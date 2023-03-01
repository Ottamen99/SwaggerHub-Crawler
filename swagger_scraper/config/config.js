// Kafka config
const PRIORITIES = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

const kafkaConfig = {
    clientId: 'my-super-test',
    brokers: ['localhost:9092'],
    groupId: 'my-group',
    priorities: PRIORITIES,
    topic: {
        topic: 'my-kafka-test',
        numPartitions: Object.keys(PRIORITIES).length,
    }
};

const kafkaConsumerConfig = {
    groupId: kafkaConfig.groupId,
    maxInFlightRequests: 1,
    maxMessagesPerBatch: 1, // Consume 1 messages per batch
    autoCommitInterval: 3000, // Automatically commit messages every 3 seconds
}

module.exports = {
    kafkaConfig,
    kafkaConsumerConfig
}