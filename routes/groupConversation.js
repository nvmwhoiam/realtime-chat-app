// receiver.js

import mongoose, { mongo } from 'mongoose';
import userModel from '../models/userSchema.js'; // Import your userModel 
import profileModel from '../models/profileSchema.js'; // Import your profileModel 
import groupMessageModel from '../models/groupMessageSchema.js'; // Import your privateMessageModel 
import readByModel from '../models/readBySchema.js'; // Import your readByModel 
import groupConversationModel from '../models/groupConversationSchema.js'; // Import your groupConversationModel 
import groupConversationRequestModel from '../models/groupConversationRequestSchema.js'; // Import your conversationGroupRequestModel 

import userIDToSocketID from '../maps/userIDToSocketID.js';
import roomsTosocketID from '../maps/roomsTosocketID.js';

import getProfileDataByProfileName from '../utils/getProfileDataByProfileName.js';
import findUserSocketIDByprofileName from '../utils/findUserSocketIDByprofileName.js';
import findSocketIDByprofileName from '../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../utils/findProfileIDByProfileName.js';

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

    // Function to search and request a conversation.
    socket.on('groupConversationSearchProfileRequest', async (value) => {
        const currentUser = socket.sID;

        const queryValue = value.trim();

        // Find the current user's ID
        const currentUserID = await findProfileIDByProfileName(currentUser);

        // Find users matching the query, excluding the current user and users in conversations
        const users = await profileModel.find(
            {
                $and: [
                    { profileName: { $regex: queryValue, $options: 'i' } },
                    { _id: { $ne: currentUserID } },
                ]
            },
            'profileName profileAvatar'
        );

        socket.emit('groupConversationSearchResults', users);
    });

    // Function to request a group conversation.
    socket.on('groupConversationRequest', async (invitedData) => {
        try {
            const currentUser = socket.sID;

            const senderID = await findProfileIDByProfileName(currentUser);

            const { groupName, groupDescription } = invitedData;

            const newGroupConversationSchema = new groupConversationModel({
                createdBy: senderID,
                groupName,
                // groupAvatar: ,
                groupDescription,
                members: [senderID]
            });

            // Save the request to the database
            await newGroupConversationSchema.save();

            const groupConversationSchema = await groupConversationModel.findById(newGroupConversationSchema._id)
                .select('-_id conversationID createdBy admin moderator members isPrivate groupName groupAvatar groupDescription lastMessageData');

            // Handle room joining for group conversations
            const conversationID = newGroupConversationSchema.conversationID;

            handleJoinRoom(conversationID);

            const senderSocketID = findSocketIDByprofileName(currentUser);

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    // Gets the sent message to the sender with the message datails, e.g messageID
                    io.to(eachSocketID).emit('groupConversationRequestFeedbackToSender', groupConversationSchema, currentUser);
                });
            }

            // It retuns each profileName
            invitedData.members.forEach(async eachMember => {
                const receiverSocketID = findSocketIDByprofileName(eachMember);
                const profileID = await findProfileIDByProfileName(eachMember);

                const groupConversationRequestSchema = new groupConversationRequestModel({
                    senderData: senderID,
                    receiverData: profileID,
                    groupData: newGroupConversationSchema._id
                });

                await groupConversationRequestSchema.save();

                // Fetch current user data 
                const groupConversationRequestSchema2 = await groupConversationRequestModel.findById(groupConversationRequestSchema._id)
                    .select('-_id createdAt customID senderData groupData status')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileName profileAvatar'
                    })
                    .populate({
                        path: 'groupData',
                        select: '-_id groupName groupAvatar groupDescription conversationID createdBy'
                    })
                    .lean();

                if (receiverSocketID) {
                    receiverSocketID.map(eachSocketID => {
                        // Gets the sent message to the sender with the message datails, e.g messageID
                        io.to(eachSocketID).emit('groupConversationRequestFeedbackToRecipient', groupConversationRequestSchema2);
                    });
                }
            });
        } catch (error) {
            console.error('Error creating conversation request:', error);
            throw error;
        }
    });

    // // Function to cancel a requested conversation.
    // socket.on('cancelConversation', async (profileNameCanceled) => {
    //     try {
    //         return
    //         const currentUser = socket.sID;

    //         const senderData = await findProfileIDByProfileName(currentUser);
    //         const receiverData = await findProfileIDByProfileName(profileNameCanceled);
    //         const senderSocketID = findSocketIDByprofileName(profileNameCanceled);

    //         const findConversationRequest = await conversationRequestModel.findOne({ senderData, receiverData });
    //         await conversationRequestModel.deleteOne({ _id: findConversationRequest._id });

    //         if (senderSocketID) {
    //             senderSocketID.map(eachSocketID => {
    //                 // Gets the sent message to the sender with the message datails, e.g messageID
    //                 io.to(eachSocketID).emit('cancelConversationFeedback', findConversationRequest.customID);
    //             });
    //         }
    //     } catch (error) {
    //         console.error('Error canceling conversation request:', error);
    //         throw error;
    //     }
    // });

    // Function to accept a conversation request.

    socket.on('groupConversationRequestAccepted', async (customID) => {
        try {
            const currentUser = socket.sID;

            const groupConversationRequestSchema = await groupConversationRequestModel.findOne({ customID });

            const groupID = groupConversationRequestSchema.groupData;

            const profileID = await findProfileIDByProfileName(currentUser);

            // Update the group conversation, add a profile
            const groupConversationSchema = await groupConversationModel.findOneAndUpdate(
                { _id: groupID }, // Query object
                { $addToSet: { members: profileID } }, // Update object
                { new: true } // Options: return the updated document
            ).select('-_id conversationID createdBy admin moderator members isPrivate groupName groupAvatar groupDescription lastMessageData');

            await groupConversationRequestModel.deleteOne({ customID });

            // Handle room joining for group conversations
            const conversationID = groupConversationSchema.conversationID;

            handleJoinRoom(conversationID);

            const senderSocketID = findSocketIDByprofileName(currentUser);

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {

                    // Sends a message to the recipient from a sender if it's online
                    io.to(eachSocketID).emit("groupConversationRequestAcceptedFeedback", groupConversationSchema);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request accepted:', error);
            throw error;
        }
    });

    // Function to reject a conversation request.
    socket.on('groupConversationRequestRejected', async (customID) => {
        try {
            return
            const currentUser = socket.sID;

            const profileID = await findProfileIDByProfileName(currentUser);

            const conversationRequestSchema = await conversationRequestModel.findOne({ customID: customID }, { recipientID: profileID })
                .populate({
                    path: 'senderData receiverData',
                    select: '-_id profileName profileAvatar'
                });

            const senderProfileName = conversationRequestSchema.senderData.profileName;
            const receiverProfileName = conversationRequestSchema.receiverData.profileName;

            const senderSocketID = findSocketIDByprofileName(senderProfileName);
            const receiverSocketID = findSocketIDByprofileName(receiverProfileName);

            // Delete the found document
            await conversationRequestSchema.deleteOne({ _id: conversationRequestSchema._id });

            // if (senderSocketID) {
            //     senderSocketID.map(eachSocketID => {

            //         // Sends a message to the recipient from a sender if it's online
            //         io.to(eachSocketID).emit("groupConversationRequestRejectedFeedback", customID);
            //     });
            // }

            if (receiverSocketID) {
                receiverSocketID.map(eachSocketID => {

                    // Sends a message to the recipient from a sender if it's online
                    io.to(eachSocketID).emit("groupConversationRequestRejectedFeedback", customID);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request rejected:', error);
            throw error;
        }
    });

    // Typing start logic
    socket.on('typingStartGroup', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            if (socket.rooms.has(conversationID)) {
                // conversationID is a room, send the message to the room
                socket.to(conversationID).emit("typingStartGroupIndicator", conversationID, currentUser);
            }

        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    // Typing stop logic
    socket.on('typingStopGroup', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            if (socket.rooms.has(conversationID)) {
                // conversationID is a room, send the message to the room
                socket.to(conversationID).emit("typingStopGroupIndicator", conversationID, currentUser);
            }

        } catch (error) {
            console.error("Error typingStop:", error);
            socket.emit('error', 'An error occurred while typingStop.');
        }

    });

    function handleJoinRoom(conversationID) {
        if (!socket.rooms.has(conversationID)) {
            socket.join(conversationID);
            roomsTosocketID.set(conversationID, (roomsTosocketID.get(conversationID) || new Set()).add(socket.id));
        }
    }

    // await groupConversationRequestModel.deleteMany({});
    // await groupMessageModel.deleteMany({});
    // await groupConversationModel.deleteMany({});
    // await readByModel.deleteMany({});
};

export default setupGroupConversation;