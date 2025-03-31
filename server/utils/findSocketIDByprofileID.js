import profileIDToSocketID from '../maps/profileIDToSocketID.js';

export default function findSocketIDByprofileID(profileID) {
    for (const [index, profileDataMap] of profileIDToSocketID.entries()) {
        if (profileDataMap.profileData.profileID === profileID) {
            return profileDataMap.profileData.socketID;
        }
    }
    return null;
}