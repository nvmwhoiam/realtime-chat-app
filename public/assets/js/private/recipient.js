import {
    observeMessages,
    handleUnreadMessages,
} from "../chat/messageState.js";

import {
    recipientMessage,
    ifActiveSetMessageStatusDelivered,
} from './functions.js';

"use strict"

const recipient = (socket) => {

    socket.on("recipientMessage", (savedMessage) => {
        recipientMessage(savedMessage, true);

        const { conversationID, messageID } = savedMessage;
        ifActiveSetMessageStatusDelivered(conversationID, messageID);

        handleUnreadMessages(true);
        observeMessages(socket);
    });
};

export default recipient;