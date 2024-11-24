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

    socket.on("newMessage", (savedMessage) => {
        // Display received message
        recipientMessage(savedMessage, true);

        const { messageID, conversationID } = savedMessage;

        // Set attribute to delivered if the user is online
        ifActiveSetMessageStatusDelivered(messageID, conversationID);

        // If it gets to here means that the user is online and sends a feedback that the message is delivered
        socket.emit('messageDelivered', messageID, conversationID);

        handleUnreadMessages(true);
        observeMessages(socket);
    });
};

export default recipient;