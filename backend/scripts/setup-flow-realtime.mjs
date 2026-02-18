#!/usr/bin/env node
/**
 * Formex — Flow для real-time: при сохранении контента → webhook на realtime-сервис.
 * Realtime публикует в Redis и транслирует по WebSocket подключённым клиентам.
 *
 * Запуск: node scripts/setup-flow-realtime.mjs
 * Env: DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN, REALTIME_WEBHOOK_URL (по умолчанию http://realtime:3001/webhook для Docker)
 */
import { readFileSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env');
if (existsSync(envPath)) {
  for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m && !process.env[m[1].trim()]) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  }
}

const BASE = process.env.DIRECTUS_URL || 'http://localhost:8055';
let TOKEN = process.env.DIRECTUS_ADMIN_TOKEN;
const EMAIL = process.env.DIRECTUS_ADMIN_EMAIL || 'admin@formex.kg';
const PASSWORD = process.env.DIRECTUS_ADMIN_PASSWORD || 'admin';
const REALTIME_URL = process.env.REALTIME_WEBHOOK_URL || 'http://realtime:3001/webhook';

let headers = { 'Content-Type': 'application/json' };
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

const api = async (path, method = 'GET', body) => {
  const r = await fetch(`${BASE.replace(/\/$/, '')}${path}`, { method, headers: { ...headers }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

async function ensureAuth() {
  if (TOKEN) return;
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!r.ok) throw new Error('Вход не удался');
  const data = await r.json();
  TOKEN = data.data?.access_token;
  if (!TOKEN) throw new Error('Не получен access_token');
  headers.Authorization = `Bearer ${TOKEN}`;
}

const CONTENT_COLLECTIONS = [
  'formex_hero', 'formex_about_block', 'formex_catalog_block', 'formex_production_block',
  'formex_projects_block', 'formex_contacts_block', 'formex_dealer_block',
  'formex_pages', 'formex_settings', 'formex_translations',
  'formex_projects', 'formex_catalog_categories', 'formex_reviews', 'formex_certificates', 'formex_production_steps',
];

async function main() {
  console.log('Настройка Flow: Directus → Realtime webhook при сохранении');
  console.log('URL:', REALTIME_URL, '\n');

  await ensureAuth();
  await api('/users/me');
  console.log('Подключение OK');

  const flowsRes = await api('/flows?filter[name][_eq]=Formex: Realtime Broadcast');
  const existing = flowsRes?.data?.[0];
  if (existing) {
    console.log('Flow уже существует. Удаляем и пересоздаём...');
    await api(`/flows/${existing.id}`, 'DELETE');
  }

  // Directus 11: операция требует flow — создаём flow первым
  const flowRes = await api('/flows', 'POST', {
    name: 'Formex: Realtime Broadcast',
    icon: 'bolt',
    color: '#00AA88',
    status: 'active',
    trigger: 'event_hook',
    accountability: 'all',
    options: {
      type: 'action',
      scope: ['items.create', 'items.update', 'items.delete'],
      collections: CONTENT_COLLECTIONS,
    },
  });
  const flowData = flowRes?.data;
  const flowId = Array.isArray(flowData) ? flowData[0]?.id : flowData?.id;
  if (!flowId) throw new Error('Не удалось создать Flow: ' + JSON.stringify(flowRes));

  const webhookOp = await api('/operations', 'POST', {
    flow: flowId,
    name: 'Notify Realtime',
    key: 'notify_realtime',
    type: 'request',
    position_x: 200,
    position_y: 0,
    options: {
      method: 'POST',
      url: REALTIME_URL,
      headers: [{ header: 'Content-Type', value: 'application/json' }],
      body: '{"source":"directus"}',
    },
  });
  const opData = webhookOp?.data;
  const opId = Array.isArray(opData) ? opData[0]?.id : opData?.id;
  if (!opId) throw new Error('Не удалось создать операцию: ' + JSON.stringify(webhookOp));

  await api(`/flows/${flowId}`, 'PATCH', { operation: opId });

  console.log('\nFlow создан. При сохранении записей formex_* → webhook → Redis Pub/Sub → WebSocket клиенты.');
}

main().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
