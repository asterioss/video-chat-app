const socket = io();
const messageContainer = document.getElementById('chat-form-container');
//const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.querySelector('.chat-messages');
const VideoGroup = document.querySelector('.videos__group');
const videoGrid = document.querySelector(".video-grid");
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
let myVideoStream, screenStream;
const peers = {};
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
          addVideoStream(video, userVideoStream);
      });
    });

    socket.on("user-connected", (userid) => {
      //console.log("New user connected "+userid);
      //connectToNewUser(userid, stream);
      setTimeout(connectToNewUser, 1000, userid, stream);
    });

    socket.on('user-disconnected', userid => {
      if(peers[userid]) peers[userid].close();
    });
  });

//const name = prompt('What is your name?');
//appendMessage('You joined');
//join the room
myPeer.on('open', userid => {
  socket.emit('join-room', { username, room, userid });
});

socket.on('message', data => {
  //appendMessage(`${data.name}: ${data.message}`)
  console.log(data);
});

socket.on('appear-message', data => {
   //console.log(data);
   appendMessage(data);
});

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
  if(videoGrid) {
    videoGrid.append(video);
    //change the size of the video
    let totalUsers = document.getElementsByTagName("video").length;
    if (totalUsers > 2) {
      if(totalUsers==3) {
        for (let index = 0; index < totalUsers; index++) {
          document.getElementsByTagName("video")[index].style.width =
              90 / totalUsers + "%";
          document.getElementsByTagName("video")[index].style.height =
              90 / totalUsers + "%";
        }
      }
      else {
        for (let index = 0; index < totalUsers; index++) {
          document.getElementsByTagName("video")[index].style.width =
              100 / totalUsers + "%";
          document.getElementsByTagName("video")[index].style.height =
              100 / totalUsers + "%";
        }
      }
    }
    //VideoGroup.scrollTop = VideoGroup.scrollHeight;
  }
};

function appendMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<p class="meta" style="font-weight:600;">${message.username} <span style="float:right; font-weight:400;">${message.time}</span></p>
  <p class="text">
    ${message.text}
  </p>`
  //div.innerText = message;
  document.querySelector('.chat-messages').appendChild(div);
}

//send button in chat
const sendButton = document.querySelector("#SendButton");
if(sendButton) {
  sendButton.addEventListener('click', e => {
    e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    //emit message to server
    socket.emit('chat-message', message);

    //Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    messageInput.value = '';
  });
}

const inviteButton = document.querySelector("#inviteButton");
const muteButton = document.querySelector("#muteButton");
const stopVideo = document.querySelector("#stopVideo");
const shareButton = document.querySelector("#shareButton");

//button to mute the microphone
if(muteButton) {
  muteButton.addEventListener("click", () => {
    const enabled = myVideoStream.getAudioTracks()[0].enabled;
    if (enabled) {
      myVideoStream.getAudioTracks()[0].enabled = false;
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

//button to share screen (working for 2 people and more)
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
      screenStream = stream;

      let videoTrack = screenStream.getVideoTracks()[0];

      if(myPeer) {
          //console.log("Current Peer", currentPeer);
          var video = document.createElement("video");
          //addVideoStream(video, stream);

          let sender = currentPeer.peerConnection.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
          })
          sender.replaceTrack(videoTrack);
          screenSharing = true;

          //clicked on "Stop sharing"
          stream.getVideoTracks()[0].onended = function () {
            //console.log('geiaa');
            let video_now = myVideoStream.getVideoTracks()[0];
            let sender = currentPeer.peerConnection.getSenders().find(function (s) {
              return s.track.kind == videoTrack.kind;
            })
            //video.remove();
            sender.replaceTrack(video_now);
          };
      }
    }).catch((err) => {
      console.log("Unable to get display media" + err)
    })
  });
}