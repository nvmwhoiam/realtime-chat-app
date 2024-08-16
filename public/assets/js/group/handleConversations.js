import {
    sendMessageGroup,
    recipientMessageGroup,
    createUserItemGroup,
    createChatContainerGroup,
} from './functions.js';

import {
    incrementPending,
    decrementPending
} from '../functions.js';


import {
    chatEventListeners
} from '../main.js';

'use strict'

// Initialize an empty array to store the strings
export const groupConversationMembersToInvite = new Set();

const handleConversations = (socket) => {

    const createGroupConversationForm = document.getElementById('createGroupConversationForm');
    const groupNameInput = document.querySelector('[name="group_name"]');
    const groupDescriptionInput = document.querySelector('[name="group_description"]');

    const searchProfileToRequestGroupConversation = document.querySelector('[name="search_group_conversation_to_create"]');
    const searchGroupConversationToCreateResults = document.querySelector('[data-group-conversation="search_group_conversation_to_create_results"]');
    const groupRequestConversationList = document.querySelector('.group_request_conversation_list');

    const conversationRequestElement = document.querySelector('[data-conversation="pending_list"]');

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

        groupConversationInviteCancelEvent();
    });

    // Gets a feedback to create a group conversation
    socket.on('groupConversationRequestFeedbackToSender', (conversationData, profileName) => {
        handleGroupConversationCreation(conversationData, profileName);
    });

    // Gets a feedback after a profile sends a request for a group conversation
    socket.on('groupConversationRequestFeedbackToRecipient', (conversationData) => {
        recipientGroupConversationInviteUI(conversationData);

        requestConversationFeedbackEvent();

        incrementPending('conversationPending');

    });

    socket.on('groupConversationRequestAcceptedFeedback', (chatData) => {
        handleGroupConversationCreation(chatData);

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

            // Function to attach event
            requestConversationFeedbackEvent();
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

    });

    function handleGroupConversationCreation(chatData, profileName) {

        createUserItemGroup(chatData, profileName);

        createChatContainerGroup(chatData)

        // chatEventListeners();

        //TODO investigate the function further
    }

    function profileToRequestPrivateConversationUI(profile) {
        const chatMessageHTML = `
            <li class="request_conversation_profile" data-profileName="${profile.profileName}">
                <div class="request_conversation_profile_body">
                    <div class="profile_image">
                        <img src="../uploads/userAvatars/${profile.profileAvatar}" alt="Profile avatar" aria-label="Profile avatar">
                    </div>
                    <div class="details">
                        <span class="profile_name">@${profile.profileName}</span>
                        <small>Not verified</small>
                    </div>
                </div>
                <div class="buttons">
                    <button type="button" class="btn_icon ${profile.requestStatus === 'pending' ? "active" : ''}" data-group-conversation="inviteCancel">
                        <i class="icon_plus-solid"></i>
                    </button>
                </div>
            </li>
            `;

        searchGroupConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    function groupConversationInviteCancelEvent() {
        const inviteCancel = document.querySelectorAll('[data-group-conversation="inviteCancel"]');

        inviteCancel.forEach(button => {
            button.addEventListener('click', handleGroupConversationLogic);
        });
    }

    function handleGroupConversationLogic() {
        const parentContainer = this.closest('.request_conversation_profile');
        const invitedProfileName = parentContainer.getAttribute('data-profileName');

        const invitedProfileAvatar = parentContainer.querySelector('img').src;

        const profileData = {
            profileAvatar: invitedProfileAvatar,
            profileName: invitedProfileName
        }

        if (!this.classList.contains('active')) {
            groupConversationMembersToInvite.add(invitedProfileName);
            this.classList.add('active');
            senderGroupConversationInviteProfilesUIAdd(profileData);
        } else {
            groupConversationMembersToInvite.delete(invitedProfileName);
            this.classList.remove('active');
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
            <li class="request_conversation_profile" data-conversation_request_id="${conversationData.customID}">

                <div class="request_conversation_profile_body">
                    <div class="profile_image">
                        <img src="../uploads/userAvatars/${conversationData.groupData.groupAvatar}" alt="Group avatar" aria-label="Group avatar">
                    </div>
                    <div class="details">
                        <span class="profile_name">${conversationData.groupData.groupName}</span>
                        <small>Not verified</small>
                    </div>
                </div>

                <div class="buttons">
                    <button type="button" class="btn_icon" data-group-conversation="request_accept">
                        <i class="icon_check-solid"></i>
                    </button>

                    <button type="button" class="btn_icon" data-group-conversation="request_reject">
                        <i class="icon_xmark-solid"></i>
                    </button>
                </div>
            </li>
            `;

        conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    function requestConversationFeedbackEvent() {
        const acceptRequests = document.querySelectorAll('[data-group-conversation="request_accept"]');
        const rejectRequests = document.querySelectorAll('[data-group-conversation="request_reject"]');

        acceptRequests.forEach(eachBtn => {
            eachBtn.removeEventListener('click', handleOnRequestAccepted);
            eachBtn.addEventListener('click', () => handleOnRequestAccepted(eachBtn));
        });

        rejectRequests.forEach(eachBtn => {
            eachBtn.removeEventListener('click', handleOnRequestRejected);
            eachBtn.addEventListener('click', () => handleOnRequestRejected(eachBtn));
        });
    }

    function handleOnRequestAccepted(eachBtn) {
        const requestConversationProfile = eachBtn.closest('.request_conversation_profile');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('groupConversationRequestAccepted', customID);

        requestConversationProfile.remove();

    }

    function handleOnRequestRejected(eachBtn) {
        const requestConversationProfile = eachBtn.closest('.request_conversation_profile');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('groupConversationRequestRejected', customID);

        requestConversationProfile.remove();

    }

}

export default handleConversations;