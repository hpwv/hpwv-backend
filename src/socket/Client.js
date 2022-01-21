const {logger, toKafkaJsLogLevel, PinoLogCreator} = require('../log/logger'),
    {Kafka} = require('kafkajs'),
    config = require('config'),
    _ = require('lodash'),
    {nanoid} = require('nanoid');

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
            const consumerId = nanoid();
            logger.info(`Creating new consumer for type ${type} with id ${consumerId}`);
            consumer = this.consumers[type] = this.kafka.consumer({groupId: consumerId});
        } else {
            logger.info(`Already consuming for type ${type}. Doing nothing.`);
            return;
        }
        await consumer.connect();
        await consumer.subscribe({topic: this.getTopicFromType(type)});
        await consumer.run({
            eachMessage: async ({message}) => {
                this.socket.send({
                    timestamp: message.timestamp,
                    element: JSON.parse(message.value)
                });
            },
        });
        logger.info(`Done subscribing to type ${type}.`);
    }

    async stopConsuming(type) {
        logger.info(`Stop consuming for type ${type}. Disconnecting.`);

        await this.consumers[type]?.disconnect();
        this.consumers[type] = undefined;
    }

    getTopicFromType(type) {
        return `${type}-updates`;
    }

    disconnect() {
        return Promise.all(_.values(this.consumers).map(it => it?.disconnect()));
    }
}

module.exports = Client
