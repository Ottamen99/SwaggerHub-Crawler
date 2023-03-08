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

const countMessagesInQueue = async () => {
    await consumer.connect()
    await consumer.subscribe({ topic, fromBeginning: true })

    const position = await consumer.position({ topic, partition })
    const earliestOffsets = await consumer.queryOffsets([{ topic, partition, time: 0 }])
    const earliestOffset = earliestOffsets[topic][partition][0]
    const messageCount = position - earliestOffset

    console.log(`There are ${messageCount} messages in the queue for topic "${topic}" and partition ${partition}.`)

    await consumer.disconnect()
}

countMessagesInQueue().catch(console.error)
