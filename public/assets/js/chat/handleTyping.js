import socket from '../socket/socketManager.js'; // Adjust the path as needed

import handleTypingStartPrivate from '../private/components/chat/handleTypingIndicator.js';
import handleTypingStartGroup from '../group/components/chat/handleTypingIndicator.js';

export function handleMessageOnInput(targetElement) {
    const chatContainer = targetElement.closest('.chat_container');
    const isGroup = chatContainer.classList.contains('group');
    const conversationID = chatContainer.getAttribute("data-chat_id");

    if (isGroup) {
        handleTypingStartGroup(targetElement, conversationID);
    } else {
        handleTypingStartPrivate(targetElement, conversationID);
    }
}

export function handleMessageOnBlur(targetElement) {
    const chatContainer = targetElement.closest('.chat_container');
    const isGroupChat = chatContainer.classList.contains('group');
    const conversationID = chatContainer.getAttribute("data-chat_id");

    const isTyping = targetElement.getAttribute('data-isTyping') === 'true';
    if (isTyping) {
        targetElement.setAttribute('data-isTyping', 'false');

        if (isGroupChat) {
            socket.emit('typingStopGroup', conversationID);
        } else {
            socket.emit('typingStopPrivate', conversationID);
        }
    }
}

export function handleMessageSubmit(target) {
    const chatContainer = target.closest('.chat_container');
    const conversationID = chatContainer.getAttribute("data-chat_id");
    const messageInput = chatContainer.querySelector("[name='send_message']");

    const messageValue = messageInput.value;

    const isGroup = chatContainer.classList.contains('group');

    if (messageValue.length === 0) {
        console.log("Message cannot be empty");
        return;
    }

    if (isGroup) {
        socket.emit("sendMessageGroup", messageValue, conversationID);
        handleTypingStopOnSubmit(chatContainer, 'group', conversationID);
    } else {
        socket.emit("sendMessage", messageValue, conversationID);
        handleTypingStopOnSubmit(chatContainer, 'private', conversationID);
    }

    chatContainer.querySelector(".message_form").reset();
}

function handleTypingStopOnSubmit(chatContainer, type, conversationID) {
    const messageInputSelector = chatContainer.querySelector('[name="send_message"]');
    const isTyping = messageInputSelector.getAttribute('data-isTyping') === 'true';

    if (isTyping) {
        messageInputSelector.setAttribute('data-isTyping', 'false');

        const typingStopEvent = type === 'group' ? 'typingStopGroup' : 'typingStopPrivate';
        socket.emit(typingStopEvent, conversationID);
    }
}