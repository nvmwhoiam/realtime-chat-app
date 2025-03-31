const groupTyping = async (io, socket) => {

    // Typing start logic
    socket.on('typingStartGroup', async (conversationID) => {
        try {
            const { _id: profileID, profileName } = socket.profileData;

            if (socket.rooms.has(conversationID)) {
                socket.to(conversationID).emit("typingStartGroupFeedback", conversationID, profileName);
            }
        } catch (error) {
            console.error("Error typingStart:", error);
        }
    });

    // Typing stop logic
    socket.on('typingStopGroup', async (conversationID) => {
        try {
            const { _id: profileID, profileName } = socket.profileData;

            if (socket.rooms.has(conversationID)) {
                socket.to(conversationID).emit("typingStopGroupFeedback", conversationID, profileName);
            }
        } catch (error) {
            console.error("Error typingStop:", error);
        }
    });
};

export default groupTyping;