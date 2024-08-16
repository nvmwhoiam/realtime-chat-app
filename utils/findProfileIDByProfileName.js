import profileModel from '../models/profileSchema.js';

// Function to find a user id by profileName
export default async function findProfileIDByProfileName(profileName) {
    try {
        const users = await profileModel.findOne({ profileName }, '_id');
        return users;
    } catch (error) {
        console.error('Error finding profile:', error);
        throw error;
    }
}