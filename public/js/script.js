const socket = io();
const messageContainer = document.getElementById('chat-form-container');
//const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.querySelector('.chat-messages');
const videoGrid = document.getElementById("video-grid");
const myVideo = document.createElement("video");
const showChat = document.querySelector("#showChat");
const backBtn = document.querySelector(".header__back");

//creating a peer element which represents the current user
//const peer = new Peer({host:'peerjs-server.herokuapp.com', secure:true, port:443});
//peerjs --port 9000
const myPeer = new Peer(undefined, {
  host: 'localhost',
  port: '9000',
  config: {
    //'iceTransportPolicy': "relay",
    'iceServers': [
      {
        urls: "stun:vc.example.com:3478"
       },
       {
        urls: "turn:vc.example.com:3478",
        username: "coturnUser",
        credential: "coturnUserPassword"
       }
    ]
  }
  //path: '/peerjs'
  //secure: true
});

myVideo.muted = true;
let myVideoStream;
const peers = {};
var peerList = [];
var currentPeer = null;

//get username and room from URL
const { username, room } = Qs.parse(location.search, {
  ignoreQueryPrefix: true,
});

navigator.mediaDevices
  .getUserMedia({
    audio: true,
    video: true,
  })
  .then((stream) => {
    myVideoStream = stream;
    addVideoStream(myVideo, stream);

    myPeer.on("call", (call) => {
      //console.log('skata');
      call.answer(stream);
      const video = document.createElement("video");
      currentPeer = call;

      call.on("stream", (userVideoStream) => {
        if(!peerList.includes(call.peer)) {
          addVideoStream(video, userVideoStream);
          peerList.push(call.peer);
        }
      });
    });

    socket.on("user-connected", (userid) => {
      console.log("New user connected "+userid);
      connectToNewUser(userid, stream);
    });

    socket.on('user-disconnected', userid => {
      if(peers[userid]) peers[userid].close();
    });
  });

/*myPeer.on("call", function (call) {
    getUserMedia(
        { video: true, audio: true },
        function (stream) {
            currentPeer = call;
            call.answer(stream); // Answer the call with stream.
            console.log("Init window stream with stream")
            const video = document.createElement("video");
            call.on("stream", function (remoteStream) {
                if (!peerList.includes(call.peer)) {
                    addVideoStream(video, remoteStream);
                    peerList.push(call.peer);
                }
            });
        },
        function (err) {
            console.log("Failed to get local stream", err);
        }
    );
});*/
//const name = prompt('What is your name?');
//join the room
myPeer.on('open', userid => {
  socket.emit('join-room', { username, room, userid });
});

/*socket.on("disconnect", function () {
  socket.emit("leave-room", ROOM_ID, currentUserId);
  video.remove();
});*/

socket.on('message', data => {
  // appendMessage(`${data.name}: ${data.message}`)
  console.log(data);
});

socket.on('appear-message', data => {
   // appendMessage(`${data.name}: ${data.message}`)
   //console.log(data);
   appendMessage(data);
});
//socket.emit('new-user', name);

//const name = prompt('What is your name?');
//appendMessage('You joined');
//socket.emit('new-user', name);
/*function button_call() {
  e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    //emit message to server
    socket.emit('chat-message', message);


    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
  messageInput.value = '';
}*/

//send button in chat
const sendButton = document.querySelector("#SendButton");
if(sendButton) {
  sendButton.addEventListener('click', e => {
    e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    //emit message to server
    socket.emit('chat-message', message);


    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    messageInput.value = '';
  });
}

const connectToNewUser = (userid, stream) => {
    const call = myPeer.call(userid, stream);
    currentPeer = call;
    const video = document.createElement("video");
    call.on("stream", (userVideoStream) => {
      addVideoStream(video, userVideoStream);
    });
    call.on('close', () => {
      video.remove();
    });
    peers[userid] = call;
};

const addVideoStream = (video, stream) => {
    video.srcObject = stream;
    video.addEventListener("loadedmetadata", () => {
      video.play();
    });
    if(videoGrid) videoGrid.append(video);
};

function appendMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta" style="font-weight:600;">${message.username} <span style="float:right; font-weight:400;">${message.time}</span></p>
    <p class="text">
      ${message.text}
    </p>`
    //div.innerText = message;
    //messageContainer.append(messageElement);
    document.querySelector('.chat-messages').appendChild(div);
}

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");

//button to mute the microphone
if(muteButton) {
  muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
      //myVideoStream.muted = true;
      html = `<i class="fas fa-microphone-slash"></i>`;
      muteButton.classList.toggle("background__red");
      muteButton.innerHTML = html;
    } else {
      myVideoStream.getAudioTracks()[0].enabled = true;
      html = `<i class="fas fa-microphone"></i>`;
      muteButton.classList.toggle("background__red");
      muteButton.innerHTML = html;
    }
  });
}

//button to stop the video
if(stopVideo) {
  stopVideo.addEventListener("click", () => {
    const enabled = myVideoStream.getVideoTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getVideoTracks()[0].enabled = false;
      html = `<i class="fas fa-video-slash"></i>`;
      stopVideo.classList.toggle("background__red");
      stopVideo.innerHTML = html;
    } else {
      myVideoStream.getVideoTracks()[0].enabled = true;
      html = `<i class="fas fa-video"></i>`;
      stopVideo.classList.toggle("background__red");
      stopVideo.innerHTML = html;
    }
  });
}

//button to invite someone
if(inviteButton) {
  inviteButton.addEventListener("click", (e) => {
    prompt(
      "Copy this link and send it to people you want to meet with",
      //window.location.href
      'http://localhost:3000'
    );
  });
}

//button to share screen
if(shareButton) {
  shareButton.addEventListener("click", (e) => {
    navigator.mediaDevices.getDisplayMedia({
      video: {
          cursor: "always"
      },
      audio: {
          echoCancellation: true,
          noiseSuppression: true
      }
    }).then((stream) => {
      const screenStream = stream;
      //window.stream = stream;

      let videoTrack = screenStream.getVideoTracks()[0];

      if(myPeer) {
          console.log("Current Peer", currentPeer);
          var video = document.createElement("video");
          addVideoStream(video, stream);

          let sender = currentPeer.peerConnection.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
          })
          sender.replaceTrack(videoTrack);
          screenSharing = true;
      }
    }).catch((err) => {
      console.log("Unable to get display media" + err)
    })
  });
}
