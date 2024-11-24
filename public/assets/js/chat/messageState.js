// Variable to store the dates for which dividers have been displayed
const displayedDividers = new Map();

// Global variable to track unread counts
const unreadCounts = new Map();

export function observeMessages(socket) {
    // Find the currently active chat container and deactivate it
    const activeChat = document.querySelector(".chat_container.active");

    if (activeChat) {
        const conversationID = activeChat.getAttribute('data-chat_id');

        const isGroup = activeChat.classList.contains('group');

        // const chatMessages = document.querySelector('.chat_messages');
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
            displayUnreadMessageDividerUI(firstDeliveredMessage, unreadCount);
        } else {
            const unreadMessageCounter = existingUnreadDivider.querySelector('.unread_messages_count');
            unreadMessageCounter.innerText = unreadCount;

            // Move the existing unread divider to the correct position if necessary
            if (firstDeliveredMessage.previousElementSibling !== existingUnreadDivider) {
                existingUnreadDivider.remove();
                firstDeliveredMessage.insertAdjacentHTML("beforebegin", existingUnreadDivider);
            }
        }

    }

    focusOnUnreadMessageDivider(chatMessages);
}

function displayUnreadMessageDividerUI(containerSelector, unreadCount) {
    const unreadMessageHTML = `
    <li class="unread_divider">
        <span class="divider_line"></span>
        <small class="unread_messages">Unread message(s) (<span class="unread_messages_count">${unreadCount}</span>)</small>
        <span class="divider_line"></span>
    </li>`;
    containerSelector.insertAdjacentHTML("beforebegin", unreadMessageHTML);
}

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

export function displayDateDivider(messageData) {
    const { conversationID, createdAt } = messageData;
    const messageDate = new Date(createdAt);
    const messageDateString = formatDate(messageDate);

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const chatMessages = chatContainer.querySelector(".chat_messages");

    // Check if the date divider needs to be displayed
    if (!displayedDividers.has(conversationID)) {
        displayedDividers.set(conversationID, new Set());
    }

    if (!displayedDividers.get(conversationID).has(messageDateString)) {
        displayedDividers.get(conversationID).add(messageDateString);

        if (chatMessages) {
            displayDateDividerUI(chatMessages, messageDateString);
        }
    }
}

function displayDateDividerUI(chatMessages, messageDateString) {
    const chatMessageDividerHTML = `
    <li class="day_divider">
        <span class="divider_line"></span>
        <small>${messageDateString}</small>
        <span class="divider_line"></span>
    </li>
    `;

    chatMessages.insertAdjacentHTML("beforeend", chatMessageDividerHTML);
}

export function resetDisplayedDividers() {
    displayedDividers.clear();
    unreadCounts.clear();
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