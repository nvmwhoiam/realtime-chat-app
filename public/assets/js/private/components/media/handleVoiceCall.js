'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

socket.on("voiceCallPrivateFeedback", (conversationID) => {
    console.log(conversationID);
});

export function handleVoiceCallButton(conversationID) {
    socket.emit("voiceCallPrivate", conversationID);
    console.log('Voice Call Button Clicked. Conversation ID:', conversationID);
}