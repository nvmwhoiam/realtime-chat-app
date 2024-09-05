'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

socket.on("typingStartPrivateFeedback", (conversationID, currentUser) => {
    handleTypingPrivate(conversationID, currentUser); ``
});

socket.on("typingStopPrivateFeedback", (conversationID, currentUser) => {
    handleTypingPrivate(conversationID, currentUser, false);
});

export default function handleTypingStartPrivate(selector, conversationID) {
    const isTyping = selector.getAttribute('data-isTyping') === 'false';
    if (isTyping) {
        selector.setAttribute('data-isTyping', 'true');
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
        handleTypingStart(isActive, conversationContent, chatMessages, currentUser);
    } else {
        handleTypingStop(isActive, conversationContent, chatMessages);
    }
}

function handleTypingStart(isActive, conversationContent, chatMessages, currentUser) {
    if (isActive) {
        typingIndicatorPrivate(chatMessages, currentUser);
    } else {
        const isTyping = conversationContent.getAttribute('data-isTyping') === 'false';
        if (isTyping) {
            conversationContent.setAttribute('data-isTyping', 'true');
            addTypingIndicator(conversationContent, currentUser);
        }
    }
}

function handleTypingStop(isActive, conversationContent, chatMessages) {
    if (isActive) {
        typingIndicatorRemove(chatMessages);
    } else {
        conversationContent.setAttribute('data-isTyping', 'false');
        removeTypingIndicator(conversationContent);
    }
}

function addTypingIndicator(conversationContent, currentUser) {
    const typingElement = document.createElement("p");
    typingElement.classList.add('typing');
    typingElement.innerHTML = `${currentUser} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
    conversationContent.appendChild(typingElement);
}

function removeTypingIndicator(conversationContent) {
    const typingElement = conversationContent.querySelector('.typing');
    if (typingElement) {
        typingElement.remove();
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
    if (chatMessages) {
        chatMessages.querySelector('.typing_indicator').remove();
    }
}