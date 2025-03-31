import socket from '../socket/socketManager.js';

export const fileMap = new Map(); // Store files with a unique key

import handleTypingStartPrivate from '../private/components/chat/handleTypingIndicator.js';
import handleTypingStartGroup from '../group/components/chat/handleTypingIndicator.js';

export function handleMessageOnInput(e) {
    const messageInput = e.target.closest('[name="send_message"]');
    if (messageInput) {
        const chatContainerItem = messageInput.closest('.chat_container_item');
        const isGroup = chatContainerItem.classList.contains('group');
        const conversationID = chatContainerItem.getAttribute("data-chat_id");

        if (messageInput.value.length > 0) {
            chatContainerItem.querySelector('.form_button').classList.add('active');
        } else {
            chatContainerItem.querySelector('.form_button').classList.remove('active');
        }

        messageInput.style.height = 'auto';
        messageInput.style.height = `${messageInput.scrollHeight}px`;

        if (isGroup) {
            handleTypingStartGroup(messageInput, conversationID);
        } else {
            handleTypingStartPrivate(messageInput, conversationID);
        }
    }
}

export function handleMessageOnFocus(e) {
    const sendMessageInput = e.target.closest('[name="send_message"]');
    if (sendMessageInput) {
        setTimeout(() => {
            sendMessageInput.scrollIntoView({
                behavior: 'smooth',
                block: 'center'
            });
        }, 300);
    }
}

export function handleMessageOnBlur(e) {
    const sendMessageInput = e.target.closest('[name="send_message"]');
    if (sendMessageInput) {
        const chatContainerItem = sendMessageInput.closest('.chat_container_item');
        const isGroupChat = chatContainerItem.classList.contains('group');
        const conversationID = chatContainerItem.getAttribute("data-chat_id");

        const isTyping = sendMessageInput.getAttribute('data-isTyping') === 'true';
        if (isTyping) {
            sendMessageInput.setAttribute('data-isTyping', 'false');

            if (isGroupChat) {
                socket.emit('typingStopGroup', conversationID);
            } else {
                socket.emit('typingStopPrivate', conversationID);
            }
        }
    }
}

export function handleImageUpload(e) {
    const sendMessageInput = e.target.closest('[data-upload="images"]');
    if (sendMessageInput) {
        const chatContainerItem = sendMessageInput.closest('.chat_container_item');
        const chatFooter = chatContainerItem.querySelector('.chat_footer');
        const conversationID = chatContainerItem.getAttribute('data-chat_id');

        const files = Array.from(sendMessageInput.files); // Convert FileList to Array
        if (files.length > 0) {

            const uploadContainerHTML = `
                <div class="upload_container">
                    <ul class="photos_list"></ul>
                </div>`;

            chatFooter.insertAdjacentHTML("afterbegin", uploadContainerHTML);

            const uploadContainer = chatContainerItem.querySelector('.upload_container');
            const photosList = uploadContainer.querySelector('.photos_list');

            files.forEach((file, index) => {
                const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
                if (!allowedTypes.includes(file.type)) {
                    alert('Only JPEG, PNG, and GIF files are allowed.');
                    return;
                }

                if (file.size > 5 * 1024 * 1024) { // 5 MB limit
                    alert('File size must be less than 5 MB.');
                    return;
                }

                const reader = new FileReader();

                reader.onload = function (e) {
                    const fileContent = e.target.result;

                    const fileData = {
                        fileName: file.name,
                        fileType: file.type,
                        fileSize: file.size,
                        fileContent // Send the File object directly
                    }

                    fileMap.set(index, fileData);

                    const photoItemHTML = `
                        <li class="photos_item" data-index="${index}" >
                            <img src="${fileContent}" alt="Uploaded Image">

                            <button type="button" class="btn_icon" data-btn="remove_image_preview" aria-label="Preview delete">
                                <i class="icon_xmark-solid"></i>
                            </button>
                        </li>`;

                    photosList.insertAdjacentHTML("beforeend", photoItemHTML);
                };

                reader.readAsDataURL(file); // Read each file
            });
        }
    }
}

export function handleMessageSubmit(e) {
    const messageForm = e.target.closest('.message_form');
    if (messageForm) {
        const chatContainerItem = messageForm.closest('.chat_container_item');
        const conversationID = chatContainerItem.getAttribute("data-chat_id");
        const messageInput = messageForm.querySelector("[name='send_message']");
        const messageValue = messageInput.value;
        const isGroup = chatContainerItem.classList.contains('group');
        const isReply = messageForm.classList.contains('isReply');
        const replyMessageID = messageForm.getAttribute('data-reply_message_id');
        const replyContainer = chatContainerItem.querySelector('.reply_container');

        const chatFooter = chatContainerItem.querySelector('.chat_footer');
        const imageInput = chatFooter.querySelector('[data-upload="images"]');
        const uploadContainer = chatFooter.querySelector('.upload_container');
        const isFile = fileMap.size > 0;

        const filesData = Array.from(fileMap.values());

        const messageData = {
            isReply,
            messageID: replyMessageID,
            isFile,
            filesData,
            messageValue,
            conversationID
        }

        if (messageValue.length === 0 && !isFile) {
            console.log("Message cannot be empty!");
            return; // Stop execution if neither message nor image is provided
        }

        if (isGroup) {
            socket.emit("groupMessageSend", messageData);
            handleTypingStopOnSubmit(chatContainerItem, 'group', conversationID);
        } else {
            socket.emit("privateMessageSend", messageData);
            handleTypingStopOnSubmit(chatContainerItem, 'private', conversationID);
        }

        messageForm.reset();
        imageInput.value = '';
        fileMap.clear();
        messageInput.style.height = 'auto';

        if (uploadContainer) {
            uploadContainer.remove();
        }

        if (replyContainer) {
            replyContainer.remove();
            messageForm.classList.remove('reply');
            messageForm.removeAttribute('data-reply_message_id');
        }
    }
}

function handleTypingStopOnSubmit(chatContainerItem, type, conversationID) {
    const messageInputSelector = chatContainerItem.querySelector('[name="send_message"]');
    const isTyping = messageInputSelector.getAttribute('data-isTyping') === 'true';

    if (isTyping) {
        messageInputSelector.setAttribute('data-isTyping', 'false');

        const typingStopEvent = type === 'group' ? 'typingStopGroup' : 'typingStopPrivate';
        socket.emit(typingStopEvent, conversationID);
    }
}