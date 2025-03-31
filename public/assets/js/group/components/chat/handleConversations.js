import {
    createUserItemGroup,
    createChatContainerGroup,
} from '../../functions.js';

import {
    setClosingToClosed,
    setClosedToOpen
} from '../../../functions.js';

import {
    incrementPending,
    decrementPending,
} from '../../../chat/handleIndicators.js';

'use strict'

import socket from '../../../socket/socketManager.js';

// Initialize an empty array to store the strings
export const groupConversationMembersToInvite = new Set();

const searchGroupConversationToCreateResults = document.querySelector('[data-list="group_conversation_request_search_results"]');
const groupRequestConversationList = document.querySelector('[data-list="group_request_conversation_list"]');
const conversationRequestElement = document.querySelector('[data-list="pending_conversations"]');
const conversationCreateModal = document.querySelector('[data-modal_container="conversation_create_modal"]');

let searchTimeout;

export function handleGroupConversationsClick(e) {
    const inviteCancel = e.target.closest('[data-conversation="invite_cancel"]');
    if (inviteCancel) {
        const parentContainer = inviteCancel.closest('.profile_element');
        const profileID = parentContainer.getAttribute('data-profile_id');
        const profileAvatar = parentContainer.querySelector('img').src;

        const profileData = {
            profileID,
            profileAvatar
        }

        if (!inviteCancel.classList.contains('active')) {
            groupConversationMembersToInvite.add(profileID);
            inviteCancel.classList.add('active');
            senderGroupConversationInviteProfilesUIAdd(profileData);
        } else {
            groupConversationMembersToInvite.delete(profileID);
            inviteCancel.classList.remove('active');
            senderGroupConversationInviteProfilesUIRemove(profileID);
        }
    }

    const acceptRequest = e.target.closest('[data-conversation="group_request_accept"]');
    if (acceptRequest) {
        const requestConversationProfile = acceptRequest.closest('.profile_element');
        const requestID = requestConversationProfile.getAttribute('data-conversation_request_id');

        socket.emit('groupConversationRequestAccept', requestID);

        if (requestConversationProfile) {
            requestConversationProfile.remove();
        }
    }

    const rejectRequest = e.target.closest('[data-conversation="group_request_reject"]');
    if (rejectRequest) {
        const requestConversationProfile = rejectRequest.closest('.profile_element');
        const requestID = requestConversationProfile.getAttribute('data-conversation_request_id');

        socket.emit('groupConversationRequestReject', requestID);

        if (requestConversationProfile) {
            requestConversationProfile.remove();
        }

    }
}

export function handleGroupConversationsInput(e) {
    const searchGroupProfile = e.target.closest('[name="search_group_conversation_to_create"]');
    if (searchGroupProfile) {
        const inputValue = searchGroupProfile.value.trim();

        searchGroupConversationToCreateResults.innerHTML = '';

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            if (inputValue) {
                socket.emit('groupConversationSearchProfileRequest', inputValue);
            }

        }, 300);
    }
}

export function handleGroupConversationsSubmit(e) {
    const createGroupConversationForm = e.target.closest('#create_group_conversation_form');
    if (createGroupConversationForm) {
        const groupNameInput = document.querySelector('[name="group_name"]');
        const groupDescriptionInput = document.querySelector('[name="group_description"]');

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

        groupNameInput.value = '';
        groupDescriptionInput.value = '';

        groupRequestConversationList.innerHTML = '';

        groupConversationMembersToInvite.clear();

        closeModalContainers(conversationCreateModal);
    }
}

socket.on('groupConversationSearchResults', (profiles) => {
    for (const profile of profiles) {
        profileToRequestPrivateConversationUI(profile);
    }
});

// Gets a feedback to create a group conversation
socket.on('groupConversationRequestFeedbackToSender', (conversationData, profileID) => {
    handleGroupConversationCreation(conversationData, profileID);
});

socket.on('groupConversationRequestFeedbackToRecipient', (conversationData) => {
    recipientGroupConversationInviteUI(conversationData);

    incrementPending('conversationPending');
});

socket.on('groupConversationRequestAcceptedFeedback', (conversationData, profileID) => {
    handleGroupConversationCreation(conversationData, profileID);

    decrementPending('conversationPending');
});

socket.on('groupConversationRequestRejectedFeedback', (requestID) => {
    const findConversationRequest = document.querySelector(`[data-conversation_request_id="${requestID}"]`);

    if (findConversationRequest) {
        findConversationRequest.remove();
    }

    decrementPending('conversationPending');
});

socket.on('groupConversationRequestDetails', (groupConversationRequest) => {
    for (const groupConversationData of groupConversationRequest) {
        recipientGroupConversationInviteUI(groupConversationData);
    }

    const isLength = groupConversationRequest.length;
    if (isLength > 0) {
        incrementPending('conversationPending', isLength);
    }

});

function handleGroupConversationCreation(conversationData, profileID) {
    createUserItemGroup(conversationData, profileID);
    createChatContainerGroup(conversationData, profileID);
}

function profileToRequestPrivateConversationUI(profileData) {
    const { profileID, profileName, profileAvatar, requestStatus } = profileData;

    const chatMessageHTML = `
            <li class="profile_element" data-profile_id="${profileID}">
                <div class="avatar_container">
                    <img src="../uploads/userAvatars/${profileAvatar}" alt="Profile avatar"
                        aria-label="Profile avatar">
                </div>

                <div class="content_container">
                    <b class="profile_name">@${profileName}</b>
                    <small>Not verified</small>
                </div>

                <div class="buttons_container">
                    <button type="button" class="btn_icon ${requestStatus === 'pending' ? " active" : ''}" data-conversation="invite_cancel">
                    <i class="icon_plus-solid"></i>
                </button>
                </div>
            </li>
            `;

    searchGroupConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
}

function senderGroupConversationInviteProfilesUIAdd(profileData) {
    const chatMessageHTML = `
            <li class="group_request_conversation_list_item" data-profile_id="${profileData.profileID}">
                <img src="${profileData.profileAvatar}">
            </li>
            `;

    groupRequestConversationList.insertAdjacentHTML('beforeend', chatMessageHTML);
}

function senderGroupConversationInviteProfilesUIRemove(profileID) {
    const itemToRemove = document.querySelector(`.group_request_conversation_list_item[data-profile_id="${profileID}"]`);
    if (itemToRemove) {
        itemToRemove.remove();
    }
}

function recipientGroupConversationInviteUI(conversationData) {
    const { requestID, groupData, createdAt } = conversationData;

    const chatMessageHTML = `
            <li class="profile_element" data-conversation_request_id="${requestID}">

                <div class="avatar_container">
                    <img src="../uploads/userAvatars/${groupData.groupAvatar}" alt="Profile avatar"
                        aria-label="Profile avatar">
                </div>

                <div class="content_container">
                    <b class="content_name">${groupData.groupName}</b>
                    <small>Not verified</small>
                </div>

                <div class="buttons_container">
                    <button type="button" class="btn_icon" aria-label="Accept request"
                        data-conversation="group_request_accept">
                        <i class="icon_check-solid"></i>
                    </button>

                    <button type="button" class="btn_icon" aria-label="Reject request"
                        data-conversation="group_request_reject">
                        <i class="icon_xmark-solid"></i>
                    </button>
                </div>

            </li>
            `;

    conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
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