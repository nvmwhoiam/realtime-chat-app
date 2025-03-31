// privateCall.js

import profileModel from '../../../models/profileSchema.js';

import privateCallModel from '../../../models/private/privateCallSchema.js';
import privateConversationModel from '../../../models/private/privateConversationSchema.js';

import findUserSocketIDByprofileID from '../../../utils/findUserSocketIDByprofileID.js';
import privateConversation from '../../../models/private/privateConversationSchema.js';

const privateVideoCall = async (io, socket) => {

    socket.on('privateCallFetchList', async () => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const privateCallSchema = await privateCallModel.find({
                $or: [
                    { senderData: profileObjectID },
                    { receiverData: profileObjectID }
                ]
            }, '-_id callID conversationID senderData receiverData type status endedBy reason createdAt')
                .populate({
                    path: 'senderData receiverData',
                    select: '-_id profileID profileName profileAvatar'
                })

            if (privateCallSchema.length > 0) {
                socket.emit('privateCallFetchListFeedback', privateCallSchema, profileID);
            }
        } catch (error) {
            console.error('Error in privateCallSchema:', error);
        }
    });

    socket.on('privateVideoCall', async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const otherParticipant = await getOtherParticipant(conversationID, profileObjectID);

            if (otherParticipant) {
                socket.emit("privateVideoCallFeedback", otherParticipant, conversationID);
            }
        } catch (error) {
            console.error("Error initiating video call:", error);
        }
    });

    socket.on('privateVideoCallStart', async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);
            const isRecipientOnline = recipientSocketID && recipientSocketID.length > 0;

            const otherParticipantID = await getOtherParticipantID(conversationID, profileObjectID);

            const statusCheck = isRecipientOnline ? 'ringing' : 'initiated';

            const newPrivateVideoCall = new privateCallModel({
                conversationID,
                senderData: profileObjectID,
                receiverData: otherParticipantID,
                type: 'video',
                status: statusCheck,
            });

            await newPrivateVideoCall.save();

            const privateCallSchema = await privateCallModel.findOne({ _id: newPrivateVideoCall._id }, '-_id callID conversationID senderData receiverData')
                .populate({
                    path: 'senderData receiverData',
                    select: '-_id profileID profileName profileAvatar'
                });

            if (privateCallSchema) {
                socket.emit("privateVideoCallStartFeedbackSender", privateCallSchema, isRecipientOnline);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateVideoCallStartFeedbackRecipient", privateCallSchema);
                });
            }
        } catch (error) {
            console.error("Error confirming video call:", error);
        }
    });

    socket.on('privateVideoCallTimeout', async (conversationID, callID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const privateCallSchema = await privateCallModel.findOneAndUpdate(
                { conversationID, callID },
                { status: 'ended', endedBy: 'system', reason: 'timeout' },
                { new: true }
            ).exec();

            if (privateCallSchema) {
                socket.emit("privateVideoCallTimeoutFeedback", callID);
            }
        } catch (error) {
            console.error("Error confirming video call:", error);
        }
    });

    socket.on('privateVideoCallSenderHangUp', async (conversationID, callID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            const privateCallSchema = await privateCallModel.findOneAndUpdate(
                { callID },
                { status: 'ended', endedBy: 'sender' },
                { new: true }
            ).exec();

            if (privateCallSchema) {
                socket.emit("privateVideoCallOutgoingHangUpFeedback", callID);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateVideoCallOutgoingHangUpFeedback", callID);
                });
            }
        } catch (error) {
            console.error("Error ending sender video call:", error);
        }
    });

    socket.on('privateVideoCallRecipientHangUp', async (conversationID, callID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            const privateCallSchema = await privateCallModel.findOneAndUpdate(
                { callID },
                { status: 'ended', endedBy: 'receiver' },
                { new: true }
            ).exec();

            if (privateCallSchema) {
                socket.emit("privateVideoCallOutgoingHangUpFeedback", callID);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateVideoCallOutgoingHangUpFeedback", callID);
                });
            }
        } catch (error) {
            console.error("Error ending recipient video call:", error);
        }
    });

    socket.on('privateVideoCallIncomingAccept', async (conversationID, callID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            const privateCallSchema = await privateCallModel.findOneAndUpdate(
                { callID },
                { status: 'in-progress' },
                { new: true }
            ).exec();

            if (privateCallSchema) {
                socket.emit("privateVideoCallIncomingAcceptFeedback", callID);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateVideoCallIncomingAcceptFeedback", callID);
                });
            }
        } catch (error) {
            console.error("Error accepting video call:", error);
        }
    });

    socket.on('privateVideoCallIncomingReject', async (conversationID, callID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            const privateCallSchema = await privateCallModel.findOneAndUpdate(
                { callID },
                { status: 'ended', endedBy: 'receiver', reason: 'declined' },
                { new: true }
            ).exec();

            if (privateCallSchema) {
                socket.emit("privateVideoCallIncomingRejectFeedback", callID);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("privateVideoCallIncomingRejectFeedback", callID);
                });
            }
        } catch (error) {
            console.error("Error rejecting video call:", error);
        }
    });

    async function getOtherParticipant(conversationID, profileObjectID) {
        try {
            const privateConversationSchema = await privateConversationModel.findOne({ conversationID });
            if (!privateConversationSchema) {
                throw new Error("Conversation not found");
            }

            const otherParticipantID = privateConversationSchema.participants.find(id => id.toString() !== profileObjectID.toString());
            if (!otherParticipantID) {
                throw new Error("No other participant found");
            }

            const participantProfile = await profileModel.findOne({ _id: { $in: otherParticipantID } }, "-_id profileName profileAvatar").lean();

            return participantProfile;
        } catch (error) {
            console.error("Error getting other participant:", error);
            socket.emit('error', 'An error occurred while getting other participant.');
        }
    }

    async function getOtherParticipantID(conversationID, profileObjectID) {
        try {
            const privateConversationSchema = await privateConversationModel.findOne({ conversationID });
            if (!privateConversationSchema) {
                throw new Error("Conversation not found");
            }

            const otherParticipantID = privateConversationSchema.participants.find(id => id.toString() !== profileObjectID.toString());
            if (!otherParticipantID) {
                throw new Error("No other participant found");
            }

            const participantProfileID = await profileModel.findOne({ _id: { $in: otherParticipantID } }, "_id").lean();

            return participantProfileID._id;
        } catch (error) {
            console.error("Error getting other participant:", error);
            socket.emit('error', 'An error occurred while getting other participant.');
        }
    }

    socket.on('video-stream', async (data) => {
        try {
            const { _id: profileID, profileName } = socket.profileData;
            // const recipientSocketID = await findSocketIDByprofileName('aqw12345');

            // recipientSocketID.map(eachSocketID => {
            //     // RecipientId is a room, send the message to the room
            //     io.to(eachSocketID).emit('video-stream', data);
            //     // Broadcast the video stream to all connected clients
            // });

            // socket.emit('video-stream', data);

        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });
};

export default privateVideoCall;