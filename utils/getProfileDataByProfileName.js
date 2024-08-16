import profileModel from '../models/profileSchema.js';

// Get user data/ server use only
export default async function getProfileDataviaProfileName(profileName) {
    const userData = await profileModel.findOne({ profileName });

    return userData;
}