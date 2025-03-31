import {
    sendMessageGroup,
} from './functions.js';

const sender = (socket) => {

    socket.on('getSentMessageGroup', (savedMessage, profileID) => {
        sendMessageGroup(savedMessage, profileID, true);
    });

};

export default sender;