import { setClosedToOpen, setClosingToClosed, dropdownMenu } from "./functions.js";

import { groupConversationMembersToInvite } from "./group/handleConversations.js";

const searchProfileToRequestPrivateConversation = document.querySelector('[name="searchProfileToRequestPrivateConversation"]');
const searchPrivateConversationToCreateResults = document.querySelector('[data-conversation="request_search_results"]');

const searchProfileToRequestGroupConversation = document.querySelector('[name="search_group_conversation_to_create"]');
const searchGroupConversationToCreateResults = document.querySelector('[data-list="group_conversation_request_search_results"]');

const modalBtns = document.querySelectorAll('[data-modal_btn]');
const modalMenuBtns = document.querySelectorAll('[data-modal_menu_btn]');

// conversationsItem list elements
const conversationList = document.querySelector(".conversation_list");

const searchInConversation = document.querySelector('[name="search_in_conversation"]');

const searchToggleBtn = document.querySelectorAll('[data-btn="search_in_conversation_container"]');

searchInConversation.addEventListener('input', function () {
    const searchTerm = this.value.toLowerCase();
    const profileNames = document.querySelectorAll('.conversation_btn .content_name');
    profileNames.forEach(profileNameElement => {
        const profileName = profileNameElement.innerText.toLowerCase();

        if (profileName.includes(searchTerm)) {
            profileNameElement.closest('.conversation_btn').style.display = '';
        } else {
            profileNameElement.closest('.conversation_btn').style.display = 'none';
        }
    });
});

modalBtns.forEach(eachBtn => {
    eachBtn.addEventListener('click', handleModalBtn);
});

modalMenuBtns.forEach(eachBtn => {
    eachBtn.addEventListener('click', handleModalMenuBtn);
});

searchToggleBtn.forEach(eachBtn => {
    eachBtn.addEventListener('click', handleSearchToggle);
});

function handleModalBtn() {
    const getAttr = this.getAttribute('data-modal_btn');
    const targetModal = document.querySelector(`[data-modal_container="${getAttr}"]`);

    const isOpen = targetModal.getAttribute('data-state') !== 'open';

    if (isOpen) {
        setClosedToOpen(targetModal);
    } else {
        setClosingToClosed(targetModal);
    }
}

function handleModalMenuBtn() {
    const parentElement = this.closest('.container_main') || this.closest('.container_sub');
    const getAttr = this.getAttribute('data-modal_menu_btn');
    const targetMenu = document.querySelector(`[data-menu_container="${getAttr}"]`);

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
            return console.log('cannot proceed further');
        }
    }

    setClosingToClosed(parentElement);
    setClosedToOpen(targetMenu);
}

function handleSearchToggle() {
    const targetElement = document.querySelector('[data-search="search_in_conversation_container"]');
    const searchInput = targetElement.querySelector('input');
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

const dropdownMenuBtns = document.querySelectorAll('.icon_dropdown');

dropdownMenuBtns.forEach(eachBtn => {
    eachBtn.addEventListener('click', function () {
        const targetBtn = this.closest('.dropdown').querySelector('.icon_dropdown_menu');
        dropdownMenu(targetBtn);
    });
});

const tabButtons = document.querySelectorAll('[data-tabBtn]');

tabButtons.forEach(eachBtn => {
    eachBtn.addEventListener('click', function () {
        const targetID = this.getAttribute('data-tabBtn');
        const targetTab = document.querySelector(`[data-tabContent="${targetID}"]`);

        document.querySelectorAll('[data-tabContent]').forEach(eachTab => {
            const isOpen = eachTab.getAttribute('data-state') === 'open';

            if (isOpen) {
                setClosingToClosed(eachTab);
            }
        });

        setClosedToOpen(targetTab);
    });
});

// if ('serviceWorker' in navigator) {

//     navigator.serviceWorker.register('sw.js').then(function (registration) {
//         // Registration was successful
//         console.log('ServiceWorker registration successful with scope: ', registration.scope);
//     }, function (err) {
//         // registration failed :(
//         console.log('ServiceWorker registration failed: ', err);
//     });
// }