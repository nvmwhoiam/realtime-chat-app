// handleTyping.js

import findUserSocketIDByprofileName from '../../../utils/findUserSocketIDByprofileName.js';

const handleTyping = async (io, socket) => {

    // Typing start logic
    socket.on('typingStartPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;
            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("typingStartPrivateFeedback", conversationID, currentUser);
                });
            }
        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    // Typing stop logic
    socket.on('typingStopPrivate', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            const recipientSocketID = await findUserSocketIDByprofileName(conversationID, currentUser);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    // RecipientId is a room, send the message to the room
                    io.to(eachSocketID).emit("typingStopPrivateFeedback", conversationID, currentUser);
                });
            }
        } catch (error) {
            console.error("Error typingStop:", error);
            socket.emit('error', 'An error occurred while typingStop.');
        }

    });
};

export default handleTyping;