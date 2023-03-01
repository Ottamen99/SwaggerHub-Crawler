// Kafka config
const PRIORITIES = {
    HIGH: 0,
    MEDIUM: 1,
    LOW: 2
}

exports.kafkaConfig = {
    clientId: 'my-super-test',
    brokers: ['localhost:9092'],
    groupId: 'my-group',
    priorities: PRIORITIES,
    topic: {
        topic: 'my-kafka-test',
        numPartitions: Object.keys(PRIORITIES).length,
    }
};