let messageTouchTimer;

export function handleMessagesClick(e) {
    const replyToButton = e.target.closest('[data-message_btn="message_reply"]');
    if (replyToButton) {
        const chatContainerItem = replyToButton.closest('.chat_container_item');
        const chatFooter = chatContainerItem.querySelector('.chat_footer');

        const messageForm = chatContainerItem.querySelector('.message_form');

        const messageItem = replyToButton.closest('.sender', '.recipient');
        const messageID = messageItem.getAttribute('data-message_id');

        messageForm.classList.add('isReply');
        messageForm.setAttribute('data-reply_message_id', messageID);

        const messageText = messageItem.querySelector('.message_text').innerText;

        replyMessageContainerUI(messageText, chatFooter);
    }

    // ! Check this logic
    const focusRepliedMessageButton = e.target.closest('button.message_replied');
    if (focusRepliedMessageButton) {
        const activeChatContainerItem = document.querySelector('.chat_container_item.active');
        const chatMessagesContainer = activeChatContainerItem.querySelector(".chat_messages");
        const targetRepliedMessageID = focusRepliedMessageButton.getAttribute('data-target');
        const targetOriginalMessage = chatMessagesContainer.querySelector(`[data-message_id="${targetRepliedMessageID}"]`);

        if (targetOriginalMessage) {
            // targetOriginalMessage.classList.add('view');
            targetOriginalMessage.scrollIntoView({
                behavior: 'smooth', // Smooth scrolling
                block: 'start',    // Align to the top of the viewport
            });
        }
    }

    closeAllContextMenus();
}

export function handleMessagesContextMenu(e) {
    const messageElement = e.target.closest('li[data-message_id]');
    if (messageElement) {
        e.preventDefault();
        handleMessageClick(messageElement);
    } else {
        closeAllContextMenus();
    }
}

export function handleMessagesTouchMenu(e) {
    const messageElement = e.target.closest('li[data-message_id]');
    if (messageElement) {
        handleMessagesTouchMenuTimer();

        messageTouchTimer = setTimeout(() => {
            handleMessageTouch(messageElement);
        }, 500); // 500ms long-press to trigger
    }

    const touchInsideMenu = e.target.closest('.message_container');
    if (!touchInsideMenu) {
        const menuOverlay = document.querySelector('.menu_overlay');
        if (menuOverlay) {
            const touchMenuOpen = document.querySelector('.touch_menu_open');
            if (touchMenuOpen) {
                touchMenuOpen.classList.remove('touch_menu_open');
            }

            menuOverlay.remove();
        }
    }
}

export function handleMessagesTouchMenuTimer() {
    clearTimeout(messageTouchTimer); // Cancel if released early
}

function handleMessageClick(messageElement) {
    const isSender = messageElement.classList.contains('sender');
    const isRecipient = messageElement.classList.contains('recipient');
    const messageID = messageElement.getAttribute('data-message_id');
    const isOpen = messageElement.classList.contains('contextmenu_open');

    if (!isOpen) {
        closeAllContextMenus();
        reactionDrawerUI(messageElement);
        messageElement.classList.add('contextmenu_open');

        if (isSender) {
            senderContexmenuUI(messageElement);
        } else if (isRecipient) {
            recipientContexmenuUI(messageElement);
        }
    }
}

function handleMessageTouch(messageElement) {
    const isSender = messageElement.classList.contains('sender');
    const isRecipient = messageElement.classList.contains('recipient');
    const messageID = messageElement.getAttribute('data-message_id');
    const isOpen = messageElement.classList.contains('touch_menu_open');

    if (!isOpen) {
        messageElement.classList.add('touch_menu_open');

        if (isSender) {
            senderTouchmenuUI();
        } else if (isRecipient) {
            recipientTouchmenuUI();
        }
    }
}

function closeAllContextMenus() {
    document.querySelectorAll('.contextmenu_open').forEach((element) => {
        element.classList?.remove('contextmenu_open');
        element.querySelector('.message_reaction_drawer')?.remove();
        element.querySelector('.message_contextmenu')?.remove();
    });
}

function senderContexmenuUI(selectorElement) {
    const contextmenuHTML = `
        <div class="message_contextmenu">
            <ul class="message_contextmenu_list" data-position="right">
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_reply" aria-label="Reply message button">Reply</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_forward" aria-label="Forward message button">Forward</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_copy" aria-label="Copy message button">Copy</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn=""message_view" aria-label="View message button">View</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn=""message_edit" aria-label="Edit message button">Edit</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn=""message_delete" aria-label="Delete message button">Delete</button>
                </li>
            </ul>
        </div>
        `;

    selectorElement.insertAdjacentHTML("beforeend", contextmenuHTML);
}

function recipientContexmenuUI(selectorElement) {
    const contextmenuHTML = `
        <div class="message_contextmenu">
            <ul class="message_contextmenu_list" data-position="right">
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_reply" aria-label="Reply message button">Reply</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_forward" aria-label="Forward message button">Forward</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn="message_copy" aria-label="Copy message button">Copy</button>
                </li>
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn=""message_view" aria-label="View message button">View</button>
                </li> 
                <li class="message_contextmenu_list_item">
                    <button type="button" data-message_btn=""message_delete" aria-label="Delete message button">Delete</button>
                </li>
            </ul>
        </div>
        `;

    selectorElement.insertAdjacentHTML("beforeend", contextmenuHTML);
}

function reactionDrawerUI(selectorElement) {
    const reactionDrawerHTML = `
        <div class="message_reaction_drawer">
            <ul class="message_reaction_drawer_list">
                <li class="message_reaction_drawer_list_item">
                    <button type="button" aria-label="">
                        😀
                    </button>
                </li>
                <li class="message_reaction_drawer_list_item">
                    <button type="button" aria-label="">
                        😃
                    </button>
                </li>
                <li class="message_reaction_drawer_list_item">
                    <button type="button" aria-label="">
                        😄
                    </button>
                </li>
                <li class="message_reaction_drawer_list_item">
                    <button type="button" aria-label="">
                        😆
                    </button>
                </li>
                <li class="message_reaction_drawer_list_item">
                    <button type="button" aria-label="">
                        🥹
                    </button>
                </li>
            </ul>
        </div>
        `;

    selectorElement.insertAdjacentHTML("afterbegin", reactionDrawerHTML);
}

function replyMessageContainerUI(replyData, selectorElement) {
    const contextmenuHTML = `
        <div class="reply_container">
            <p class="reply_preview">
                ${replyData}
            </p>
        </div>
        `;

    selectorElement.insertAdjacentHTML("afterbegin", contextmenuHTML);
}

function senderTouchmenuUI() {
    const contextmenuHTML = `
        <div class="menu_overlay">
            <div class="message_container">

                <div class="message_body">

                    <div class="message_box">
                        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Hic sapiente
                            eveniet nesciunt, nisi, quibusdam odio voluptate reprehenderit, officia
                            distinctio accusantium non tempora similique dolor qui recusandae. Harum,
                            quisquam quaerat. Pariatur.
                        </p>
                    </div>

                    <ul class="message_reaction_list">
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😀
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😃
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😄
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😆
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                🥹
                            </button>
                        </li>
                    </ul>

                    <ul class="menu_list">
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_reply" aria-label="Reply message button">
                                Reply
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_forward" aria-label="Forward message button">
                                Forward
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_cope" aria-label="Copy message button">
                                Copy
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_view" aria-label="View message button">
                                View
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_edit" aria-label=Edit message button">
                                Edit
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_delete" aria-label="Delete message button">
                                Delete
                            </button>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    `;

    document.querySelector('body').insertAdjacentHTML("beforeend", contextmenuHTML);
}

function recipientTouchmenuUI() {
    const contextmenuHTML = `
        <div class="menu_overlay">
            <div class="message_container">

                <div class="message_body">

                    <div class="message_box">
                        <p>Lorem ipsum dolor sit amet consectetur, adipisicing elit. Hic sapiente
                            eveniet nesciunt, nisi, quibusdam odio voluptate reprehenderit, officia
                            distinctio accusantium non tempora similique dolor qui recusandae. Harum,
                            quisquam quaerat. Pariatur.
                        </p>
                    </div>

                    <ul class="message_reaction_list">
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😀
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😃
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😄
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                😆
                            </button>
                        </li>
                        <li class="message_reaction_list_item">
                            <button type="button" aria-label="">
                                🥹
                            </button>
                        </li>
                    </ul>

                    <ul class="menu_list">
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_reply" aria-label="Reply message button">
                                Reply
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_forward" aria-label="Forward message button">
                                Forward
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_cope" aria-label="Copy message button">
                                Copy
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_view" aria-label="View message button">
                                View
                            </button>
                        </li>
                        <li class="menu_list_item">
                            <button type="button" data-message_btn="message_delete" aria-label="Delete message button">
                                Delete
                            </button>
                        </li>
                    </ul>
                </div>

            </div>
        </div>
    `;

    document.querySelector('body').insertAdjacentHTML("beforeend", contextmenuHTML);
}