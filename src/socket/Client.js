const {logger, toKafkaJsLogLevel, PinoLogCreator} = require('../log/logger'),
    {Kafka} = require('kafkajs'),
    config = require('config'),
    _ = require('lodash');

class Client {

    id;
    socket;
    kafka;
    consumers = {};

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
                case 'HIDE_CARS':
                    this.stopConsuming('car');
                    break;
                case 'SHOW_BIKES':
                    this.consume('bike');
                    break;
                case 'HIDE_BIKES':
                    this.stopConsuming('bike');
                    break;
                case 'SHOW_PEDESTRIANS':
                    this.consume('pedestrian');
                    break;
                case 'HIDE_PEDESTRIANS':
                    this.stopConsuming('pedestrian');
                    break;
            }
        });
    }

    initializeKafka() {
        this.kafka = new Kafka({
            brokers: config.brokers,
            clientId: this.id,
            logLevel: toKafkaJsLogLevel(config.app.log.kafkaLevel),
            logCreator: PinoLogCreator
        });
    }

    async consume(type) {
        let consumer = this.consumers[type];

        if (!consumer) {
            logger.info(`Creating new consumer for type ${type}`);
            consumer = this.consumers[type] = this.kafka.consumer({groupId: this.id});
        } else {
            logger.info(`Already consuming for type ${type}. Doing nothing.`);
            return;
        }
        await consumer.connect();
        await consumer.subscribe({topic: this.getTopicNameFromType(type)}); // , fromBeginning: true
        await consumer.run({
            eachMessage: async ({topic, partition, message}) => {
                const prefix = `${topic}[${partition} | ${message.offset}] / ${message.timestamp}`;
                logger.debug(`- ${prefix} ${message.key}#${message.value}`);
                this.socket.send(JSON.parse(message.value));
            },
        })
    }

    async stopConsuming(type) {
        logger.info(`Stop consuming for type ${type}. Disconnecting.`);

        await this.consumers[type]?.disconnect();
        this.consumers[type] = undefined;
    }

    getTopicNameFromType(type) {
        return 'output-topic';
    }

    disconnect() {
        const keys = _.keys(this.consumers);
        return keys.map(key => this.consumers[key]?.disconnect());
    }
}

module.exports = Client
