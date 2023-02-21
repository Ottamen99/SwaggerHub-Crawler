To start kafka server `brew services start kafka`

To start zookeeper server `brew services start zookeeper`

To stop kafka server `brew services stop kafka`

To stop zookeeper server `brew services stop zookeeper`

To check kafka server status `brew services list`

To create a topic `kafka-topics --create --bootstrap-server localhost:9092 --replication-factor 1 --partitions 1 --topic my-kafka-test`