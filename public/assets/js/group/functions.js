import {
    insertSenderLogic,
    insertRecipientLogic,
    handleReadMessages,
    hourMinuteDateFormat,
    formattedMessage
} from "../functions.js";

// conversationsItem list elements
const conversationList = document.querySelector(".conversation_list");

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
    // const senderName = profileName === userData.lastMessageData.senderData.profileName ? 'You:' : `${userData.lastMessageData.senderData.profileName}:`;

    const senderName = hasLastMessage && profileName === userData?.lastMessageData?.senderData?.profileName
        ? 'You:' : hasLastMessage ? `${userData?.lastMessageData?.senderData?.profileName ?? ''}:` : '';

    const conversationHTML = `
        <li class="conversation_list_item">
            <button type="button" class="conversation_btn group" data-conversation_id="${userData.conversationID}">
                <div class="header profile_image">
                    <img src="../uploads/userAvatars/${userData.groupAvatar}" alt="User avatar" aria-label="User avatar">
                </div>
                <div class="message_content">
                    <b class="profile_name">${userData.groupName}</b>
                    <div class="message_body">
                        <p class="message_text">${senderName} ${lastMessageContent}</p>
                        <p class="chat_typing"></p>
                    </div>
                </div>
                <div class="footer">
                    <div class="time_container">
                        <time datetime="${createdAt}">${formattedDate}</time>
                    </div>
                    <div class="status_container">
                        <span class="not_badge"><i class="not_seen_times">0</i></span>
                    </div>
                </div>
            </button>
        </li>
        `;

    conversationList.insertAdjacentHTML("beforeend", conversationHTML);
}

// Create a template for the chat container
export function createChatContainerGroup(userData) {
    const chatContainerHTML = `
<section class="chat_container group" data-chat_id="${userData.conversationID}">
    <section class="chat_wrapper">
        <section class="chat_header">
            <div class="flex_item">
                <button type="button" data-btn="close_modal" class="btn_icon header_close" aria-label=""
                    aria-controls="">
                    <i class="icon_angle-left-solid"> </i>
                </button>
                <div class="profile_image">
                    <img src="../uploads/userAvatars/${userData.groupAvatar}" alt="User avatar"
                        aria-label="User avatar">
                </div>
                <div class="details">
                    <b class="profile_name">${userData.groupName}</b>
                    <small>${userData.description || "..."}</small>
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
        </section>
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

    <aside class="chat_side_panel" data-state="closed">

    <header class="panel_header">
        <button type="button" class="btn_icon" aria-label="" aria-controls="">
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