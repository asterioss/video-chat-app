const socket = io();
const messageContainer = document.getElementById('chat-form-container');
const messageForm = document.getElementById('chat-form');
const messageInput = document.getElementById('message-input');
const chatMessages = document.querySelector('.chat-messages');

const name = prompt('What is your name?');
socket.emit('new-user', name);

socket.on('message', data => {
   // appendMessage(`${data.name}: ${data.message}`)
   console.log(data);
});

socket.on('appear-message', data => {
    // appendMessage(`${data.name}: ${data.message}`)
    //console.log(data);
    appendMessage(data);
});
//const name = prompt('What is your name?');
//appendMessage('You joined');
//socket.emit('new-user', name);
messageForm.addEventListener('submit', e => {
    e.preventDefault();
    const message = messageInput.value;
    console.log(message);
    //emit message to server
    socket.emit('chat-message', message);


    // Scroll down
    chatMessages.scrollTop = chatMessages.scrollHeight;
    messageInput.value = ''
});

function appendMessage(message) {
    const div = document.createElement('div');
    div.classList.add('message');
    div.innerHTML = `<p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">
      ${message.text}
    </p>`
    //div.innerText = message;
    //messageContainer.append(messageElement);
    document.querySelector('.chat-messages').appendChild(div);
}