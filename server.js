const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const { v4: uuidV4 } = require('uuid');
const formatMessage = require('./utils/message');
const {userJoin, getCurrentUser, userLeave} = require('./utils/user');

const users = {};
//peer_server
/*const { ExpressPeerServer } = require("peer");
const peerServer = ExpressPeerServer(server, {
  debug: true,
});*/

//set static folder
app.use(express.static(path.join(__dirname, 'public')));
//app.use("/peerjs", peerServer)

/*app.get('/', (req, res) => {
  console.log("ok");
});*/

io.on('connection', socket => {
  //when a user joins the room
  //socket.emit('appear-message', formatMessage('ApplicationBot', 'Welcome to Chat'));
  socket.on('join-room', ({ username, room, userid }) => {
    //save the user
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //when a new user connected
    socket.broadcast.to(user.room).emit('message', `${user.username} has joined the chat`);
    socket.broadcast.to(user.room).emit('appear-message', formatMessage('ChatBot',`${user.username} has joined the chat`));
    socket.broadcast.to(user.room).emit("user-connected", userid);

    //when a user disconnects
    socket.on('disconnect', () => {
      const user = userLeave(socket.id);
      if(user) {
        io.to(user.room).emit('message', `${user.username} has left the chat`);
        io.to(user.room).emit('appear-message', formatMessage('ChatBot',`${user.username} has left the chat`));
        socket.broadcast.to(user.room).emit("user-disconnected", userid);
      }
    });
  });
  
  //when send chat message
  socket.on('chat-message', message => {
    const user = getCurrentUser(socket.id);
    //console.log('Message:'+message);
    io.to(user.room).emit('appear-message', formatMessage(user.username, message));
    //io.emit('appear-message', formatMessage(users[socket.id], message));
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
//peerServer.listen(peerPort);