import socket from '../socket/socketManager.js';

import {
    dropdownMenu,
    setClosingToClosed,
    setClosedToOpen
} from "../functions.js";

const conversationList = document.querySelector('[data-list="conversations"]');
const chatContainerList = document.querySelector('.chat_container_list');

export const handleAppClick = (e) => {
    const modalButton = e.target.closest('[data-modal_btn]');
    if (modalButton) {
        const getAttribute = modalButton.getAttribute('data-modal_btn');
        const targetModal = document.querySelector(`[data-modal_container="${getAttribute}"]`);
        const isOpen = targetModal.getAttribute('data-state') !== 'open';
        if (isOpen) {
            setClosedToOpen(targetModal);
        } else {
            setClosingToClosed(targetModal);
        }
    }

    const openSearchButton = e.target.closest('[data-toggle="conversation_panel_search"]');
    if (openSearchButton) {
        const targetElement = document.querySelector('[data-search="conversation_panel"]');
        const searchInput = targetElement.querySelector('[name="conversation_panel"]');
        const isOpen = targetElement.getAttribute('data-state') !== 'open';

        if (searchInput.value.trim().length > 0) {
            searchInput.value = '';
        }

        if (isOpen) {
            setClosedToOpen(targetElement);
        } else {
            setClosingToClosed(targetElement);
        }
    }

    const tabButton = e.target.closest('[data-btn_tab]');
    if (tabButton) {
        const targetID = tabButton.getAttribute('data-btn_tab');
        const targetTab = document.querySelector(`[data-tabContent="${targetID}"]`);

        document.querySelectorAll('[data-tabContent]').forEach(eachTab => {
            const isOpen = eachTab.getAttribute('data-state') === 'open';
            if (isOpen) {
                setClosingToClosed(eachTab);
            }
        });

        if (targetID === 'calls_list') {
            socket.emit("privateCallFetchList");
        }

        setClosedToOpen(targetTab);
    }

    const modalMenuButton = e.target.closest('[data-modal_menu_btn]');
    if (modalMenuButton) {
        const parentElement = modalMenuButton.closest('.container_main, .container_sub');
        const getAttribute = modalMenuButton.getAttribute('data-modal_menu_btn');
        const targetMenu = document.querySelector(`[data-menu_container="${getAttribute}"]`);

        const searchProfileToRequestPrivateConversation = document.querySelector('[name="searchProfileToRequestPrivateConversation"]');
        const searchPrivateConversationToCreateResults = document.querySelector('[data-conversation="request_search_results"]');

        const searchProfileToRequestGroupConversation = document.querySelector('[name="search_group_conversation_to_create"]');
        const searchGroupConversationToCreateResults = document.querySelector('[data-list="group_conversation_request_search_results"]');

        if (searchProfileToRequestPrivateConversation) {
            searchProfileToRequestPrivateConversation.value = '';
        }

        if (searchPrivateConversationToCreateResults) {
            searchPrivateConversationToCreateResults.innerHTML = '';
        }

        if (searchProfileToRequestGroupConversation) {
            searchProfileToRequestGroupConversation.value = '';
        }

        if (searchGroupConversationToCreateResults) {
            searchGroupConversationToCreateResults.innerHTML = '';
        }

        if (targetMenu.getAttribute('data-menu_container') === 'conversation_create_group_step_2') {
            if (groupConversationMembersToInvite.size === 0) {
                return console.log('Cannot proceed further');
            }
        }

        setClosingToClosed(parentElement);
        setClosedToOpen(targetMenu);
    }

    const conversationButton = e.target.closest('.conversation_item');
    if (conversationButton) {
        const conversationID = conversationButton.getAttribute('data-conversation_id');
        const isGroup = conversationButton.classList.contains('group');
        const isActive = conversationButton.classList.contains('active');
        const activeChat = document.querySelector('.chat_container_item.active');

        // Find and deactivate any currently active button
        const activeButton = document.querySelector('.conversation_item.active');
        if (activeButton && activeButton !== conversationButton) {
            activeButton.classList.remove('active');
        }

        // Deactivate the currently active chat container
        if (activeChat) {
            activeChat.querySelector(".chat_messages").innerHTML = '';
            activeChat.classList.remove('active');
        }

        // Toggle activation of the clicked button and its chat container
        if (!isActive) {
            conversationButton.classList.add('active');
            chatContainerList.setAttribute("data-state", "open");

            const targetChat = document.querySelector(`[data-chat_id="${conversationID}"]`);
            if (targetChat) {
                targetChat.querySelector(".chat_messages").innerHTML = '';
                targetChat.classList.add('active');

                const chatLoader = targetChat.querySelector('.chat_loader');
                if (chatLoader) {
                    chatLoader.classList.add('loading');
                }

                const event = isGroup ? "groupMessagesFetch" : "privateMessagesFetch";
                socket.emit(event, conversationID);
            }
        } else {
            conversationButton.classList.remove('active');

            chatContainerList.setAttribute("data-state", "closed");
        }
    }

    const iconDropdown = e.target.closest('.icon_dropdown');
    const iconDropdownMenu = e.target.closest('.icon_dropdown_menu');
    if (iconDropdown) {
        const iconDropdownMenu = iconDropdown.closest('.dropdown').querySelector('.icon_dropdown_menu');
        dropdownMenu(iconDropdownMenu);
    }
    if (!iconDropdown && !iconDropdownMenu) {
        const openDropdown = document.querySelector('.icon_dropdown_menu[data-state="open"]');
        if (openDropdown) {
            setClosingToClosed(openDropdown);
        }
    }

    const closeChatButton = e.target.closest("[data-btn='close_modal']");
    if (closeChatButton) {
        const activeConversationBtn = document.querySelector('.conversation_item.active');
        if (activeConversationBtn) {
            activeConversationBtn.classList.remove('active');
        }

        const activeConversationChat = document.querySelector('.chat_container_item.active');
        if (activeConversationChat) {
            activeConversationChat.classList.remove('active');
        }

        setClosingToClosed(chatContainerList);
    }
}

export const handleAppInput = (e) => {
    const searchInConversation = e.target.closest('[name="conversation_panel"]');
    if (searchInConversation) {
        const searchTerm = searchInConversation.value.toLowerCase();
        const profileNames = document.querySelectorAll('.conversation_item .content_name');

        profileNames.forEach(profileNameElement => {
            const conversationButton = profileNameElement.closest('.conversation_item');
            const profileName = profileNameElement.innerText.toLowerCase();

            if (profileName.includes(searchTerm)) {
                conversationButton.style.display = '';

                // Highlight the matching part
                const originalText = profileNameElement.innerText;
                const highlightedText = originalText.replace(
                    new RegExp(`(${searchTerm})`, 'gi'),
                    '<span class="search_highlight">$1</span>'
                );
                profileNameElement.innerHTML = highlightedText;
            } else {
                conversationButton.style.display = 'none';

                // Reset the text if it doesn't match
                profileNameElement.innerHTML = profileNameElement.innerText;
            }
        });
    }
}