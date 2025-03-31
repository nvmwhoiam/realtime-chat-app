'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

socket.on("typingStartPrivateFeedback", (conversationID) => {
    handleTypingPrivate(conversationID);
});

socket.on("typingStopPrivateFeedback", (conversationID) => {
    handleTypingPrivate(conversationID, false);
});

export default function handleTypingStartPrivate(selector, conversationID) {
    const isTyping = selector.getAttribute('data-isTyping') === 'false';
    if (isTyping) {
        selector.setAttribute('data-isTyping', 'true');

        socket.emit('typingStartPrivate', conversationID);
    }
}

// Function to handle private typing logic
function handleTypingPrivate(conversationID, isStart = true) {
    const chatContainerItem = document.querySelector(`[data-chat_id="${conversationID}"]`);
    const conversationItem = document.querySelector(`[data-conversation_id="${conversationID}"]`);
    const isActive = chatContainerItem.classList.contains('active');
    const messageBody = conversationItem.querySelector('.message_body');
    const chatMessages = chatContainerItem.querySelector('.chat_messages');

    if (isStart) {
        handleTypingStart(isActive, messageBody, chatMessages);
    } else {
        handleTypingStop(isActive, messageBody, chatMessages);
    }
}

function handleTypingStart(isActive, messageBody, chatMessages) {
    if (isActive) {
        typingIndicatorPrivate(chatMessages);
    } else {
        const isTyping = messageBody.getAttribute('data-isTyping') === 'false';
        if (isTyping) {
            messageBody.setAttribute('data-isTyping', 'true');
            addTypingIndicator(messageBody);
        }
    }
}

function handleTypingStop(isActive, messageBody, chatMessages) {
    if (isActive) {
        typingIndicatorRemove(chatMessages);
    } else {
        messageBody.setAttribute('data-isTyping', 'false');
        removeTypingIndicator(messageBody);
    }
}

// Function to add typing indicator on a conversation list item
function addTypingIndicator(messageBody) {
    const typingElement = document.createElement("p");
    typingElement.classList.add('typing');
    typingElement.innerHTML = 'is typing <span class="dots"><span></span> <span></span> <span></span></span>';
    messageBody.appendChild(typingElement);
}

// Function to remove typing indicator on a conversation list item
function removeTypingIndicator(messageBody) {
    const typingElement = messageBody.querySelector('.typing');
    if (typingElement) {
        typingElement.remove();
    }
}

// Function to add typing indicator on a chat body
function typingIndicatorPrivate(chatMessages) {
    const typingHTML = `
        <li class="typing_indicator">
            <div class="typing_bubble">
                <span></span> <span></span> <span></span>
            </div>
        </li>
       ` ;

    chatMessages.insertAdjacentHTML("beforeend", typingHTML);
}

// Function to remove typing indicator on a chat body
function typingIndicatorRemove(chatMessages) {
    if (chatMessages) {
        chatMessages.querySelector('.typing_indicator').remove();
    }
}