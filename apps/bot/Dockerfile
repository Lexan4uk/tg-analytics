FROM node:20-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
COPY apps/bot/package.json ./apps/bot/package.json

RUN npm ci

FROM node:20-alpine AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

WORKDIR /app/apps/bot
RUN npm run build

FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production

COPY --from=build /app/apps/bot/dist ./dist
COPY --from=build /app/apps/bot/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules

EXPOSE 3001
CMD ["node", "dist/index.js"]
