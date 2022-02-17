const express = require('express');
const app = express();
const path = require('path');
const http = require('http');
const server = http.createServer(app);
const socketio = require('socket.io');
const io = socketio(server);
const { v4: uuidV4 } = require('uuid');
const formatMessage = require('./utils/message');
//const userList = document.getElementById('users');

const users = {};
//app.set('view engine', 'ejs')
//set static folder
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.redirect(`/${uuidV4()}`);
  //res.send('public/index.html');
  //console.log("ok");
});

/*app.get('/:room', (req, res) => {
  res.render('room', { roomId: req.params.room })
});*/

io.on('connection', socket => {
  //when user connects
  //users[socket.id] = name;
  //socket.emit('appear-message', formatMessage('ApplicationBot', 'Welcome to Chat'));
  socket.on('new-user', name => {
    users[socket.id] = name;
    socket.broadcast.emit('message', 'A user has joined the chat');
  });
  //when client disconnects
  socket.on('disconnect', () => {
    io.emit('message', 'A user left the chat');
    delete users[socket.id];
    //socket.broadcast.emit('user-disconnected', users[socket.id]);
    //delete users[socket.id];
  });
  //when send chat message
  socket.on('chat-message', message => {
    //socket.broadcast.emit('chat-message', { message: message, name: users[socket.id] })
    //console.log('Message:'+message);
    io.emit('appear-message', formatMessage(users[socket.id], message));
  });
});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, ()=> console.log(`Server running on port ${PORT}`));