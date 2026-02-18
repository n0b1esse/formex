#!/usr/bin/env node
/**
 * Formex Realtime — WebSocket + Redis Pub/Sub
 *
 * 1. Принимает webhook от Directus Flow при сохранении записей
 * 2. Публикует событие в Redis
 * 3. Подписывается на Redis и транслирует подключённым клиентам
 *
 * Запуск: node server.mjs
 * Env: PORT, REDIS_URL
 */
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createClient } from 'redis';
import express from 'express';

const PORT = parseInt(process.env.PORT || '3001', 10);
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = process.env.REDIS_CHANNEL || 'formex:content-updates';

const app = express();
app.use(express.json({ limit: '64kb' }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: true, // для dev; в production указать конкретные домены
    methods: ['GET'],
  },
  transports: ['websocket', 'polling'],
});

// Redis: publisher (для webhook) и subscriber (для broadcast)
let redisPub, redisSub;

async function connectRedis() {
  redisPub = createClient({ url: REDIS_URL });
  redisSub = redisPub.duplicate();
  redisPub.on('error', (e) => console.error('Redis pub error:', e.message));
  redisSub.on('error', (e) => console.error('Redis sub error:', e.message));
  await redisPub.connect();
  await redisSub.connect();
  await redisSub.subscribe(CHANNEL, (message) => {
    try {
      const payload = JSON.parse(message);
      io.emit('content:update', payload);
    } catch (e) {
      console.warn('Redis message parse:', e.message);
    }
  });
  console.log('Redis connected, subscribed to', CHANNEL);
}

// Webhook: Directus Flow вызывает POST /webhook
app.post('/webhook', async (req, res) => {
  res.status(202).end();
  const payload = req.body || {};
  const collection = payload.collection || payload.payload?.collection || 'unknown';
  const event = payload.event || payload.type || payload.payload?.action || 'update';
  const data = {
    collection,
    event,
    timestamp: new Date().toISOString(),
    keys: payload.keys ?? payload.payload?.keys ?? [],
  };
  try {
    if (redisPub) {
      await redisPub.publish(CHANNEL, JSON.stringify(data));
    }
    io.emit('content:update', data);
  } catch (e) {
    console.error('Publish error:', e.message);
  }
});

// Health
app.get('/health', (_, res) => res.json({ status: 'ok', redis: !!redisPub }));

io.on('connection', (socket) => {
  socket.emit('content:update', { type: 'connected' });
});

httpServer.listen(PORT, async () => {
  try {
    await connectRedis();
  } catch (e) {
    console.error('Redis connect failed:', e.message);
    process.exit(1);
  }
  console.log(`Formex Realtime: http://localhost:${PORT}, WebSocket ready`);
});
