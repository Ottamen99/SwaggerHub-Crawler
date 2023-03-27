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

const kafkaMainConsumerConfig = {
    groupId: kafkaConfig.groupId,
    partitionsConsumedConcurrently: 1,
    topic: kafkaConfig.topic.topic,
    fromBeginning: true,
    // partitionsConsumed: [0, 1] // assign partitions 0 and 1 to this consumer
    memberAssignment: [
        {
            topic: kafkaConfig.topic.topic,
            partitions: [0, 1], // Assign partitions 0 and 1 to this consumer
        },
    ],
}

const kafkaRetryConsumerConfig = {
    groupId: kafkaConfig.groupId,
    partitionsConsumedConcurrently: 1,
    // partitionsConsumed: [2] // assign partition 2 to this consumer
    memberAssignment: [
        {
            topic: kafkaConfig.topic.topic,
            partitions: [2], // Assign partitions 0 and 1 to this consumer
        },
    ],
}

module.exports = {
    kafkaConfig,
    kafkaMainConsumerConfig,
    kafkaRetryConsumerConfig,
}