'use strict'

// Global map to track pending counts
const pendingCounts = new Map();

import {
    displayDateDivider
} from './chat/messageState.js';

// Initialize pending counts for different events
pendingCounts.set('conversationPending', 0);

const conversationList = document.querySelector('[data-list="conversations"]');
const chatsContainer = document.querySelector('.chats_wrapper');

///////////////////////////////////
export function insertSenderLogic(messageData, chatMessageHTML, isNew) {
    const {
        conversationID,
        content,
        createdAt
    } = messageData;

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const isActive = chatContainer.classList.contains('active');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    if (chatMessages) {
        displayDateDivider(messageData);
        chatMessages.insertAdjacentHTML("beforeend", chatMessageHTML);

        // Scroll to the bottom of the chat container
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (isNew) {
        const conversationButton = document.querySelector(`[data-conversation_id='${conversationID}']`);
        const conversationListItem = conversationButton.closest('.conversation_list_item');

        if (!isFirstChild(conversationList, conversationListItem)) {
            moveToTop(conversationList, conversationListItem);
        }

        if (conversationButton) {
            conversationButton.querySelector(".message_text").innerText = `${content}`;

            // const messageStatus = conversationButton.querySelector('.status_container .status');
            const timeContainer = conversationButton.querySelector(".time_container");
            const timeSelector = timeContainer.querySelector("time");
            timeSelector.setAttribute('datetime', createdAt);
            timeSelector.innerText = hourMinuteDateFormat(createdAt);

            // messageStatus.setAttribute('data-message_status', 'sent');
        }
    }
}

export function insertRecipientLogic(messageData, chatMessageHTML, isNew) {
    const {
        conversationID,
        content,
        createdAt
    } = messageData;

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const isActive = chatContainer.classList.contains('active');
    const isGroup = chatContainer.classList.contains('group');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    if (chatMessages) {
        displayDateDivider(messageData);
        chatMessages.insertAdjacentHTML("beforeend", chatMessageHTML);
    }

    if (isNew) {
        const conversationButton = document.querySelector(`[data-conversation_id='${conversationID}']`);
        const conversationListItem = conversationButton.closest('.conversation_list_item');

        if (!isFirstChild(conversationList, conversationListItem)) {
            moveToTop(conversationList, conversationListItem);
        }

        if (conversationButton) {
            conversationButton.querySelector(".message_body").classList.remove('active');
            conversationButton.querySelector(".message_text").innerText = `${content}`;

            const timeContainer = conversationButton.querySelector(".time_container");
            const timeSelector = timeContainer.querySelector("time");
            timeSelector.setAttribute('datetime', createdAt);
            timeSelector.innerText = hourMinuteDateFormat(createdAt);
        }

        // if (!isActive) {
        //     const isSeen = conversationButton.getAttribute('data-isSeen') === 'true';
        //     const statusContainer = conversationButton.querySelector('.status_container');

        //     if (isSeen) {
        //         conversationButton.setAttribute('data-isSeen', 'false');

        //         const createSpan = document.createElement("span");
        //         createSpan.classList.add('not_badge');

        //         const createI = document.createElement("i");
        //         createI.classList.add('not_seen_times');
        //         createI.innerText = '1';

        //         createSpan.appendChild(createI);
        //         statusContainer.appendChild(createSpan);
        //     } else {
        //         const notSeenTimes = statusContainer.querySelector('.not_seen_times');
        //         let counterValue = parseInt(notSeenTimes.innerText, 10);
        //         if (isNaN(counterValue)) {
        //             counterValue = 0;
        //         }
        //         counterValue++;
        //         notSeenTimes.innerText = counterValue;
        //     }

        // }
    }
}

export function hourMinuteDateFormat(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

export function isScrolledToEnd(element) {
    // Calculate the difference between scroll height and scroll position
    const scrollDifference = element.scrollHeight - element.scrollTop - element.clientHeight;

    // Check if the scroll difference is very small (close to 0)
    // This indicates that the user has scrolled to the end
    return Math.abs(scrollDifference) < 1;
}

export function formattedMessage(string) {
    // Regex patterns
    const mentionPattern = /@(\w+)/g;
    const telPattern = /tel:(\d+)/g;
    const urlPattern = /url:(https?:\/\/[^\s]+)/g;
    const mailtoPattern = /mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g;

    return string
        .replace(mentionPattern, '<span class="profile_tag">@$1</span>') // Profile tags
        .replace(telPattern, '<a href="tel:$1">$1</a>') // Phone numbers
        .replace(urlPattern, '<a href="$1" target="_blank">$1</a>') // URLs
        .replace(mailtoPattern, '<a href="mailto:$1">$1</a>'); // Email
}

export function messageStatusFunction(status) {
    return `
    <span class="status" data-message_status="${status}">
        <i class="icon_check-solid"></i>
        <i class="icon_check-solid"></i>
    </span>
`;
}


// Function to update or remove indicators
function updateIndicators(eventType) {
    let count = pendingCounts.get(eventType);

    // Elements
    const conversationSettingsBtn = document.querySelector('[data-modal_btn="conversation_settings_modal"]');

    if (eventType === 'conversationPending') {
        const conversationPending = document.querySelector('[data-modal_menu_btn="conversation_pending"]');
        const notificationBubble = conversationSettingsBtn.querySelector('.notification_bubble');
        const pendingIndicator = conversationPending.querySelector('.pending_indicator');

        if (count > 0) {
            createNotificationBubble(conversationSettingsBtn);
            createCountTextIndicator(conversationPending, count);
        } else {
            // If count is 0 or less, remove indicators if they exist
            if (notificationBubble) {
                conversationPending.removeChild(pendingIndicator);
                conversationSettingsBtn.removeChild(notificationBubble)
            }
        }
    }
}

// Function to increment the pending count
export function incrementPending(eventType, incrementBy = 1) {
    if (pendingCounts.has(eventType)) {
        let count = pendingCounts.get(eventType);
        pendingCounts.set(eventType, count + incrementBy);
        updateIndicators(eventType);
    }
}

// Function to decrement the pending count
export function decrementPending(eventType) {
    if (pendingCounts.has(eventType)) {
        let count = pendingCounts.get(eventType);
        if (count > 0) {
            pendingCounts.set(eventType, count - 1);
            updateIndicators(eventType);
        }
    }
}

function createNotificationBubble(appendSelector) {
    // If count is greater than 0, create indicators if they don't exist
    const isContainsClass = appendSelector.classList.contains('notification_bubble');
    if (!isContainsClass) {
        const spanCreate = document.createElement('span');
        spanCreate.classList.add('notification_bubble');
        appendSelector.appendChild(spanCreate);
    }
}

function createCountTextIndicator(appendSelector, countNumber) {
    // If count is greater than 0, create indicators if they don't exist
    const isContainsClass = appendSelector.classList.contains('pending_indicator');
    if (!isContainsClass) {
        const spanCreate = document.createElement('span');
        spanCreate.classList.add('pending_indicator');
        appendSelector.appendChild(spanCreate);
    }

    const pendingIndicator = appendSelector.querySelector('.pending_indicator');

    // Update the pending indicator text
    pendingIndicator.innerText = `(${countNumber})`;
}

export function isFirstChild(container, item) {
    return container.firstElementChild === item;
}

export function moveToTop(container, element) {
    if (container && element) {
        container.removeChild(element);
        container.insertBefore(element, container.firstChild);
    }
}


export function dropdownMenu(selector) {

    if (selector.getAttribute("data-state") !== "open") {

        selector.setAttribute("data-state", "open");

        selector.setAttribute("aria-expanded", true);

    } else {

        selector.setAttribute("data-state", "closing");

        selector.setAttribute("aria-expanded", false);

        selector.addEventListener("animationend", function () {

            selector.setAttribute("data-state", "closed");

        }, { once: true });
    }
}

export function closeChat() {
    // Find the currently active button
    const activeConversationBtn = document.querySelector('.conversation_btn.active');

    // Find the currently active chat container
    const activeConversationChat = document.querySelector('.chat_container.active');

    if (activeConversationBtn) {
        activeConversationBtn.classList.remove('active');
    }

    if (activeConversationChat) {
        activeConversationChat.classList.remove('active');
    }

    //Check if Modal is active if it is then close it before opens another window
    if (document.querySelector(".chats_wrapper").getAttribute("data-state") === "open") {

        document.querySelector(".chats_wrapper")?.setAttribute("data-state", "closing");

        document.querySelector(".chats_wrapper")?.addEventListener("animationend", function () {
            document.querySelector(".chats_wrapper").setAttribute("data-state", "closed");

        }, { once: true });

    }
}

export function setClosedToOpen(selector) {

    selector.setAttribute("data-state", "open");

    selector.setAttribute("aria-expanded", true);
}

export function setClosingToClosed(selector) {
    selector.setAttribute("data-state", "closing");

    selector.setAttribute("aria-expanded", false);

    selector.addEventListener("animationend", function () {

        selector.setAttribute("data-state", "closed");

    }, { once: true });
}