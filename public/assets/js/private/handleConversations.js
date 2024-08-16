import {
    sendMessage,
    recipientMessage,
    createUserItem,
    createChatContainer,
} from './functions.js';

import {
    incrementPending,
    decrementPending
} from '../functions.js';

import {
    chatEventListeners
} from '../main.js';

const handleConversations = (socket) => {

    const searchProfileToRequestPrivateConversation = document.querySelector('[name="searchProfileToRequestPrivateConversation"]');
    const searchPrivateConversationToCreateResults = document.querySelector('[data-conversation="request_search_results"]');
    const conversationRequestElement = document.querySelector('[data-conversation="pending_list"]');

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

        privateConversationIRequestCancelEvent();
    });

    socket.on('privateConversationRequestFeedback', (profileData) => {
        profileOfRequestedConversationUI(profileData);

        incrementPending('conversationPending'); // Increment pending count for conversation settings

        privateConversationRequestFeedbackEvent();
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

        chatEventListeners();
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
            // Example usage
            incrementPending('conversationPending', isLength); // Increment pending count for conversation settings

            // Function to attach event
            privateConversationRequestFeedbackEvent();
        }

    });

    function profileToRequestPrivateConversationUI(profile) {
        const chatMessageHTML = `
            <li class="request_conversation_profile" data-profileName="${profile.profileName}">
                <div class="request_conversation_profile_body">
                    <div class="profile_image">
                        <img src="../uploads/userAvatars/${profile.profileAvatar}" alt="profile avatar" aria-label="profile avatar">
                    </div>
                    <div class="details">
                        <span class="profile_name">@${profile.profileName}</span>
                        <small>Not verified</small>
                    </div>
                </div>
                <div class="buttons">
                    <button type="button" class="btn_icon ${profile.requestStatus === 'pending' ? "active" : ''}" data-conversation="requestCancel">
                        <i class="icon_plus-solid"></i>
                    </button>
                </div>
            </li>
            `;

        searchPrivateConversationToCreateResults.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    function privateConversationIRequestCancelEvent() {
        const requestCancel = document.querySelectorAll('[data-conversation="requestCancel"]');

        requestCancel.forEach(button => {
            button.addEventListener('click', handleRequestCancelConversationLogic);
        });
    }

    function handleRequestCancelConversationLogic() {
        const parentContainer = this.closest('.request_conversation_profile');

        const profileNameRequested = parentContainer.getAttribute('data-profileName');

        if (!this.classList.contains('active')) {
            this.classList.add('active');
            socket.emit('privateConversationRequest', profileNameRequested);
        } else {
            this.classList.remove('active');
            socket.emit('privateConversationRequestCancel', profileNameRequested);
        }
    }

    function profileOfRequestedConversationUI(profile) {
        const chatMessageHTML = `
            <li class="request_conversation_profile" data-conversation_request_id="${profile.customID}">

                <div class="request_conversation_profile_body">
                    <div class="profile_image">
                        <img src="../uploads/userAvatars/${profile.senderData.profileAvatar}" alt="profile avatar" aria-label="profile avatar">
                    </div>
                    <div class="details">
                        <span class="profile_name">@${profile.senderData.profileName}</span>
                        <small>Not verified</small>
                    </div>
                </div>

                <div class="buttons">
                    <button type="button" class="btn_icon" data-private-conversation="request_accept">
                        <i class="icon_check-solid"></i>
                    </button>

                    <button type="button" class="btn_icon" data-private-conversation="request_reject">
                        <i class="icon_xmark-solid"></i>
                    </button>
                </div>
            </li>
            `;

        conversationRequestElement.insertAdjacentHTML('beforeend', chatMessageHTML);
    }

    function privateConversationRequestFeedbackEvent() {
        const acceptRequests = document.querySelectorAll('[data-private-conversation="request_accept"]');
        const rejectRequests = document.querySelectorAll('[data-private-conversation="request_reject"]');

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
        socket.emit('privateConversationRequestAccepted', customID);

        requestConversationProfile.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings

    }

    function handleOnRequestRejected(eachBtn) {
        const requestConversationProfile = eachBtn.closest('.request_conversation_profile');
        const customID = requestConversationProfile.getAttribute('data-conversation_request_id');
        socket.emit('privateConversationRequestRejected', customID);

        requestConversationProfile.remove();

        decrementPending('conversationPending'); // Decrement pending count for conversation settings

    }
}


export default handleConversations;