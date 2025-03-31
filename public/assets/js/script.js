import {
    dropdownMenu,
    setClosingToClosed,
    setClosedToOpen
} from "./functions.js";

import {
    handleOnlineUsers
} from './chat/onlineUsers.js';

import {
    handleEmojiClick
} from './app/handleEmojis.js';

import {
    createUserItem,
    createChatContainer
} from './private/functions.js';

import {
    createUserItemGroup,
    createChatContainerGroup
} from './group/functions.js';

import {
    handleMessageOnInput,
    handleMessageOnFocus,
    handleMessageOnBlur,
    handleMessageSubmit,
    handleImageUpload,
    fileMap
} from './chat/handleTyping.js';

import {
    privateVideoCallEventClick
} from "./private/components/media/handleVideoCall.js";

import {
    privateVoiceCallEventClick
} from "./private/components/media/handleVoiceCall.js";

import {
    handlePrivateConversationsClick,
    handlePrivateConversationsInput
} from './private/components/chat/handleConversations.js';

import {
    handleGroupConversationsClick,
    handleGroupConversationsInput,
    handleGroupConversationsSubmit,
    groupConversationMembersToInvite
} from './group/components/chat/handleConversations.js';

import {
    handleMessagesClick,
    handleMessagesContextMenu,
    handleMessagesTouchMenu,
    handleMessagesTouchMenuTimer
} from "./chat/handleMessages.js";

import {
    handleAppClick,
    handleAppInput
} from './app/handleAppEvents.js';

import privateConversationHandle from "./private/main.js";
import groupConversationHandle from "./group/main.js";

import socket from './socket/socketManager.js';

const conversationList = document.querySelector('[data-list="conversations"]');
const chatContainerList = document.querySelector('.chat_container_list');

socket.on("connect", async () => {
    socket.on('profileData', (profileData) => {
        const profileAvatars = document.querySelectorAll('.profile_avatar_container');
        profileAvatars.forEach(e => {
            const ifExists = e.querySelector('.profile_avatar');
            if (!ifExists) {
                const createImg = document.createElement("img");
                createImg.src = "../uploads/userAvatars/" + profileData.profileAvatar;
                createImg.setAttribute('alt', 'Profile Avatar');
                createImg.classList.add('profile_avatar');
                e.appendChild(createImg);
            }
        });
    });

    socket.on('participantsData', (conversationsData, profileID) => {
        conversationList.innerHTML = '';

        for (const chatData of conversationsData) {
            if (chatData.isPrivate) {
                const { participants } = chatData;
                createUserItem(participants, chatData);
                createChatContainer(participants, chatData);
            } else {
                createUserItemGroup(chatData, profileID);
                createChatContainerGroup(chatData, profileID);
            }
        }

        handleOnlineUsers();
    });

    privateConversationHandle(socket);
    groupConversationHandle(socket);

    document.addEventListener('click', (e) => {
        handleAppClick(e);

        handlePrivateConversationsClick(e);
        handleGroupConversationsClick(e);

        privateVideoCallEventClick(e);
        privateVoiceCallEventClick(e);

        const sideBarToggleButton = e.target.closest("[data-btn='side_bar_toggle'], [data-btn='chat_side_panel_close']");
        if (sideBarToggleButton) {
            const parentElement = sideBarToggleButton.closest('.chat_container_item');
            const chatSidePanel = parentElement.querySelector('.chat_side_panel');
            const isOpen = chatSidePanel.getAttribute('data-state') === 'open';
            if (isOpen) {
                setClosingToClosed(chatSidePanel);
            } else {
                setClosedToOpen(chatSidePanel);
            }
        }

        const sidebarMenuBtn = e.target.closest('[data-sidebar_menu_btn]');
        if (sidebarMenuBtn) {
            const chatSidePanel = sidebarMenuBtn.closest('.chat_side_panel');
            const parentElement = sidebarMenuBtn.closest('.container_main, .container_sub');
            const getAttribute = sidebarMenuBtn.getAttribute('data-sidebar_menu_btn');
            const targetMenu = chatSidePanel.querySelector(`[data-sidebar_menu_container="${getAttribute}"]`);

            setClosingToClosed(parentElement);
            setClosedToOpen(targetMenu);
        }

        handleEmojiClick(e);

        const removeImagePreviewBtn = e.target.closest('[data-btn="remove_image_preview"]');
        if (removeImagePreviewBtn) {
            const uploadContainer = removeImagePreviewBtn.closest('.upload_container');
            const chatFooter = uploadContainer.closest('.chat_footer');
            const fileInput = chatFooter.querySelector('[data-upload="images"]');
            const photosList = removeImagePreviewBtn.closest('.photos_list');
            const photosItem = photosList.closest('.photos_item');
            const fileIndex = photosItem.getAttribute('data-index');

            photosItem.remove();
            fileMap.delete(Number(fileIndex));

            if (fileMap.size === 0) {
                fileMap.clear();
                fileInput.value = '';
                uploadContainer.remove();
            }
        }

        handleMessagesClick(e);
    });

    document.addEventListener('submit', (e) => {
        e.preventDefault();

        handleMessageSubmit(e);

        handleGroupConversationsSubmit(e);
    });

    document.addEventListener('input', (e) => {
        handleMessageOnInput(e);
        handlePrivateConversationsInput(e);
        handleGroupConversationsInput(e);

        handleAppInput(e);

        const emojiSearch = e.target.closest('[name="emojis"]');
        if (emojiSearch) {
            const emojiItems = document.querySelectorAll('.emoji_item');

            emojiItems.forEach(item => {
                const button = item.querySelector('.emoji_button');
                const title = button.getAttribute('title').toLowerCase();

                if (title.includes(emojiSearch.value.toLowerCase())) {
                    item.style.display = 'block';
                } else {
                    item.style.display = 'none';
                }
            });

        }
    });

    document.addEventListener('focusin', (e) => {
        handleMessageOnFocus(e);
    });

    document.addEventListener('focusout', (e) => {
        handleMessageOnBlur(e);
    });

    document.addEventListener('change', (e) => {
        handleImageUpload(e);
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleMessageSubmit(e);
        }
    });

    // // Function to check if the device is a touch device
    // function isTouchDevice() {
    //     return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    // }

    // // // Attach event listeners based on device type
    // // if (isTouchDevice()) {
    // document.addEventListener('touchstart', (e) => {
    //     handleMessagesTouchMenu(e);
    // });

    // document.addEventListener('touchend', () => {
    //     handleMessagesTouchMenuTimer();
    // });

    // document.addEventListener('touchmove', () => {
    //     handleMessagesTouchMenuTimer();
    // });
    // // } else {
    document.addEventListener("contextmenu", function (e) {
        handleMessagesContextMenu(e);
    });
    // // }
});