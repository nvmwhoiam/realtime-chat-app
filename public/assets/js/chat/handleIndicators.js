'use strict'

// Global map to track pending counts
const pendingCounts = new Map();

// Initialize pending counts for different events
pendingCounts.set('conversationPending', 0);

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
    pendingIndicator.innerText = `(${countNumber})`;
}