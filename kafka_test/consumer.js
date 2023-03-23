const { Kafka } = require('./kafkajs');

const kafka = new Kafka({
    clientId: 'my-super-test',
    brokers: ['localhost:9092']
});

const consumer = kafka.consumer({ groupId: 'my-group' });

const topic = 'my-kafka-test';

async function consumeMessages() {
    await consumer.connect();
    await consumer.subscribe({ topic, fromBeginning: true });
    await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { url } = JSON.parse(message.value.toString());
            console.log(`Consumed message from topic ${topic} partition ${partition} with url ${url}`);
        }
    });
}

// Example usage
consumeMessages();
