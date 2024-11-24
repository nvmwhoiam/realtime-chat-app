import {
    observeMessages,
    handleUnreadMessages
} from "../chat/messageState.js";

import {
    recipientMessageGroup
} from './functions.js';

const recipient = (socket) => {

    // Recipient message sent from the server
    socket.on("newMessageGroup", (savedMessage, currentUser) => {
        // Display received message
        recipientMessageGroup(savedMessage, currentUser, true);

        observeMessages(socket);
        handleUnreadMessages();
    });

};
export default recipient;