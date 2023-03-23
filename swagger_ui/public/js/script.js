// Connect to the Socket.io server
const socket = io();

// Send a chat message to the server
const sendButton = document.getElementById('send-button');

sendButton.addEventListener('click', () => {
    const message = "THIS IS A SUPER MESSAGE!";
    socket.emit('chat message', message);
});

// Receive chat messages from the server
socket.on('chat message', (msg) => {
    // kafkaQueue element in HTML update
    const kafkaQueue = document.getElementById('kafkaQueue');
    kafkaQueue.innerHTML = 'Number of elements in the queue: ' + msg;
});

// Receive kafka priority from the server
socket.on('priority', (msg) => {
    // kafkaQueue element in HTML update
    const highPriority = document.getElementById('highPriority');
    const mediumPriority = document.getElementById('mediumPriority');
    const lowPriority = document.getElementById('lowPriority');
    highPriority.innerHTML = 'Number of high priority elements: ' + msg.high;
    mediumPriority.innerHTML = 'Number of medium priority elements: ' + msg.medium;
    lowPriority.innerHTML = 'Number of low priority elements: ' + msg.low;
})

// Receive kafka download from the server
socket.on('download', (msg) => {
    // kafkaQueue element in HTML update
    const downloadSuccess = document.getElementById('downloadSuccess');
    const downloadFailure = document.getElementById('downloadFailure');
    downloadSuccess.innerHTML = 'Number of downloaded elements: ' + msg.success;
    downloadFailure.innerHTML = 'Number of failed elements: ' + msg.failure;
})

// Receive kafka update from the server
socket.on('update', (msg) => {
    // kafkaQueue element in HTML update
    const updateSuccess = document.getElementById('updateSuccess');
    updateSuccess.innerHTML = 'Number of updated elements: ' + msg;
})