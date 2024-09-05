'use strict'
// Variable to store the dates for which dividers have been displayed
const displayedDividers = new Map();

// Global variable to track unread counts
const unreadCounts = new Map();

// Global map to track pending counts
const pendingCounts = new Map();

// Initialize pending counts for different events
pendingCounts.set('conversationPending', 0);

const conversationList = document.querySelector('[data-conversation="list"]');

import selectors from './utils/selectors.js';

export function observeMessages(socket) {
    // Find the currently active chat container and deactivate it
    const activeChat = document.querySelector(".chat_container.active");

    if (activeChat) {
        // Get the conversation ID from the clicked button
        const conversationID = activeChat.getAttribute('data-chat_id');

        // Check if the clicked button is a group chat
        const isGroup = activeChat.classList.contains('group');

        const recipientMessages = document.querySelectorAll('.chat_messages .recipient[data-message_id]');

        // Callback function for Intersection Observer
        const observerCallback = (entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (entry.target.getAttribute('data-message_status') !== 'read') {
                        entry.target.setAttribute('data-message_status', 'read');

                        const messageID = entry.target.getAttribute('data-message_id');

                        if (isGroup) {
                            socket.emit("readByGroup", messageID, conversationID);
                        } else {
                            socket.emit("readBy", messageID, conversationID);
                        }

                        handleReadMessages(conversationID);

                        // Optionally, unobserve the element after it is marked as read
                        observer.unobserve(entry.target);
                    }
                }
            });
        };

        // Create the Intersection Observer
        const observerOptions = {
            root: null, // Use the viewport as the container
            rootMargin: '0px',
            threshold: 0.6 // Trigger when 60% of the element is visible
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);

        // Observe each message element
        recipientMessages.forEach(message => observer.observe(message));
    }
}

export function handleUnreadMessages(isNew = false) {
    const activeChatContainer = document.querySelector('.chat_container.active');
    if (!activeChatContainer) return;

    const conversationID = activeChatContainer.getAttribute('data-chat_id');
    // const chatBody = activeChatContainer.querySelector('.chat_body');
    const chatMessages = activeChatContainer.querySelector('.chat_messages');
    const recipientMessages = chatMessages.querySelectorAll('.recipient[data-message_status="delivered"]');

    // Check if the content of chatBody is taller than chatMessages
    if (chatMessages.scrollHeight <= chatMessages.clientHeight) return;

    if (recipientMessages.length > 0) {
        // Initialize unread count for the chat if not already initialized
        if (!unreadCounts.has(conversationID)) {
            unreadCounts.set(conversationID, 0);
        }

        // Calculate the unread count based on whether new messages are being handled
        let unreadCount;

        if (isNew) {
            // Increment unread count by 1 for an individual new message
            unreadCount = unreadCounts.get(conversationID) + 1;
        } else {
            // Add the number of new messages to the current unread count
            unreadCount = unreadCounts.get(conversationID) + recipientMessages.length;
        }

        unreadCounts.set(conversationID, unreadCount);

        // Insert or update unread messages divider
        const firstDeliveredMessage = recipientMessages[0];
        const existingUnreadDivider = chatMessages.querySelector('.unread_divider');

        if (!existingUnreadDivider) {
            const unreadMessageHTML = `
                <li class="unread_divider">
                    <span class="inline_divider"></span>
                    <span class="unread_messages">Unread message(s) (<small class="unread_messages_count">${unreadCount}</small>)</span>
                    <span class="inline_divider"></span>
                </li>`;
            firstDeliveredMessage.insertAdjacentHTML("beforebegin", unreadMessageHTML);
        } else {
            const unreadMessageCounter = existingUnreadDivider.querySelector('.unread_messages_count');
            unreadMessageCounter.innerText = unreadCount;

            // Move the existing unread divider to the correct position if necessary
            if (firstDeliveredMessage.previousElementSibling !== existingUnreadDivider) {
                existingUnreadDivider.remove();
                firstDeliveredMessage.insertAdjacentElement("beforebegin", existingUnreadDivider);
            }
        }

    }

    focusOnUnreadMessageDivider(chatMessages);
}

// Function to decrement unread messages
export function handleReadMessages(conversationID) {
    // Initialize unread count for the chat if not already initialized
    if (!unreadCounts.has(conversationID)) {
        unreadCounts.set(conversationID, 0);
    }

    let unreadCount = unreadCounts.get(conversationID) - 1;
    unreadCount = Math.max(0, unreadCount); // Ensure the count doesn't go below zero
    unreadCounts.set(conversationID, unreadCount);

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}'] .chat_messages`);
    // Update or remove unread messages divider
    if (chatContainer) {
        // Check if the unread messages divider is already inserted
        const existingUnreadDivider = chatContainer.querySelector('.unread_divider');

        if (existingUnreadDivider) {
            if (unreadCount > 0) {
                const unreadMessageCounter = existingUnreadDivider.querySelector('.unread_messages_count');
                unreadMessageCounter.innerText = unreadCount;
            } else {
                existingUnreadDivider.remove();
                unreadCounts.clear();
            }
        }
    }
}

export function focusOnUnreadMessageDivider(chatMessages) {
    const unreadDivider = chatMessages.querySelector('.unread_divider');

    if (unreadDivider) {
        unreadDivider.scrollIntoView({ behavior: "instant", block: "end" });
    } else {
        // Scroll to the bottom of the chat container
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
}

export function insertSenderLogic(messageData, chatMessageHTML, isNew) {
    // Insert the message into the chat container
    const chatContainer = document.querySelector(`[data-chat_id='${messageData.conversationID}']`);
    const isActive = chatContainer.classList.contains('active');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    if (chatMessages) {
        displayDateDivider(messageData);
        chatMessages.insertAdjacentHTML("beforeend", chatMessageHTML);

        // Scroll to the bottom of the chat container
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    if (isNew) {
        // Update the chat preview message
        const conversationContainer = document.querySelector(`[data-conversation_id='${messageData.conversationID}']`);
        const conversationListItem = conversationContainer.closest('.conversation_list_item');

        if (!isFirstChild(selectors.conversationList, conversationListItem)) {
            moveToTop(conversationList, conversationListItem);
        }

        if (conversationContainer) {
            const timeSelector = conversationContainer.querySelector(".time_container time");

            conversationContainer.querySelector(".message_text").innerText = `You: ${messageData.content}`;
            timeSelector.setAttribute('datetime', messageData.createdAt);
            timeSelector.innerText = hourMinuteDateFormat(messageData.createdAt);
        }
    }

}

export function insertRecipientLogic(messageData, chatMessageHTML, isNew) {
    // Insert the message into the chat container
    const chatContainer = document.querySelector(`[data-chat_id='${messageData.conversationID}']`);
    const isActive = chatContainer.classList.contains('active');
    const isGroup = chatContainer.classList.contains('group');
    const chatMessages = chatContainer.querySelector('.chat_messages');

    if (chatMessages) {
        // Display date divider if necessary
        displayDateDivider(messageData);

        chatMessages.insertAdjacentHTML("beforeend", chatMessageHTML);
    }

    // Handle if it is a fetched or a new message
    if (isNew) {
        const conversationButton = document.querySelector(`[data-conversation_id='${messageData.conversationID}']`);
        const conversationListItem = conversationButton.closest('.conversation_list_item');

        if (!isFirstChild(selectors.conversationList, conversationListItem)) {
            moveToTop(conversationList, conversationListItem);
        }

        if (conversationButton) {
            conversationButton.querySelector(".message_body").classList.remove('active');
            conversationButton.querySelector(".message_text").innerText = `${messageData.senderData.profileName}: ${messageData.content}`;

            const timeSelector = conversationButton.querySelector(".time_container time");
            timeSelector.setAttribute('datetime', messageData.createdAt);
            timeSelector.innerText = hourMinuteDateFormat(messageData.createdAt);
        }

        // Handle if the chat container is not open
        if (!isActive) {

            // Check if the conversation is seen (i.e., 'data-isSeen' is 'true')
            const isSeen = conversationButton.getAttribute('data-isSeen') === 'true';
            // Find the notification badge container
            const statusContainer = conversationButton.querySelector('.status_container');

            if (isSeen) {
                // If it was seen, mark it as not seen (false)
                conversationButton.setAttribute('data-isSeen', 'false');

                // If the badge doesn't exist, create it
                const createSpan = document.createElement("span");
                createSpan.classList.add('not_badge');

                const createI = document.createElement("i");
                createI.classList.add('not_seen_times');
                createI.innerText = '1'; // Initialize with 1 since it's the first unseen notification

                createSpan.appendChild(createI);
                statusContainer.appendChild(createSpan);
            } else {
                // If the badge already exists, increment the counter
                const notSeenTimes = statusContainer.querySelector('.not_seen_times');
                let counterValue = parseInt(notSeenTimes.innerText, 10);
                if (isNaN(counterValue)) {
                    counterValue = 0; // Ensure counter starts at 0 if parsing fails
                }
                counterValue++;
                notSeenTimes.innerText = counterValue;
            }

        }
    }
}

export function hourMinuteDateFormat(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}

function formatDate(dateString) {
    const now = new Date();
    const date = new Date(dateString);

    const nowDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dateDateOnly = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const timeDiff = nowDateOnly - dateDateOnly;
    const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day

    if (date.getFullYear() === now.getFullYear()) {
        if (timeDiff < oneDay) {
            // Date is today
            return 'Today';
        } else if (timeDiff < 2 * oneDay) {
            // Date is yesterday
            return 'Yesterday';
        } else {
            // Date is in the current year, return in "dd MMM" format
            return date.toLocaleString('en-US', { day: 'numeric', month: 'short' });
        }
    } else {
        // Date is in a previous year, return in "dd MMM yyyy" format
        return date.toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });
    }
}

export function isScrolledToEnd(element) {
    // Calculate the difference between scroll height and scroll position
    const scrollDifference = element.scrollHeight - element.scrollTop - element.clientHeight;

    // Check if the scroll difference is very small (close to 0)
    // This indicates that the user has scrolled to the end
    return Math.abs(scrollDifference) < 1;
}

function displayDateDivider(messageData) {
    const messageDate = new Date(messageData.createdAt);
    const messageDateString = formatDate(messageDate);
    const conversationID = messageData.conversationID;

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}'] .chat_messages`);

    // Check if the date divider needs to be displayed
    if (!displayedDividers.has(conversationID)) {
        displayedDividers.set(conversationID, new Set());
    }

    if (!displayedDividers.get(conversationID).has(messageDateString)) {
        displayedDividers.get(conversationID).add(messageDateString);

        if (chatContainer) {
            const chatMessageDividerHTML = `
            <li class="day_divider"><span>${messageDateString}</span></li>
            `;

            chatContainer.insertAdjacentHTML("beforeend", chatMessageDividerHTML);
        }
    }
}

export function resetDisplayedDividers() {
    displayedDividers.clear();
    unreadCounts.clear();
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
    if (document.querySelector(".chats_container").getAttribute("data-state") === "open") {

        document.querySelector(".chats_container")?.setAttribute("data-state", "closing");

        document.querySelector(".chats_container")?.addEventListener("animationend", function () {
            document.querySelector(".chats_container").setAttribute("data-state", "closed");

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

// try {
//     const response = await fetch('./assets/emojis/emojis.json');
//     const data = await response.json();

//     console.log(data);

//     for (const emojis of data) {
//         createEmojis(emojis);
//     }

// } catch (error) {
//     console.error('Error during fetching videos:', error);
// }

// function createEmojis(emojis) {
//     const chatContainer = document.querySelector('.emojiss');
//     const chatMessageHTML = `
//         <li>
// ${emojis}
//         </li>
//        `;

//     chatContainer.insertAdjacentHTML("beforeend", chatMessageHTML);
// }

// chat application

// message from A to B and from A to B to C
