import profileModel from '../models/profileSchema.js';

// Function to find a user id by profileName
export default async function findProfileIDByProfileID(profileID) {
    try {
        const profileSchema = await profileModel.findOne({ profileID });
        return profileSchema._id;
    } catch (error) {
        console.error('Error finding profile:', error);
        throw error;
    }
}