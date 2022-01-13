const {Server} = require('socket.io'),
    Client = require('./Client'),
    {nanoid} = require('nanoid'),
    {logger} = require('../log/logger');

let io,
    clients = new Set();

const initializeSocketIo = (server) => {
    io = new Server(server);

    io.on('connection', (socket) => {
        const client = new Client(nanoid(), socket)
        clients.add(client);
        logger.info(`Client with id ${client.id} connected.`);

        socket.on('disconnect', async (reason) => {
            logger.info(`Client with id ${client.id} disconnected, reason: ${reason}`);
            await client.disconnect();
            clients.delete(client);
        });
    });
}

const closeAllClientConnections = async () => {
    return Promise.all(Array.from(clients).map(it => it.disconnect()));
}

module.exports = {
    initializeSocketIo,
    closeAllClientConnections
}
