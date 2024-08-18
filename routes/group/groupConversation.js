// receiver.js

import mongoose, { mongo } from 'mongoose';
import userModel from '../../models/userSchema.js'; // Import your userModel 
import profileModel from '../../models/profileSchema.js'; // Import your profileModel 
import groupMessageModel from '../../models/groupMessageSchema.js'; // Import your privateMessageModel 
import readByModel from '../../models/readBySchema.js'; // Import your readByModel 
import groupConversationModel from '../../models/groupConversationSchema.js'; // Import your groupConversationModel 
import groupConversationRequestModel from '../../models/groupConversationRequestSchema.js'; // Import your conversationGroupRequestModel 

import userIDToSocketID from '../../maps/userIDToSocketID.js';
import roomsTosocketID from '../../maps/roomsTosocketID.js';

import getProfileDataByProfileName from '../../utils/getProfileDataByProfileName.js';
import findUserSocketIDByprofileName from '../../utils/findUserSocketIDByprofileName.js';
import findSocketIDByprofileName from '../../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../../utils/findProfileIDByProfileName.js';

// import handleMedia from './handleMedia/handleMedia.js';
import handleTyping from './handleChat/handleTyping.js';
import handleCreateConversation from './handleChat/handleCreateConversation.js';

const setupGroupConversation = async (io, socket) => {

    socket.on("sendMessageGroup", async (messageValue, conversationID) => {
        try {
            const currentUser = socket.sID;
            const profileID = await findProfileIDByProfileName(currentUser);

            const groupConversationSchema = await groupConversationModel.findOne({ conversationID: conversationID, members: profileID });

            if (!groupConversationSchema) {
                // User is not a member of the conversation
                socket.emit("sendMessageGroupError", { error: "You are not a member of this conversation" });
                return;
            }

            const userID = await getProfileDataByProfileName(currentUser);
            const newMessage = new groupMessageModel({
                conversationID: conversationID,
                senderData: userID._id,
                content: messageValue
            });

            // Save the new message to the database
            await newMessage.save();

            // Retrieve the saved message and populate the senderID field
            const savedMessage = await groupMessageModel.findById(newMessage._id)
                .populate({
                    path: 'senderData',
                    select: '-_id profileName profileAvatar' // Adjust the fields you want to populate
                })
                .lean()
                .select('-_id conversationID content createdAt messageID readBy senderData status');

            if (roomsTosocketID.has(conversationID)) {
                socket.emit("getSentMessageGroup", savedMessage, currentUser);

                // RecipientId is a room, send the message to the room
                socket.to(conversationID).emit("newMessageGroup", savedMessage);
            }

        } catch (error) {
            console.error("Error handling sendMessage:", error);
            // Handle errors, e.g., emit an error event to the client
            socket.emit("sendMessageError", { error: "An error occurred while processing the message" });
        }
    });

    // User requested the chat messages for a group chat
    socket.on("requestMessagesGroup", async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const profileID = await findProfileIDByProfileName(currentUser);

            const groupConversationSchema = await groupConversationModel.findOne({ conversationID: conversationID, members: profileID });

            if (!groupConversationSchema) {
                // User is not a member of the conversation
                socket.emit("requestMessagesGroupError", { error: "You are not a member of this conversation" });
                return;
            }

            // Fetch messages from the groupMessageModel
            const messages = await groupMessageModel.find({ conversationID }, '-_id')
                .populate({
                    path: 'senderData',
                    select: '-_id profileName profileAvatar'
                })
                .exec();

            // Extract all message IDs
            const messageIDs = messages.map(msg => msg.messageID);

            // Fetch readBy data for all message IDs
            const readByData = await readByModel.find({ messageID: { $in: messageIDs } }, '-_id messageID readBy createdAt')
                .populate({
                    path: 'readBy',
                    select: '-_id profileName profileAvatar'
                });

            // Map readBy data to messages
            const groupMessageDetails = messages.map(groupMessage => {
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
            socket.emit('fetchChatDataGroup', groupMessageDetails, currentUser);
        } catch (error) {
            console.error("Error fetching messages:", error);
            socket.emit('error', 'An error occurred while fetching messages.');
        }
    });

    // ! Delete return
    socket.on('readByGroup', async (messageID, chatID) => {
        try {
            const currentUser = socket.sID;
            return
            const profileID = await findProfileIDByProfileName(currentUser);

            // Check if it exists, if it does do nothing
            const ifExists = await readByModel.findOne({ messageID: messageID, readBy: profileID });
            if (!ifExists) {
                const readBySchema = new readByModel({
                    messageID: messageID,
                    readBy: profileID
                });

                await readBySchema.save();

                if (readBySchema) {
                    if (roomsTosocketID.has(chatID)) {
                        // RecipientId is a room, send the message to the room
                        socket.to(chatID).emit("readByGroupStatus", chatID, messageID, currentUser);
                    }
                }
            }
        } catch (error) {
            console.error("Error readByGroup:", error);
            socket.emit('error', 'An error occurred while readByGroup.');
        }
    });

    // handleMedia(io, socket);
    handleTyping(io, socket);
    handleCreateConversation(io, socket);

    // await groupConversationRequestModel.deleteMany({});
    // await groupMessageModel.deleteMany({});
    // await groupConversationModel.deleteMany({});
    // await readByModel.deleteMany({});
};

export default setupGroupConversation;