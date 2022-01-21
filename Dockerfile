FROM node:17-alpine

WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY ./config/* ./config/
COPY ./ssl/* ./ssl/
COPY ./src/ ./src/

CMD [ "node", "./src/index.js" ]
