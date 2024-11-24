import setupSender from './sender.js';
import setupRecipient from './recipient.js';
import handleConversations from "./handleConversations.js";

import {
    observeMessages,
    handleUnreadMessages,
    resetDisplayedDividers
} from "../chat/messageState.js";

import {
    sendMessageGroup,
    recipientMessageGroup,
} from './functions.js';

"use strict"

const groupConversationHandle = (socket) => {

    // Set up setupSender functionality
    setupSender(socket);

    // Set up setupReceiver functionality
    setupRecipient(socket);

    // Set up handleConversations functionality
    handleConversations(socket);

    // Fetch group chat data
    socket.on("fetchChatDataGroup", (messages, currentUser) => {
        resetDisplayedDividers(); // Reset displayed dividers

        for (const messageData of messages) {
            const isSender = messageData.senderData.profileName === currentUser;

            if (isSender) {
                // Display sent message
                sendMessageGroup(messageData, currentUser);
            } else {
                // Display received message
                recipientMessageGroup(messageData, currentUser);
            }
        }

        handleUnreadMessages();
        observeMessages(socket);
    });

    // Reads the group chat messages and send it to the participants
    socket.on('readByGroupStatus', (conversationID, messageID, profileData) => {
        // handleMessageStatus(conversationID, messageID);
        console.log(messageID, conversationID, profileData);
    });
};

export default groupConversationHandle;