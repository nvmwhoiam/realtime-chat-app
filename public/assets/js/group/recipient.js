import {
    closeChat,
    resetDisplayedDividers,
    dropdownMenu,
    observeMessages,
    handleUnreadMessages
} from "../functions.js";

import {
    sendMessageGroup,
    recipientMessageGroup,
    createUserItemGroup,
    createChatContainerGroup,
} from './functions.js';

const recipient = (socket) => {

    // Recipient message sent from the server
    socket.on("newMessageGroup", (savedMessage, currentUser) => {
        // Display received message
        recipientMessageGroup(savedMessage, currentUser, true);

        observeMessages(socket);
        handleUnreadMessages();
    });

};
export default recipient;