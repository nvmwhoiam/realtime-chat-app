// handleMedia.js

import privateCallModel from '../../../models/private/privateCallSchema.js';

import findUserSocketIDByprofileName from '../../../utils/findUserSocketIDByprofileName.js';
import findProfileIDByProfileName from '../../../utils/findProfileIDByProfileName.js';
import findUserIDBySocketID from '../../../utils/findUserIDBySocketID.js';

const handleMedia = async (io, socket) => {

    socket.on('videoCallPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);
            const isRecipientOnline = recipientSocketID && recipientSocketID.length > 0;

            // const senderID = await findProfileIDByProfileName(currentUser);
            // const recipientID = findUserIDBySocketID(recipientSocketID);

            const newPrivateVideoCall = new privateCallModel({
                conversationID: '32250975ad96d35d9e62b1dc0b1d3841',
                senderData: '66773f6623c7e6d60bdcf4e7',
                receiverData: '66773f91ac788b73c8d8b940',
                type: 'video',
                status: 'initiated',
            });

            await newPrivateVideoCall.save();

            const privateCallSchema = await privateCallModel.findOne({ _id: newPrivateVideoCall._id }, '-_id')
                .populate({
                    path: 'senderData receiverData',
                    select: '-_id profileName profileAvatar'
                });


            if (privateCallSchema) {
                socket.emit("videoCallPrivateSenderFeedback", privateCallSchema, isRecipientOnline);
            }

            if (recipientSocketID && privateCallSchema) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("videoCallPrivateRecipientFeedback", privateCallSchema);
                });
            }
        } catch (error) {
            console.error("Error initiating video call:", error);
            socket.emit('error', 'An error occurred while initiating video call.');
        }
    });

    socket.on('voiceCallPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            console.log(conversationID);

            return

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("voiceCallPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    socket.on('videoCallCancelPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("videoCallCancelPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error canceling video call:", error);
            socket.emit('error', 'An error occurred while canceling video call.');
        }
    });

    socket.on('videoCallAcceptPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("videoCallAcceptPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error accepting video call:", error);
            socket.emit('error', 'An error occurred while accepting video call:.');
        }
    });

    socket.on('video-stream', async (data) => {
        try {
            // const currentUser = socket.sID;
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

export default handleMedia;