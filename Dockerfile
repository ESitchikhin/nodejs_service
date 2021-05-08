FROM node:12
ENV NODE_ENV=production
RUN mkdir -p /app
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
EXPOSE 8000
CMD ["node", "index.js"]
