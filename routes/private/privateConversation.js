// privateConversation.js

import mongoose, { mongo } from 'mongoose';
import userModel from '../../models/userSchema.js'; // Import your userModel 
import profileModel from '../../models/profileSchema.js'; // Import your profileModel 
import privateMessageModel from '../../models/privateMessageSchema.js'; // Import your privateMessageModel 
import privateConversationModel from '../../models/privateConversationSchema.js'; // Import your privateConversationModel 
import conversationRequestModel from '../../models/conversationRequestSchema.js'; // Import your conversationRequestModel 

import getProfileDataByProfileName from '../../utils/getProfileDataByProfileName.js';
import findUserSocketIDByprofileName from '../../utils/findUserSocketIDByprofileName.js';
import findSocketIDByprofileName from '../../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../../utils/findProfileIDByProfileName.js';

import handleMedia from './handleMedia/handleMedia.js';
import handleTyping from './handleChat/handleTyping.js';
import handleCreateConversation from './handleChat/handleCreateConversation.js';

const setupPrivateConversation = async (io, socket) => {

    socket.on("sendMessage", async (messageValue, conversationID) => {
        try {
            const currentUser = socket.sID;
            const profileID = await findProfileIDByProfileName(currentUser);

            const privateConversationSchema = await privateConversationModel.findOne({ conversationID: conversationID, participants: profileID });

            if (!privateConversationSchema) {
                // User is not a member of the conversation
                socket.emit("sendMessagePrivateError", { error: "You are not a participant of this conversation" });
                return;
            }

            const userID = await getProfileDataByProfileName(currentUser);
            const receiverSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);
            const senderSocketID = findSocketIDByprofileName(currentUser);

            // Save a message
            const newMessage = new privateMessageModel({
                conversationID: conversationID,
                senderData: userID._id,
                content: messageValue
            });

            // Save the new message to the database
            await newMessage.save();

            // Retrieve the saved message and populate the senderData field
            const savedMessage = await privateMessageModel.findById(newMessage._id)
                .populate({
                    path: 'senderData',
                    select: '-_id profileName profileAvatar' // Adjust the fields you want to populate
                })
                .lean()
                .select('-_id conversationID content createdAt messageID readBy senderData status');

            senderSocketID.map(eachSocketID => {
                // Gets the sent message to the sender with the message datails, e.g messageID
                io.to(eachSocketID).emit("sentMessage", savedMessage);
            });

            if (receiverSocketID) {
                // Returns the new message to the recipient if it's online
                receiverSocketID.map(async eachSocketID => {
                    // Sends a message to the recipient from a sender if it's online
                    socket.to(eachSocketID).emit("newMessage", savedMessage);
                });

                // Returns feedback to the sender that message was delivered, recipient should be online
                senderSocketID.map(async eachSocketID => {
                    const { messageID } = savedMessage;

                    // Sends a message feedback as delivered if a user is online 
                    const privateMessageSchema = await privateMessageModel.findOneAndUpdate(
                        { messageID: messageID }, // Query object
                        { status: 'delivered' }, // Update object
                        { new: true } // Options: return the updated document
                    );

                    if (privateMessageSchema) {
                        // RecipientId is a room, send the message to the room
                        io.to(eachSocketID).emit("messageDeliveredFeedback", messageID, conversationID);
                    }
                });
            }
        } catch (error) {
            console.error("Error handling sendMessage:", error);
            // Handle errors, e.g., emit an error event to the client
            socket.emit("sendMessageError", { error: "An error occurred while processing the message" });
        }
    });

    // User requested the chat messages for a private chat
    socket.on("requestMessages", async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const profileID = await findProfileIDByProfileName(currentUser);

            const privateConversationSchema = await privateConversationModel.findOne({ conversationID: conversationID, participants: profileID });

            if (!privateConversationSchema) {
                // User is not a member of the conversation
                socket.emit("requestMessagesPrivateError", { error: "You are not a participant of this conversation" });
                return;
            }

            // Find the messages associated with the conversationID
            const messages = await privateMessageModel.find({ conversationID: conversationID }, '-_id')
                .populate({
                    path: 'senderData',
                    select: '-_id profileName'
                })
                // .limit(10)
                .exec();

            // Emit the populated message data to the client
            socket.emit('fetchChatData', messages, currentUser);
        } catch (error) {
            console.error("Error fetching messages:", error);
            socket.emit('error', 'An error occurred while fetching messages.');
        }
    });

    // Function to deal with readBy status for private conversations
    socket.on('readBy', async (messageID, conversationID) => {
        const currentUser = socket.sID;

        // Update the message status to 'delivered'
        const privateMessageSchema = await privateMessageModel.findOneAndUpdate(
            { messageID: messageID }, // Query object
            { status: 'read' }, // Update object
            { new: true } // Options: return the updated document
        );

        const socketID = await findUserSocketIDByprofileName(conversationID, currentUser);

        if (socketID && privateMessageSchema) {
            socketID.map(eachSocketID => {
                // RecipientId is a room, send the message to the room
                io.to(eachSocketID).emit("readByStatus", conversationID, messageID);
            });
        }
    });

    handleMedia(io, socket);
    handleTyping(io, socket);
    handleCreateConversation(io, socket);

    // await privateMessageModel.deleteMany({});
    // await privateConversationModel.deleteMany({});
    // await conversationRequestModel.deleteMany({});
};

export default setupPrivateConversation;