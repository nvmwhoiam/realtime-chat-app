import {
    insertSenderLogic,
    insertRecipientLogic,
    hourMinuteDateFormat,
    formattedMessage,
    messageStatusFunction
} from "../functions.js";

// conversationsItem list elements
const conversationList = document.querySelector('[data-list="conversations"]');

// Chat container elements
const chatContainer = document.querySelector(".chats_container");

export function sendMessage(messageData, isNew = false) {
    const chatMessageHTML = `
    <li class="sender" data-message_status="${messageData.status}" data-message_id="${messageData.messageID}">
        <div class="message_content">
            <div class="message_body">
                <p class="message_text">${formattedMessage(messageData.content)}</p>
            </div>
            
            <div class="message_footer">
                <time datetime="${messageData.createdAt}">${hourMinuteDateFormat(messageData.createdAt)}</time>
               <span class="status">
                   <i class="icon_check-solid"></i>
                   <i class="icon_check-solid"></i>
              </span>
            </div>
        </div>
    </li>
       `;

    insertSenderLogic(messageData, chatMessageHTML, isNew);
}

export function recipientMessage(messageData, isNew = false) {
    // Create the recipient chat message HTML
    const chatMessageHTML = `
        <li class="recipient" data-message_status="${messageData.status}" data-message_id="${messageData.messageID}">
            <div class="message_content">
                <div class="message_body">
                    <p class="message_text">${formattedMessage(messageData.content)}</p>
                </div>

                <div class="message_footer">
                    <span class="status">
                        <i class="icon_check-solid"></i>
                        <i class="icon_check-solid"></i>
                    </span>
                    <time datetime="${messageData.createdAt}">${hourMinuteDateFormat(messageData.createdAt)}</time>
                </div>
            </div>
        </li>
        `;

    insertRecipientLogic(messageData, chatMessageHTML, isNew);
}

// Create a template for the user item
export function createUserItem(userData, chatData) {
    const hasLastMessage = chatData.lastMessageData !== false;
    const lastMessageContent = hasLastMessage ? chatData.lastMessageData.content : "No messages";
    const createdAt = hasLastMessage ? chatData.lastMessageData.createdAt : '';
    const formattedDate = hasLastMessage ? hourMinuteDateFormat(chatData.lastMessageData.createdAt) : '';
    const senderName = hasLastMessage && userData.profileName === chatData?.lastMessageData?.senderData?.profileName
        ? 'You:' : hasLastMessage ? `${chatData?.lastMessageData?.senderData?.profileName ?? ''}:` : '';
    const messageStatus = hasLastMessage ? messageStatusFunction(chatData.lastMessageData.status) : '';

    const conversationHTML = `
        <li class="conversation_list_item">
            <button type="button" class="conversation_btn profile_element" data-conversation_id="${chatData.conversationID}">

                <div class="avatar_container profile_image">
                    <img src="../uploads/userAvatars/${userData.profileAvatar}" alt="Profile avatar"
                        aria-label="Profile avatar">
                        <span class="profile_status" data-profile="${userData.profileName}"
                            data-status="offline"></span>
                </div>

                <div class="content_container">

                    <b class="content_name" data-profile="profileName">${userData.profileName}</b>

                    <div class="message_body">

                        <p class="message_text">
                            ${senderName} ${lastMessageContent}
                        </p>
                        <p class="chat_typing"></p>
                    </div>

                </div>

                <div class="footer_container">

                    <div class="time_container">
                        <time datetime="${createdAt}">${formattedDate}</time>
                    </div>

                    <div class="status_container">
                        ${messageStatus}
                        <span class="not_badge">
                            <i class="not_seen_times">0</i>
                        </span>
                    </div>

                </div>

            </button>
        </li>
        `;

    conversationList.insertAdjacentHTML("beforeend", conversationHTML);
}

// Create a template for the chat container
export function createChatContainer(userData, chatData) {
    const chatContainerHTML = `
        <section class="chat_container" data-chat_id="${chatData.conversationID}">
            <section class="chat_wrapper">
                <header class="chat_header">
                    <div class="flex_item">
                        <button type="button" data-btn="close_modal" class="btn_icon header_close"
                            aria-label="Close chat window">
                            <i class="icon_angle-left-solid"> </i>
                        </button>
                        <div class="profile_image">
                            <img src="../uploads/userAvatars/${userData.profileAvatar}" alt="User avatar" aria-label="User avatar">
                                <span class="profile_status" data-profile="${userData.profileName}" data-status="offline"></span>
                        </div>
                        <div class="details">
                            <b class="profile_name">${userData.profileName}</b>
                            <small></small>
                        </div>
                    </div>
                    <div class="flex_item">
                        <button type="button" class="btn_icon" data-btn="voiceCall" aria-label="Voice call on/off">
                            <i class="icon_phone-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="videoCall" aria-label="Video call on/off">
                            <i class="icon_video-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="side_bar_toggle" aria-label="Chat sidebar toggle">
                            <i class="icon_bars-solid"></i>
                        </button>
                    </div>
                </header>
                <ul class="chat_messages"></ul>
                <form method="post" action="#" class="message_form">
                    <button type="button" class="btn_icon">
                        <i class="icon_microphone-solid"></i>
                    </button>
                    <input type="text" placeholder="Type something..." rows="1" name="send_message">
                        <div class="dropdown">
                            <button type="button" class="btn_icon icon_dropdown" data-btn="attach">
                                <i class="icon_paperclip-solid"></i>
                            </button>

                            <ul class="icon_dropdown_menu" data-position="top_right" data-state="closed">

                                <li class="icon_dropdown_menu_item">
                                    <button type="button" class="btn_btn">
                                        Attach File
                                    </button>
                                </li>

                                <li class="icon_dropdown_menu_item">
                                    <label type="button" class="label_btn">
                                        Attach Photo
                                        <input type="file" data-upload="images" accept="image/*" multiple />
                                    </label>
                                </li>

                            </ul>
                        </div>

                        <div class="dropdown">
                            <button type="button" class="btn_icon icon_dropdown" data-btn="emojis">
                                <i class="icon_face-smile-regular"></i>
                            </button>

                            <ul class="icon_dropdown_menu" data-position="top_right" data-state="closed">

                                <li class="icon_dropdown_menu_item">
                                    <button type="button" class="btn_btn">
                                        Attach File
                                    </button>
                                </li>

                                <li class="icon_dropdown_menu_item">
                                    <button type="button" class="btn_btn">
                                        Attach Photo
                                    </button>
                                </li>

                            </ul>
                        </div>
                </form>
            </section>

            <aside class="chat_side_panel" data-state="closed">

                <header class="panel_header">
                    <button type="button" class="btn_icon" data-btn="side_bar_toggle" aria-label="" aria-controls="">
                        <i class="icon_xmark-solid"></i>
                    </button>

                    <h2>Side Panel</h2>
                </header>

                <div class="panel_body">

                    <div class="panel_body_header">

                        <div class="profile_container">
                            <div class="profile_avatar">
                                <img src="../uploads/userAvatars/user.svg">
                                    <span class="profile_status"></span>
                            </div>
                        </div>

                        <div class="profile_name">
                            Seid Ali
                        </div>
                    </div>

                    <div class="buttons_container">

                        <ul class="action_buttons">
                            <li class="action_button">
                                <button type="button" aria-label="">
                                    Mute/Unmute
                                </button>
                            </li>

                            <li class="action_button">
                                <button type="button" aria-label="">

                                </button>
                            </li>

                            <li class="action_button">
                                <button type="button" aria-label="">

                                </button>
                            </li>

                        </ul>

                    </div>

                </div>

            </aside>
        </section>
        `;

    chatContainer.insertAdjacentHTML("beforeend", chatContainerHTML);
}

export function ifActiveSetMessageStatusDelivered(messageID, conversationID) {
    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    const isActive = chatContainer.classList.contains('active');

    if (isActive) {
        const messageSelector = document.querySelector(`[data-message_id='${messageID}']`);
        messageSelector.setAttribute('data-message_status', 'delivered');
    }
}

export function ifActiveSetMessageStatusRead(conversationID, messageID) {
    const chatContainer = document.querySelector(`[data-chat_id="${conversationID}"]`);
    const isActive = chatContainer.classList.contains('active');

    if (isActive) {
        const recipientMessages = document.querySelector(`.sender[data-message_id="${messageID}"]`);
        if (recipientMessages) {
            recipientMessages.setAttribute('data-message_status', 'read');
        }
    }
}