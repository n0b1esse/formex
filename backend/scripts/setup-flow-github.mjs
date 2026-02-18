#!/usr/bin/env node
/**
 * Formex — настройка Directus Flow: при сохранении контента → триггер экспорта в GitHub.
 *
 * Создаёт Flow с Event Hook (items.create, items.update) и операцией
 * "Webhook" — POST на GitHub repository_dispatch.
 *
 * Запуск: GITHUB_PAT=xxx GITHUB_REPO=owner/repo node scripts/setup-flow-github.mjs
 *
 * Требует: DIRECTUS_URL, DIRECTUS_ADMIN_TOKEN (или email/password), GITHUB_PAT, GITHUB_REPO
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
const GITHUB_PAT = process.env.GITHUB_PAT;
const GITHUB_REPO = process.env.GITHUB_REPO || 'n0b1esse/formex';

if (!GITHUB_PAT) {
  console.error('Задайте GITHUB_PAT (Personal Access Token с scope repo)');
  process.exit(1);
}

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

// Коллекции контента — при изменении триггерим экспорт
const CONTENT_COLLECTIONS = [
  'formex_hero', 'formex_about_block', 'formex_catalog_block', 'formex_production_block',
  'formex_projects_block', 'formex_contacts_block', 'formex_dealer_block',
  'formex_pages', 'formex_settings', 'formex_translations',
  'formex_projects', 'formex_catalog_categories', 'formex_reviews', 'formex_certificates', 'formex_production_steps',
];

async function main() {
  console.log('Настройка Flow: Directus → GitHub export при сохранении');
  console.log('Repo:', GITHUB_REPO, '\n');

  await ensureAuth();
  await api('/users/me');
  console.log('Подключение OK');

  // Проверяем существующие flows
  const flowsRes = await api('/flows?filter[name][_eq]=Formex: Export to GitHub');
  const existing = flowsRes?.data?.[0];
  if (existing) {
    console.log('Flow уже существует. Удаляем и пересоздаём...');
    await api(`/flows/${existing.id}`, 'DELETE');
  }

  // 1. Создаём операцию Request URL (POST на GitHub)
  const webhookOp = await api('/operations', 'POST', {
    name: 'Trigger GitHub Export',
    key: 'trigger_github',
    type: 'request',
    position_x: 200,
    position_y: 0,
    options: {
      method: 'POST',
      url: `https://api.github.com/repos/${GITHUB_REPO}/dispatches`,
      headers: [
        { header: 'Authorization', value: `token ${GITHUB_PAT}` },
        { header: 'Accept', value: 'application/vnd.github.v3+json' },
      ],
      body: '{"event_type":"directus-update"}',
    },
  });
  const opData = webhookOp?.data;
  const opId = Array.isArray(opData) ? opData[0]?.id : opData?.id;
  if (!opId) throw new Error('Не удалось создать операцию: ' + JSON.stringify(webhookOp));

  // 2. Создаём Flow с Event Hook
  const flowPayload = {
    name: 'Formex: Export to GitHub',
    icon: 'published_with_changes',
    color: '#6644FF',
    status: 'active',
    trigger: 'event_hook',
    accountability: 'all',
    options: {
      type: 'action',
      scope: ['items.create', 'items.update'],
      collections: CONTENT_COLLECTIONS,
    },
    operation: opId,
  };

  const flowRes = await api('/flows', 'POST', flowPayload);
  const flowId = Array.isArray(flowRes?.data) ? flowRes.data[0].id : flowRes?.data?.id;
  if (!flowId) throw new Error('Не удалось создать Flow: ' + JSON.stringify(flowRes));

  console.log('\nFlow создан. При сохранении записей в коллекциях formex_* будет отправляться запрос в GitHub.');
  console.log('GitHub Action export-content обработает event_type=directus-update и обновит репозиторий.');
  console.log('\nПроверка: сохраните любую запись в Directus → через 1–2 мин сайт обновится.');
}

main().catch((e) => {
  console.error('Ошибка:', e.message);
  process.exit(1);
});
