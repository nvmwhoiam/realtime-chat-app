import socket from '../socket/socketManager.js';

export function handleOnlineUsers() {
    socket.on('onlineProfile', (onlineProfile) => {
        // console.log('Profile is online:', onlineProfile);
        handleOnlineUsersUI(onlineProfile);
    });

    socket.on('onlineProfileList', (onlineProfiles) => {
        // console.log('Received online profiles:', onlineProfiles);
        for (const onlineProfile of onlineProfiles) {
            handleOnlineUsersUI(onlineProfile);
        }
    });
}

function handleOnlineUsersUI(onlineProfile) {
    const profileSelector = document.querySelectorAll(`[data-profile="${onlineProfile}"]`);

    if (profileSelector.length > 0) {
        profileSelector.forEach(eachProfile => {
            eachProfile.setAttribute('data-status', 'online');
        });
    }
}

socket.on('offlineProfile', (offlineProfile) => {
    console.log('Profile is offline:', offlineProfile);
    if (offlineProfile) {
        const profileSelector = document.querySelectorAll(`[data-profile="${offlineProfile}"]`);

        profileSelector.forEach(eachProfile => {
            eachProfile.setAttribute('data-status', 'offline');
        });
    }
});