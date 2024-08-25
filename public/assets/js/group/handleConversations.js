import {
    createUserItemGroup,
    createChatContainerGroup,
} from './functions.js';

import {
    incrementPending,
    decrementPending,
    setClosingToClosed,
    setClosedToOpen
} from '../functions.js';

'use strict'

// Initialize an empty array to store the strings
export const groupConversationMembersToInvite = new Set();

const handleConversations = (socket) => {

    const createGroupConversationForm = document.getElementById('createGroupConversationForm');
    const groupNameInput = document.querySelector('[name="group_name"]');
    const groupDescriptionInput = document.querySelector('[name="group_description"]');

    const searchProfileToRequestGroupConversation = document.querySelector('[name="search_group_conversation_to_create"]');
    const searchGroupConversationToCreateResults = document.querySelector('[data-list="group_conversation_request_search_results"]');
    const groupRequestConversationList = document.querySelector('[data-list="group_request_conversation_list"]');

    const conversationRequestElement = document.querySelector('[data-list="pending_conversations"]');

    const conversationCreateModal = document.querySelector('[data-modal_container="conversation_create_modal"]');

    let searchTimeout;

    searchProfileToRequestGroupConversation.addEventListener('input', function () {
        const value = searchProfileToRequestGroupConversation.value.trim();

        // Clear previous search results
        searchGroupConversationToCreateResults.innerHTML = '';

        // Debounce the search input to reduce API requests
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            if (value) {
                // If it gets to here means that the profile is online and sends a feedback that the message is delivered
                socket.emit('groupConversationSearchProfileRequest', value);
            }

        }, 300); // Adjust debounce delay as needed
    });

    socket.on('groupConversationSearchResults', (users) => {
        for (const profile of users) {
            profileToRequestPrivateConversationUI(profile);
        }
    });

    // Gets a feedback to create a group conversation
    socket.on('groupConversationRequestFeedbackToSender', (conversationData, profileName) => {
        handleGroupConversationCreation(conversationData, profileName);
    });

    // Gets a feedback after a profile sends a request for a group conversation
    socket.on('groupConversationRequestFeedbackToRecipient', (conversationData) => {
        recipientGroupConversationInviteUI(conversationData);

        incrementPending('conversationPending');
    });

    socket.on('groupConversationRequestAcceptedFeedback', (chatData, profileName) => {
        handleGroupConversationCreation(chatData, profileName);

        decrementPending('conversationPending');
    });

    // Function to remove conversation request when a profile rejects the request
    socket.on('groupConversationRequestRejectedFeedback', (customID) => {
        const findConversationRequest = document.querySelector(`[data-conversation_request_id="${customID}"]`);

        findConversationRequest.remove();

        decrementPending('conversationPending');
    });

    socket.on('groupConversationRequestDetails', (conversationData) => {
        for (const conversationDatas of conversationData) {
            recipientGroupConversationInviteUI(conversationDatas);
        }

        const isLength = conversationData.length;

        if (isLength > 0) {
            // Example usage
            incrementPending('conversationPending', isLength); // Increment pending count for conversation settings
        }

    });

    createGroupConversationForm.addEventListener("submit", function (e) {
        e.preventDefault();

        const groupName = groupNameInput.value.trim();
        const groupDescription = groupDescriptionInput.value.trim();

        if (groupConversationMembersToInvite.size < 1) {
            return console.log("Need at least one profile to invite!");
        }

        const inviteData = {
            groupName,
            groupDescription,
            members: Array.from(groupConversationMembersToInvite)
        }

        socket.emit('groupConversationRequest', inviteData);

        // Clear the input fields directly
        groupNameInput.value = '';
        groupDescriptionInput.value = '';

        groupRequestConversationList.innerHTML = '';

        groupConversationMembersToInvite.clear();

        closeModalContainers(conversationCreateModal);
    });

    function handleGroupConversationCreation(chatData, profileName) {

        createUserItemGroup(chatData, profileName);

        createChatContainerGroup(chatData);
    }

    function profileToRequestPrivateConversationUI(profile) {
        const chatMessageHTML = `
            <li class="profile_element" data-profileName="${profile.profileName}">
                <div class="avatar_container">
                    <img src="../uploads/userAvatars/${profile.profileAvatar}" alt="Profile avatar"
                        aria-label="Profile avatar">
                </div>

                <div class="content_container">
                    <b class="profile_name">@${profile.profileName}</b>
                    <small>Not verified</small>
                </div>

                <div class="buttons_container">
                    <button type="button" class="btn_icon ${profile.requestStatus === 'pending' ? " active" : ''}" data-group-conversation="inviteCancel">
                    <i class="icon_plus-solid"></i>
                </button>
                </div>
            </li>
            `;

        searchGroupConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    searchGroupConversationToCreateResults.addEventListener('click', function (event) {
        // Use closest to find the nearest .conversation ancestor
        const inviteCancel = event.target.closest('[data-group-conversation="inviteCancel"]');

        if (inviteCancel) {
            handleGroupConversationLogic(inviteCancel);
        }
    });



    function handleGroupConversationLogic(selectorElement) {
        const parentContainer = selectorElement.closest('.profile_element');
        const invitedProfileName = parentContainer.getAttribute('data-profileName');

        const invitedProfileAvatar = parentContainer.querySelector('img').src;

        const profileData = {
            profileAvatar: invitedProfileAvatar,
            profileName: invitedProfileName
        }

        if (!selectorElement.classList.contains('active')) {
            groupConversationMembersToInvite.add(invitedProfileName);
            selectorElement.classList.add('active');
            senderGroupConversationInviteProfilesUIAdd(profileData);
        } else {
            groupConversationMembersToInvite.delete(invitedProfileName);
            selectorElement.classList.remove('active');
            senderGroupConversationInviteProfilesUIRemove(invitedProfileName);
        }
    }

    function senderGroupConversationInviteProfilesUIAdd(profileData) {
        const chatMessageHTML = `
            <li class="group_request_conversation_list_item" data-profileName="${profileData.profileName}">
                <img src="${profileData.profileAvatar}">
            </li>
            `;

        groupRequestConversationList.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    function senderGroupConversationInviteProfilesUIRemove(invitedProfileName) {
        const itemToRemove = document.querySelector(`.group_request_conversation_list_item[data-profileName="${invitedProfileName}"]`);
        if (itemToRemove) {
            itemToRemove.remove();
        }
    }

    function recipientGroupConversationInviteUI(conversationData) {
        const chatMessageHTML = `
            <li class="profile_element" data-conversation_request_id="${conversationData.customID}">

                <div class="avatar_container">
                    <img src="../uploads/userAvatars/${conversationData.groupData.groupAvatar}" alt="Profile avatar"
                        aria-label="profile avatar">
                </div>

                <div class="content_container">
                    <b class="content_name">${conversationData.groupData.groupName}</b>
                    <small>Not verified</small>
                </div>

                <div class="buttons_container">
                    <button type="button" class="btn_icon"
                        data-group-conversation="request_accept">
                        <i class="icon_check-solid"></i>
                    </button>

                    <button type="button" class="btn_icon"
                        data-group-conversation="request_reject">
                        <i class="icon_xmark-solid"></i>
                    </button>
                </div>
            </li>
            `;

        conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    conversationRequestElement.addEventListener('click', function (event) {
        const acceptRequest = event.target.closest('[data-group-conversation="request_accept"]');
        const rejectRequest = event.target.closest('[data-group-conversation="request_reject"]');

        if (acceptRequest) {
            handleOnRequestAccepted(acceptRequest);
        }

        if (rejectRequest) {
            handleOnRequestRejected(rejectRequest);
        }
    });

    function handleOnRequestAccepted(selectorElement) {
        const requestConversationProfile = selectorElement.closest('.profile_element');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('groupConversationRequestAccepted', customID);
        requestConversationProfile.remove();
    }

    function handleOnRequestRejected(selectorElement) {
        const requestConversationProfile = selectorElement.closest('.profile_element');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('groupConversationRequestRejected', customID);
        requestConversationProfile.remove();
    }

    function closeModalContainers(selectorElement) {
        setClosingToClosed(selectorElement);

        const selectorElementMain = selectorElement.querySelector('.container_main');
        const selectorElementSubs = selectorElement.querySelectorAll('.container_sub');

        setClosedToOpen(selectorElementMain);

        selectorElementSubs.forEach(eachSub => {
            setClosingToClosed(eachSub);
        });
    }

}

export default handleConversations;