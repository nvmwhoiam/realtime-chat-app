// handleTyping.js

const handleTyping = async (io, socket) => {

    // Typing start logic
    socket.on('typingStartGroup', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            if (socket.rooms.has(conversationID)) {
                // conversationID is a room, send the message to the room
                socket.to(conversationID).emit("typingStartGroupIndicator", conversationID, currentUser);
            }
        } catch (error) {
            console.error("Error typingStart:", error);
            socket.emit('error', 'An error occurred while typingStart.');
        }
    });

    // Typing stop logic
    socket.on('typingStopGroup', async (conversationID) => {
        try {
            const currentUser = socket.sID;

            if (socket.rooms.has(conversationID)) {
                // conversationID is a room, send the message to the room
                socket.to(conversationID).emit("typingStopGroupIndicator", conversationID, currentUser);
            }
        } catch (error) {
            console.error("Error typingStop:", error);
            socket.emit('error', 'An error occurred while typingStop.');
        }
    });
};

export default handleTyping;