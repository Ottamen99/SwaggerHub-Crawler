const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-crawler',
    brokers: ['localhost:9092']
});

const producer = kafka.producer();

const topic = 'my-kafka-test';

async function produceMessages(urls) {
    await producer.connect();
    for (const url of urls) {
        const message = { url };
        await producer.send({
            topic,
            messages: [
                { value: JSON.stringify(message) }
            ]
        });
    }
    await producer.disconnect();
}

// Example usage
const urls = ['https://example.com/page1', 'https://example.com/page2', 'https://example.com/page3'];
produceMessages(urls);
