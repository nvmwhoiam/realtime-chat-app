'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

// Map to handle typing profileNames by conversation
const typingProfileNamesByConversation = new Map();

socket.on("typingStartGroupIndicator", (conversationID, currentUser) => {
    handleTypingGroup(conversationID, currentUser)
});

socket.on("typingStopGroupIndicator", (conversationID, currentUser) => {
    handleTypingGroup(conversationID, currentUser, false)
});

export default function handleTypingStartGroup(selector, conversationID) {
    if (!selector.classList.contains('typing')) {
        selector.classList.add('typing');
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

        if (isActive) {
            typingIndicatorGroup(chatMessages, Array.from(typingProfileNames).join(', '));
        } else {
            conversationContent.classList.add('active');
            conversationContent.querySelector('.chat_typing').innerHTML = `${Array.from(typingProfileNames).join(', ')} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
        }
    } else {
        typingProfileNames.delete(currentUser);

        if (isActive) {
            typingIndicatorRemove(chatMessages);
        } else {
            if (typingProfileNames.size > 0) {
                conversationContent.querySelector('.chat_typing').innerHTML = `${Array.from(typingProfileNames).join(', ')} is typing <span class="dots"><span></span> <span></span> <span></span></span>`;
            } else {
                conversationContent.classList.remove('active');
                conversationContent.querySelector('.chat_typing').innerHTML = '';
            }
        }
    }
}

// Function to handle group typing indicator
function typingIndicatorGroup(chatMessages, currentUser) {
    const typingHTML = `
        <li class="typing_indicator">
            <div class="typing_profile_name">${currentUser}</div>
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