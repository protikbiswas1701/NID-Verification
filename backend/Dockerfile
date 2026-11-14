FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure storage directories exist
RUN mkdir -p private_uploads

EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000

CMD ["node", "src/server.js"]
