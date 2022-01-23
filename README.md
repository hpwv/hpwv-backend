# Web-Server
## Introduction
This is the web server for the prototype.
It contains an Express.js https web server and a Socket.IO server, listening for connections from the hpwv.
For development and testing the project uses some self singed certificates that need to be accepted 
before testing, see section *Running*.
You can also deploy your own certificates by placing them in the ssl folder.

## Preparation
Install `docker` and `docker-compose`.

Run `docker compose build` to build the docker containers ahead of running them.

Make sure the Kafka Cluster is up and running before starting the web server, as the 
kafka network is required.

## Running
Simply run `docker compose up` if you want to see the log output in the current 
terminal session or `docker compose up -d` if you want to start it in the background.

After starting the container, open a browser, go to `https://localhost:3117/` and accept the 
certificate, as otherwise the WebSocket connection from the Frontend will fail.
After accepting the certificate, you should see a text saying `Cannot GET /` which is okay, as there
are no express endpoints implemented.

## Stopping
In order to stop the containers, run `docker compose down`.
