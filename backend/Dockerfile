FROM node:20-bullseye-slim

WORKDIR /app

# Install standard dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
RUN npm ci --omit=dev

COPY . .

# Ensure storage directories exist
RUN mkdir -p private_uploads

EXPOSE 5000

ENV NODE_ENV=production \
    PORT=5000

CMD ["node", "src/server.js"]
