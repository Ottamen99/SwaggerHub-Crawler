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
    partitionsConsumed: [PRIORITIES.HIGH, PRIORITIES.MEDIUM] // assign partitions 0 and 1 to this consumer
}

const kafkaRetryConsumerConfig = {
    groupId: kafkaConfig.groupId,
    partitionsConsumedConcurrently: 1,
    topic: kafkaConfig.topic.topic,
    partitionsConsumed: [PRIORITIES.LOW] // assign partition 2 to this consumer
}

module.exports = {
    kafkaConfig,
    kafkaMainConsumerConfig,
    kafkaRetryConsumerConfig,
}