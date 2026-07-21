FROM node:22-bookworm-slim AS builder
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/app/node_modules/.cache/puppeteer
COPY package*.json ./
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate --schema=./prisma/schema.prisma
COPY . .
RUN npm run build

FROM node:22-bookworm-slim
WORKDIR /app
ENV PUPPETEER_CACHE_DIR=/app/node_modules/.cache/puppeteer
RUN apt-get update && apt-get install -y \
  ca-certificates fonts-liberation \
  libnss3 libnspr4 libgbm1 libdrm2 \
  libxkbcommon0 libxrandr2 libxfixes3 libxdamage1 libxcomposite1 \
  libglib2.0-0 libasound2 libatk-bridge2.0-0 libatk1.0-0 \
  libcups2 libxshmfence1 libpango-1.0-0 libcairo2 \
  && rm -rf /var/lib/apt/lists/*
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/prisma ./prisma
CMD ["node", "dist/src/main.js"]
