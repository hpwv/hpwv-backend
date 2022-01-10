const pino = require('pino'),
    expressPino = require('express-pino-logger'),
    config = require('config'),
    {logLevel} = require('kafkajs');

const logger = pino({
        level: config.app.log.level || 'info',
        transport: {
            target: config.app.log.prettyPrint ? 'pino-pretty' : 'pino/file'
        }
    }),
    expressLogger = expressPino({logger});

const toPinoLogLevel = level => {
    switch (level) {
        case logLevel.ERROR:
        case logLevel.NOTHING:
            return 'error'
        case logLevel.WARN:
            return 'warn'
        case logLevel.INFO:
            return 'info'
        case logLevel.DEBUG:
            return 'debug'
    }
}

const toKafkaJsLogLevel = level => {
    switch (level) {
        case 'error':
            return logLevel.ERROR;
        case 'warn':
            return logLevel.WARN;
        case 'info':
            return logLevel.INFO;
        case 'debug':
            return logLevel.DEBUG;
    }
}

const PinoLogCreator = () => {
    return ({namespace, level, label, log}) => {
        const {message, ...extra} = log;
        logger[toPinoLogLevel(level)]({
            message,
            extra,
        });
    };
}

module.exports = {
    logger,
    expressLogger,
    toKafkaJsLogLevel,
    PinoLogCreator
};
