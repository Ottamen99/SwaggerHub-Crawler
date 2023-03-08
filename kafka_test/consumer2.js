const { Kafka } = require('kafkajs');

const kafka = new Kafka({
    clientId: 'my-super-test',
    brokers: ['localhost:9092']
});

const topic = 'my-kafka-test';

const mainConsumer = kafka.consumer({
    groupId: 'my-group',
    partitionsConsumedConcurrently: 1,
    topic: topic,
    partitionsConsumed: [0, 1] // assign partitions 0 and 1 to this consumer
});

const lowPriorityConsumer = kafka.consumer({
    groupId: 'my-group',
    partitionsConsumedConcurrently: 1,
    topic: topic,
    partitionsConsumed: [2] // assign partitions 2 and 3 to this consumer
});

const startConsumers = async () => {
    await Promise.all([mainConsumer.connect(), lowPriorityConsumer.connect()]);
    console.log('[Consumers connected]');

    await Promise.all([mainConsumer.subscribe({
        topic: topic,
        fromBeginning: true,
        partitions: [0]
    }), lowPriorityConsumer.subscribe({
        topic: topic,
        fromBeginning: true,
        partitions: [2],
    })]);
    console.log('[Consumers subscribed]');

    // await Promise.all([consumeApiUrls(), retryConsumeApiUrls()]);
    await Promise.all([consumeMessagesHigh(), consumeMessagesLow()]);
}

async function consumeMessagesHigh() {
    await mainConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {
            const { url } = JSON.parse(message.value.toString());
            switch (partition) {
                case 0:
                    console.log(`----- HIGH PRIORITY -----`);
                    console.log(`Consumed message from topic ${topic} partition ${partition} with url ${url}`);
                    console.log(`-------------------------`);
                    break;
                
                case 1:
                    console.log(`----- MED PRIORITY -----`);
                    console.log(`Consumed message from topic ${topic} partition ${partition} with url ${url}`);
                    console.log(`------------------------`);
                    break;
            }
        }
    });
}

async function consumeMessagesLow() {
    await lowPriorityConsumer.run({
        eachMessage: async ({ topic, partition, message }) => {

            switch (partition) {
                case 2:
                    // do something
                    const { url } = JSON.parse(message.value.toString());
                    console.log("Waiting for 5 seconds");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    console.log(`----- LOW PRIORITY -----\nConsumed message from topic ${topic} partition ${partition} with url ${url}\n------------------------`);
                    // wait for 5 seconds
                    break;
            }
        }
    });
}

// Example usage
// consumeMessages();

startConsumers();
