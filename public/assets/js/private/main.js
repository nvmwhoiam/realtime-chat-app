import setupSender from './sender.js';
import setupRecipient from './recipient.js';

import {
    observeMessages,
    handleUnreadMessages,
    resetDisplayedDividers
} from "../chat/messageState.js";

import {
    sendMessage,
    recipientMessage,
    ifActiveSetMessageStatusDelivered,
    ifActiveSetMessageStatusRead
} from './functions.js';

import {
    chatLoaderRemove
} from '../functions.js'

"use strict"

const privateConversationHandle = (socket) => {

    setupSender(socket);

    setupRecipient(socket);

    socket.on("privateMessagesFetchFeedback", (messagesData, profileID) => {
        // resetDisplayedDividers();

        // console.time('fetchMessage');
        for (const messageData of messagesData) {
            const isSender = messageData.senderData.profileID === profileID;
            if (isSender) {
                sendMessage(messageData);
            } else {
                recipientMessage(messageData);
            }
        }
        // console.timeEnd('fetchMessage');

        chatLoaderRemove();

        handleUnreadMessages();
        observeMessages(socket);
    });

    socket.on('readByStatus', (conversationID, messageID) => {
        ifActiveSetMessageStatusRead(conversationID, messageID);
    });

    socket.on('messageDeliveredFeedbackAfterRelogin', (messagesData) => {
        for (const messageData of messagesData) {
            const { conversationID, messageID } = messageData;
            console.log(messageData);
            ifActiveSetMessageStatusDelivered(conversationID, messageID);
        }
    });
};

export default privateConversationHandle;