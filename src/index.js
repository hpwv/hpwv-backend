const express = require('express'),
    cors = require('cors'),
    {logger, expressLogger} = require('./log/logger'),
    config = require('config'),
    helmet = require('helmet'),
    {handleError} = require('./helper/error'),
    fs = require('fs'),
    path = require('path'),
    https = require('https'),
    {initializeSocketIo, closeAllClientConnections} = require('./socket/handler');

const app = express();
app.use(cors());
app.use(express.json());
app.use(expressLogger);
app.use(helmet());
app.use((err, req, res, next) => {
    handleError(err, res);
});

const server = https.createServer({
        key: fs.readFileSync(path.join(__dirname, config.ssl.key)),
        cert: fs.readFileSync(path.join(__dirname, config.ssl.cert))
    },
    app
).listen(config.app.port, () => {
    logger.info(`Server running on port ${config.app.port}`);
});

initializeSocketIo(server);

const errorTypes = ['unhandledRejection', 'uncaughtException'],
    signalTraps = ['SIGTERM', 'SIGINT', 'SIGUSR2'];

errorTypes.map(type => {
    process.on(type, async e => {
        try {
            logger.info(`process.on ${type}`);
            logger.error(e);
            await closeAllClientConnections();
            process.exit(0);
        } catch (_) {
            process.exit(1);
        }
    })
})

signalTraps.map(type => {
    process.once(type, async () => {
        try {
            await closeAllClientConnections();
        } finally {
            process.kill(process.pid, type);
        }
    })
})

module.exports = app;
