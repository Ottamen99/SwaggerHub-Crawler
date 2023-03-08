// Connect to the Socket.io server
const socket = io();

// Send a chat message to the server
const sendButton = document.getElementById('send-button');
const messageList = document.getElementById('message-list');

sendButton.addEventListener('click', () => {
    const message = "THIS IS A SUPER MESSAGE!";
    socket.emit('chat message', message);
});

// Receive chat messages from the server
socket.on('chat message', (msg) => {
    const li = document.createElement('li');
    li.textContent = msg;
    messageList.appendChild(li);
});
