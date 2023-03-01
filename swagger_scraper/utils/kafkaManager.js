const { Kafka } = require('kafkajs');
const config = require("../config/config");

const kafka = new Kafka({
    clientId: config.kafkaConfig.clientId,
    brokers: config.kafkaConfig.brokers
});

const setupKafka = async (createTopic) => {
    const admin = kafka.admin();
    await admin.connect();

    if (createTopic) {
        let isCreated = await admin.createTopics({
            topics: [config.kafkaConfig.topic],
            waitForLeaders: true
        });
        let retries = 0;
        while (!isCreated) {
            // delete and retry
            if (retries > 5) {
                console.error(`[kafkaManager.setupKafka] Failed to create topic ${config.kafkaConfig.topic.topic}`);
                process.exit(1);
            }
            await admin.deleteTopics({
                topics: [config.kafkaConfig.topic.topic]
            })
            await new Promise(resolve => setTimeout(resolve, 1000));
            isCreated = await admin.createTopics({
                topics: [config.kafkaConfig.topic],
                waitForLeaders: true
            });
            retries++;
        }
    }
}

const logTopics = async () => {
    let admin = kafka.admin();
    await admin.connect();
    const topicMetadata = await admin.fetchTopicMetadata();
    console.log('Topics:');
    topicMetadata.topics.forEach(topic => {
        console.log(`  ${topic.name} (${topic.partitions.length} partitions)`);
    });
    await admin.disconnect();
}

const describeCluster = async () => {
    let admin = kafka.admin();
    await admin.connect();
    const clusterMetadata = await admin.describeCluster();
    console.log('Cluster:');
    console.log(`  Broker count: ${clusterMetadata.brokers.length}`);
    console.log(`  Controller ID: ${clusterMetadata.controller}`);
    console.log(`  Cluster ID: ${clusterMetadata.clusterId}`);
    await admin.disconnect();
}

const getProducer = async () => {
    return kafka.producer();
}

const getAdmin = async () => {
    return kafka.admin();
}

module.exports = {
    setupKafka,
    getProducer,
    logTopics,
    describeCluster
}
