FROM node:20-alpine

WORKDIR /app

COPY package*.json tsconfig.json ./
RUN npm install --allow-git=all

COPY . .

EXPOSE 3333

CMD ["npm", "start"]
