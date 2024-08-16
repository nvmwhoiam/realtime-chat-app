import userIDToSocketID from '../maps/userIDToSocketID.js';

export default function findSocketIDByprofileName(profileName) {
    for (const [userId, userData] of userIDToSocketID.entries()) {
        if (userData.userData.profileName === profileName) {
            return userData.socketID;
        }
    }
    return null;
}