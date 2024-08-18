// socketRouter.js

import express from 'express';
import setupGroupConversation from './group/groupConversation.js';
import setupPrivateConversation from './private/privateConversation.js';

import userIDToSocketID from '../maps/userIDToSocketID.js';
import roomsTosocketID from '../maps/roomsTosocketID.js';

import mongoose, { mongo } from 'mongoose';
import userModel from '../models/userSchema.js'; // Import your userModel
import profileModel from '../models/profileSchema.js'; // Import your profileModel
import privateMessageModel from '../models/privateMessageSchema.js'; // Import your privateMessageModel
import groupMessageModel from '../models/groupMessageSchema.js'; // Import your privateMessageModel
import readByModel from '../models/readBySchema.js'; // Import your readByModel
import privateConversationModel from '../models/privateConversationSchema.js'; // Import your privateConversationModel
import groupConversationModel from '../models/groupConversationSchema.js'; // Import your groupConversationModel
import conversationRequestModel from '../models/conversationRequestSchema.js'; // Import your conversationRequestModel
import groupConversationRequestModel from '../models/groupConversationRequestSchema.js'; // Import your groupConversationRequestModel
import { promises as fs } from 'fs';
import crypto from 'crypto';
import cookie from 'cookie';

import cookieParser from 'cookie-parser';

import path, { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import findUserIDBySocketID from '../utils/findUserIDBySocketID.js';
import findSocketIDByprofileName from '../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../utils/findProfileIDByProfileName.js';

// // Initialize Express
// const app = express();

// // Set up EJS as the templating engine
// app.set('views', path.join(__dirname, 'views'));
// app.set('view engine', 'ejs');

// // Define a route
// app.get('/', (req, res) => {
//     res.render('index', { title: 'Socket.IO with EJS' });
// });

const socketRouter = async (io) => {

    io.on('connection', async (socket) => {

        // socket.onAny((event, ...args) => {
        //     console.log(event, args);
        // });

        // Listen for the fetchUserData event
        socket.on('fetchUserData', (sID) => {
            // console.log('fetchUserData event received with sID:', sID);
            socket.sID = sID;
            // console.log('socket.sID is now:', socket.sID);
            fetchUserData();
        });


        // // Accessing the cookies from the headers
        // const cookieHeader = socket.request.headers.cookie;

        // if (cookieHeader) {
        //     // Parsing cookies using the cookie module
        //     const cookies = cookie.parse(cookieHeader);

        //     // Accessing a specific cookie value
        //     const sID = cookies.sID;

        //     if (!sID) {
        //         throw error("Session ID is not present")
        //     }

        //     // Storing the session ID in the socket object for later use
        //     socket.sID = sID;
        // }

        async function fetchUserData() {
            try {
                const profileName = socket.sID;

                if (!profileName) {
                    return;
                }

                // Fetch current user data
                const currentUser = await profileModel.findOne({ profileName }, "profileName profileAvatar").lean();
                if (!currentUser) {
                    throw new Error('User not found');
                }

                // Emit user data to the client
                socket.emit('userData', currentUser);

                const userIDtoString = currentUser._id.toString();

                // Update userIDToSocketID map
                if (!userIDToSocketID.has(userIDtoString)) {
                    userIDToSocketID.set(userIDtoString, { socketID: [socket.id], userData: currentUser });
                } else {
                    userIDToSocketID.get(userIDtoString).socketID.push(socket.id);
                }

                // Fetch private conversations
                const privateConversations = await privateConversationModel.find({ participants: currentUser._id })
                    .sort({ 'lastMessage.createdAt': -1 })
                    .select('-_id conversationID createdAt isPrivate lastMessageData participants')
                    .lean();

                const privateConversationDetails = await Promise.all(privateConversations.map(async (conversation) => {
                    const otherParticipantIds = conversation.participants.filter(id => id.toString() !== currentUser._id.toString());
                    const participantProfiles = await profileModel.find({ _id: { $in: otherParticipantIds } }, "-_id profileName profileAvatar").lean();
                    const lastMessage = await privateMessageModel.findOne({ conversationID: conversation.conversationID })
                        .sort({ createdAt: -1 })
                        .select('-_id content status senderData conversationID createdAt')
                        .populate({
                            path: 'senderData',
                            select: "-_id profileName profileAvatar"
                        })
                        .lean();

                    return {
                        ...conversation,
                        participants: participantProfiles,
                        lastMessageData: lastMessage || false
                    };
                }));

                // Fetch group conversations
                const groupConversations = await groupConversationModel.find({ members: currentUser._id })
                    .sort({ 'lastMessage.createdAt': -1 })
                    .select('-_id conversationID createdAt isPrivate lastMessageData members groupName groupAvatar groupDescription')
                    .lean();

                const groupConversationDetails = await Promise.all(groupConversations.map(async (conversation) => {
                    const memberProfiles = await profileModel.find({ _id: { $in: conversation.members } }, "-_id profileName profileAvatar").lean();
                    const lastMessage = await groupMessageModel.findOne({ conversationID: conversation.conversationID })
                        .sort({ createdAt: -1 })
                        .select('-_id content conversationID senderData createdAt')
                        .populate({ path: "senderData", select: "-_id profileName profileAvatar" })
                        .lean();

                    return {
                        ...conversation,
                        members: memberProfiles,
                        lastMessageData: lastMessage || false
                    };
                }));

                // Concatenate and sort conversations
                const allConversationDetails = privateConversationDetails.concat(groupConversationDetails);
                allConversationDetails.sort((a, b) => {
                    if (!a.lastMessageData || !b.lastMessageData) return 0;
                    return new Date(b.lastMessageData.createdAt) - new Date(a.lastMessageData.createdAt);
                });

                // Handle room joining for group conversations
                groupConversationDetails.forEach(conversation => {
                    const { conversationID } = conversation;

                    handleJoinRoom(conversationID)
                });

                // Emit all conversation details to the client
                socket.emit('participantsData', allConversationDetails, profileName);

                privateConversationsRequests(profileName);
                groupConversationsRequests(profileName);

                // Notify other participants about message deliveries
                const recipientSocketIDs = await findOtherParticipantsSocketIDs(profileName);
                const conversationIDs = privateConversationDetails.map(c => c.conversationID);

                if (recipientSocketIDs.length > 0) {
                    const messageData = await markMessagesAsDeliveredWhenUserReLogin(conversationIDs);

                    if (messageData) {
                        recipientSocketIDs.forEach(socketID => {
                            io.to(socketID).emit('messageDeliveredFeedbackAfterRelogin', messageData);
                        });
                    }
                }

                // Extract unique profile names from participants and members
                const allProfileNames = [
                    ...new Set([
                        ...privateConversationDetails.flatMap(convo => convo.participants.map(p => p.profileName)),
                        ...groupConversationDetails.flatMap(convo => convo.members.map(m => m.profileName))
                    ])
                ].filter(profileNames => profileNames !== profileName);

                // Find profile names that exist in the userIDToSocketID map
                const foundProfileNames = allProfileNames.filter(profileName => {
                    // Check if profileName exists in the map
                    for (const { userData } of userIDToSocketID.values()) {
                        if (userData.profileName === profileName) {
                            return true;
                        }
                    }
                    return false;
                });

                socket.emit('onlineProfileList', foundProfileNames);

                foundProfileNames.forEach(eachProfileName => {
                    const recipientSocketIDs = findSocketIDByprofileName(eachProfileName);

                    if (recipientSocketIDs) {
                        recipientSocketIDs.forEach(socketID => {
                            // Emit all online profiles to ones that have a conversation with 
                            io.to(socketID).emit('onlineProfile', profileName);
                        });
                    }
                });

            } catch (error) {
                console.error('Error fetching user data:', error.message);
                socket.emit('userDataError', { error: error.message });
            }
        }

        // Set up setupPrivateConversation functionality
        setupPrivateConversation(io, socket);

        // Set up setupGroupConversation functionality
        setupGroupConversation(io, socket);

        socket.on('disconnect', async () => {
            // Handle disconnect
            // console.log(`Client with socket ID ${socket.id} disconnected`);

            const socketIdToFind = socket.id;
            const userID = findUserIDBySocketID(socketIdToFind);

            if (userID !== null) {
                const userData = userIDToSocketID.get(userID);
                const socketIndex = userData.socketID.indexOf(socket.id);
                if (socketIndex > -1) {
                    userData.socketID.splice(socketIndex, 1);
                }
                if (userData.socketID.length === 0) {
                    userIDToSocketID.delete(userID);
                }

                // Check if userID is in any private conversations
                const privateConversations = await privateConversationModel.find({ participants: userID }).lean();
                // Check if userID is in any group conversations
                const groupConversations = await groupConversationModel.find({ members: userID }).lean();

                // Extract all participants and members profile names
                const allProfileNames = [
                    ...new Set([
                        ...privateConversations.flatMap(convo => convo.participants.map(p => p.toString())),
                        ...groupConversations.flatMap(convo => convo.members.map(m => m.toString()))
                    ])
                ];

                // Find profile names that exist in the userIDToSocketID map
                const foundProfileNames = allProfileNames.filter(profileId => {
                    // Check if profileId exists in the map
                    return userIDToSocketID.has(profileId);
                }).map(profileId => {
                    const { userData } = userIDToSocketID.get(profileId);
                    return userData.profileName;
                });

                const profileNameDisconnected = userData.userData.profileName;

                foundProfileNames.forEach(eachProfileName => {
                    const recipientSocketIDs = findSocketIDByprofileName(eachProfileName);

                    if (recipientSocketIDs) {
                        recipientSocketIDs.forEach(socketID => {
                            io.to(socketID).emit('offlineProfile', profileNameDisconnected);
                        });
                    }
                });
            } else {
                console.log(`Socket ID ${socket.id} not found in the Map`);
            }
        });

        function findUserIDBySocketID(socketId) {
            for (const [userID, { socketID }] of userIDToSocketID.entries()) {
                if (socketID.includes(socketId)) {
                    return userID;
                }
            }
            return null;
        }

        // ! Make it global
        function handleJoinRoom(conversationID) {
            if (!socket.rooms.has(conversationID)) {
                socket.join(conversationID);
                roomsTosocketID.set(conversationID, (roomsTosocketID.get(conversationID) || new Set()).add(socket.id));
            }
        }

        // Function to return private conversation requests
        async function privateConversationsRequests(profileName) {
            try {
                const userID = await findProfileIDByProfileName(profileName);
                const recipientSocketIDs = await findSocketIDByprofileName(profileName);

                // Fetch current user data 
                const privateConversationRequestSchema = await conversationRequestModel.find({ receiverData: userID })
                    .select('-_id createdAt customID senderData status')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileName profileAvatar'
                    })
                    .lean();

                // Check if the array is empty
                if (privateConversationRequestSchema.length > 0) {
                    recipientSocketIDs.forEach(socketID => {
                        // Emit all conversation requests to the client
                        io.to(socketID).emit('privateConversationRequestDetails', privateConversationRequestSchema);
                    });
                }
            } catch (error) {
                console.error('Error in privateConversationsRequests:', error);
                // Handle error appropriately
            }
        }

        // Function to return group conversation requests
        async function groupConversationsRequests(profileName) {
            const userID = await findProfileIDByProfileName(profileName);
            const recipientSocketIDs = await findSocketIDByprofileName(profileName);

            // Fetch current user data 
            const groupConversationRequestSchema = await groupConversationRequestModel.find({ receiverData: userID })
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

            // Check if the array is empty
            if (groupConversationRequestSchema.length > 0) {
                recipientSocketIDs.forEach(socketID => {

                    // Emit all conversation requests to the client
                    io.to(socketID).emit('groupConversationRequestDetails', groupConversationRequestSchema);
                });
            }
        }

        async function markMessagesAsDeliveredWhenUserReLogin(conversationIDs) {
            try {
                // Find messages with status 'sent' and matching conversationID
                const messages = await privateMessageModel.find({
                    conversationID: { $in: conversationIDs }, // Match any conversation ID in the array
                    status: 'sent' // Match messages with status 'sent'
                }).exec();

                // If no messages found, return early
                if (messages.length === 0) {
                    return; // Return undefined or handle as needed
                }

                // Update each message to 'delivered' and return the messageID and conversationID
                const updatedMessages = await Promise.all(messages.map(async message => {
                    const updatedMessage = await privateMessageModel.findOneAndUpdate(
                        { _id: message._id }, // Query: find by _id
                        { status: 'delivered' }, // Update status to 'delivered'
                        { new: true } // Options: return the updated document
                    ).exec();

                    return { messageID: updatedMessage.messageID, conversationID: updatedMessage.conversationID };
                }));

                return updatedMessages;
            } catch (error) {
                console.error('Error marking messages as delivered:', error);
                throw error; // Handle or propagate the error as needed
            }
        }

        // Function to find all chats involving the given profile name and get socket IDs of other participants
        async function findOtherParticipantsSocketIDs(senderProfileName) {
            const senderUser = await profileModel.findOne({ profileName: senderProfileName }).select('_id').exec();

            if (!senderUser) {
                return []; // Sender user not found
            }

            // Find all chats involving the sender
            const chats = await privateConversationModel.find({
                participants: senderUser._id
            }).populate({
                path: 'participants',
                select: '_id profileName'
            }).exec();

            const recipientSocketIDs = new Set();

            for (const chat of chats) {
                // Filter out the sender from the participants
                const recipients = chat.participants.filter(participant => participant._id.toString() !== senderUser._id.toString());

                // Add the socket IDs of the other participants to the set
                recipients.forEach(recipient => {
                    const recipientSocketData = userIDToSocketID.get(recipient._id.toString());
                    if (recipientSocketData && recipientSocketData.socketID) {
                        recipientSocketIDs.add(recipientSocketData.socketID);
                    }
                });
            }

            return Array.from(recipientSocketIDs);
        }

    });
};

export default socketRouter;