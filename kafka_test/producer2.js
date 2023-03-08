const { Kafka, Partitioners} = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-super-test',
    brokers: ['localhost:9092']
});

const producer = kafka.producer({ createPartitioner: Partitioners.DefaultPartitioner });

const topic = 'my-kafka-test';

async function produceMessages(urls) {
    await producer.connect();
    for (const url of urls) {
        const message = { url };
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message), partition: 0 },
            ]
        });
    }
    await producer.disconnect();
}

async function produceMessagesMED(urls) {
    await producer.connect();
    for (const url of urls) {
        const message = { url };
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message), partition: 1 },
            ]
        });
    }
    await producer.disconnect();
}

async function produceMessagesLOW(urls) {
    await producer.connect();
    for (const url of urls) {
        const message = { url };
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message), partition: 2 },
            ]
        });
    }
    await producer.disconnect();
}

// Example usage
const urls = ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'];
produceMessages(urls);
produceMessagesMED(urls);
produceMessagesLOW(urls);