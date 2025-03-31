'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

const callsList = document.querySelector('[data-list="calls"]');

let setRingingTimeout;
let setCallTime;
let minutes = 0;
let seconds = 0;

function startAndClearTimeout() {
    // Clear any existing timeout if there is one
    clearTimeout(setRingingTimeout);

    // Set a new timeout
    setRingingTimeout = setTimeout(() => {
        const parentElement = document.querySelector('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');
        const callID = parentElement.getAttribute('data-call_id');

        socket.emit("privateVideoCallTimeout", conversationID, callID);
    }, 30000);
}

function stopTimeout() {
    clearTimeout(setRingingTimeout);
    console.log('Timeout stopped.');
}

function startAndClearCallInterval() {
    // Clear any existing interval if there is one
    clearInterval(setCallTime);

    // Set a new interval to increment seconds
    setCallTime = setInterval(() => {
        // Increment seconds
        seconds++;

        // Check if seconds have reached 60
        if (seconds === 60) {
            seconds = 0; // Reset seconds to 0
            minutes++;  // Increment minutes

            // Only update the minutes DOM when minutes actually change
            let formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
            document.querySelector('[data-timer="call_minutes"]').innerText = formattedMinutes;
        }

        // Always update the seconds DOM
        let formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;
        document.querySelector('[data-timer="call_seconds"]').innerText = formattedSeconds;

    }, 1000);
}

function stopCallInterval() {
    clearInterval(setCallTime);
    console.log('Interval stopped.');
}

// startAndClearCallInterval();
// setTimeout(stopCallInterval, 5000);

export function privateVideoCallEventClick(e) {
    const privateVideoCall = e.target.closest('[data-btn="private_video_call"]');
    if (privateVideoCall) {
        const parentElement = privateVideoCall.closest('.chat_container_item, .call_item');
        const conversationID = parentElement.getAttribute('data-chat_id');

        socket.emit("privateVideoCall", conversationID);
    }

    const privateVideoCallStart = e.target.closest('[data-btn="private_video_call_start"]');
    if (privateVideoCallStart) {
        const parentElement = privateVideoCallStart.closest('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');

        startAndClearTimeout();

        if (parentElement) {
            parentElement.remove();
        }

        socket.emit("privateVideoCallStart", conversationID);
    }

    const privateVideoCallCancel = e.target.closest('[data-btn="private_video_call_cancel"]');
    if (privateVideoCallCancel) {
        const parentElement = privateVideoCallCancel.closest('.private_video_call');

        if (parentElement) {
            parentElement.remove();
        }
    }

    const privateVideoCallVolumeToggle = e.target.closest('[data-btn="private_video_call_volume_toggle"]');
    if (privateVideoCallVolumeToggle) {
        const iconSelector = privateVideoCallVolumeToggle.querySelector('i');
        const isVolume = iconSelector.className === 'icon_volume-high-solid';

        if (isVolume) {
            iconSelector.classList.replace('icon_volume-high-solid', 'icon_volume-xmark-solid');
        } else {
            iconSelector.classList.replace('icon_volume-xmark-solid', 'icon_volume-high-solid');
        }
    }

    const privateVideoCallMicToggle = e.target.closest('[data-btn="private_video_call_microphone_toggle"]');
    if (privateVideoCallMicToggle) {
        const iconSelector = privateVideoCallMicToggle.querySelector('i');
        const isMute = iconSelector.className === 'icon_microphone-solid';

        if (isMute) {
            iconSelector.classList.replace('icon_microphone-solid', 'icon_microphone-slash-solid');
        } else {
            iconSelector.classList.replace('icon_microphone-slash-solid', 'icon_microphone-solid');
        }
    }

    const privateVideoCallVideoToggle = e.target.closest('[data-btn="private_video_call_video_toggle"]');
    if (privateVideoCallVideoToggle) {
        const iconSelector = privateVideoCallVideoToggle.querySelector('i');
        const isVideoOn = iconSelector.className === 'icon_video-solid';

        if (isVideoOn) {
            iconSelector.classList.replace('icon_video-solid', 'icon_video-slash-solid');
        } else {
            iconSelector.classList.replace('icon_video-slash-solid', 'icon_video-solid');
        }
    }

    const privateVideoCallSenderHangUp = e.target.closest('[data-btn="private_video_call_sender_hang_up"]');
    if (privateVideoCallSenderHangUp) {
        const parentElement = privateVideoCallSenderHangUp.closest('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');
        const callID = parentElement.getAttribute('data-call_id');

        socket.emit("privateVideoCallSenderHangUp", conversationID, callID);
    }

    const privateVideoCallRecipientHangUp = e.target.closest('[data-btn="private_video_call_recipient_hang_up"]');
    if (privateVideoCallRecipientHangUp) {
        const parentElement = privateVideoCallRecipientHangUp.closest('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');
        const callID = parentElement.getAttribute('data-call_id');

        socket.emit("privateVideoCallRecipientHangUp", conversationID, callID);
    }

    const privateVideoCallIncomingReject = e.target.closest('[data-btn="private_video_call_incoming_reject"]');
    if (privateVideoCallIncomingReject) {
        const parentElement = privateVideoCallIncomingReject.closest('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');
        const callID = parentElement.getAttribute('data-call_id');

        socket.emit("privateVideoCallIncomingReject", conversationID, callID);
    }

    const privateVideoCallIncomingAccept = e.target.closest('[data-btn="private_video_call_incoming_accept"]');
    if (privateVideoCallIncomingAccept) {
        const parentElement = privateVideoCallIncomingAccept.closest('.private_video_call');
        const conversationID = parentElement.getAttribute('data-conversation_id');
        const callID = parentElement.getAttribute('data-call_id');

        socket.emit("privateVideoCallIncomingAccept", conversationID, callID);
    }
}

socket.on("privateVideoCallRinging", (callData) => {
    console.log(callData);
    incomingCallUI(callData);
});

socket.on("privateVideoCallRingingFeedback", (callID) => {
    console.log("Feedback to the calling user" + callID);
});

socket.on("privateVideoCallTimeoutFeedback", (callData) => {
    console.log(callData);
});

socket.on("privateCallFetchListFeedback", (privateCallsSchema, profileID) => {
    callsList.innerHTML = '';
    for (const privateCallSchema of privateCallsSchema) {
        incomingCallItemUI(privateCallSchema, profileID);
    }
});

socket.on("privateVideoCallFeedback", (participantData, conversationID) => {
    if (participantData) {
        privateVideoCallConfirm(participantData, conversationID);
    } else {
        console.error("No profile data received for video call.");
    }
});

socket.on("privateVideoCallStartFeedbackSender", (callData, isRecipientOnline) => {
    if (callData) {
        outgoingCallUI(callData, isRecipientOnline);
    } else {
        console.error("No call data received for outgoing call.");
    }
});

socket.on("privateVideoCallStartFeedbackRecipient", (callData) => {
    if (callData) {
        incomingCallUI(callData);
    } else {
        console.error("No call data received for incoming call.");
    }
});

socket.on("privateVideoCallOutgoingHangUpFeedback", (callID) => {
    const parentElement = document.querySelector(`[data-call_id="${callID}"]`);
    if (parentElement) {
        parentElement.remove();
    }

    // stopVideoStream();
});

socket.on("privateVideoCallIncomingAcceptFeedback", (callID) => {
    const parentElement = document.querySelector(`[data-call_id="${callID}"]`);

    stopTimeout();

    if (parentElement) {
        parentElement.setAttribute('data-mode', 'videoMode');
    }

    startAndClearCallInterval();

    // requestVideoStream();
});

socket.on("privateVideoCallIncomingRejectFeedback", (callID) => {
    const parentElement = document.querySelector(`[data-call_id="${callID}"]`);
    if (parentElement) {
        parentElement.remove();
    }
});

let localStream = null; // Store the stream globally

// camera.js
function requestVideoStream() {
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        alert("Your browser does not support video streaming.");
        return;
    }

    // Request access to the camera
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(function (stream) {
            localStream = stream; // Store the stream globally for later use
            // Set the video element's source to the camera stream
            localVideo.srcObject = stream;
            localVideo.play();

            console.log("Stream started.");
        })
        .catch(function (error) {
            if (error.name === "NotAllowedError") {
                alert("Camera and microphone access was denied.");
            } else if (error.name === "NotFoundError") {
                alert("No camera or microphone found.");
            } else {
                console.error("Error accessing the camera: ", error);
            }
        });
}

// Function to stop the video stream
function stopVideoStream() {
    if (localStream) {
        // Stop all tracks in the stream
        localStream.getTracks().forEach(track => track.stop());
        localStream = null; // Reset the global variable
        console.log("Stream stopped.");
    } else {
        console.log("No active stream to stop.");
    }
}

socket.on('video-stream', (data) => {
    return
    const videoElement = document.getElementById('remoteVideo');
    const blob = new Blob([data], { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    videoElement.src = url;
    videoElement.play();
});

function privateVideoCallConfirm(participantData, conversationID) {
    const HTMLContainer = ` 
    <div class="private_video_call" data-conversation_id="${conversationID}" data-mode="confirmMode">

    <div class="confirm_container">

        <div class="container_wrapper">

            <div class="profile_avatar">
                <div class="avatar_wrapper">
                    <img src="../uploads/userAvatars/${participantData.profileAvatar}">
                </div>
            </div>

            <div class="profile_name">
                <h3>${participantData.profileName}</h3>
                <p>Start video call</p>
            </div>

            <div class="buttons">
                <button type="button" class="btn_icon reject_call_btn" data-btn="private_video_call_cancel" aria-label="">
                    <i class="icon_xmark-solid"></i>
                </button>

                <button type="button" class="btn_icon accept_call_btn" data-btn="private_video_call_start" aria-label="">
                    <i class="icon_video-solid"></i>
                </button>
            </div>

        </div>

    </div>

</div>
`;

    document.querySelector('body').insertAdjacentHTML("beforeend", HTMLContainer);
}

function outgoingCallUI(callData, isRecipientOnline) {
    const callStatus = isRecipientOnline ? "outgoing" : "connecting"; // Set call status based on recipient's online status

    const HTMLContainer = ` 
        <div class="private_video_call" data-conversation_id="${callData.conversationID}" data-call_id="${callData.callID}" data-mode="dialMode">

        <div class="call_container">

            <div class="container_wrapper">

                <div class="profile_avatar">
                    <div class="avatar_wrapper">
                        <img src="../uploads/userAvatars/${callData.receiverData.profileAvatar}">
                        <div class="calling_effect outgoing">
                            <span></span> <span></span> <span></span>
                        </div>
                    </div>
                </div>

                <div class="profile_name">
                    <h3>${callData.receiverData.profileName}</h3>
                    <p>${callStatus} video call <span class="dots"><span></span><span></span><span></span></span></p>
                </div>

                <div class="buttons">
                    <button type="button" class="btn_icon" data-btn="private_video_call_volume_toggle" aria-label="">
                        <i class="icon_volume-xmark-solid"></i>
                    </button>

                    <button type="button" class="btn_icon hangup_call_btn" data-btn="private_video_call_sender_hang_up" aria-label="">
                        <i class="icon_phone-slash-solid"></i>
                    </button>

                    <button type="button" class="btn_icon" data-btn="private_video_call_microphone_toggle" aria-label="">
                        <i class="icon_microphone-slash-solid"></i>
                    </button>
                </div>

            </div>

        </div>

        <div class="video_container">

            <div class="remote_container">
                <video class="recipients_view" id="remoteVideo" autoplay> </video>

                <div class="timer_container">
                    <span data-timer="call_minutes">00</span>:<span data-timer="call_seconds">00</span>
                </div>

                <div class="recipients_view_controls">
                    <button type="button" class="btn_icon" data-btn="private_video_call_video_toggle" aria-label="">
                        <i class="icon_video-solid"></i>
                    </button>
                    <button type="button" class="btn_icon" data-btn="private_video_call_volume_toggle" aria-label="">
                        <i class="icon_volume-high-solid"></i>
                    </button>
                    <button type="button" class="btn_icon" data-btn="private_video_call_microphone_toggle" aria-label="">
                        <i class="icon_microphone-solid"></i>
                    </button>
                    <button type="button" class="btn_icon hangup_call" data-btn="private_video_call_sender_hang_up" aria-label="">
                        <i class="icon_phone-slash-solid"></i>
                    </button>
                </div>
            </div>

            <div class="local_container">
                <video class="sendersView" id="localVideo" autoplay></video>
            </div>

        </div>

    </div>
    `;

    document.querySelector('body').insertAdjacentHTML("beforeend", HTMLContainer);
}

function incomingCallUI(callData) {
    const HTMLContainer = `
        <div class="private_video_call" data-conversation_id="${callData.conversationID}" data-call_id="${callData.callID}" data-mode="dialMode">

            <div class="call_container">

                <div class="container_wrapper">

                    <div class="profile_avatar">
                        <div class="avatar_wrapper">
                            <img src="../../../../../../uploads/userAvatars/${callData.senderData.profileAvatar}">
                            <div class="calling_effect incoming">
                                <span></span> <span></span> <span></span>
                            </div>
                        </div>
                    </div>

                    <div class="profile_name">
                        <h3>${callData.senderData.profileName}</h3>
                        <p>incoming video call <span class="dots"><span></span><span></span><span></span></span></p>
                    </div>

                    <div class="buttons">
                        <button type="button" class="btn_icon reject_call_btn" data-btn="private_video_call_incoming_reject" aria-label="">
                            <i class="icon_phone-slash-solid"></i>
                        </button>

                        <button type="button" class="btn_icon accept_call_btn" data-btn="private_video_call_incoming_accept" aria-label="">
                            <i class="icon_phone-solid"></i>
                        </button>
                    </div>

                </div>

            </div>

            <div class="video_container">

                <div class="remote_container">
                    <video class="recipients_view" id="remoteVideo" autoplay> </video>

                    <div class="timer_container">
                        <span data-timer="call_minutes">00</span>:<span data-timer="call_seconds">00</span>
                    </div>

                    <div class="recipients_view_controls">
                        <button type="button" class="btn_icon" data-btn="private_video_call_video_toggle" aria-label="">
                            <i class="icon_video-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="private_video_call_volume_toggle" aria-label="">
                            <i class="icon_volume-high-solid"></i>
                        </button>
                        <button type="button" class="btn_icon" data-btn="private_video_call_microphone_toggle" aria-label="">
                            <i class="icon_microphone-solid"></i>
                        </button>
                        <button type="button" class="btn_icon hangup_call" data-btn="private_video_call_recipient_hang_up" aria-label="">
                            <i class="icon_phone-slash-solid"></i>
                        </button>
                    </div>
                </div>

                <div class="local_container">
                    <video class="sendersView" id="localVideo" autoplay></video>
                </div>

            </div>

        </div>
        `;

    document.querySelector('body').insertAdjacentHTML("beforeend", HTMLContainer);
}

function incomingCallItemUI(callData, profileID) {
    const isSender = callData.senderData.profileID === profileID;

    const callDirection = isSender
        ? (callData.type === 'video' ? 'Outgoing video' : 'Outgoing voice')
        : (callData.type === 'video' ? 'Incoming video' : 'Incoming voice');

    const callType = callData.type === 'video' ? 'video' : 'phone';
    const userData = isSender ? callData.receiverData : callData.senderData;

    const HTMLContainer = `
        <li class="profile_element call_item" data-call_id="${callData.callID}" data-chat_id="${callData.conversationID}">
            <div class="avatar_container">
                <img src='../uploads/userAvatars/${userData.profileAvatar}' alt="Profile Avatar" aria-label="Profile Avatar">
            </div>
            <div class="content_container">
                <div class="profile_name">${userData.profileName}</div>
                <small>${callDirection} call - ${hourMinuteDateFormat(callData.createdAt)}</small>
            </div>
            <div class="buttons_container">
                <button type="button" class="btn_icon" data-btn="private_video_call" aria-label="">
                    <i class="icon_${callType}-solid"></i>
                </button>
            </div>
        </li>
    `;

    callsList.insertAdjacentHTML("beforeend", HTMLContainer);
}

function hourMinuteDateFormat(dateString) {
    const date = new Date(dateString);

    return date.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
}