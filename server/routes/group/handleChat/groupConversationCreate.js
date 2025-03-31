//Models
import profileModel from '../../../models/profileSchema.js'; // Import your profileModel 
import groupConversationModel from '../../../models/group/groupConversationSchema.js'; // Import your privateConversationModel 
import groupConversationMembersModel from '../../../models/group/groupConversationMembersSchema.js'; // Import your groupConversationMembersModel 
import groupConversationRequestModel from '../../../models/group/groupConversationRequestSchema.js'; // Import your conversationRequestModel 

import findSocketIDByprofileID from '../../../utils/findSocketIDByprofileID.js';

import roomsTosocketID from '../../../maps/roomsTosocketID.js';

const groupConversationHandle = async (io, socket) => {

    // Function to search and request a conversation.
    socket.on('groupConversationSearchProfileRequest', async (value) => {
        const { _id: profileObjectID, profileID, profileName } = socket.profileData;

        const queryValue = value.trim();

        // Find users matching the query, excluding the current user and users in conversations
        const profileSchema = await profileModel.find(
            {
                $and: [
                    { profileName: { $regex: queryValue, $options: 'i' } },
                    { _id: { $ne: profileObjectID } },
                ]
            },
            '_-id profileID profileName profileAvatar'
        );

        socket.emit('groupConversationSearchResults', profileSchema);
    });

    // Function to request a group conversation.
    socket.on('groupConversationRequest', async (invitedData) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const { groupName, groupDescription, members: groupMembers } = invitedData;

            const newGroupConversationSchema = new groupConversationModel({
                createdBy: profileObjectID,
                groupName,
                groupDescription
            });

            await newGroupConversationSchema.save();

            const { conversationID } = newGroupConversationSchema;

            const groupConversationSchema = await groupConversationModel.findOne({ conversationID })
                .select('-_id conversationID createdBy isPrivate groupName groupAvatar groupDescription lastMessageData')
                .populate({
                    path: 'createdBy',
                    select: 'profileID profileName profileAvatar'
                });


            const groupConversationMembersSchema = new groupConversationMembersModel({
                conversationID,
                memberID: profileObjectID,
                role: 'admin'
            });

            await groupConversationMembersSchema.save();

            const groupConversationMembersSchemaFind = await groupConversationMembersModel.find({ conversationID })
                .select('-_id conversationID memberID role status')
                .populate({
                    path: 'memberID',
                    select: '-_id profileID profileName profileAvatar'
                })
                .lean();

            handleJoinRoom(conversationID);

            // Directly add the populated members to the newGroupConversationSchema in-memory
            groupConversationSchema.members = groupConversationMembersSchemaFind;

            const senderSocketID = findSocketIDByprofileID(profileID);
            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit('groupConversationRequestFeedbackToSender', groupConversationSchema, profileID);
                });
            }

            // It retuns each profileName
            groupMembers.forEach(async eachMember => {
                const receiverData = await profileModel.findOne({ profileID: eachMember }, '_id profileID');
                const recipientSocketID = findSocketIDByprofileID(eachMember);

                const {
                    _id: recipientObjectID,
                    profileID,
                } = receiverData;

                const groupConversationRequestSchema = new groupConversationRequestModel({
                    senderData: profileObjectID,
                    receiverData: recipientObjectID,
                    groupData: newGroupConversationSchema._id
                });

                await groupConversationRequestSchema.save();

                // Fetch current user data 
                const groupConversationRequestSchema2 = await groupConversationRequestModel.findById(groupConversationRequestSchema._id)
                    .select('-_id createdAt requestID senderData groupData status')
                    .populate({
                        path: 'senderData',
                        select: '-_id profileID profileName profileAvatar'
                    })
                    .populate({
                        path: 'groupData',
                        select: '-_id groupName groupAvatar groupDescription conversationID createdBy'
                    })
                    .lean();
                if (recipientSocketID) {
                    recipientSocketID.map(eachSocketID => {
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
    // const { _id:profileObjectID, profileID, profileName } = socket.profileData;

    //         const senderData = await findProfileIDByProfileName(currentUser);
    //         const receiverData = await findProfileIDByProfileName(profileNameCanceled);
    //         const senderSocketID = findSocketIDByprofileID(profileNameCanceled);

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

    socket.on('groupConversationRequestAccept', async (requestID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const groupConversationRequestSchema = await groupConversationRequestModel.findOne({ requestID, receiverData: profileObjectID });

            const groupID = groupConversationRequestSchema.groupData;

            const groupConversationSchema = await groupConversationModel.findById(groupID)
                .select('-_id conversationID createdBy members isPrivate groupName groupAvatar groupDescription lastMessageData')
                .populate({
                    path: 'createdBy',
                    select: 'profileID profileName profileAvatar'
                });

            const { conversationID } = groupConversationSchema;

            const groupConversationMembersSchema = new groupConversationMembersModel({
                conversationID,
                memberID: profileObjectID
            });

            await groupConversationMembersSchema.save();

            const groupConversationMembers = await groupConversationMembersModel.find({ conversationID })
                .select('-_id memberID role status')
                .populate({
                    path: 'memberID',
                    select: '-_id profileID profileName profileAvatar'
                })
                .lean();

            groupConversationSchema.members = groupConversationMembers;

            await groupConversationRequestModel.deleteOne({ requestID });

            handleJoinRoom(conversationID);

            const senderSocketID = findSocketIDByprofileID(profileID);
            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("groupConversationRequestAcceptedFeedback", groupConversationSchema, profileID);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request accepted:', error);
            throw error;
        }
    });

    socket.on('groupConversationRequestReject', async (requestID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const groupConversationRequestSchema = await groupConversationRequestModel.findOne({ requestID, receiverData: profileObjectID })
                .populate({
                    path: 'senderData receiverData',
                    select: '-_id profileName'
                });

            if (!groupConversationRequestSchema) {
                console.log('No request has been found of this requestID');
                return;
            }

            const receiverProfileID = groupConversationRequestSchema.receiverData.profileID;

            const senderSocketID = findSocketIDByprofileID(profileID);
            const receiverSocketID = findSocketIDByprofileID(receiverProfileID);

            await groupConversationRequestSchema.deleteOne({ _id: groupConversationRequestSchema._id });

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("groupConversationRequestRejectedFeedback", requestID);
                });
            }

            if (receiverSocketID) {
                receiverSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("groupConversationRequestRejectedFeedback", requestID);
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

export default groupConversationHandle;