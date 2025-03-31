import {
    observeMessages,
    handleUnreadMessages
} from "../chat/messageState.js";

import {
    recipientMessageGroup
} from './functions.js';

const recipient = (socket) => {

    // Recipient message sent from the server
    socket.on("newMessageGroup", (savedMessage, profileID) => {
        recipientMessageGroup(savedMessage, profileID, true);

        observeMessages(socket);
        handleUnreadMessages();
    });

};
export default recipient;