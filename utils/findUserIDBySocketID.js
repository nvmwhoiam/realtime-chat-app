import userIDToSocketID from '../maps/userIDToSocketID.js';

export default function findUserIDBySocketID(socketID) {
    for (const [userId, userData] of userIDToSocketID.entries()) {
        if (userData.socketID.includes(socketID)) {
            return userId;
        }
    }
    return null;
}