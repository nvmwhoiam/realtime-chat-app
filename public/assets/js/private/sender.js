import {
    sendMessage,
    ifActiveSetMessageStatusDelivered,
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
};

export default sender;