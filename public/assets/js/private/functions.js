'use strict'

import {
    insertSenderLogic,
    insertRecipientLogic,
    hourMinuteDateFormat,
    formattedMessage
} from "../functions.js";

const conversationList = document.querySelector('[data-list="conversations"]');
const chatsContainer = document.querySelector('.chat_container_list');

export function sendMessage(messageData, isNew = false) {

    const { status, messageID, content, replyTo, sent, delivered, read, removed, attachments, createdAt } = messageData;

    const isFiles = attachments.length > 0 ? handleImage(attachments[0].filePath) : '';

    const isDelivered = delivered ? `, Delivered: ${delivered}` : '';
    const isRead = read ? `, Read: ${read}` : '';
    const ifRemoved = status === 'removed' ? 'Original message was removed!' : formattedMessage(content);

    // Check if content is empty
    const hasContent = content && content.trim().length > 0;

    const chatMessageHTML = `
        <li class="message_item sender" data-message_status="${status}" data-message_id="${messageID}">

            <div class="message_wrapper">

                ${isFiles}

                <div class="message_container">
 
                    ${hasContent || replyTo ? `
                        <div class="message_content">
                            ${replyMessage(replyTo)}  
                            ${hasContent ? `
                                <p class="message_text">
                                    ${ifRemoved}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}

                </div>
            </div>

            <div class="message_footer">
                <time datetime="${createdAt}">${hourMinuteDateFormat(createdAt)}</time>
                <span class="status" title="Sent: ${sent} ${isDelivered} ${isRead}">
                    <i class="icon_check-solid"></i>
                    <i class="icon_check-solid"></i>
                </span>
            </div>

        </li>
    `;

    insertSenderLogic(messageData, chatMessageHTML, isNew);
}

export function recipientMessage(messageData, isNew = false) {

    const { status, messageID, content, replyTo, sent, delivered, read, removed, attachments, createdAt } = messageData;

    const isFiles = attachments.length > 0 ? handleImage(attachments[0].filePath) : '';

    const isDelivered = delivered ? `, Delivered: ${delivered}` : '';
    const isRead = read ? `, Read: ${read}` : '';
    const ifRemoved = status === 'removed' ? 'Original message was removed!' : formattedMessage(content);

    // Check if content is empty
    const hasContent = content && content.trim().length > 0;

    const chatMessageHTML = `
        <li class="message_item recipient" data-message_status="${status}" data-message_id="${messageID}">

            <div class="message_wrapper">

                ${isFiles}

                <div class="message_container">

                    ${hasContent || replyTo ? `
                        <div class="message_content">
                            ${replyMessage(replyTo)}  
                            ${hasContent ? `
                                <p class="message_text">
                                    ${ifRemoved}
                                </p>
                            ` : ''}
                        </div>
                    ` : ''}

                </div>

            </div>

            <div class="message_footer">
                <span class="status" title="Sent: ${sent} ${isDelivered} ${isRead}">
                    <i class="icon_check-solid"></i>
                    <i class="icon_check-solid"></i>
                </span>
                <time datetime="${createdAt}">${hourMinuteDateFormat(createdAt)}</time>
            </div>

        </li>
       `;

    insertRecipientLogic(messageData, chatMessageHTML, isNew);
}

export function createUserItem(userData, chatData) {

    const { conversationID, lastMessageData, notSeen } = chatData;

    const { profileID, profileName, profileAvatar } = userData;

    const hasLastMessage = lastMessageData !== false;

    // Handle message content priority: removed > content > attachment > "No messages"
    const lastMessageContent = hasLastMessage
        ? lastMessageData.status === 'removed'
            ? "Original message was removed!"
            : lastMessageData.content ||
            (lastMessageData.attachments ? "📷 " + lastMessageData.attachments[0].fileCategory : "No messages")
        : "No messages";

    const createdAt = hasLastMessage ? lastMessageData.createdAt : '';
    const formattedDate = hasLastMessage ? hourMinuteDateFormat(lastMessageData.createdAt) : '';
    const messageStatus = hasLastMessage ? messageStatusFunction(lastMessageData.status) : '';

    const isSeen = notSeen === 0;
    const notSeenBadge = !isSeen
        ? `<span class="not_badge">
                <i class="not_seen_times">${notSeen}</i>
           </span>`
        : '';

    const conversationHTML = `
            <button type="button" class="conversation_item profile_element" data-isSeen="${isSeen}" data-conversation_id="${conversationID}">

                <div class="avatar_container profile_image">
                    <img src="../uploads/userAvatars/${profileAvatar}" alt="Profile avatar"
                        aria-label="Profile avatar">
                    <span class="profile_status" data-profile_id="${profileID}" data-status="offline">
                    </span>
                </div>

                <div class="content_container">

                    <div class="content_name" data-profile="profileName">
                        ${profileName}
                    </div>

                    <div class="message_container" data-isTyping="false">

                        <p class="message_text">
                           ${lastMessageContent}
                        </p>
                    </div>

                </div>

                <div class="footer_container">

                    <div class="time_container">
                        <time datetime="${createdAt}">${formattedDate}</time>
                    </div>
 
                    <div class="status_container">
                        ${messageStatus}
                        ${notSeenBadge}
                    </div>

                </div>

            </button>
        `;

    conversationList.insertAdjacentHTML("beforeend", conversationHTML);
}

export function createChatContainer(userData, chatData) {
    const { profileID, profileName, profileAvatar } = userData;

    const chatContainerHTML = `
        <div class="chat_container_item" data-chat_id="${chatData.conversationID}">
            <section class="chat_wrapper">
                <header class="chat_header">

                    <div class="flex_item">
                        <button type="button" data-btn="close_modal" class="btn_icon header_close"
                            aria-label="Close chat window">
                            <i class="icon_angle-left-solid"> </i>
                        </button>
                        <div class="profile_image">
                            <img src="../uploads/userAvatars/${profileAvatar}" alt="User avatar" aria-label="User avatar">
                            <span class="profile_status" data-profile_id="${profileID}" data-status="offline"></span>
                        </div>
                        <div class="details">
                            <div class="profile_name">${profileName}</div>
                            <small>Offline</small>
                        </div>
                    </div>
                
                    <div class="flex_item">
                        <button type="button" class="btn_icon" data-btn="private_voice_call" aria-label="Voice call on/off">
                            <i class="icon_phone-solid"></i>
                        </button>

                        <button type="button" class="btn_icon" data-btn="private_video_call" aria-label="Video call on/off">
                            <i class="icon_video-solid"></i>
                        </button>
                        
                        <button type="button" class="btn_icon" data-btn="side_bar_toggle" aria-label="Chat sidebar toggle">
                            <i class="icon_bars-solid"></i>
                        </button>
                    </div>
                
                </header>

                <span class="chat_loader"></span>

                <ul class="chat_messages"></ul>

                <div class="chat_footer">

                    <div class="chat_footer_body">

                        <div class="dropdown">
                            <button type="button" class="btn_icon icon_dropdown" data-btn="emojis">
                                <i class="icon_face-smile-regular"></i>
                            </button>

                            <ul class="icon_dropdown_menu" data-position="top_left" data-state="closed"></ul>
                        </div>

                        <form method="post" action="#" class="message_form" enctype="multipart/form-data">
                            <div class="textarea_body">
                                <textarea placeholder="Type message..." data-isTyping="false"
                                        name="send_message" id="message_input" rows="1"></textarea>
                            </div>

                            <div class="form_button">
                                <button type="button" class="btn_icon" aria-label="">
                                    <i class="icon_microphone-solid"></i>
                                </button>
                                <button type="submit" class="btn_icon" aria-label="Submit Message">
                                    <i class="icon_paper-plane-solid"></i>
                                </button>
                                <div class="dropdown">
                                    <button type="button" class="btn_icon icon_dropdown" aria-label=""
                                        data-btn="">
                                        <i class="icon_plus-solid"></i>
                                    </button>
                                    <ul class="icon_dropdown_menu" data-position="top_right"
                                        data-state="closed">
                                        <li class="icon_dropdown_menu_item">
                                            <button type="button" class="btn_btn">
                                                Location
                                            </button>
                                        </li>
                                        <li class="icon_dropdown_menu_item">
                                            <button type="button" class="btn_btn">
                                                Mention
                                            </button>
                                        </li>
                                        <li class="icon_dropdown_menu_item"> 
                                            <label class="label_btn" aria-label="Upload image button">
                                                Attach Photo
                                                <input type="file" data-upload="images" accept="image/*" multiple="">
                                            </label>
                                        </li>
                                    </ul>
                                </div>
                            </div>

                        </form>

                    </div>

                </div>
            </section>

            <aside class="chat_side_panel" data-state="closed">

                <div class="container">

                    <div class="container_main" data-sidebar_menu_container="side_panel_menu" data-state="open">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-btn="chat_side_panel_close"
                                aria-label="" aria-controls="">
                                <i class="icon_xmark-solid"></i>
                            </button>

                            <h2>Side Panel</h2>
                        </header>

                        <div class="panel_body">
                            <div class="panel_body_header">

                                <div class="profile_container">
                                    <div class="profile_avatar_wrapper">
                                        <img src="../uploads/userAvatars/${profileAvatar}">
                                            <span class="profile_status"></span>
                                    </div>
                                </div>

                                <div class="profile_name">
                                    ${profileName}
                                </div>

                            </div>

                            <div class="buttons_container">
                                <ul class="action_buttons">
                                    <li class="action_button">
                                        <button type="button" class="btn_icon" aria-label="">
                                            <i class="icon_check-solid"></i>
                                        </button>

                                        <small class="btn_title">Leave</small>
                                    </li>

                                    <li class="action_button">
                                        <button type="button" class="btn_icon" aria-label="">
                                            <i class="icon_bell-regular"></i>
                                        </button>

                                        <small class="btn_title">Mute</small>
                                    </li>

                                    <li class="action_button">
                                        <button type="button" class="btn_icon" aria-label="">
                                            <i class="icon_magnifying-glass-solid"></i>
                                        </button>

                                        <small class="btn_title">Search</small>
                                    </li>

                                </ul>

                                <ul class="navigation_list">

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn"
                                            data-sidebar_menu_btn="groups_in_common_container" aria-label="">
                                            Group(s) in common
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn" aria-label="">
                                            Stared message(s)
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn"
                                            data-sidebar_menu_btn="media_container" aria-label="">
                                            Media
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn" aria-label="">
                                            Appearance
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn"
                                            data-sidebar_menu_btn="about_container" aria-label="">
                                            About
                                        </button>
                                    </li>
                                </ul>

                            </div>

                        </div>

                    </div>

                    <div class="container_sub" data-sidebar_menu_container="groups_in_common_container"
                        data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-sidebar_menu_btn="side_panel_menu"
                                aria-label="" aria-controls="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Group(s) in Common</h2>
                        </header>

                        <div class="panel_body">

                        </div>

                    </div>

                    <div class="container_sub" data-sidebar_menu_container="media_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-sidebar_menu_btn="side_panel_menu"
                                aria-label="" aria-controls="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Media</h2>
                        </header>

                        <div class="panel_body">

                        </div>

                    </div>

                    <div class="container_sub" data-sidebar_menu_container="about_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-sidebar_menu_btn="side_panel_menu"
                                aria-label="" aria-controls="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>About</h2>
                        </header>

                        <div class="panel_body">

                        </div>

                    </div>

                </div>

            </aside>
        </div>
        `;

    chatsContainer.insertAdjacentHTML("beforeend", chatContainerHTML);
}

export function ifActiveSetMessageStatusDelivered(conversationID, messageID) {
    const chatContainer = document.querySelector(`[data-chat_id='${conversationID}']`);
    // const conversationButton = document.querySelector(`[data-conversation_id='${conversationID}']`);
    const isActive = chatContainer.classList.contains('active');

    if (isActive) {
        const messageSelector = document.querySelector(`[data-message_id='${messageID}']`);
        messageSelector.setAttribute('data-message_status', 'delivered');
    }

    // if (conversationButton) {
    //     const messageStatus = conversationButton.querySelector('.status_container .status');
    //     messageStatus.setAttribute('data-message_status', 'delivered');
    // }
}

export function ifActiveSetMessageStatusRead(conversationID, messageID) {
    const chatContainer = document.querySelector(`[data-chat_id="${conversationID}"]`);
    // const conversationButton = document.querySelector(`[data-conversation_id='${conversationID}']`);
    const isActive = chatContainer.classList.contains('active');

    if (isActive) {
        const recipientMessages = document.querySelector(`.sender[data-message_id="${messageID}"]`);
        if (recipientMessages) {
            recipientMessages.setAttribute('data-message_status', 'read');
        }
    }

    // if (conversationButton) {
    //     const messageStatus = conversationButton.querySelector('.status_container .status');
    //     messageStatus.setAttribute('data-message_status', 'read');
    // }
}

function replyMessage(replyTo) {
    if (!replyTo) return '';

    return `
        <button class="message_replied"
            data-target="${replyTo.messageID}"
            title="View the original message">
            <p class="reply_text">${formattedMessage(replyTo.content)}</p>
        </button>
    `;
}

function messageStatusFunction(status) {
    return `
    <span class="status" data-message_status="${status}">
        <i class="icon_check-solid"></i>
        <i class="icon_check-solid"></i>
    </span>
    `;
}

function handleImage(path) {
    return `
    <div class="image_container">
        <div class="image_body">
            <img src="./../uploads/uploadImages/${path}">
        </div>
    </div>`;
}