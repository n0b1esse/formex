FROM node:20-alpine
WORKDIR /app
COPY realtime/package.json ./
RUN npm install --omit=dev
COPY realtime/*.mjs ./
EXPOSE 3001
CMD ["node", "server.mjs"]
