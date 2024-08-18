import setupSender from './sender.js';
import setupRecipient from './recipient.js';
import handleConversations from "./handleConversations.js";

import {
    resetDisplayedDividers,
    observeMessages,
    handleUnreadMessages
} from "../functions.js";

import {
    sendMessage,
    recipientMessage,
    ifActiveSetMessageStatusDelivered,
    ifActiveSetMessageStatusRead,
} from './functions.js';

"use strict"

const privateConversationHandle = (socket) => {

    // Set up setupSender functionality
    setupSender(socket);

    // Set up setupReceiver functionality
    setupRecipient(socket);

    // Set up handleConversations functionality
    handleConversations(socket);

    // Fetch private chat data
    socket.on("fetchChatData", (messages, currentUser) => {
        resetDisplayedDividers(); // Reset displayed dividers

        for (const messageData of messages) {
            const isSender = messageData.senderData.profileName === currentUser;

            if (isSender) {
                // Display sent message
                sendMessage(messageData);
            } else {
                // Display received message
                recipientMessage(messageData);
            }
        }

        // // Call stickyHeaderDividerCreate after processing messages
        // stickyHeaderDividerCreate(messages[0].conversationID);

        handleUnreadMessages();
        observeMessages(socket);
    });

    socket.on('readByStatus', (conversationID, messageID) => {
        ifActiveSetMessageStatusRead(conversationID, messageID);
    });

    // Get message feedback that user's message is delivered, when user logins after message was sent
    socket.on('messageDeliveredFeedbackAfterRelogin', (messageData) => {
        for (const messageDatas of messageData) {
            const { messageID, conversationID } = messageDatas;

            ifActiveSetMessageStatusDelivered(messageID, conversationID);
        }
    });
};

export default privateConversationHandle;