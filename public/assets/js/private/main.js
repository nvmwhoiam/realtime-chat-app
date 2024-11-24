import setupSender from './sender.js';
import setupRecipient from './recipient.js';
import handleConversations from "./components/chat/handleConversations.js";

import {
    observeMessages,
    handleUnreadMessages,
    resetDisplayedDividers
} from "../chat/messageState.js";

import {
    sendMessage,
    recipientMessage,
    ifActiveSetMessageStatusDelivered,
    ifActiveSetMessageStatusRead,
} from './functions.js';

"use strict"

const privateConversationHandle = (socket) => {

    setupSender(socket);

    setupRecipient(socket);

    handleConversations(socket);

    socket.on("fetchChatData", (messages, currentUser) => {
        resetDisplayedDividers();

        for (const messageData of messages) {
            const isSender = messageData.senderData.profileName === currentUser;

            if (isSender) {
                sendMessage(messageData);
            } else {
                recipientMessage(messageData);
            }
        }

        handleUnreadMessages();
        observeMessages(socket);
    });

    socket.on('readByStatus', (conversationID, messageID) => {
        ifActiveSetMessageStatusRead(conversationID, messageID);
    });

    socket.on('messageDeliveredFeedbackAfterRelogin', (messageData) => {
        for (const messageDatas of messageData) {
            const { messageID, conversationID } = messageDatas;

            ifActiveSetMessageStatusDelivered(messageID, conversationID);
        }
    });
};

export default privateConversationHandle;