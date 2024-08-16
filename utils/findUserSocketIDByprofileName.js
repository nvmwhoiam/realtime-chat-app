import profileModel from '../models/profileSchema.js';
import privateConversationModel from '../models/privateConversationSchema.js';
import userIDToSocketID from '../maps/userIDToSocketID.js';

// Get socket id via profile name that is not the sender
export default async function findUserSocketIDByprofileName(conversationID, profileName) {
    const userID = await profileModel.findOne({ profileName: profileName });
    const privateConversationSchema = await privateConversationModel.findOne({ conversationID })
        .populate({
            path: 'participants',
            select: '_id'
        })
        .exec();

    // Filter out the participant that matches the currentUser profile name
    const filteredParticipants = privateConversationSchema.participants
        .filter(participant => participant._id.toString() !== userID._id.toString())
        .map(participant => participant._id.toString());

    // Join the array into a single string
    const participantsString = filteredParticipants.join(', ');

    // Retrieve the socket data for the participant
    const recipientSocketData = userIDToSocketID.get(participantsString);

    if (!recipientSocketData) {
        return false; // Socket data not found
    }

    const { socketID } = recipientSocketData;

    return socketID;
}