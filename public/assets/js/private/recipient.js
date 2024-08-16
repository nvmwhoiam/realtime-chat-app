import {
    closeChat,
    resetDisplayedDividers,
    dropdownMenu,
    observeMessages,
    handleUnreadMessages,
    handleReadMessages,
} from "../functions.js";

import {
    sendMessage,
    recipientMessage,
    createUserItem,
    createChatContainer,
    ifActiveSetMessageStatusDelivered,
    ifActiveSetMessageStatusRead
} from './functions.js';

"use strict"

const recipient = (socket) => {

    // Recipient message sent from the server
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