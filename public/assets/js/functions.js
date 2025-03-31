'use strict'

import {
    displayDateDivider
} from './chat/messageState.js';

const conversationList = document.querySelector('[data-list="conversations"]');
const chatContainerList = document.querySelector('.chat_container_list');

export function insertSenderLogic(messageData, chatMessageHTML, isNew) {
    const { conversationID, content, createdAt } = messageData;

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const chatMessages = chatContainer.querySelector('.chat_messages');
    const isActive = chatContainer.classList.contains('active');

    if (chatMessages) {
        const messageObject = {
            conversationID,
            createdAt: formatDate(createdAt)
        }

        displayDateDivider(messageObject, chatMessages);
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
    const { conversationID, content, createdAt } = messageData;

    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const chatMessages = chatContainer.querySelector('.chat_messages');
    const isActive = chatContainer.classList.contains('active');
    const isGroup = chatContainer.classList.contains('group');

    if (chatMessages) {
        const messageObject = {
            conversationID,
            createdAt: formatDate(createdAt)
        }

        displayDateDivider(messageObject, chatMessages);
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

        if (!isActive) {
            const isSeen = conversationButton.getAttribute('data-isSeen') === 'true';
            const statusContainer = conversationButton.querySelector('.status_container');

            if (isSeen) {
                conversationButton.setAttribute('data-isSeen', 'false');
                const createSpan = document.createElement("span");
                createSpan.classList.add('not_badge');

                const createI = document.createElement("i");
                createI.classList.add('not_seen_times');
                createI.innerText = '1';

                createSpan.appendChild(createI);
                statusContainer.appendChild(createSpan);
            } else {
                const notSeenTimes = statusContainer.querySelector('.not_seen_times');
                let counterValue = parseInt(notSeenTimes.innerText, 10);
                if (isNaN(counterValue)) {
                    counterValue = 0;
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

export function chatLoaderRemove() {
    const activeChat = document.querySelector('.chat_container_item.active');
    const chatLoader = activeChat.querySelector('.chat_loader');
    if (chatLoader) {
        chatLoader.classList.remove('loading');
    }
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


export function formatDate(dateString) {
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