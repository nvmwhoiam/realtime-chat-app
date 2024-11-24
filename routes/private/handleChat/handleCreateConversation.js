// handleCreateConversation.js

// Models
import profileModel from '../../../models/profileSchema.js'; // Import your profileModel 
import privateConversationModel from '../../../models/private/privateConversationSchema.js'; // Import your privateConversationModel 
import conversationRequestModel from '../../../models/private/privateConversationRequestSchema.js'; // Import your conversationRequestModel 

// Maps
import findSocketIDByprofileName from '../../../utils/findSocketIDByprofileName.js';
import findProfileIDByProfileName from '../../../utils/findProfileIDByProfileName.js';

const handleCreateConversation = async (io, socket) => {

    // Function to search and request a conversation.
    socket.on('searchProfileToRequestPrivateConversation', async (value) => {
        const currentUser = socket.sID;

        const queryValue = value.trim();

        const users = await searchUsersByUsername(queryValue, currentUser);

        socket.emit('privateConversationSearchResults', users);
    });

    // Function to request a private conversation.
    socket.on('privateConversationRequest', async (profileNameRequested) => {
        try {
            const currentUser = socket.sID;

            const senderData = await findProfileIDByProfileName(currentUser);
            const receiverData = await findProfileIDByProfileName(profileNameRequested);
            const senderSocketID = findSocketIDByprofileName(profileNameRequested);

            // Create a new request instance
            const newRequest = new conversationRequestModel({
                senderData,
                receiverData,
            });

            // Save the request to the database
            await newRequest.save();

            // Populate the senderData
            const populatedRequest = await conversationRequestModel.findById(newRequest._id)
                .populate({
                    path: 'senderData',
                    select: '-_id profileName profileAvatar'
                });

            // Prepare user data to emit
            const userData = {
                senderData: populatedRequest.senderData,
                customID: populatedRequest.customID
            };

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    // Gets the sent message to the sender with the message datails, e.g messageID
                    io.to(eachSocketID).emit('privateConversationRequestFeedback', userData);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request:', error);
            throw error;
        }

    });

    // Function to cancel a requested conversation.
    socket.on('privateConversationRequestCancel', async (profileNameCanceled) => {
        try {
            const currentUser = socket.sID;

            const senderData = await findProfileIDByProfileName(currentUser);
            const receiverData = await findProfileIDByProfileName(profileNameCanceled);
            const senderSocketID = findSocketIDByprofileName(profileNameCanceled);

            const findConversationRequest = await conversationRequestModel.findOne({ senderData, receiverData });
            await conversationRequestModel.deleteOne({ _id: findConversationRequest._id });

            if (senderSocketID) {
                senderSocketID.map(eachSocketID => {
                    // Gets the sent message to the sender with the message datails, e.g messageID
                    io.to(eachSocketID).emit('privateConversationRequestCancelFeedback', findConversationRequest.customID);
                });
            }
        } catch (error) {
            console.error('Error canceling conversation request:', error);
            throw error;
        }
    });

    // Function to accept a requested conversation.
    socket.on('privateConversationRequestAccepted', async (customID) => {
        try {
            const currentUser = socket.sID;

            // Update the message status to 'delivered'
            const conversationRequestSchema = await conversationRequestModel.findOneAndUpdate(
                { customID: customID }, // Query object
                { status: 'accepted' }, // Update object
                { new: true } // Options: return the updated document
            ).populate({
                path: 'senderData receiverData',
                select: '-_id profileName profileAvatar'
            }); // Populate the receiverData;

            const senderProfileName = conversationRequestSchema.senderData.profileName;
            const receiverProfileName = conversationRequestSchema.receiverData.profileName;

            const senderData = await findProfileIDByProfileName(currentUser);
            const receiverData = await findProfileIDByProfileName(senderProfileName);

            const newConversationSchema = await privateConversationModel({
                participants: [
                    senderData,
                    receiverData
                ]
            }, "-_id conversationID isPrivate participants lastMessageData");

            await newConversationSchema.save();

            await conversationRequestModel.deleteOne({ customID });

            const senderSocketID = findSocketIDByprofileName(senderProfileName);
            const receiverSocketID = findSocketIDByprofileName(receiverProfileName);

            if (conversationRequestSchema && newConversationSchema) {
                const chatData = {
                    conversationID: newConversationSchema.conversationID,
                    lastMessageData: newConversationSchema.lastMessageData
                }

                if (senderSocketID) {
                    senderSocketID.map(eachSocketID => {

                        const userData = {
                            profileName: conversationRequestSchema.receiverData.profileName,
                            profileAvatar: conversationRequestSchema.receiverData.profileAvatar
                        }

                        // Sends a message to the recipient from a sender if it's online
                        io.to(eachSocketID).emit("privateConversationRequestAcceptedFeedback", userData, chatData);

                        // Emit status to online profile when profile accepts a conversation
                        io.to(eachSocketID).emit('onlineProfile', receiverProfileName);
                    });
                }

                if (receiverSocketID) {
                    receiverSocketID.map(eachSocketID => {

                        const userData = {
                            profileName: conversationRequestSchema.senderData.profileName,
                            profileAvatar: conversationRequestSchema.senderData.profileAvatar
                        }

                        // Sends a message to the recipient from a sender if it's online
                        io.to(eachSocketID).emit("privateConversationRequestAcceptedFeedback", userData, chatData);

                        // Emit status to online profile when profile accepts a conversation
                        io.to(eachSocketID).emit('onlineProfile', senderProfileName);
                    });
                }
            }
        } catch (error) {
            console.error('Error creating conversation request accepted:', error);
            throw error;
        }
    });

    // Function to reject a requested conversation.
    socket.on('privateConversationRequestRejected', async (customID) => {
        try {
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
            //         io.to(eachSocketID).emit("privateConversationRequestRejectedFeedback", customID);
            //     });
            // }

            if (receiverSocketID) {
                receiverSocketID.map(eachSocketID => {

                    // Sends a message to the recipient from a sender if it's online
                    io.to(eachSocketID).emit("privateConversationRequestRejectedFeedback", customID);
                });
            }
        } catch (error) {
            console.error('Error creating conversation request rejected:', error);
            throw error;
        }
    });

    // Function to find users by a partial username match, excluding those who have an existing conversation 
    // with the searching user or have a pending conversation request.
    async function searchUsersByUsername(query, currentUser) {
        try {
            // Find the current user's ID
            const currentUserID = await findProfileIDByProfileName(currentUser);

            // Find conversations involving the current user
            const conversations = await privateConversationModel.find(
                { participants: currentUserID },
                'participants -_id'
            );

            // Extract the participants from the conversations, flatten and filter out the current user ID
            const usersInConversations = conversations
                .flatMap(conv => conv.participants)
                .filter(id => id.toString() !== currentUserID.toString());

            // Find users matching the query, excluding the current user and users in conversations
            const users = await profileModel.find(
                {
                    $and: [
                        { profileName: { $regex: query, $options: 'i' } },
                        { _id: { $ne: currentUserID } },
                        { _id: { $nin: usersInConversations } }
                    ]
                },
                'profileName profileAvatar'
            );

            // Check for pending conversation requests
            const conversationRequests = await conversationRequestModel.find(
                { senderData: currentUserID, status: 'pending' },
                'receiverData'
            );

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