FROM node:21
WORKDIR /spotify-thing/
COPY public/ ./public
COPY src/ ./src
COPY package*.json ./
RUN npm install
CMD ["npm", "start"]