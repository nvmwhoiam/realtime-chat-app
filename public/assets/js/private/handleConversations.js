import {
    createUserItem,
    createChatContainer,
} from './functions.js';

import {
    incrementPending,
    decrementPending
} from '../functions.js';

'use strict'

const handleConversations = (socket) => {

    const searchProfileToRequestPrivateConversation = document.querySelector('[name="searchProfileToRequestPrivateConversation"]');
    const searchPrivateConversationToCreateResults = document.querySelector('[data-list="private_conversation_request_search_results"]');
    const conversationRequestElement = document.querySelector('[data-list="pending_conversations"]');

    let searchTimeout;

    searchProfileToRequestPrivateConversation.addEventListener('input', function () {
        const value = searchProfileToRequestPrivateConversation.value.trim();

        // Clear previous search results
        searchPrivateConversationToCreateResults.innerHTML = '';

        // Debounce the search input to reduce API requests
        clearTimeout(searchTimeout);

        searchTimeout = setTimeout(() => {
            if (value) {
                // If it gets to here means that the profile is online and sends a feedback that the message is delivered
                socket.emit('searchProfileToRequestPrivateConversation', value);
            }

        }, 300); // Adjust debounce delay as needed
    });

    socket.on('privateConversationSearchResults', (profiles) => {
        for (const profile of profiles) {
            profileToRequestPrivateConversationUI(profile);
        }
    });

    socket.on('privateConversationRequestFeedback', (profileData) => {
        profileOfRequestedConversationUI(profileData);

        incrementPending('conversationPending'); // Increment pending count for conversation settings
    });

    // Function to remove conversation request when a profile cancels the request 
    socket.on('privateConversationRequestCancelFeedback', (customID) => {
        const findConversationRequest = document.querySelector(`[data-conversation_request_id="${customID}"]`);

        findConversationRequest.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings
    });

    // Function to handle requested conversation accepted feedback
    socket.on('privateConversationRequestAcceptedFeedback', (profileData, chatData) => {

        createUserItem(profileData, chatData);
        createChatContainer(profileData, chatData);

        // Clear search input
        searchProfileToRequestPrivateConversation.value = '';

        // Clear previous search results
        searchPrivateConversationToCreateResults.innerHTML = '';

        decrementPending('conversationPending'); // Decrement pending count for conversation settings
    });

    // Function to remove conversation request when a profile rejects the request
    socket.on('privateConversationRequestRejectedFeedback', (customID) => {
        const findConversationRequest = document.querySelector(`[data-conversation_request_id="${customID}"]`);

        findConversationRequest.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings
    });

    socket.on('privateConversationRequestDetails', (conversationRequested) => {
        for (const conversationData of conversationRequested) {
            profileOfRequestedConversationUI(conversationData);
        }

        const isLength = conversationRequested.length;

        if (isLength > 0) {
            incrementPending('conversationPending', isLength); // Increment pending count for conversation settings
        }
    });

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
                    <button type="button" class="btn_icon${profile.requestStatus === 'pending' ? " active" : ''}" data-conversation="requestCancel">
                    <i class="icon_plus-solid"></i>
                </button>
                </div>
            </li>
            `;

        searchPrivateConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    searchPrivateConversationToCreateResults.addEventListener('click', function (event) {
        // Use closest to find the nearest .conversation ancestor
        const requestCancel = event.target.closest('[data-conversation="requestCancel"]');

        if (requestCancel) {
            handleRequestCancelConversationLogic(requestCancel);
        }
    });

    function handleRequestCancelConversationLogic(selectorElement) {
        const parentContainer = selectorElement.closest('.profile_element');

        const profileNameRequested = parentContainer.getAttribute('data-profileName');

        if (!selectorElement.classList.contains('active')) {
            selectorElement.classList.add('active');
            socket.emit('privateConversationRequest', profileNameRequested);
        } else {
            selectorElement.classList.remove('active');
            socket.emit('privateConversationRequestCancel', profileNameRequested);
        }
    }

    function profileOfRequestedConversationUI(profile) {
        const chatMessageHTML = `
            <li class="profile_element" data-conversation_request_id="${profile.customID}">

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
                        data-conversation="request_accept">
                        <i class="icon_check-solid"></i>
                    </button>

                    <button type="button" class="btn_icon"
                        data-conversation="request_reject">
                        <i class="icon_xmark-solid"></i>
                    </button>
                </div>
            </li>
    `;

        conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    conversationRequestElement.addEventListener('click', function (event) {
        const acceptRequest = event.target.closest('[data-conversation="request_accept"]');
        const rejectRequest = event.target.closest('[data-conversation="request_reject"]');

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
        socket.emit('privateConversationRequestAccepted', customID);

        requestConversationProfile.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings

    }

    function handleOnRequestRejected(selectorElement) {
        const requestConversationProfile = selectorElement.closest('.profile_element');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('privateConversationRequestRejected', customID);

        requestConversationProfile.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings

    }
}


export default handleConversations;