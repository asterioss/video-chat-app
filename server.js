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

//app.set('view engine', 'ejs')
//set static folder
app.use(express.static(path.join(__dirname, 'public')));

/*app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
  //res.send('public/index.html');
  //console.log("ok");
});*/

/*app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
});*/

io.on('connection', socket => {
  //when user connects
  //users[socket.id] = name;
  //socket.emit('appear-message', formatMessage('ApplicationBot', 'Welcome to Chat'));
  socket.on('join-room', ({ username, room, userid }) => {
    //users[socket.id] = name;
    //save the user
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);
    //when a new user connected
    socket.broadcast.to(user.room).emit('message', `${user.username} has joined the chat`);
    socket.broadcast.to(user.room).emit('appear-message', formatMessage('ChatBot',`${user.username} has joined the chat`));
    socket.broadcast.to(user.room).emit("user-connected", userid);
    //socket.broadcast.emit("user-connected", name);
  });
  //when send chat message
  socket.on('chat-message', message => {
    const user = getCurrentUser(socket.id);
    //socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] })
    //console.log('Message:'+message);
    io.to(user.room).emit('appear-message', formatMessage(user.username, message));
    //io.emit('appear-message', formatMessage(users[socket.id], message));
  });
  //when client disconnects
  socket.on('disconnect', () => {
    const user = userLeave(socket.id);
    if(user) {
      io.to(user.room).emit('message', `${user.username} has left the chat`);
      io.to(user.room).emit('appear-message', formatMessage('ChatBot',`${user.username} has left the chat`));
    }
    //delete users[socket.id];
    //socket.broadcast.emit('user-disconnected', users[socket.id]);
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));
//peerServer.listen(peerPort);