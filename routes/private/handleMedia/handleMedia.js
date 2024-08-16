// handleMedia.js

import findUserSocketIDByprofileName from '../../../utils/findUserSocketIDByprofileName.js';

const handleMedia = async (io, socket) => {

    socket.on('videoCallPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("videoCallPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    socket.on('voiceCallPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

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