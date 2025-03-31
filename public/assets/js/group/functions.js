import {
    insertSenderLogic,
    insertRecipientLogic,
    hourMinuteDateFormat,
    formattedMessage
} from "../functions.js";

const conversationList = document.querySelector('[data-list="conversations"]');
const chatContainer = document.querySelector(".chat_container_list");

export function sendMessageGroup(messageData, profileID, isNew = false) {
    const { status, messageID, content, replyTo, attachments, createdAt } = messageData;

    const isFiles = attachments.length > 0 ? handleImage(attachments[0].filePath) : '';

    // const isRead = readBy.profileID === profileID ? 'read' : 'sent';
    const isRead = 'false';
    const ifRemoved = status === 'removed' ? 'Original message was removed!' : formattedMessage(content);

    // Check if content is empty
    const hasContent = content && content.trim().length > 0;

    const chatMessageHTML = `
        <li class="sender" data-message_status="${isRead}" data-message_id="${messageID}">

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
            </div>

        </li>
        `;

    insertSenderLogic(messageData, chatMessageHTML, isNew);
}

export function recipientMessageGroup(messageData, profileID, isNew = false) {
    const { status, senderData, messageID, content, replyTo, attachments, readBy, createdAt } = messageData;

    const isRead = readBy.map(item => item.profileID === profileID) ? 'read' : 'sent';
    const seenProfileNames = readBy.map(seen => seen.profileName);

    const isFiles = attachments.length > 0 ? handleImage(attachments[0].filePath) : '';

    const ifRemoved = status === 'removed' ? 'Original message was removed!' : formattedMessage(content);

    // Check if content is empty
    const hasContent = content && content.trim().length > 0;

    console.log(seenProfileNames);

    const chatMessageHTML = `
        <li class="recipient" data-message_status="${isRead}" data-message_id="${messageID}">

            <div class="message_wrapper">

                ${isFiles}

                <div class="message_container">
 
                    <div class="username">
                        ${senderData.profileName}
                    </div>

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
            </div>

        </li>
        `;

    insertRecipientLogic(messageData, chatMessageHTML, isNew);
}

export function createUserItemGroup(userData, profileID) {
    const { groupName, groupAvatar, conversationID, lastMessageData } = userData;

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


    const senderName = hasLastMessage && profileID === lastMessageData.senderData.profileID
        ? 'You:' : hasLastMessage ? `${lastMessageData.senderData.profileName ?? ''}:` : '';

    const conversationHTML = `
            <button type="button" class="conversation_item group profile_element" data-isSeen='true' data-conversation_id="${conversationID}">

                <div class="avatar_container profile_image">
                    <img src="../uploads/userAvatars/${groupAvatar}" alt="Group avatar"
                        aria-label="${groupName}'s avatar">
                </div>

                <div class="content_container">

                    <div class="content_name">${groupName}</div>

                    <div class="message_body">

                        <p class="message_text">
                            ${senderName} ${lastMessageContent}
                        </p>
                    
                    </div>

                </div>

                <div class="footer_container">

                    <div class="time_container">
                        <time datetime="${createdAt}">${formattedDate}</time>
                    </div>

                    <div class="status_container"></div>

                </div>

            </button>
        `;

    conversationList.insertAdjacentHTML("beforeend", conversationHTML);
}

export function createChatContainerGroup(chatData, currentProfileID) {
    const { conversationID, groupName, groupAvatar, groupDescription, createdBy, members } = chatData;

    const chatContainerHTML = `
        <div class="chat_container_item group" data-chat_id="${conversationID}">
            <section class="chat_wrapper">
                <header class="chat_header">
                    <div class="flex_item">
                        <button type="button" data-btn="close_modal" class="btn_icon header_close" aria-label=""
                        >
                            <i class="icon_angle-left-solid"> </i>
                        </button>
                        <div class="profile_image">
                            <img src="../uploads/userAvatars/${groupAvatar}" alt="Group avatar"
                                aria-label="${groupAvatar}'s avatar">
                        </div>
                        <div class="details">
                            <div class="profile_name">${groupName}</div>
                            <small>${groupDescription || "..."}</small>
                        </div>
                    </div>
                    <div class="flex_item">
                        <button type="button" class="btn_icon" data-btn="group_voice_call" aria-label="Group voice call on/off">
                            <i class="icon_phone-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="group_video_call" aria-label="Group video call on/off">
                            <i class="icon_video-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="side_bar_toggle"
                            aria-label="Group chat sidebar toggle">
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

                        <form method="post" action="#" class="message_form">
                            <div class="textarea_body">
                                <textarea placeholder="Type message..." data-isTyping="false"
                                    name="send_message" id="message_input" rows="1"></textarea>
                            </div>
                            <div class="form_button">
                                <button type="button" class="btn_icon" aria-label="">
                                    <i class="icon_microphone-solid"></i>
                                </button>

                                <button type="submit" class="btn_icon" aria-label="">
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

            </section>

            <aside class="chat_side_panel" data-modal_container="side_panel_modal" data-state="closed">

                <div class="container">

                    <div class="container_main" data-sidebar_menu_container="side_panel_menu" data-state="open">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-btn="chat_side_panel_close"
                                aria-label="">
                                <i class="icon_xmark-solid"></i>
                            </button>

                            <h2>Side Panel</h2>
                        </header>

                        <div class="panel_body">
                            <div class="panel_body_header">

                                <div class="profile_container">
                                    <div class="profile_avatar_wrapper">
                                        <img src="../uploads/userAvatars/${groupAvatar}" alt="Group avatar" aria-label="${groupAvatar}'s avatar">
                                    </div>
                                </div>

                                <div class="profile_name">
                                    ${groupName}
                                </div>

                                <p class="group_description">
                                    ${groupDescription || '...'}
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
                                            data-sidebar_menu_btn="members_container" aria-label="">
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
                                        <button type="button" class="btn_btn" aria-label="">
                                            About
                                        </button>
                                    </li>
                                </ul>

                            </div>

                        </div>

                    </div>

                    <div class="container_sub" data-sidebar_menu_container="members_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-sidebar_menu_btn="side_panel_menu"
                                aria-label="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Members</h2>
                        </header>

                        <div class="panel_body">

                            <ul class="members_list" data-list="members_list">

                                ${groupMembersRender(members, createdBy.profileID, currentProfileID)}

                            </ul>

                        </div>

                    </div>

                    <div class="container_sub" data-sidebar_menu_container="media_container" data-state="closed">

                        <header class="panel_header">
                            <button type="button" class="btn_icon" data-sidebar_menu_btn="side_panel_menu"
                                aria-label="">
                                <i class="icon_angle-left-solid"></i>
                            </button>

                            <h2>Media</h2>
                        </header>

                        <div class="panel_body">

                        </div>

                    </div>

                </div>

            </aside>

        </li>
    `;

    chatContainer.insertAdjacentHTML("beforeend", chatContainerHTML);
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

function groupMembersRender(members, creatorsProfileID, currentProfileID) {
    return members.map(eachMember => {
        const { profileName, profileAvatar, profileID } = eachMember.memberID;
        const isCreator = profileID === creatorsProfileID;
        const isCurrentProfileCreator = currentProfileID === creatorsProfileID;
        const isCurrentProfile = profileID === currentProfileID;
        const isMod = eachMember.role === 'moderator' ? ' mod' : '';
        const isStatus = isCurrentProfile ? '' : `<span class="profile_status" data-profile_id="${profileID}" data-status="offline"></span>`;

        return `
        <li class="profile_element${isCreator ? ' creator' : ''}${isMod}${isCurrentProfile ? ' current' : ''}">
            <div class="avatar_container profile_image">
                <img src="../uploads/userAvatars/${profileAvatar}" alt="${profileName}'s avatar" aria-label="${profileName}'s avatar">
                ${isStatus}
            </div>
            <div class="content_container">
                <div class="profile_name">${profileName}${isCreator ? ' (Creator)' : ''}${isMod ? ' (Mod)' : ''}</div>
                <small>Offline</small>
            </div>
            <div class="buttons_container">
                <div class="dropdown">
                    <button type="button" class="btn_icon icon_dropdown" aria-label="Options">
                        <i class="icon_ellipsis-vertical-solid"></i>
                    </button>
                    <ul class="icon_dropdown_menu" data-position="bot_right" data-state="closed">
                        ${groupMembersDropdownItem(isCurrentProfileCreator, isCurrentProfile)}
                    </ul>
                </div>
            </div>
        </li>
            `;
    }).join('');
}

function groupMembersDropdownItem(isCurrentProfileCreator, isCurrentProfile) {
    if (isCurrentProfileCreator) {
        if (isCurrentProfile) {
            return `
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Delete Group</button>
            </li>`;
        }

        if (!isCurrentProfile) {
            return `
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Mute</button>
            </li>
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Assign Role</button>
            </li>
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Kick</button>
            </li>
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Report</button>
            </li>`;
        }
    } else {
        if (isCurrentProfile) {
            return `
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Leave Group</button>
            </li>`;
        }

        if (!isCurrentProfile) {
            return `
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Mute</button>
            </li>
            <li class="icon_dropdown_menu_item">
                <button type="button" class="btn_btn" data-btn="" aria-label="">Report</button>
            </li>`;
        }
    }
}

function handleImage(path) {
    return `
    <div class="image_container">
        <div class="image_body">
            <img src="./../uploads/uploadImages/${path}">
        </div>
    </div>`;
}