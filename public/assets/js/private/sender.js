import {
    closeChat,
    resetDisplayedDividers,
    dropdownMenu,
    handleReadMessages,
} from "../functions.js";

import {
    sendMessage,
    recipientMessage,
    createUserItem,
    createChatContainer,
    ifActiveSetMessageStatusDelivered,
    ifActiveSetMessageStatusRead,
} from './functions.js';

"use strict"

const sender = (socket) => {

    // Get the sent data back with it's ID generated from the server
    socket.on('sentMessage', (savedMessage) => {
        sendMessage(savedMessage, true);
    });

    // Get message feedback to the sender that user is online and message delivered
    socket.on('messageDeliveredFeedback', (messageID, conversationID) => {
        ifActiveSetMessageStatusDelivered(messageID, conversationID);
    });

    // socket.emit("typingStart", "cBcL4cvzYhHM");
    // socket.emit("typingStop", "cBcL4cvzYhHM");
};

export default sender;

// ! Looks quite messy needs to be tidied