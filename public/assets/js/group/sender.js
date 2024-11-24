import {
    sendMessageGroup,
} from './functions.js';

const sender = (socket) => {

    // Get the sent data back with it's ID generated from the server
    socket.on('getSentMessageGroup', (savedMessage, currentUser) => {
        sendMessageGroup(savedMessage, currentUser, true);
    });

};

export default sender;