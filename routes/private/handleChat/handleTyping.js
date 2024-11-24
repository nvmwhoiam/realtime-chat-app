// handleTyping.js

import findUserSocketIDByprofileName from '../../../utils/findUserSocketIDByprofileName.js';

const handleTyping = async (io, socket) => {

    socket.on('typingStartPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("typingStartPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStartPrivate:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    socket.on('typingStopPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("typingStopPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStopPrivate:", error);
            socket.emit('error', 'An error occurred while typingStop.');
        }

    });
};

export default handleTyping;