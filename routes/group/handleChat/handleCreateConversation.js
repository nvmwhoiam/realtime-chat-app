// handleCreateConversation.js

//Models
import profileModel from '../../../models/profileSchema.js'; // Import your profileModel 
import groupConversationModel from '../../../models/group/groupConversationSchema.js'; // Import your privateConversationModel 
import groupConversationRequestModel from '../../../models/group/groupConversationRequestSchema.js'; // Import your conversationRequestModel 

import findSocketIDByprofileName from '../../../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../../../utils/findProfileIDByProfileName.js';

import roomsTosocketID from '../../../maps/roomsTosocketID.js';

const handleCreateConversation = async (io, socket) => {

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
                admin: senderID,
                createdBy: senderID,
                groupName,
                // groupAvatar: ,
                groupDescription,
                members: [senderID]
            });

            // Save the request to the database
            await newGroupConversationSchema.save();

            const groupConversationSchema = await groupConversationModel.findById(newGroupConversationSchema._id)
                .select('-_id conversationID createdBy admin moderator members isPrivate groupName groupAvatar groupDescription lastMessageData')
                .populate({
                    path: 'createdBy admin moderator members',
                    select: 'profileName profileAvatar'
                });
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
                    io.to(eachSocketID).emit("groupConversationRequestAcceptedFeedback", groupConversationSchema, currentUser);
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

    function handleJoinRoom(conversationID) {
        if (!socket.rooms.has(conversationID)) {
            socket.join(conversationID);
            roomsTosocketID.set(conversationID, (roomsTosocketID.get(conversationID) || new Set()).add(socket.id));
        }
    }
};

export default handleCreateConversation;