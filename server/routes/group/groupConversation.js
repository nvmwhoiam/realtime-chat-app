import mongoose, { mongo } from 'mongoose';
import userModel from '../../models/userSchema.js'; // Import your userModel 
import profileModel from '../../models/profileSchema.js'; // Import your profileModel 

import readByModel from '../../models/readBySchema.js'; // Import your readByModel 
import groupMessageModel from '../../models/group/groupMessageSchema.js'; // Import your groupMessageModel 
import groupConversationModel from '../../models/group/groupConversationSchema.js'; // Import your groupConversationModel 
import groupConversationMembersModel from '../../models/group/groupConversationMembersSchema.js'; // Import your groupConversationModel 
import groupConversationRequestModel from '../../models/group/groupConversationRequestSchema.js'; // Import your conversationGroupRequestModel 

import { handleFiles } from '../private/privateConversation.js';

import roomsTosocketID from '../../maps/roomsTosocketID.js';

import groupTyping from './handleChat/groupTyping.js';
import groupConversationCreate from './handleChat/groupConversationCreate.js';

const setupGroupConversation = async (io, socket) => {

    socket.on("groupMessageSend", async (messageData) => {
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

            // Check if the user is a member in the conversation
            const groupConversationMembersSchema = await groupConversationMembersModel.findOne({ conversationID, memberID: profileObjectID });
            if (!groupConversationMembersSchema) {
                console.log("You are not a member of this conversation!");
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
                const originalMessage = await groupMessageModel.findOne({ messageID, conversationID });
                if (!originalMessage) {
                    console.log('The message you are replying to does not exist in this conversation!');
                    return;
                }

                newMessageData.replyTo = messageID._id;
            }

            // Save the new message
            const newMessage = new groupMessageModel(newMessageData);
            await newMessage.save();

            // Fetch the saved message with populated data
            const groupMessageSchema = await groupMessageModel.findById(newMessage._id, '-_id conversationID content createdAt messageID readBy senderData status attachments')
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

            if (roomsTosocketID.has(conversationID)) {
                socket.emit("getSentMessageGroup", groupMessageSchema, profileName);

                // RecipientId is a room, send the message to the room
                socket.to(conversationID).emit("newMessageGroup", groupMessageSchema);
            }
        } catch (error) {
            console.error("Error handling sendMessage:", error);
        }
    });

    socket.on("groupMessagesFetch", async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const groupConversationMembersSchema = await groupConversationMembersModel.findOne({ conversationID, memberID: profileObjectID });
            if (!groupConversationMembersSchema) {
                console.log("You are not a member of this conversation!");
                return;
            }

            const { role, createdAt: memberJoinedAt } = groupConversationMembersSchema;

            // Define the query condition based on the user's role
            const queryCondition = role === 'admin' || role === 'moderator'
                // Admins and moderators can access all messages
                ? { conversationID }
                // Regular users can only see messages after they joined
                : { conversationID, createdAt: { $gte: memberJoinedAt } };

            // Fetch messages from the groupMessageModel
            const groupMessageSchema = await groupMessageModel.find(queryCondition, '-_id messageID conversationID senderData content status sent delivered read removed attachments reaction replyTo createdAt')
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

            // Extract all message IDs
            const messageIDs = groupMessageSchema.map(msg => msg.messageID);

            // Fetch readBy data for all message IDs
            const readByData = await readByModel.find({ messageID: { $in: messageIDs } }, '-_id messageID readBy createdAt')
                .populate({
                    path: 'readBy',
                    select: '-_id profileID profileName profileAvatar'
                });

            // Map readBy data to groupMessageSchema
            const groupMessageDetails = groupMessageSchema.map(groupMessage => {
                // Find readBy entries matching the current messageID
                const readByForMessage = readByData
                    .filter(rb => rb.messageID === groupMessage.messageID)
                    .map(rb => rb.readBy);

                // Return the message with the embedded readBy data
                return {
                    ...groupMessage.toObject(),
                    readBy: readByForMessage
                };
            });

            // Emit the populated message data to the client
            socket.emit('fetchChatDataGroup', groupMessageDetails, profileID);
        } catch (error) {
            console.error("Error fetching messages:", error);
        }
    });

    socket.on('readByGroup', async (conversationID, messageID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const readBySchema = await readByModel.findOne({ messageID, readBy: profileObjectID });
            if (!readBySchema) {
                const readBySchema = new readByModel({
                    messageID,
                    readBy: profileObjectID
                });

                // await readBySchema.save();

                if (readBySchema) {
                    if (roomsTosocketID.has(conversationID)) {
                        socket.to(conversationID).emit("readByGroupStatus", conversationID, messageID, profileID);
                    }
                }
            }
        } catch (error) {
            console.error("Error readByGroup:", error);
        }
    });

    groupTyping(io, socket);
    groupConversationCreate(io, socket);

    // await groupConversationMembersModel.deleteMany({});
    // await groupConversationRequestModel.deleteMany({});
    // await groupMessageModel.deleteMany({});
    // await groupConversationModel.deleteMany({});
    // await readByModel.deleteMany({});
};

export default setupGroupConversation;