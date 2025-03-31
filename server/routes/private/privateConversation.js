import mongoose, { mongo } from 'mongoose';
import userModel from '../../models/userSchema.js';
import profileModel from '../../models/profileSchema.js';
import privateMessageModel from '../../models/private/privateMessageSchema.js';
import privateCallsModel from '../../models/private/privateCallSchema.js';
import privateConversationModel from '../../models/private/privateConversationSchema.js';
import privateConversationRequestModel from '../../models/private/privateConversationRequestSchema.js';
import attachmentModel from '../../models/attachmentSchema.js';

import findUserSocketIDByprofileID from '../../utils/findUserSocketIDByprofileID.js';
import findSocketIDByprofileID from '../../utils/findSocketIDByprofileID.js';

import privateVideoCall from './handleMedia/privateVideoCall.js';
import privateVoiceCall from './handleMedia/privateVoiceCall.js';
import privateTyping from './handleChat/privateTyping.js';
import privateConversationCreate from './handleChat/privateConversationCreate.js';

import crypto from 'crypto';
import { promises as fs } from 'fs';

import path, { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const setupPrivateConversation = async (io, socket) => {

    socket.on("privateMessageSend", async (messageData) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const { isReply, messageID, isFile, filesData, messageValue, conversationID } = messageData;

            // Save files and collect their names
            const attachments = [];
            if (isFile && filesData.length > 0) {
                for (const eachImage of filesData) {
                    const fileName = await handleFiles(eachImage);
                    if (fileName) {
                        attachments.push(fileName); // Add saved file name to attachments array
                    }
                }
            }

            // Validate message or file presence
            if (messageValue.length === 0 && attachments.length === 0) {
                console.log("Message cannot be empty! You must provide either a message or an image.");
                return; // Stop execution if neither message nor image is provided
            }

            // Check if the user is a participant in the conversation
            const privateConversationSchema = await privateConversationModel.findOne({ conversationID, participants: profileObjectID });
            if (!privateConversationSchema) {
                console.log("You are not a participant of this conversation!");
                return;
            }

            // Dynamically construct newMessageData
            const newMessageData = {
                conversationID,
                senderData: profileObjectID
            };

            // Include content if present
            if (messageValue.trim().length > 0) {
                newMessageData.content = messageValue.trim();
            }

            // Include attachments if present
            if (attachments.length > 0) {
                newMessageData.attachments = attachments;
            }

            // Handle reply logic
            if (isReply) {
                const originalMessage = await privateMessageModel.findOne({ messageID, conversationID });
                if (!originalMessage) {
                    console.log('The message you are replying to does not exist in this conversation!');
                    return;
                }

                newMessageData.replyTo = messageID._id;
            }

            // Save the new message
            const newMessage = new privateMessageModel(newMessageData);
            await newMessage.save();

            // Fetch the saved message with populated data
            const privateMessageSchema = await privateMessageModel.findById(newMessage._id, '-_id conversationID content createdAt messageID readBy senderData status attachments')
                .populate({
                    path: 'senderData',
                    select: '-_id profileID profileName profileAvatar'
                })
                .populate({
                    path: 'replyTo',
                    select: '-_id conversationID content createdAt messageID readBy senderData status attachments'
                })
                .populate({
                    path: 'attachments',
                    select: '-_id fileType fileSize filePath fileCategory'
                })
                .lean();

            // Find receiver and sender socket IDs
            const receiverSocketID = await findUserSocketIDByprofileID(conversationID, profileID);
            const senderSocketID = findSocketIDByprofileID(profileID);

            // Emit the message to the sender
            senderSocketID.forEach(eachSocketID => {
                io.to(eachSocketID).emit("sentMessage", privateMessageSchema);
            });

            // Emit the message to the receiver
            if (receiverSocketID) {
                receiverSocketID.forEach(async eachSocketID => {
                    socket.to(eachSocketID).emit("recipientMessage", privateMessageSchema);
                });

                // Update message status to "delivered"
                senderSocketID.forEach(async eachSocketID => {
                    const { messageID } = privateMessageSchema;

                    const privateMessageUpdateSchema = await privateMessageModel.findOneAndUpdate(
                        { messageID },
                        {
                            status: 'delivered',
                            delivered: Date.now()
                        },
                        { new: true }
                    );

                    if (privateMessageUpdateSchema) {
                        io.to(eachSocketID).emit("messageDeliveredFeedback", conversationID, messageID);
                    }
                });
            }
        } catch (error) {
            console.error("Error handling privateMessageSend:", error);
        }
    });

    socket.on("privateMessagesFetch", async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const privateConversationSchema = await privateConversationModel.findOne({ conversationID, participants: profileObjectID });
            if (!privateConversationSchema) {
                console.log("You are not a participant of this conversation!");
                return;
            }

            const privateMessageSchema = await privateMessageModel.find({ conversationID }, '-_id messageID conversationID senderData content status sent delivered read removed attachments reaction replyTo createdAt')
                .populate({
                    path: 'senderData',
                    select: '-_id profileID profileName profileAvatar'
                })
                .populate({
                    path: 'replyTo',
                    select: '-_id conversationID content createdAt messageID readBy senderData status attachments'
                })
                .populate({
                    path: 'attachments',
                    select: '-_id fileType fileSize filePath fileCategory'
                })
                // .limit(10)
                .exec();

            if (privateMessageSchema) {
                socket.emit('privateMessagesFetchFeedback', privateMessageSchema, profileID);
            }
        } catch (error) {
            console.error("Error fetching privateMessages", error);
        }
    });

    socket.on('readBy', async (conversationID, messageID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const privateMessageUpdateSchema = await privateMessageModel.findOneAndUpdate(
                { messageID },
                { status: 'read', read: Date.now() },
                { new: true }
            );

            const receiverSocketID = await findUserSocketIDByprofileID(conversationID, profileID);
            if (receiverSocketID && privateMessageUpdateSchema) {
                receiverSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("readByStatus", conversationID, messageID);
                });
            }
        } catch (error) {
            console.error("Error fetching readBy", error);
        }
    });

    privateVoiceCall(io, socket);
    privateVideoCall(io, socket);
    privateTyping(io, socket);
    privateConversationCreate(io, socket);

    // await privateMessageModel.deleteMany({});
    // await privateConversationModel.deleteMany({});
    // await privateConversationRequestModel.deleteMany({});
    // await privateCallsModel.deleteMany({});
};

export default setupPrivateConversation;

export async function handleFiles(image) {
    const randomFileName = generateRandomFileName(image.fileName);
    const filePath = path.join(__dirname, '../../../uploads', 'uploadImages', randomFileName);
    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif'];
    const maxFileSize = 5 * 1024 * 1024; // 5MB

    if (!image || !image.fileContent) {
        console.error('Invalid image data received');
        return null;
    }

    if (!allowedTypes.includes(image.fileType)) {
        console.error('Unsupported file type');
        return null;
    }

    try {
        // Extract the Base64 data from the Data URL
        const base64Data = image.fileContent.replace(/^data:image\/\w+;base64,/, '');

        // Convert Base64 to Buffer
        const buffer = Buffer.from(base64Data, 'base64');

        // Check file size
        if (buffer.length > maxFileSize) {
            console.error('File size exceeds the limit');
            return null;
        }

        // Write the buffer to a file
        await fs.writeFile(filePath, buffer);

        // Save the attachment to the database
        const attachmentSchema = new attachmentModel({
            fileName: image.fileName,
            fileType: image.fileType,
            fileSize: buffer.length, // Use buffer.length for file size
            filePath: randomFileName,
            fileCategory: 'image'
        });

        await attachmentSchema.save();

        console.log('Image saved successfully:', randomFileName);
        return attachmentSchema._id; // Return the saved file ID
    } catch (err) {
        console.error(`Error saving image: ${err}`);
        return null;
    }
}

const generateRandomFileName = (originalName) => {
    const randomName = crypto.randomBytes(16).toString('hex');
    const extension = extname(originalName);
    return `${randomName}${extension}`;
};