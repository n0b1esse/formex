#!/usr/bin/env node
/**
 * Formex Directus — исправление коллекции Languages
 * Заполняет пустую коллекцию языков, если она есть.
 * Помогает при ошибке «Отношение языков не было настроено правильно» при загрузке файлов.
 *
 * Запуск: cd backend && node scripts/fix-languages.mjs
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
  console.error('Задайте DIRECTUS_ADMIN_TOKEN или DIRECTUS_ADMIN_EMAIL и DIRECTUS_ADMIN_PASSWORD в .env');
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

const LANGUAGES = [
  { code: 'ru', name: 'Русский', direction: 'ltr' },
  { code: 'en', name: 'English', direction: 'ltr' },
  { code: 'ky', name: 'Кыргызча', direction: 'ltr' },
  { code: 'en-US', name: 'English (US)', direction: 'ltr' },
];

async function main() {
  console.log('Formex — исправление коллекции Languages');
  console.log('URL:', BASE, '\n');

  await ensureAuth();
  const collections = (await api('/collections')).data || [];
  const names = collections.map((c) => c.collection);

  const langLike = names.filter((n) => /language/i.test(n) || n === 'languages');
  if (langLike.length > 0) {
    console.log('Коллекции, похожие на languages:', langLike.join(', '));
  } else {
    console.log('Доступные коллекции:', names.filter((n) => !n.startsWith('directus_')).slice(0, 20).join(', '), '...');
  }

  for (const collName of ['languages', 'directus_languages', ...langLike]) {
    if (!names.includes(collName)) continue;

    console.log('\nНайдена коллекция:', collName);
    const res = await api(`/items/${collName}?limit=1`);
    const existing = res?.data || [];

    if (existing.length > 0) {
      console.log('Коллекция уже содержит', existing.length, '+ записей. Ничего не делаем.');
      return;
    }

    console.log('Коллекция пуста. Добавляю языки...');
    await api(`/items/${collName}`, 'POST', LANGUAGES);
    console.log('Добавлено языков:', LANGUAGES.length);
    console.log('\nГотово. Попробуйте снова загрузить файл.');
    return;
  }

  console.log('\nКоллекция Languages не найдена. Создаю...');
  try {
    await api('/collections', 'POST', {
      collection: 'languages',
      meta: { icon: 'translate', note: 'Языки для интерфейса переводов' },
      schema: { name: 'languages' },
      fields: [
        { field: 'code', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input' } },
        { field: 'name', type: 'string', meta: { interface: 'input' } },
        { field: 'direction', type: 'string', schema: { default_value: 'ltr' }, meta: { interface: 'select-dropdown-m2o', options: { choices: [{ text: 'LTR', value: 'ltr' }, { text: 'RTL', value: 'rtl' }] } } },
      ],
    });
    console.log('Коллекция languages создана.');
    await api('/items/languages', 'POST', LANGUAGES);
    console.log('Добавлено языков:', LANGUAGES.length);
    console.log('\nГотово. Попробуйте снова загрузить файл.');
    return;
  } catch (e) {
    console.log('Не удалось создать (возможно, другая схема):', e.message);
  }

  console.log('Проверяю коллекцию Files...');
  for (const filesColl of ['directus_files', 'Files']) {
    if (!names.includes(filesColl)) continue;
    try {
      const fields = (await api(`/fields/${filesColl}`)).data || [];
      const withTranslations = fields.filter((f) => (f.meta?.interface || '').toLowerCase().includes('translation'));
      if (withTranslations.length > 0) {
        console.log('  Поля с Translations:', withTranslations.map((f) => f.field).join(', '));
        console.log('  → Data Model → Files → замените интерфейс этих полей на Input.');
      } else {
        console.log('  Поля Files без Translations — причина ошибки может быть в другой коллекции.');
      }
    } catch (e) {
      console.log('  Не удалось проверить:', e.message);
    }
    break;
  }
  console.log('\nСм. DIRECTUS_SETUP.md, раздел про ошибку языков.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
