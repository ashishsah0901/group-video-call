const socket = io("/");
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const input = document.getElementById("chat_message");
const sendButton = document.getElementById("send_button");
const messages = document.getElementById("messages");
myVideo.muted = true;
document.getElementById("close_menu").hidden = true;
let myVideoStream;
const peers = {};
const myPeer = new Peer();
navigator.mediaDevices
    .getUserMedia({
        video: true,
        audio: true,
    })
    .then((stream) => {
        myVideoStream = stream;
        addVideoStream(myVideo, stream);
        myPeer.on("call", (call) => {
            call.answer(stream);
            const video = document.createElement("video");
            video.setAttribute("id", call.peer);
            call.on(
                "stream",
                (userVideoStream) => {
                    addVideoStream(video, userVideoStream);
                },
                (err) => console.error(err)
            );
        });
        socket.on("user-connected", (userId) => {
            connectToNewUser(userId, stream);
        });
        socket.on("createMessage", (message) => {
            messages.insertAdjacentHTML(
                "afterend",
                `<li class="message"><b>user</b><br/>${message}</li>`
            );
        });
        socket.on("user-disconnected", (userId) => {
            if (peers[userId]) {
                peers[userId].close();
            }
            document.getElementById(userId).remove();
        });
    });

myPeer.on("open", (id) => {
    socket.emit("join-room", ROOM_ID, id);
});

const connectToNewUser = (userId, stream) => {
    const call = myPeer.call(userId, stream);
    const video = document.createElement("video");
    video.setAttribute("id", userId);
    call.on(
        "stream",
        (userVideoStream) => {
            addVideoStream(video, userVideoStream);
        },
        (err) => {
            console.error(err);
        }
    );
    peers[userId] = call;
};

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
        video.play();
    });
    videoGrid.append(video);
};

sendButton.addEventListener("click", function (e) {
    if (input.value.length !== 0) {
        emitMessage();
    }
});

input.onkeydown = function (e) {
    if (e.key === "Enter" && input.value.length !== 0) {
        emitMessage();
    }
};

function emitMessage() {
    socket.emit("message", input.value);
    input.value = "";
}

const muteUnmute = () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getAudioTracks()[0].enabled = false;
        setUnMuteButton();
    } else {
        setMuteButton();
        myVideoStream.getAudioTracks()[0].enabled = true;
    }
};

const setUnMuteButton = () => {
    const html = `
    <i class="unmute fas fa-microphone-slash"></i>
    <span>Unmute</span>
    `;
    document.querySelector(".main_mute_button").innerHTML = html;
};

const setMuteButton = () => {
    const html = `
    <i class="fas fa-microphone"></i>
    <span>Mute</span>
    `;
    document.querySelector(".main_mute_button").innerHTML = html;
};

const playStop = () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myVideoStream.getVideoTracks()[0].enabled = false;
        setPlayVideo();
    } else {
        setStopVideo();
        myVideoStream.getVideoTracks()[0].enabled = true;
    }
};

const setPlayVideo = () => {
    const html = `
    <i class="stop fas fa-video-slash"></i>
    <span>Play Video</span>
    `;
    document.querySelector(".main_video_button").innerHTML = html;
};

const setStopVideo = () => {
    const html = `
    <i class="fas fa-video"></i>
    <span>Stop Video</span>
    `;
    document.querySelector(".main_video_button").innerHTML = html;
};

const leaveCall = () => {
    window.location.replace("http://localhost:8000");
    socket.emit("user-disconnected", myPeer.id);
};

const toggleChat = () => {
    const chat = document.getElementsByClassName("main_right")[0];
    if (chat.classList.contains("chat_closeSideMenu")) {
        chat.classList.remove("chat_closeSideMenu");
        chat.classList.add("chat_openSideMenu");
        document.getElementById("close_menu").hidden = true;
    } else {
        chat.classList.add("chat_closeSideMenu");
        chat.classList.remove("chat_openSideMenu");
        document.getElementById("close_menu").hidden = false;
    }
};
