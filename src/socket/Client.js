const {logger, toKafkaJsLogLevel, PinoLogCreator} = require('../log/logger'),
    {Kafka} = require('kafkajs'),
    config = require('config');

class Client {

    id;
    socket;
    kafka;
    consumer;

    constructor(id, socket) {
        this.id = id;
        this.socket = socket;
        this.startListening();
        this.initializeKafka();
    }

    get id() {
        return this.id;
    }

    startListening() {
        this.socket.on('message', (message) => {
            logger.info(message);
            switch (message) {
                case 'SHOW_CARS':
                    this.consume('car');
                    break;
                case 'SHOW_BIKES':
                    this.consume('bike');
                    break;
                case 'SHOW_PEDESTRIANS':
                    this.consume('pedestrian');
                    break;
            }
        });
    }

    initializeKafka() {
        this.kafka = new Kafka({
            brokers: config.brokers,
            clientId: this.id,
            logLevel: toKafkaJsLogLevel(config.app.log.level),
            logCreator: PinoLogCreator
        });
        this.consumer = this.kafka.consumer({groupId: this.id});
    }

    async consume(type) {
        await this.consumer.connect();
        await this.consumer.subscribe({topic: this.getTopicNameFromType(type)}); // , fromBeginning: true
        await this.consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
                console.log(`- ${prefix} ${message.key}#${message.value}`);
                this.socket.send(JSON.parse(message.value));
            },
        })
    }

    getTopicNameFromType(type) {
        return 'output-topic';
    }

    disconnect() {
        return this.consumer.disconnect();
    }
}

module.exports = Client
