import {
    insertSenderLogic,
    insertRecipientLogic,
    handleReadMessages,
    hourMinuteDateFormat,
    formattedMessage
} from "../functions.js";

// conversationsItem list elements
const conversationList = document.querySelector('[data-list="conversations"]');

// Chat container elements
const chatContainer = document.querySelector(".chats_container");

export function sendMessageGroup(messageData, currentProfile, isNew = false) {
    const isRead = messageData.readBy.profileName === currentProfile ? 'read' : 'sent';

    const chatMessageHTML = `
    <li class="sender" data-message_status="${isRead}" data-message_id="${messageData.messageID}">
        <div class="message_content">
            <div class="message_body">
                <p class="message_text">${formattedMessage(messageData.content)}</p>
            </div>

            <div class="message_footer">
                <time datetime="${messageData.createdAt}">${hourMinuteDateFormat(messageData.createdAt)}</time>
            </div>
        </div>
    </li>
    `;

    insertSenderLogic(messageData, chatMessageHTML, isNew);
}

export function recipientMessageGroup(messageData, currentProfile, isNew = false) {
    const isRead = messageData.readBy.some(item => item.profileName === currentProfile) ? 'read' : 'sent';
    const seenProfiles = messageData.readBy.map(seen => seen.profileName);

    // Create the recipient chat message HTML
    const chatMessageHTML = `
    <li class="recipient" data-message_status="${isRead}" data-message_id="${messageData.messageID}">
        <div class="message_content">
            <div class="message_body">
                <div class="username">${messageData.senderData.profileName}</div>
                <p class="message_text">${formattedMessage(messageData.content)}</p>
            </div>
            <div class="message_footer">
              <time datetime="${messageData.createdAt}">${hourMinuteDateFormat(messageData.createdAt)}</time>
            </div>
        </div>
    </li>
    `;

    insertRecipientLogic(messageData, chatMessageHTML, isNew);
}

export function createUserItemGroup(userData, profileName) {
    const hasLastMessage = userData.lastMessageData !== false;
    const lastMessageContent = hasLastMessage ? userData.lastMessageData.content : "No messages";
    const createdAt = hasLastMessage ? userData.lastMessageData.createdAt : "";
    const formattedDate = hasLastMessage ? hourMinuteDateFormat(userData.lastMessageData.createdAt) : "";

    const senderName = hasLastMessage && profileName === userData?.lastMessageData?.senderData?.profileName
        ? 'You:' : hasLastMessage ? `${userData?.lastMessageData?.senderData?.profileName ?? ''}:` : '';

    const conversationHTML = `
        <li class="conversation_list_item">
            <button type="button" class="conversation_btn group profile_element" data-conversation_id="${userData.conversationID}">

                <div class="avatar_container profile_image">
                    <img src="../uploads/userAvatars/${userData.groupAvatar}" alt="Group avatar"
                        aria-label="Group avatar">
                </div>

                <div class="content_container">

                    <b class="content_name">${userData.groupName}</b>

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
export function createChatContainerGroup(chatData) {
    const chatContainerHTML = `
        <section class="chat_container group" data-chat_id="${chatData.conversationID}">
            <section class="chat_wrapper">
                <header class="chat_header">
                    <div class="flex_item">
                        <button type="button" data-btn="close_modal" class="btn_icon header_close" aria-label=""
                            aria-controls="">
                            <i class="icon_angle-left-solid"> </i>
                        </button>
                        <div class="profile_image">
                            <img src="../uploads/userAvatars/${chatData.groupAvatar}" alt="Group avatar"
                                aria-label="Group avatar">
                        </div>
                        <div class="details">
                            <b class="profile_name">${chatData.groupName}</b>
                            <small>${chatData.description || "..."}</small>
                        </div>
                    </div>
                    <div class="flex_item">
                        <button type="button" class="btn_icon" data-btn="voiceCall" aria-label="Group voice call on/off">
                            <i class="icon_phone-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="videoCall" aria-label="Group video call on/off">
                            <i class="icon_video-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="side_bar_toggle"
                            aria-label="Group chat sidebar toggle">
                            <i class="icon_bars-solid"></i>
                        </button>
                    </div>
                </header>
                <ul class="chat_messages"></ul>
                <form method="post" action="#" class="message_form">
                    <button type="button" class="btn_icon">
                        <i class="icon_microphone-solid"></i>
                    </button>
                    <input type="text" placeholder="Type something..." name="send_message">
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
                                    <button type="button" class="btn_btn">
                                        Attach Photo
                                    </button>
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

            <aside class="chat_side_panel" modal_container="side_panel_modal" data-state="closed">

                <div class="container">

                    <div class="container_main" data-menu_container="side_panel_menu" data-state="open">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-modal_btn="side_panel_modal"
                                aria-label="" aria-controls="">
                                <i class="icon_xmark-solid"></i>
                            </button>

                            <h2>Side Panel</h2>
                        </header>

                        <div class="panel_body">
                            <div class="panel_body_header">

                                <div class="profile_container">
                                    <div class="profile_avatar_wrapper">
                                        <img src="../uploads/userAvatars/${chatData.groupAvatar}" alt="Group avatar" aria-label="Group avatar">
                                            <span class="profile_status"></span>
                                    </div>
                                </div>

                                <div class="profile_name">
                                    ${chatData.groupName}
                                </div>

                                <p class="group_description">
                                    ${chatData.groupDescription}
                                </p>
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
                                            data-modal_menu_btn="members_container" aria-label="">
                                            Members
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn" aria-label="">
                                            Stared message(s)
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn"
                                            data-modal_menu_btn="media_container" aria-label="">
                                            Media
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn" aria-label="">
                                            Appearance
                                        </button>
                                    </li>

                                    <li class="navigation_list_item">
                                        <button type="button" class="btn_btn" aria-label="">
                                            About
                                        </button>
                                    </li>
                                </ul>

                            </div>

                        </div>

                    </div>

                    <div class="container_sub" data-menu_container="members_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-modal_menu_btn="side_panel_menu"
                                aria-label="" aria-controls="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Members</h2>
                        </header>

                        <div class="panel_body">

                            <ul class="members_list">

                                ${chatData.members.map(eachMember => `
                                            <li class="members_list_item">
                                            <div class="avatar_container">
                                                <img src="../uploads/userAvatars/${eachMember.profileAvatar}">
                                            </div>
                                            <div class="metadata_container">
                                                <span>${eachMember.profileName}</span>
                                                <small>Online</small>
                                            </div>
                                            <div class="actions_container">
                                                <button type="button" class="btn_icon" aria-label="">
                                                    <i class="icon_ellipsis-vertical-solid"></i>
                                                </button>
                                            </div>
                                        </li>
                                        `).join('')}
                                        
                            </ul>

                        </div>

                    </div>

                    <div class="container_sub" data-menu_container="media_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-modal_menu_btn="side_panel_menu"
                                aria-label="" aria-controls="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Media</h2>
                        </header>

                        <div class="panel_body">

                        </div>

                    </div>

                </div>

            </aside>

        </section>
        `;

    chatContainer.insertAdjacentHTML("beforeend", chatContainerHTML);
}