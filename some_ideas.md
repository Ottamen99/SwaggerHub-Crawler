# Ideas

## Use Kafka to create urls crawling system using queue

Produce messages: Node.js crawler can produce messages to the Kafka topic by using the Kafka API.

Consume messages: To consume messages from the topic, the crawler can use the Kafka API.

By using Kafka to manage the message queue of URLs, the crawler can handle restarts and failures gracefully. When the crawler starts up again, it can resume consuming messages from where it left off, thanks to Kafka's built-in support for managing offsets.

https://kafka.apache.org