FROM node:18-alpine

WORKDIR /app

COPY package.json ./
COPY package-lock.json ./

RUN npm install --fetch-timeout=600000 --network-timeout=600000

COPY server/ ./server/
COPY .env ./

EXPOSE 3001

CMD ["node", "server/index.js"]