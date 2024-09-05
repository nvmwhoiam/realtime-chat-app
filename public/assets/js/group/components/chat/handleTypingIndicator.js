'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

// Map to handle typing profileNames by conversation
const typingProfileNamesByConversation = new Map();

socket.on("typingStartGroupFeedback", (conversationID, currentUser) => {
    handleTypingGroup(conversationID, currentUser)
});

socket.on("typingStopGroupFeedback", (conversationID, currentUser) => {
    handleTypingGroup(conversationID, currentUser, false)
});

export default function handleTypingStartGroup(selector, conversationID) {
    const isTyping = selector.getAttribute('data-isTyping') === 'false';
    if (isTyping) {
        selector.setAttribute('data-isTyping', 'true');
        socket.emit('typingStartGroup', conversationID);
    }
}

// Function to handle group typing logic
function handleTypingGroup(conversationID, currentUser, isStart = true) {
    if (!typingProfileNamesByConversation.has(conversationID)) {
        typingProfileNamesByConversation.set(conversationID, new Set());
    }

    const chatContainer = document.querySelector(`[data-chat_id="${conversationID}"]`);
    const conversationItem = document.querySelector(`[data-conversation_id="${conversationID}"]`);
    const isActive = chatContainer.classList.contains('active');
    const conversationContent = conversationItem.querySelector('.message_body');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    const typingProfileNames = typingProfileNamesByConversation.get(conversationID);

    if (isStart) {
        typingProfileNames.add(currentUser);
        handleTypingStart(isActive, conversationContent, chatMessages, typingProfileNames);
    } else {
        typingProfileNames.delete(currentUser);
        handleTypingStop(isActive, conversationContent, chatMessages, typingProfileNames);
    }
}

function handleTypingStart(isActive, conversationContent, chatMessages, typingProfileNames) {
    if (isActive) {
        updateOrAddTypingIndicator(chatMessages, Array.from(typingProfileNames).join(', '));
    } else {
        const isTyping = conversationContent.getAttribute('data-isTyping') === 'true';
        if (!isTyping) {
            conversationContent.setAttribute('data-isTyping', 'true');
            addTypingIndicator(conversationContent, typingProfileNames);
        } else {
            // Update the existing typing indicator with new user names
            updateTypingIndicator(conversationContent, typingProfileNames);
        }
    }
}

function handleTypingStop(isActive, conversationContent, chatMessages, typingProfileNames) {
    if (isActive) {
        if (typingProfileNames.size > 0) {
            updateOrAddTypingIndicator(chatMessages, Array.from(typingProfileNames).join(', '));
        } else {
            typingIndicatorRemove(chatMessages);
        }
    } else {
        if (typingProfileNames.size > 0) {
            updateTypingIndicator(conversationContent, typingProfileNames);
        } else {
            conversationContent.setAttribute('data-isTyping', 'false');
            removeTypingIndicator(conversationContent);
        }
    }
}

function addTypingIndicator(conversationContent, typingProfileNames) {
    const typingElement = document.createElement("p");
    typingElement.classList.add('typing');
    typingElement.innerHTML = `${Array.from(typingProfileNames).join(', ')} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
    conversationContent.appendChild(typingElement);
}

function updateTypingIndicator(conversationContent, typingProfileNames) {
    const typingElement = conversationContent.querySelector('.typing');
    if (typingElement) {
        typingElement.innerHTML = `${Array.from(typingProfileNames).join(', ')} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
    }
}

function updateOrAddTypingIndicator(chatMessages, typingProfileNames) {
    let typingElement = chatMessages.querySelector('.typing_indicator');
    if (typingElement) {
        // Update existing bubble with new names
        typingElement.querySelector('.typing_profile_name').textContent = typingProfileNames;
    } else {
        // If no existing bubble, create a new one
        const typingHTML = `
            <li class="typing_indicator">
                <div class="typing_profile_name">${typingProfileNames}</div>
                <div class="typing_bubble">
                    <span></span> <span></span> <span></span>
                </div>
            </li>
        `;
        chatMessages.insertAdjacentHTML("beforeend", typingHTML);
    }
}

function typingIndicatorRemove(chatMessages) {
    if (chatMessages) {
        const typingElement = chatMessages.querySelector('.typing_indicator');
        if (typingElement) {
            typingElement.remove();
        }
    }
}

function removeTypingIndicator(conversationContent) {
    const typingElement = conversationContent.querySelector('.typing');
    if (typingElement) {
        typingElement.remove();
    }
}