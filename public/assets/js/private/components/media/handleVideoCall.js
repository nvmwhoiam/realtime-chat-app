'use strict'

import socket from '../../../socket/socketManager.js'; // Adjust the path as needed

export function handleVideoCallButton(conversationID) {
    socket.emit("videoCallPrivate", conversationID);
    console.log('Video Call Button Clicked. Conversation ID:', conversationID);
}

socket.on("videoCallPrivateFeedback", (conversationID) => {
    console.log(conversationID);
});

socket.on("videoCallCancelPrivateFeedback", (conversationID) => {
    console.log(conversationID);
});

socket.on("videoCallAcceptPrivateFeedback", (conversationID) => {
    console.log(conversationID);
});

// const cancelVideoCall = document.querySelector('[data-btn="videoCallCancel"]');
// const acceptVideoCall = document.querySelector('[data-btn="videoCallAccept"]');

// cancelVideoCall.addEventListener('click', function () {
//     const parentElement = this.closest('.video_call');
//     const conversationID = parentElement.getAttribute('data-conversation_id');

//     parentElement.remove();

//     socket.emit("videoCallCancelPrivate", conversationID);
// });

// acceptVideoCall.addEventListener('click', function () {
//     const parentElement = this.closest('.video_call');
//     const conversationID = parentElement.getAttribute('data-conversation_id');

//     setVideoMode();

//     socket.emit("videoCallAcceptPrivate", conversationID);
// });

// document.addEventListener('click', setVideoMode);

function setVideoMode() {
    const parentElement = document.querySelector('.video_call');
    const isVideoMode = parentElement.getAttribute('data-mode') === 'videoMode';

    if (isVideoMode) {
        parentElement.setAttribute('data-mode', 'dialMode');
    } else {
        parentElement.setAttribute('data-mode', 'videoMode');
    }

    // requestVideoStream();
}

// camera.js
function requestVideoStream() {
    const localVideo = document.getElementById('localVideo');
    const remoteVideo = document.getElementById('remoteVideo');

    // Check if getUserMedia is supported
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Request access to the camera
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(function (stream) {
                // Set the video element's source to the camera stream
                localVideo.srcObject = stream;
                localVideo.play();

                // remoteVideo.srcObject = stream;
                // remoteVideo.play();

                const mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });

                mediaRecorder.ondataavailable = function (event) {
                    if (event.data.size > 0) {
                        socket.emit('video-stream', event.data);
                    }
                };

                mediaRecorder.start(100); // Send data every 100ms

            })
            .catch(function (error) {
                console.error("Error accessing the camera: ", error);
            });
    } else {
        console.error("getUserMedia is not supported by this browser.");
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

const toggleVideo = document.querySelector('[data-btn="toggleVideo"]');
const toggleVolume = document.querySelector('[data-btn="toggleVolume"]');
const toggleMicrophone = document.querySelector('[data-btn="toggleMicrophone"]');
const hangUpCall = document.querySelector('[data-btn="hangup_call"]');

// toggleVideo.addEventListener('click', handleToggleVideo);
// toggleVolume.addEventListener('click', handleToggleVolume);
// toggleMicrophone.addEventListener('click', handleToggleMicrophone);
// hangUpCall.addEventListener('click', handleHangUpCall);

function handleToggleVideo() {
    const parentElement = this.querySelector('i');
    const isVideoSolid = parentElement.className === 'icon_video-solid';

    if (isVideoSolid) {
        parentElement.classList.replace('icon_video-solid', 'icon_video-slash-solid');
    } else {
        parentElement.classList.replace('icon_video-slash-solid', 'icon_video-solid');
    }
}
function handleToggleVolume() {
    const parentElement = this.querySelector('i');
    const isVideoSolid = parentElement.className === 'icon_volume-high-solid';

    if (isVideoSolid) {
        parentElement.classList.replace('icon_volume-high-solid', 'icon_volume-xmark-solid');
    } else {
        parentElement.classList.replace('icon_volume-xmark-solid', 'icon_volume-high-solid');
    }
}
function handleToggleMicrophone() {
    const parentElement = this.querySelector('i');
    const isVideoSolid = parentElement.className === 'icon_microphone-solid';

    if (isVideoSolid) {
        parentElement.classList.replace('icon_microphone-solid', 'icon_microphone-slash-solid');
    } else {
        parentElement.classList.replace('icon_microphone-slash-solid', 'icon_microphone-solid');
    }
}
function handleHangUpCall() {
    const parentElement = this.closest('.video_call');

    parentElement.remove();
}