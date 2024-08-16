'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

socket.on("typingStartPrivateIndicator", (conversationID, currentUser) => {
    handleTypingPrivate(conversationID, currentUser)
});

socket.on("typingStopPrivateIndicator", (conversationID, currentUser) => {
    handleTypingPrivate(conversationID, currentUser, false)
});

export default function handleTypingStartPrivate(selector, conversationID) {
    if (!selector.classList.contains('typing')) {
        selector.classList.add('typing');
        socket.emit('typingStartPrivate', conversationID);
    }
}

// Function to handle group typing logic
function handleTypingPrivate(conversationID, currentUser, isStart = true) {
    const chatContainer = document.querySelector(`[data-chat_id="${conversationID}"]`);
    const conversationItem = document.querySelector(`[data-conversation_id="${conversationID}"]`);
    const isActive = chatContainer.classList.contains('active');
    const conversationContent = conversationItem.querySelector('.message_body');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    if (isStart) {
        if (isActive) {
            typingIndicatorPrivate(chatMessages, currentUser);
        } else {
            conversationContent.classList.add('active');
            conversationContent.querySelector('.chat_typing').innerHTML = `${currentUser} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
        }
    } else {
        if (isActive) {
            typingIndicatorRemove(chatMessages);
        } else {
            conversationContent.classList.remove('active');
            conversationContent.querySelector('.chat_typing').innerHTML = '';
        }
    }
}

// Function to handle group typing indicator
function typingIndicatorPrivate(chatMessages) {
    const typingHTML = `
        <li class="typing_indicator">
            <div class="typing_bubble">
                <span></span> <span></span> <span></span>
            </div>
        </li>
       ` ;

    chatMessages.insertAdjacentHTML("beforeend", typingHTML);

    // // Scroll to the bottom of the chat container
    // chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Function to handle group typing indicator remove
function typingIndicatorRemove(chatMessages) {
    chatMessages.querySelector('.typing_indicator').remove();
}