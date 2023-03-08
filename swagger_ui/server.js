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

io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
    });
});

http.listen(3000, () => {
    console.log('listening on *:3000');
});


// create kafka consumer
const kafka = new Kafka({
    clientId: 'my-super-test',
    brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

const topic = 'my-kafka-test'
const partition = 0
const run = async () => {
    // Consuming
    await consumer.connect()
    await consumer.subscribe({ topic: 'my-kafka-test', fromBeginning: true })

    await consumer.run({
        autoCommit: false,
        eachMessage: async ({ topic, partition, message }) => {
            console.log({
                value: message.value.toString(),
            })
            io.emit('chat message', message.value.toString());
        },
    })
}

async function countMessagesInQueue() {
    await consumer.connect()
    await consumer.subscribe({ topic: topic, fromBeginning: true })

    // ...consume messages...

    const { paused } = consumer.commi()
    console.log(`Number of messages in queue: ${paused.length}`)

    await consumer.disconnect()
}

countMessagesInQueue().catch(console.error)
