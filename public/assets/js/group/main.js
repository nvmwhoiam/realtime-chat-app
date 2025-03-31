import setupSender from './sender.js';
import setupRecipient from './recipient.js';

import {
    observeMessages,
    handleUnreadMessages,
    resetDisplayedDividers
} from "../chat/messageState.js";

import {
    sendMessageGroup,
    recipientMessageGroup,
} from './functions.js';

import {
    chatLoaderRemove
} from '../functions.js'

"use strict"

const groupConversationHandle = (socket) => {

    setupSender(socket);
    setupRecipient(socket);

    socket.on("fetchChatDataGroup", (groupMessages, profileID) => {
        resetDisplayedDividers();

        for (const messageData of groupMessages) {
            const isSender = messageData.senderData.profileID === profileID;
            if (isSender) {
                sendMessageGroup(messageData, profileID);
            } else {
                recipientMessageGroup(messageData, profileID);
            }
        }

        chatLoaderRemove();

        handleUnreadMessages();
        observeMessages(socket);
    });

    socket.on('readByGroupStatus', (conversationID, messageID, profileID) => {
        // handleMessageStatus(conversationID, messageID);
        console.log(conversationID, messageID, profileID);
    });
};

export default groupConversationHandle;