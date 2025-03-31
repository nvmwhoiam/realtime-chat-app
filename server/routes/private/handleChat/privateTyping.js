import findUserSocketIDByprofileID from '../../../utils/findUserSocketIDByprofileID.js';

const privateTyping = async (io, socket) => {

    socket.on('typingStartPrivate', async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;
            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("typingStartPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStartPrivate:", error);
        }
    });

    socket.on('typingStopPrivate', async (conversationID) => {
        try {
            const { _id: profileObjectID, profileID, profileName } = socket.profileData;

            const recipientSocketID = await findUserSocketIDByprofileID(conversationID, profileID);

            if (recipientSocketID) {
                recipientSocketID.map(eachSocketID => {
                    io.to(eachSocketID).emit("typingStopPrivateFeedback", conversationID);
                });
            }
        } catch (error) {
            console.error("Error typingStopPrivate:", error);
        }
    });
};

export default privateTyping;