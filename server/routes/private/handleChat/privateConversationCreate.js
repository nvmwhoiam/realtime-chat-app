// Models
import profileModel from '../../../models/profileSchema.js';
import privateConversationModel from '../../../models/private/privateConversationSchema.js';
import conversationRequestModel from '../../../models/private/privateConversationRequestSchema.js';

// Maps
import findSocketIDByprofileCustomID from '../../../utils/findSocketIDByprofileID.js';
import findProfileIDByProfileID from '../../../utils/findProfileIDByProfileID.js';
import findUserSocketIDByProfileName from '../../../utils/findUserSocketIDByprofileID.js';

const handleCreateConversation = async (io, socket) => {

    // Function to search and request a conversation.
    socket.on('privateConversationSearchProfileRequest', async (value) => {
        const { _id: profileObjectID, profileID, profileName } = socket.profileData;

        const queryValue = value.trim();

        const users = await searchUsersByUsername(queryValue, profileObjectID);

        socket.emit('privateConversationSearchResults', users);
    });

    // Function to request a private conversation.
    socket.on('privateConversationRequest', async (requestedProfileID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            if (!requestedProfileID) {
                console.error('Conversation request profileID not found!');
                return;
            }

            const receiverData = await findProfileIDByProfileID(requestedProfileID);
            const recipientSocketID = findSocketIDByprofileCustomID(requestedProfileID);

            const newRequest = new conversationRequestModel({
                senderData: profileObjectID,
                receiverData,
            });

            await newRequest.save();

            const populatedRequest = await conversationRequestModel.findById(newRequest._id)
                .populate({
                    path: 'senderData',
                    select: '-_id profileID profileName profileAvatar'
                });

            const profileData = {
                senderData: populatedRequest.senderData,
                profileID: populatedRequest.profileID
            };

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit('privateConversationRequestFeedback', profileData);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request:', error);
            throw error;
        }
    });

    // Function to cancel a requested conversation.
    socket.on('privateConversationRequestCancel', async (cancelProfileID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            if (!cancelProfileID) {
                console.error('Conversation requested profileID not found!');
                return;
            }

            const receiverData = await findProfileIDByProfileID(cancelProfileID);
            const recipientSocketID = findSocketIDByprofileCustomID(cancelProfileID);

            const findConversationRequest = await conversationRequestModel.findOne({ senderData: profileObjectID, receiverData });
            if (findConversationRequest) {
                await conversationRequestModel.deleteOne({ _id: findConversationRequest._id });

                const { requestID } = findConversationRequest;

                if (recipientSocketID) {
                    recipientSocketID.map(eachSocketID => {
                        io.to(eachSocketID).emit('privateConversationRequestCancelFeedback', requestID);
                    });
                }
            }
        } catch (error) {
            console.error('Error canceling conversation request:', error);
            throw error;
        }
    });

    // Function to accept a requested conversation.
    socket.on('privateConversationRequestAccept', async (requestID) => {
        try {
            const { _id: profileObjectID, profileID, profileName, profileAvatar } = socket.profileData;

            const conversationRequestSchema = await conversationRequestModel.findOne({ requestID, status: 'pending' })
                .populate({
                    path: 'senderData receiverData',
                    select: 'profileID profileName profileAvatar'
                });

            if (!conversationRequestSchema) {
                console.error('Conversation request not found or already processed.');
                return;
            }

            const senderProfileData = conversationRequestSchema.senderData;

            const newConversationSchema = new privateConversationModel({
                participants: [
                    profileObjectID,
                    senderProfileData._id
                ]
            }, "-_id conversationID isPrivate lastMessageData");

            await newConversationSchema.save();

            await conversationRequestModel.deleteOne({ requestID });

            if (conversationRequestSchema && newConversationSchema) {
                const senderSocketID = findSocketIDByprofileCustomID(senderProfileData.profileID);
                const receiverSocketID = findSocketIDByprofileCustomID(profileID);

                const { conversationID, isPrivate, createdAt, lastMessageData } = newConversationSchema;

                const chatData = {
                    conversationID,
                    isPrivate,
                    createdAt,
                    lastMessageData
                }

                // it sends accept to other profile 
                if (senderSocketID) {
                    senderSocketID.map(eachSocketID => {
                        const profileData = {
                            profileID,
                            profileName,
                            profileAvatar
                        }

                        io.to(eachSocketID).emit("privateConversationRequestAcceptFeedback", profileData, chatData);
                        io.to(eachSocketID).emit('onlineProfile', profileID);
                    });
                }

                // it sends accept to current profile 
                if (receiverSocketID) {
                    receiverSocketID.map(eachSocketID => {
                        const profileData = {
                            profileID: conversationRequestSchema.senderData.profileID,
                            profileName: conversationRequestSchema.senderData.profileName,
                            profileAvatar: conversationRequestSchema.senderData.profileAvatar
                        }

                        io.to(eachSocketID).emit("privateConversationRequestAcceptFeedback", profileData, chatData);
                        io.to(eachSocketID).emit('onlineProfile', senderProfileData.profileID);
                    });
                }
            }
        } catch (error) {
            console.error('Error creating conversation request accepted:', error);
            throw error;
        }
    });

    // Function to reject a requested conversation.
    socket.on('privateConversationRequestReject', async (requestID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const conversationRequestSchema = await conversationRequestModel.findOne({ requestID }, { receiverData: profileObjectID })
                .populate({
                    path: 'senderData',
                    select: '-_id profileID'
                });

            const receiverProfileID = conversationRequestSchema.senderData.profileID;

            const senderSocketID = findSocketIDByprofileCustomID(profileID);
            const receiverSocketID = findSocketIDByprofileCustomID(receiverProfileID);

            // Delete the found document
            await conversationRequestSchema.deleteOne({ _id: conversationRequestSchema._id });

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateConversationRequestRejectFeedback", requestID);
                });
            }

            // if (receiverSocketID) {
            //     receiverSocketID.map(eachSocketID => {
            //         io.to(eachSocketID).emit("privateConversationRequestRejectFeedback", requestID);
            //     });
            // }
        } catch (error) {
            console.error('Error creating conversation request reject:', error);
            throw error;
        }
    });

    // Function to find users by a partial username match, excluding those who have an existing conversation 
    // with the searching user or have a pending conversation request.
    async function searchUsersByUsername(query, profileObjectID) {
        try {
            const privateConversationSchema = await privateConversationModel.find({ participants: profileObjectID }, 'participants -_id');

            // Extract the participants from the conversations, flatten and filter out the current user ID
            const usersInConversations = privateConversationSchema
                .flatMap(conv => conv.participants)
                .filter(id => id.toString() !== profileObjectID.toString());

            // Find users matching the query, excluding the current user and users in conversations
            const users = await profileModel.find(
                {
                    $and: [
                        { profileName: { $regex: query, $options: 'i' } },
                        { _id: { $ne: profileObjectID } },
                        { _id: { $nin: usersInConversations } }
                    ]
                },
                'profileID profileName profileAvatar'
            );

            // Check for pending conversation requests
            const conversationRequests = await conversationRequestModel.find({ senderData: profileObjectID, status: 'pending' }, 'receiverData');

            const pendingRequests = conversationRequests.map(req => req.receiverData.toString());

            // Add status to users
            const usersWithStatus = users.map(user => {
                const userID = user._id.toString();
                if (pendingRequests.includes(userID)) {
                    return { ...user.toObject(), requestStatus: 'pending' };
                }

                return { ...user.toObject(), requestStatus: 'available' };
            });

            // Remove _id from each user object before returning
            const usersWithoutID = usersWithStatus.map(user => {
                const { _id, ...userWithoutID } = user;
                return userWithoutID;
            });

            return usersWithoutID;
        } catch (error) {
            console.error('Error searching for users:', error);
            throw error;
        }
    }
};

export default handleCreateConversation;