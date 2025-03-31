import socket from '../socket/socketManager.js';

const onlineProfilesSet = new Set();

export function handleOnlineUsers() {
    socket.on('onlineProfile', (onlineProfile) => {
        updateOnlineProfilesSet(onlineProfile, true);
    });

    socket.on('onlineProfileList', (onlineProfiles) => {
        for (const onlineProfile of onlineProfiles) {
            updateOnlineProfilesSet(onlineProfile, true);
        }
    });

    socket.on('offlineProfile', (offlineProfile) => {
        if (offlineProfile) {
            updateOnlineProfilesSet(offlineProfile, false);
        }
    });
}

function updateOnlineProfilesSet(profileID, isOnline) {
    if (isOnline) {
        if (!onlineProfilesSet.has(profileID)) {
            onlineProfilesSet.add(profileID);
            handleOnlineUsersUI(profileID, true);
        }
    } else {
        if (onlineProfilesSet.has(profileID)) {
            onlineProfilesSet.delete(profileID);
            handleOnlineUsersUI(profileID, false);
        }
    }
}

function handleOnlineUsersUI(profileID, isOnline) {
    const profileSelector = document.querySelectorAll(`[data-profile_id="${profileID}"]`);
    if (profileSelector.length > 0) {
        profileSelector.forEach(eachProfile => {
            eachProfile.setAttribute('data-status', isOnline ? 'online' : 'offline');
        });
    }
}