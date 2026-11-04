FROM node:22-bookworm-slim

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --chown=node:node backend ./backend
COPY --chown=node:node src ./src

ENV NODE_ENV=production
ENV PORT=3000

USER node

EXPOSE 3000

CMD ["node", "backend/server.js"]