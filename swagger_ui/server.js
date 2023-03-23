const express = require('express');
const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const { Kafka } = require('kafkajs');

// set public folder
app.use(express.static(__dirname + '/public'));

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

let messageCounter = 0;

let highPriorityCounter = 0;
let mediumPriorityCounter = 0;
let lowPriorityCounter = 0;

let downloadSuccessCounter = 0;
let downloadFailureCounter = 0;
let updateSuccessCounter = 0;

io.on('connection', (socket) => {
    // console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
    socket.on('disconnect', () => {
        // console.log('user disconnected');
    });
    socket.on('kafka queue', (msg, callback) => {
       if (msg === 'decrease') {
              messageCounter--;
       } else if (msg === 'increase') {
              messageCounter++;
       }
         callback({success: "yes"});
        io.emit('chat message', messageCounter);
    });

    socket.on('kafka priority', (msg, callback) => {
        let currCounter = 0;
        if (msg.action === 'increase') {
            currCounter++;
        } else if (msg.action === 'decrease') {
            currCounter--;
        }
        switch (msg.priority) {
            case 'high':
                highPriorityCounter += currCounter;
                break;
            case 'medium':
                mediumPriorityCounter += currCounter;
                break;
            case 'low':
                lowPriorityCounter += currCounter;
                break;
        }
        callback({success: "yes"});
        io.emit('priority', {
            high: highPriorityCounter,
            medium: mediumPriorityCounter,
            low: lowPriorityCounter
        });
    })


    socket.on('kafka download', (msg, callback) => {
        if (msg === 'success') {
            downloadSuccessCounter++;
        } else if (msg === 'failure') {
            downloadFailureCounter++;
        }
        callback({success: "yes"});
        io.emit('download', {
            success: downloadSuccessCounter,
            failure: downloadFailureCounter
        });
    })
    socket.on('kafka update', (msg, callback) => {
        updateSuccessCounter++;
        callback({success: "yes"});
        io.emit('update', updateSuccessCounter);
    })
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});

