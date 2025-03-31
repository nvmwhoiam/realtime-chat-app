import profileModel from '../models/profileSchema.js';
import privateConversationModel from '../models/private/privateConversationSchema.js';
import profileIDToSocketID from '../maps/profileIDToSocketID.js';

// Get socket ID via profile name that is not the sender
export default async function findUserSocketIDByprofileID(conversationID, profileID) {
    try {
        // Retrieve the user ID based on the profile name
        const user = await profileModel.findOne({ profileID });
        if (!user) {
            console.error(`User with profile name "${profileID}" not found.`);
            return false;
        }

        // Retrieve the conversation and its participants
        const conversation = await privateConversationModel.findOne({ conversationID })
            .populate({
                path: 'participants',
                select: '_id',
            })
            .exec();

        if (!conversation) {
            console.error(`Conversation with ID "${conversationID}" not found.`);
            return false;
        }

        // Find the participant that is not the sender
        const recipient = conversation.participants.find(
            participant => participant._id.toString() !== user._id.toString()
        );

        if (!recipient) {
            console.error(`No recipient found in conversation "${conversationID}".`);
            return false;
        }

        // Retrieve the socket ID for the recipient
        const recipientSocketData = profileIDToSocketID.get(recipient._id.toString());
        if (!recipientSocketData) {
            // console.error(`Socket data not found for user ID "${recipient._id}".`);
            return false;
        }

        return recipientSocketData.profileData.socketID;
    } catch (error) {
        console.error(`Error in findUserSocketIDByProfileName: ${error.message}`);
        return false;
    }
}