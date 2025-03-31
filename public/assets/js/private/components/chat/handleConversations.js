import {
    createUserItem,
    createChatContainer,
} from '../../functions.js';

import {
    incrementPending,
    decrementPending
} from '../../../chat/handleIndicators.js';

'use strict'

import socket from '../../../socket/socketManager.js';

const searchPrivateConversationToCreate = document.querySelector('[name="search_private_conversation_to_create"]');
const searchPrivateConversationToCreateResults = document.querySelector('[data-list="private_conversation_request_search_results"]');
const conversationRequestElement = document.querySelector('[data-list="pending_conversations"]');

let searchTimeout;

export function handlePrivateConversationsClick(e) {
    const requestCancel = e.target.closest('[data-conversation="private_request_cancel"]');
    if (requestCancel) {
        const parentContainer = requestCancel.closest('.profile_element');
        const profileID = parentContainer.getAttribute('data-profile_id');

        if (!requestCancel.classList.contains('active')) {
            requestCancel.classList.add('active');
            socket.emit('privateConversationRequest', profileID);
        } else {
            requestCancel.classList.remove('active');
            socket.emit('privateConversationRequestCancel', profileID);
        }
    }

    const acceptRequest = e.target.closest('[data-conversation="private_request_accept"]');
    if (acceptRequest) {
        const requestConversationProfile = acceptRequest.closest('.profile_element');
        const requestID = requestConversationProfile.getAttribute('data-conversation_request_id');

        socket.emit('privateConversationRequestAccept', requestID);

        if (requestConversationProfile) {
            requestConversationProfile.remove();
        }

        decrementPending('conversationPending');
    }

    const rejectRequest = e.target.closest('[data-conversation="private_request_reject"]');
    if (rejectRequest) {
        const requestConversationProfile = rejectRequest.closest('.profile_element');
        const requestID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('privateConversationRequestReject', requestID);

        if (requestConversationProfile) {
            requestConversationProfile.remove();
        }

        decrementPending('conversationPending');
    }
}

export function handlePrivateConversationsInput(e) {
    const searchPrivateProfile = e.target.closest('[name="search_private_conversation_to_create"]');
    if (searchPrivateProfile) {
        const inputValue = searchPrivateProfile.value.trim();

        searchPrivateConversationToCreateResults.innerHTML = '';

        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            if (inputValue) {
                socket.emit('privateConversationSearchProfileRequest', inputValue);
            }

        }, 300);
    }
}

socket.on('privateConversationSearchResults', (profiles) => {
    for (const profile of profiles) {
        profileToRequestPrivateConversationUI(profile);
    }
});

socket.on('privateConversationRequestFeedback', (profileData) => {
    profileOfRequestedConversationUI(profileData);

    incrementPending('conversationPending');
});

// Function to remove conversation request when a profile cancels the request 
socket.on('privateConversationRequestCancelFeedback', (customID) => {
    const findConversationRequest = document.querySelector(`[data-conversation_request_id="${customID}"]`);

    if (findConversationRequest) {
        findConversationRequest.remove();
    }

    decrementPending('conversationPending');
});

// Function to handle requested conversation accepted feedback
socket.on('privateConversationRequestAcceptFeedback', (profileData, chatData) => {
    createUserItem(profileData, chatData);
    createChatContainer(profileData, chatData);

    searchPrivateConversationToCreate.value = '';
    searchPrivateConversationToCreateResults.innerHTML = '';

    decrementPending('conversationPending');
});

// Function to remove conversation request when a profile rejects the request
socket.on('privateConversationRequestRejectFeedback', (customID) => {
    const findConversationRequest = document.querySelector(`[data-conversation_request_id="${customID}"]`);

    if (findConversationRequest) {
        findConversationRequest.remove();
    }

    decrementPending('conversationPending');
});

socket.on('privateConversationRequestDetails', (conversationRequested) => {
    for (const conversationData of conversationRequested) {
        profileOfRequestedConversationUI(conversationData);
    }

    const isLength = conversationRequested.length;

    if (isLength > 0) {
        incrementPending('conversationPending', isLength);
    }
});

function profileToRequestPrivateConversationUI(profile) {
    const { profileID, profileName, profileAvatar, requestStatus } = profile;
    const isActive = requestStatus === 'pending' ? " active" : '';

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
                <button type="button" class="btn_icon${isActive}" data-conversation="private_request_cancel">
                    <i class="icon_plus-solid"></i>
                </button>
            </div>
        </li>
        `;

    searchPrivateConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
}

function profileOfRequestedConversationUI(profile) {
    const chatMessageHTML = `
        <li class="profile_element" data-conversation_request_id="${profile.requestID}">

            <div class="avatar_container">
                <img src="../uploads/userAvatars/${profile.senderData.profileAvatar}" alt="Profile avatar"
                    aria-label="profile avatar">
            </div>

            <div class="content_container">
                <b class="content_name">@${profile.senderData.profileName}</b>
                <small>Not verified</small>
            </div>

            <div class="buttons_container">
                <button type="button" class="btn_icon"
                    data-conversation="private_request_accept">
                    <i class="icon_check-solid"></i>
                </button>

                <button type="button" class="btn_icon"
                    data-conversation="private_request_reject">
                    <i class="icon_xmark-solid"></i>
                </button>
            </div>
        </li>
    `;

    conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
}