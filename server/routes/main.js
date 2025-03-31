// socketRouter.js
import express from 'express';
import setupGroupConversation from './group/groupConversation.js';
import setupPrivateConversation from './private/privateConversation.js';

import profileIDToSocketID from '../maps/profileIDToSocketID.js';
import roomsTosocketID from '../maps/roomsTosocketID.js';

import userModel from '../models/userSchema.js';
import profileModel from '../models/profileSchema.js';
import readByModel from '../models/readBySchema.js';

import privateMessageModel from '../models/private/privateMessageSchema.js';
import privateConversationModel from '../models/private/privateConversationSchema.js';
import privateConversationRequestModel from '../models/private/privateConversationRequestSchema.js';
import privateCallModel from '../models/private/privateCallSchema.js';

import groupMessageModel from '../models/group/groupMessageSchema.js';
import groupConversationModel from '../models/group/groupConversationSchema.js';
import groupConversationMembersModel from '../models/group/groupConversationMembersSchema.js';
import groupConversationRequestModel from '../models/group/groupConversationRequestSchema.js';

import findUserSocketIDByprofileID from '../utils/findUserSocketIDByprofileID.js';
import findSocketIDByprofileID from '../utils/findSocketIDByprofileID.js';

import { promises as fs } from 'fs';
import crypto from 'crypto';
import cookie from 'cookie';

import cookieParser from 'cookie-parser';

import path, { join, dirname, extname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

import findSocketIDByprofileCustomID from '../utils/findSocketIDByprofileID.js';
import findProfileDataBySocketID from '../utils/findProfileDataBySocketID.js';
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

        const sID = socket.handshake.auth.sID;

        async function initProfile(sID) {
            // if (!sID) {
            //     socket.disconnect();
            //     throw new Error("No session ID found in handshake");
            // }

            try {
                const profileSchema = await profileModel.findOne({ profileName: sID }, "profileID profileName profileAvatar profileStatus");
                if (!profileSchema) {
                    throw new Error('Profile not found!');
                }

                profileSchema.socketID = [socket.id];

                socket.profileData = profileSchema;

                const { _id: profileObjectID, profileID, profileName, profileAvatar, socketID } = profileSchema;

                const profileData = {
                    profileID,
                    profileName,
                    profileAvatar
                }

                socket.emit('profileData', profileData);

                const privateConversations = await privateConversationModel.find({ participants: profileObjectID }, '-_id conversationID createdAt isPrivate lastMessageData participants')
                    .populate({
                        path: 'participants',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .lean();

                const privateConversationDetails = await Promise.all(privateConversations.map(async privateConversation => {
                    const { conversationID } = privateConversation;

                    const otherParticipantProfile = privateConversation.participants.find(participant => participant.profileID !== profileID);

                    const privateLastMessage = await privateMessageModel.findOne({
                        conversationID
                    }, '-_id content status attachments senderData conversationID createdAt')
                        .sort({ createdAt: -1 })
                        .populate({
                            path: 'senderData',
                            select: "-_id profileID profileName profileAvatar"
                        })
                        .populate({
                            path: 'attachments',
                            select: '-_id fileType fileSize filePath fileCategory'
                        })
                        .lean();

                    const unreadMessageCount = await privateMessageModel.countDocuments({
                        conversationID,
                        status: { $ne: 'read' },
                        'senderData': { $ne: profileObjectID }
                    })
                        .lean();

                    return {
                        ...privateConversation,
                        participants: otherParticipantProfile,
                        lastMessageData: privateLastMessage || false,
                        notSeen: unreadMessageCount
                    };
                }));

                const groupConversationMembersSchema = await groupConversationMembersModel.find({ memberID: profileObjectID }, '-_id conversationID');

                const groupConversationIDs = groupConversationMembersSchema.map(conversation => conversation.conversationID);

                const groupConversationSchema = await groupConversationModel.find({ conversationID: { $in: groupConversationIDs } },
                    '-_id conversationID createdBy admin moderator createdAt isPrivate members lastMessageData groupName groupAvatar groupDescription')
                    .populate({
                        path: 'createdBy',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .lean();

                const groupConversationDetails = await Promise.all(groupConversationSchema.map(async (groupConversation) => {
                    const { conversationID } = groupConversation;

                    // Fetch group conversation members
                    const groupConversationMembers = await groupConversationMembersModel.find({ conversationID }, '-_id memberID role status createdAt')
                        .populate({
                            path: 'memberID',
                            select: '-_id profileID profileName profileAvatar'
                        })
                        .lean();

                    const currentUser = groupConversationMembers.find(member => member.memberID && member.memberID.profileID === profileID);
                    const userRole = currentUser?.role || 'member';
                    const memberJoinedAt = currentUser?.createdAt;

                    const queryCondition = (userRole === 'admin' || userRole === 'moderator')
                        ? { conversationID } // Admins and moderators can access all messages
                        : { conversationID, createdAt: { $gte: memberJoinedAt } }; // Regular users see messages after joining

                    const groupLastMessage = await groupMessageModel.findOne(queryCondition, '-_id content conversationID senderData createdAt')
                        .sort({ createdAt: -1 })
                        .populate({
                            path: "senderData",
                            select: "-_id profileID profileName profileAvatar"
                        })
                        .populate({
                            path: 'attachments',
                            select: '-_id fileType fileSize filePath fileCategory'
                        })
                        .lean();

                    return {
                        ...groupConversation,
                        members: groupConversationMembers,
                        lastMessageData: groupLastMessage || false
                    };
                }));

                const allConversationDetails = privateConversationDetails.concat(groupConversationDetails);

                allConversationDetails.sort((a, b) => {
                    // Check if lastMessageData is falsy (e.g., false, null, undefined)
                    if (!a.lastMessageData && !a.lastMessageData.createdAt) {
                        return 1;  // Place this conversation at the end
                    }
                    if (!b.lastMessageData && !b.lastMessageData.createdAt) {
                        return -1; // Place this conversation at the end
                    }

                    // If we have valid lastMessageData, proceed with sorting
                    const dateA = new Date(a.lastMessageData.createdAt);
                    const dateB = new Date(b.lastMessageData.createdAt);

                    // If either date is invalid, handle it gracefully
                    if (isNaN(dateA) || isNaN(dateB)) return 0;

                    // Sort by most recent (descending order)
                    return dateB - dateA;
                });

                socket.emit('participantsData', allConversationDetails, profileID);

                // Handle room joining for group conversations
                groupConversationDetails.forEach(groupConversation => {
                    const { conversationID } = groupConversation;
                    if (!socket.rooms.has(conversationID)) {
                        socket.join(conversationID);
                        roomsTosocketID.set(conversationID, (roomsTosocketID.get(conversationID) || new Set()).add(socket.id));
                    }
                });

                const profileIDtoString = profileObjectID.toString();
                if (!profileIDToSocketID.has(profileIDtoString)) {
                    profileIDToSocketID.set(profileIDtoString, { profileData: profileSchema });
                } else {
                    profileIDToSocketID.get(profileIDtoString).profileData.socketID.push(socket.id);
                }

                // // Handle logic on user connection
                // await privateVideoCall(profileObjectID);
                // await privateConversationsRequests(profileObjectID);
                // await groupConversationsRequests(profileObjectID);

                // const conversationIDs = privateConversations.map(conversation => conversation.conversationID);
                // const recipientSocketIDs = await findUserSocketIDByprofileID(conversationIDs, profileID);
                // if (recipientSocketIDs.length > 0) {
                //     const messageData = await markMessagesAsDeliveredWhenUserReLogin(conversationIDs);
                //     if (messageData) {
                //         recipientSocketIDs.forEach(socketID => {
                //             io.to(socketID).emit('messageDeliveredFeedbackAfterRelogin', messageData);
                //         });
                //     }
                // }

                getOnlineProfiles(allConversationDetails, profileID);
            } catch (error) {
                console.error('Error fetching user data:', error);
            }
        }

        // console.time('initProfile');
        await initProfile(sID);
        // console.timeEnd('initProfile');

        // Set up setupPrivateConversation functionality
        setupPrivateConversation(io, socket);
        setupGroupConversation(io, socket);

        socket.on('disconnect', async () => {
            try {
                if (!profileIDToSocketID || profileIDToSocketID.size === 0) {
                    console.log("profileIDToSocketID map is not initialized yet.");
                    return; // Exit early as there's no data to process
                }

                const { _id: profileObjectID, profileID, profileName, socketID } = findProfileDataBySocketID(socket.id);

                if (profileID) {
                    // console.log(`${socketID} disconnected`);

                    // console.log(`This is socketID: ${socketID}`);
                    // console.log(`This is socket.id: ${socket.id}`); 

                    // await profileModel.findOneAndUpdate(
                    //     { _id: profileObjectID },
                    //     { profileStatus: Date.now() },
                    //     { new: true })

                    const socketIndex = socketID.indexOf(socket.id);

                    if (socketIndex > -1) {
                        socketID.splice(socketIndex, 1);

                        if (socketID.length === 0) {
                            profileIDToSocketID.delete(profileObjectID.toString());

                            const privateConversationSchema = await privateConversationModel.find({ participants: profileObjectID }, '-_id conversationID')
                                .populate({
                                    path: 'participants',
                                    select: 'profileID'
                                })
                                .lean();
                            const groupConversationMembersSchema = await groupConversationMembersModel.find({ memberID: profileObjectID }, '-_id conversationID').lean();
                            const groupConversationIDs = groupConversationMembersSchema.map(conversation => conversation.conversationID);
                            const groupConversationMembersSchema2 = await groupConversationMembersModel.find({ conversationID: groupConversationIDs })
                                .populate({
                                    path: 'memberID',
                                    select: 'profileID'
                                })
                                .lean();

                            const groupProfileNames = groupConversationMembersSchema2
                                .filter(member => member.memberID._id.toString() !== profileID.toString())
                                .map(member => member.memberID.profileID);

                            const privateProfileNames = privateConversationSchema
                                .flatMap(conversation => conversation.participants) // Flatten the participants array
                                .filter(participant => participant._id.toString() !== profileID.toString()) // Exclude the current profile
                                .map(participant => participant.profileID); // Map to profileID                   

                            const allProfileNames = [...new Set([...groupProfileNames, ...privateProfileNames])];

                            allProfileNames.forEach(eachProfileID => {
                                const recipientSocketIDs = findSocketIDByprofileCustomID(eachProfileID);

                                if (recipientSocketIDs) {
                                    recipientSocketIDs.forEach(socketID => {
                                        io.to(socketID).emit('offlineProfile', profileID);
                                    });
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                console.log(error);
            }
        });

        // Function to return private conversation requests
        async function privateConversationsRequests(profileObjectID) {
            try {
                const privateConversationRequestSchema = await privateConversationRequestModel.find({ receiverData: profileObjectID },
                    '-_id createdAt requestID senderData status')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .lean();

                if (privateConversationRequestSchema.length > 0) {
                    socket.emit('privateConversationRequestDetails', privateConversationRequestSchema);
                }
            } catch (error) {
                console.error('Error in privateConversationsRequests:', error);
            }
        }

        // Function to return group conversation requests
        async function groupConversationsRequests(profileObjectID) {
            try {
                const groupConversationRequestSchema = await groupConversationRequestModel.find({ receiverData: profileObjectID },
                    '-_id createdAt requestID senderData groupData status')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .populate({
                        path: 'groupData',
                        select: '-_id groupName groupAvatar groupDescription conversationID createdBy'
                    })
                    .lean();

                if (groupConversationRequestSchema.length > 0) {
                    socket.emit('groupConversationRequestDetails', groupConversationRequestSchema);
                }
            } catch (error) {
                console.error('Error in groupConversationRequestDetails:', error);
            }
        }

        // Function to run when a user A is calling current user to feedback it's call
        async function privateVideoCall(profileObjectID) {
            try {
                const timeoutThreshold = new Date(Date.now() - 30 * 1000); // 30 seconds ago
                const privateCallSchema = await privateCallModel.findOne({
                    receiverData: profileObjectID,
                    status: "ringing",
                    createdAt: { $gte: timeoutThreshold } // Exclude calls older than 30 seconds
                })
                    .select('-_id callID conversationID senderData type status createdAt')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .lean();

                if (privateCallSchema) {
                    socket.emit('privateVideoCallRinging', privateCallSchema);

                    const receiverProfileID = privateCallSchema.senderData.profileID
                    const receiverSocketID = findSocketIDByprofileID(receiverProfileID);
                    const { callID } = privateCallSchema;

                    if (receiverSocketID) {
                        receiverSocketID.forEach(socketID => {
                            io.to(socketID).emit('privateVideoCallRingingFeedback', callID);
                        })
                    }
                }
            } catch (error) {
                console.error('Error in privateConversationsRequests:', error);
            }
        }

        async function markMessagesAsDeliveredWhenUserReLogin(conversationIDs) {
            try {
                // Find messages with status 'sent' and matching conversationID
                const messages = await privateMessageModel.find({ conversationID: { $in: conversationIDs }, status: 'sent' });

                // If no messages found, return early
                if (messages.length === 0) {
                    return; // Return undefined or handle as needed
                }

                // Update each message to 'delivered' and return the messageID and conversationID
                const updatedMessages = await Promise.all(messages.map(async message => {
                    const privateMessageUpdateSchema = await privateMessageModel.findOneAndUpdate(
                        { _id: message._id },
                        { status: 'delivered', delivered: Date.now() },
                        { new: true }
                    );

                    const { conversationID, messageID } = privateMessageUpdateSchema;

                    return { messageID, conversationID };
                }));

                return updatedMessages;
            } catch (error) {
                console.error('Error marking messages as delivered:', error);
                throw error; // Handle or propagate the error as needed
            }
        }

        function getOnlineProfiles(profileRelevantConversations, profileID) {
            const onlineProfileNames = new Set();

            // Use a Map for quick lookups of online users
            const onlineUsersSet = new Set(
                Array.from(profileIDToSocketID.values())
                    .filter(({ profileData }) => profileData.profileID)
                    .map(({ profileData }) => profileData.profileID)
            );

            // Extract all unique profile names involved in conversations
            profileRelevantConversations.forEach(eachConversation => {
                if (eachConversation.participants && eachConversation.participants.profileID) {
                    // Private conversation
                    if (eachConversation.participants.profileID !== profileID) {
                        onlineProfileNames.add(eachConversation.participants.profileID);
                    }
                } else if (eachConversation.members) {
                    // Group conversation
                    eachConversation.members.forEach(member => {
                        if (member.memberID.profileID && member.memberID.profileID !== profileID) {
                            onlineProfileNames.add(member.memberID.profileID);
                        }
                    });
                }
            });

            // Filter out only the online users from the extracted profile names
            const onlineUsers = Array.from(onlineProfileNames).filter(profile => onlineUsersSet.has(profile));

            if (onlineUsers.length > 0) {
                // Emit the list of online users when a user logs in
                socket.emit('onlineProfileList', onlineUsers);

                // For each online user, emit to the relevant users about the profile's status
                onlineUsers.forEach(eachProfileCustomID => {
                    const recipientSocketIDs = findSocketIDByprofileCustomID(eachProfileCustomID);
                    if (recipientSocketIDs) {
                        recipientSocketIDs.forEach(socketID => {
                            io.to(socketID).emit('onlineProfile', profileID);
                        });
                    }
                });
            }
        }
    });
};

// const createProfile = new profileModel({
//     profileName: 'profile123'
// });

// createProfile.save();

export default socketRouter;