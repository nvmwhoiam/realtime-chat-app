import profileIDToSocketID from '../maps/profileIDToSocketID.js';

export default function findProfileDataBySocketID(socketID) {
    for (const [profileID, profileDataMap] of profileIDToSocketID.entries()) {
        if (profileDataMap && profileDataMap.profileData) {
            const { socketID: socketIDArray } = profileDataMap.profileData;
            if (Array.isArray(socketIDArray) && socketIDArray.includes(socketID)) {
                return profileDataMap.profileData;
            }
        }
    }

    return null;
}