#!/usr/bin/env node
/**
 * Миграция данных из formex_index_blocks в типизированные коллекции.
 * Запуск: cd backend && node scripts/migrate-index-blocks-to-typed.mjs
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

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

if (!TOKEN && (!EMAIL || !PASSWORD)) {
  console.error('Задайте DIRECTUS_ADMIN_TOKEN или email/пароль в .env');
  process.exit(1);
}

let headers = { 'Content-Type': 'application/json' };
if (TOKEN) headers.Authorization = `Bearer ${TOKEN}`;

const api = async (path, method = 'GET', body) => {
  const r = await fetch(`${BASE}${path}`, { method, headers: { ...headers }, body: body ? JSON.stringify(body) : undefined });
  if (!r.ok) throw new Error(`${method} ${path}: ${r.status} ${await r.text()}`);
  return r.status === 204 ? null : r.json();
};

async function ensureAuth() {
  if (TOKEN) return;
  const r = await fetch(`${BASE}/auth/login`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: EMAIL, password: PASSWORD }) });
  if (!r.ok) throw new Error('Вход не удался');
  const data = await r.json();
  TOKEN = data.data?.access_token;
  if (!TOKEN) throw new Error('Не получен access_token');
  headers.Authorization = `Bearer ${TOKEN}`;
}

async function main() {
  console.log('Миграция formex_index_blocks → типизированные коллекции\n');
  await ensureAuth();

  const blocks = (await api(`/items/formex_index_blocks?sort=sort&fields=block_id,lang,content`)).data || [];
  if (blocks.length === 0) {
    console.log('Нет данных в formex_index_blocks.');
    return;
  }

  const map = { hero: 'formex_hero', about: 'formex_about_block', catalog: 'formex_catalog_block', production: 'formex_production_block', projects: 'formex_projects_block', contacts: 'formex_contacts_block', dealer: 'formex_dealer_block' };

  for (const b of blocks) {
    if (!b.content || !map[b.block_id]) continue;
    const coll = map[b.block_id];
    const c = b.content;
    let item = { lang: b.lang, ...c };
    try {
      const existing = (await api(`/items/${coll}?filter[lang][_eq]=${b.lang}&limit=1`)).data?.[0];
      if (existing) {
        await api(`/items/${coll}/${existing.id}`, 'PATCH', item);
        console.log('Обновлено:', coll, b.lang);
      } else {
        await api(`/items/${coll}`, 'POST', item);
        console.log('Создано:', coll, b.lang);
      }
    } catch (e) {
      console.warn('Ошибка', coll, b.lang, ':', e.message);
    }
  }
  console.log('\nГотово.');
}

main().catch((e) => { console.error(e.message); process.exit(1); });
