import {
    closeChat,
    resetDisplayedDividers,
    dropdownMenu,
    setClosingToClosed,
    setClosedToOpen,

} from "./functions.js";

import {
    createUserItemGroup,
    createChatContainerGroup,
} from './group/functions.js';

import {
    createUserItem,
    createChatContainer,
} from './private/functions.js';

import selectors from "./utils/selectors.js";

import { handleVideoCallButton } from "./private/components/media/handleVideoCall.js";
import { handleVoiceCallButton } from "./private/components/media/handleVoiceCall.js";

import privateConversationHandle from "./private/main.js";
import groupConversationHandle from "./group/main.js";

import handleTypingStartPrivate from './private/components/chat/handleTypingIndicator.js';
import handleTypingStartGroup from './group/components/chat/handleTypingIndicator.js';

import socket from './socket/socketManager.js'; // Adjust the path as needed

const urlParams = new URLSearchParams(window.location.search);
const sID = urlParams.get("sID");

const profileAvatars = document.querySelectorAll('.profile_avatar_container');

// Event listener when the socket connects
socket.on("connect", async () => {

    socket.emit('fetchUserData', sID);

    // Add event listeners to interact with the server
    socket.on('userData', (userData) => {
        profileAvatars.forEach(e => {

            const ifExists = e.querySelector('.profile_avatar');
            if (!ifExists) {
                const createImg = document.createElement("img");
                createImg.src = "../uploads/userAvatars/" + userData.profileAvatar;
                createImg.setAttribute('alt', 'Profile Avatar');
                createImg.classList.add('profile_avatar');
                e.appendChild(createImg);
            }
        });
    });

    socket.on('participantsData', (conversationsData, profileName) => {
        selectors.conversationList.innerHTML = '';

        for (const chatData of conversationsData) {
            conversationsItem(chatData, profileName);
        }

        chatEventListeners();

        if (conversationsData.length === 0) return;

        handleOnlineUsers();
    });

    function handleOnlineUsers() {
        socket.on('onlineProfile', (onlineProfile) => {
            handleOnlineUsersUI(onlineProfile);
        });

        socket.on('onlineProfileList', (onlineProfiles) => {
            for (const onlineProfile of onlineProfiles) {
                handleOnlineUsersUI(onlineProfile);
            }
        });
    }

    function handleOnlineUsersUI(onlineProfile) {
        const profileSelector = document.querySelectorAll(`[data-profile="${onlineProfile}"]`);

        if (profileSelector.length > 0) {
            profileSelector.forEach(eachProfile => {
                eachProfile.setAttribute('data-status', 'online');
            });
        }
    }

    socket.on('offlineProfile', (offlineProfile) => {
        if (offlineProfile) {
            const profileSelector = document.querySelectorAll(`[data-profile="${offlineProfile}"]`);

            profileSelector.forEach(eachProfile => {
                eachProfile.setAttribute('data-status', 'offline');
            });
        }
    });

    privateConversationHandle(socket);
    groupConversationHandle(socket);
});

function chatEventListeners() {
    selectors.conversationList.addEventListener('click', function (event) {
        // Use closest to find the nearest .conversation ancestor
        const conversationItem = event.target.closest('.conversation_btn');

        if (conversationItem) {
            handleConversationButtons(conversationItem);
        }
    });

    selectors.chatsContainer.addEventListener('click', function (event) {
        // Use closest to find the nearest .chat_container ancestor
        const chatContainerInner = event.target.closest('.chat_container');
        if (!chatContainerInner) return;  // Exit if no .chat_container is found

        const closeModal = chatContainerInner.querySelector("[data-btn='close_modal']");

        if (closeModal && closeModal.contains(event.target)) {
            closeChat();
        }

        const voiceCallBtn = chatContainerInner.querySelector('[data-btn="voiceCall"]');
        const videoCallBtn = chatContainerInner.querySelector('[data-btn="videoCall"]');

        const conversationID = chatContainerInner.getAttribute('data-chat_id');

        if (voiceCallBtn && voiceCallBtn.contains(event.target)) {
            handleVoiceCallButton(conversationID);
        }

        if (videoCallBtn && videoCallBtn.contains(event.target)) {
            handleVideoCallButton(conversationID);
        }

        // Event listener for side bar toggle
        const sideBarToggleButton = chatContainerInner.querySelector("[data-btn='side_bar_toggle']");
        if (sideBarToggleButton && sideBarToggleButton.contains(event.target)) {
            const parentElement = chatContainerInner.querySelector('.chat_side_panel');
            const isOpen = parentElement.getAttribute('data-state') === 'open';

            if (isOpen) {
                setClosingToClosed(parentElement);
            } else {
                setClosedToOpen(parentElement);
            }
        }

        const attachBtns = chatContainerInner.querySelector('[data-btn="attach"]');
        const emojisBtns = chatContainerInner.querySelector('[data-btn="emojis"]');
        if (attachBtns && attachBtns.contains(event.target)) {
            const targetElement = event.target.closest(".dropdown").querySelector(".icon_dropdown_menu");
            dropdownMenu(targetElement);
        }

        if (emojisBtns && emojisBtns.contains(event.target)) {
            const targetElement = event.target.closest(".dropdown").querySelector(".icon_dropdown_menu");
            dropdownMenu(targetElement);
        }

        // Close any open context menus first
        // closeAllContextMenus();
    });

    // selectors.chatsContainer.addEventListener("contextmenu", function (event) {
    //     event.preventDefault();
    //     const messageElement = event.target.closest('li[data-message_id]');
    //     if (messageElement) {
    //         handleMessageClick(messageElement);
    //     } else {
    //         closeAllContextMenus();
    //     }
    // });

    selectors.chatsContainer.addEventListener('submit', function (event) {
        // Check if the event target is a form with the class 'message_form'
        if (event.target.matches(".message_form")) {
            event.preventDefault(); // Prevent the default form submission behavior

            // Call your submission handler
            handleMessageSubmit(event.target);
        }
    });

    selectors.chatsContainer.addEventListener('input', function (event) {
        // Check if the event target is a form with the class 'message_form'
        if (event.target.matches('[name="send_message"]')) {

            handleMessageOnInput(event.target);
        }
    });

    selectors.chatsContainer.addEventListener('focusout', function (event) {
        // Check if the event target is an input with the name 'send_message'
        if (event.target.matches('[name="send_message"]')) {

            handleMessageOnBlur(event.target);
        }
    });
}

function conversationsItem(chatData, profileName) {
    if (chatData.isPrivate) {
        const participant = chatData.participants[0];
        createUserItem(participant, chatData);
        createChatContainer(participant, chatData);
    } else {
        createUserItemGroup(chatData, profileName);
        createChatContainerGroup(chatData);
    }
}

// Function to handle message on input
function handleMessageOnInput(targetElement) {
    const chatContainer = targetElement.closest('.chat_container');
    const isGroup = chatContainer.classList.contains('group');
    const conversationID = chatContainer.getAttribute("data-chat_id");

    if (isGroup) {
        handleTypingStartGroup(targetElement, conversationID);
    } else {
        handleTypingStartPrivate(targetElement, conversationID);
    }
}

// Function to handle message on blur
function handleMessageOnBlur(targetElement) {
    const chatContainer = targetElement.closest('.chat_container');
    const isGroupChat = chatContainer.classList.contains('group');
    const conversationID = chatContainer.getAttribute("data-chat_id");

    if (targetElement.classList.contains('typing')) {
        targetElement.classList.remove('typing');

        if (isGroupChat) {
            socket.emit('typingStopGroup', conversationID);
        } else {
            socket.emit('typingStopPrivate', conversationID);
        }
    }
}

// Function to handle message submit
function handleMessageSubmit(target) {
    const chatContainer = target.closest('.chat_container');
    const conversationID = chatContainer.getAttribute("data-chat_id");
    const messageInput = chatContainer.querySelector("[name='send_message']");

    const messageValue = messageInput.value;

    // Check if the clicked button is a group chat
    const isGroup = chatContainer.classList.contains('group');

    // Check if the message is empty
    if (messageValue.length === 0) {
        console.log("Message cannot be empty");
        return;
    }

    if (isGroup) {
        // Send the data to the server
        socket.emit("sendMessageGroup", messageValue, conversationID);
        handleTypingStopOnSubmit(chatContainer, 'group', conversationID);
    } else {
        // Send the data to the server
        socket.emit("sendMessage", messageValue, conversationID);
        handleTypingStopOnSubmit(chatContainer, 'private', conversationID);
    }

    chatContainer.querySelector(".message_form").reset();
}

function handleTypingStopOnSubmit(chatContainer, type, conversationID) {
    const typingElement = chatContainer.querySelector('.typing');
    if (typingElement) {
        typingElement.classList.remove('typing');
        const typingStopEvent = type === 'group' ? 'typingStopGroup' : 'typingStopPrivate';
        socket.emit(typingStopEvent, conversationID);
    }
}

// Function to handle conversation item on click
function handleConversationButtons(currentButton) {
    const conversationsButton = selectors.conversationList.querySelectorAll('.conversation_btn');

    // Deactivate all buttons
    conversationsButton.forEach(e => e.classList.remove('active'));

    // Activate the clicked button
    currentButton.classList.add('active');

    selectors.chatsContainer.setAttribute("data-state", innerWidth < 768 ? "open" : "closing");

    // Check if the clicked currentButton is a group chat
    const isGroup = currentButton.classList.contains('group');

    // Find the currently active chat container and deactivate it
    const activeChat = document.querySelector(".chat_container.active");
    if (activeChat) {
        activeChat.classList.remove("active");
    }

    // Get the conversation ID from the clicked currentButton
    const conversationID = currentButton.getAttribute('data-conversation_id');

    // Find the chat container corresponding to the conversation ID
    const targetChat = document.querySelector(`[data-chat_id="${conversationID}"]`);
    targetChat.classList.add("active");

    onSeenClickItemLogic(currentButton);

    // Clear the chat messages container before fetching new messages
    const chatMessagesContainer = targetChat.querySelector(".chat_messages");
    chatMessagesContainer.innerHTML = '';

    // Emit the appropriate event to request messages
    if (isGroup) {
        socket.emit("requestMessagesGroup", conversationID);
    } else {
        socket.emit("requestMessages", conversationID);
    }
}

function onSeenClickItemLogic(currentButton) {
    const isSeen = currentButton.classList.contains('not_seen');

    if (isSeen) {
        currentButton.querySelector(".not_badge .not_seen_times").innerText = 0;
        currentButton.classList.remove('not_seen');
    }
}

// Define the function to handle message clicks
function handleMessageClick(messageElement) {
    // Determine if the message is from the sender or recipient
    const isSender = messageElement.classList.contains('sender');
    const messageID = messageElement.getAttribute('data-message_id');

    // Check if the context menu is already open
    if (!messageElement.classList.contains('contextmenu_open')) {
        // Close any open context menus first
        closeAllContextMenus();

        if (isSender) {
            // Logic for opening the menu for sender
            console.log(`Opening sender menu for message with ID: ${messageID}`);
            // Add the contextmenu_open class
            messageElement.classList.add('contextmenu_open');

            senderContexmenu(messageElement);
        } else if (messageElement.classList.contains('recipient')) {
            // Logic for opening the menu for recipient
            console.log(`Opening recipient menu for message with ID: ${messageID}`);
            // Add the contextmenu_open class
            messageElement.classList.add('contextmenu_open');

            recipientContexmenu(messageElement);
        }
    } else {
        console.log(`Menu already open for message with ID: ${messageID}`);
    }
}

// Function to close all open context menus
function closeAllContextMenus() {
    // Find all elements with the contextmenu_open class and remove it
    document.querySelectorAll('.contextmenu_open').forEach((element) => {
        element.classList.remove('contextmenu_open');
        element.querySelector('.message_contextmenu').remove();
    });
}

function senderContexmenu(selectorElement) {
    const contextmenuHTML = `
        <div class="message_contextmenu">
            <ul class="message_contextmenu_list" data-position="right">
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Reply</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Forward</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Copy</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">View</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Edit</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Delete</button>
                </li>
            </ul>
        </div>
        `;

    selectorElement.insertAdjacentHTML("beforeend", contextmenuHTML);
}

function recipientContexmenu(selectorElement) {
    const contextmenuHTML = `
        <div class="message_contextmenu">
            <ul class="message_contextmenu_list">
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Reply</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Forward</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Copy</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">View</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" class="btn_btn" aria-label="">Delete</button>
                </li>
            </ul>
        </div>
        `;

    selectorElement.insertAdjacentHTML("beforeend", contextmenuHTML);
}