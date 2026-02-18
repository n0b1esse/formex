#!/usr/bin/env node
/**
 * Formex Directus Bootstrap
 * Создаёт коллекции и заполняет начальным контентом.
 *
 * Запуск:
 *   cd backend && node scripts/bootstrap-directus.mjs
 *
 * Требует: DIRECTUS_URL и DIRECTUS_ADMIN_TOKEN в .env
 * Токен: Settings → Access Tokens в админке Directus
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
  console.error('Задайте DIRECTUS_ADMIN_TOKEN в .env ИЛИ DIRECTUS_ADMIN_EMAIL и DIRECTUS_ADMIN_PASSWORD');
  console.error('Токен: Data Model → Users → ваш пользователь → поле Token → Generate');
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
  if (!r.ok) throw new Error('Вход не удался. Проверьте DIRECTUS_ADMIN_EMAIL и DIRECTUS_ADMIN_PASSWORD в .env');
  const data = await r.json();
  TOKEN = data.data?.access_token;
  if (!TOKEN) throw new Error('Не получен access_token');
  headers.Authorization = `Bearer ${TOKEN}`;
  console.log('Вход выполнен по email/паролю');
}

const COLLECTION_GROUPS = {
  formex_hero: 'formex_grp_main',
  formex_about_block: 'formex_grp_main',
  formex_catalog_block: 'formex_grp_main',
  formex_production_block: 'formex_grp_main',
  formex_projects_block: 'formex_grp_main',
  formex_contacts_block: 'formex_grp_main',
  formex_dealer_block: 'formex_grp_main',
  formex_pages: 'formex_grp_pages',
  formex_catalog_categories: 'formex_grp_catalog',
  formex_production_steps: 'formex_grp_production',
  formex_projects: 'formex_grp_projects',
  formex_reviews: 'formex_grp_reviews',
  formex_certificates: 'formex_grp_reviews',
  formex_settings: 'formex_grp_settings',
  formex_translations: 'formex_grp_settings',
  formex_index_blocks: 'formex_grp_legacy',
};

// Папки для иерархии в сайдбаре (по страницам и контенту)
const FOLDER_COLLECTIONS = [
  { collection: 'formex_grp_main', meta: { icon: 'home', note: 'Блоки главной страницы', hidden: false, translation: { 'ru-RU': 'Главная страница', 'en-US': 'Main Page' } }, schema: null },
  { collection: 'formex_grp_pages', meta: { icon: 'article', note: 'Контент страниц (about, catalog и др.)', hidden: false, translation: { 'ru-RU': 'Контент страниц', 'en-US': 'Page Content' } }, schema: null },
  { collection: 'formex_grp_catalog', meta: { icon: 'category', note: 'Каталог продукции', hidden: false, translation: { 'ru-RU': 'Каталог', 'en-US': 'Catalog' } }, schema: null },
  { collection: 'formex_grp_production', meta: { icon: 'precision_manufacturing', note: 'Производство', hidden: false, translation: { 'ru-RU': 'Производство', 'en-US': 'Production' } }, schema: null },
  { collection: 'formex_grp_projects', meta: { icon: 'folder', note: 'Проекты', hidden: false, translation: { 'ru-RU': 'Проекты', 'en-US': 'Projects' } }, schema: null },
  { collection: 'formex_grp_reviews', meta: { icon: 'rate_review', note: 'Отзывы и сертификаты', hidden: false, translation: { 'ru-RU': 'Отзывы и сертификаты', 'en-US': 'Reviews & Certificates' } }, schema: null },
  { collection: 'formex_grp_settings', meta: { icon: 'settings', note: 'Настройки сайта', hidden: false, translation: { 'ru-RU': 'Настройки', 'en-US': 'Settings' } }, schema: null },
  { collection: 'formex_grp_legacy', meta: { icon: 'archive', note: 'Устаревшие коллекции (скрыто)', hidden: true, translation: { 'ru-RU': 'Устаревшее', 'en-US': 'Legacy' } }, schema: null },
];

const COLLECTIONS = [
  {
    collection: 'formex_settings',
    meta: { icon: 'settings', note: 'Глобальные настройки (контакты, футер)', display_template: '{{ key }} ({{ lang }})', group: 'formex_grp_settings', translation: { 'ru-RU': 'Настройки (контакты, футер)', 'en-US': 'Settings' } },
    schema: { name: 'formex_settings' },
    fields: [
      { field: 'key', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input' } },
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'value', type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } },
    ],
  },
  {
    collection: 'formex_pages',
    meta: { icon: 'article', note: 'Контент страниц по языкам', display_template: '{{ page }} ({{ lang }})', group: 'formex_grp_pages', translation: { 'ru-RU': 'Страницы (about, catalog и др.)', 'en-US': 'Pages Content' } },
    schema: { name: 'formex_pages' },
    fields: [
      { field: 'page', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'О нас (about)', value: 'about' },
        { text: 'Каталог (catalog)', value: 'catalog' },
        { text: 'Производство (production)', value: 'production' },
        { text: 'Проекты (projects)', value: 'projects' },
        { text: 'Материалы (materials)', value: 'materials' },
      ] } } },
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'content', type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } },
    ],
  },
  {
    collection: 'formex_projects',
    meta: { icon: 'folder', note: 'Реализованные проекты', group: 'formex_grp_projects', translation: { 'ru-RU': 'Проекты', 'en-US': 'Projects' } },
    schema: { name: 'formex_projects' },
    fields: [
      { field: 'name', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'lang', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'sort', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_catalog_categories',
    meta: { icon: 'category', note: 'Категории каталога', group: 'formex_grp_catalog', translation: { 'ru-RU': 'Категории каталога', 'en-US': 'Catalog Categories' } },
    schema: { name: 'formex_catalog_categories' },
    fields: [
      { field: 'slug', type: 'string', meta: { interface: 'input' } },
      { field: 'name', type: 'string', meta: { interface: 'input' } },
      { field: 'lang', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'sort', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_reviews',
    meta: { icon: 'rate_review', note: 'Отзывы партнёров', group: 'formex_grp_reviews', translation: { 'ru-RU': 'Отзывы', 'en-US': 'Reviews' } },
    schema: { name: 'formex_reviews' },
    fields: [
      { field: 'quote', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'author', type: 'string', meta: { interface: 'input' } },
      { field: 'type', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'text', value: 'text' }, { text: 'scan', value: 'scan' }] } } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'lang', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'sort', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_certificates',
    meta: { icon: 'verified', note: 'Сертификаты', group: 'formex_grp_reviews', translation: { 'ru-RU': 'Сертификаты', 'en-US': 'Certificates' } },
    schema: { name: 'formex_certificates' },
    fields: [
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'] } },
      { field: 'sort', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_production_steps',
    meta: { icon: 'precision_manufacturing', note: 'Этапы производства', group: 'formex_grp_production', translation: { 'ru-RU': 'Этапы производства', 'en-US': 'Production Steps' } },
    schema: { name: 'formex_production_steps' },
    fields: [
      { field: 'icon', type: 'string', meta: { interface: 'input' } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'lang', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'sort', type: 'integer', schema: { default_value: 0 }, meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_translations',
    meta: { icon: 'translate', note: 'UI-строки (навигация, кнопки)', group: 'formex_grp_settings', translation: { 'ru-RU': 'Переводы (UI)', 'en-US': 'Translations' } },
    schema: { name: 'formex_translations' },
    fields: [
      { field: 'key', type: 'string', schema: { is_nullable: false }, meta: { interface: 'input' } },
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'value', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_index_blocks',
    meta: { icon: 'view_module', note: 'Устаревшая — не использовать. Контент в formex_hero, formex_about_block и др.', display_template: '{{ block_id }} ({{ lang }})', group: 'formex_grp_legacy', hidden: true, translation: { 'ru-RU': 'Индекс-блоки (legacy)', 'en-US': 'Index Blocks (Legacy)' } },
    schema: { name: 'formex_index_blocks' },
    fields: [
      { field: 'block_id', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [
        { text: 'Hero', value: 'hero' }, { text: 'О компании', value: 'about' }, { text: 'Каталог', value: 'catalog' },
        { text: 'Производство', value: 'production' }, { text: 'Портфолио', value: 'projects' }, { text: 'Контакты', value: 'contacts' }, { text: 'Партнёр', value: 'dealer' },
      ] } } },
      { field: 'lang', type: 'string', meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'sort', type: 'integer', meta: { interface: 'input' } },
      { field: 'content', type: 'json', meta: { interface: 'input-code', options: { language: 'json' } } },
    ],
  },
  // === ТИПИЗИРОВАННЫЕ БЛОКИ ГЛАВНОЙ (визуальные поля вместо JSON) ===
  {
    collection: 'formex_hero',
    meta: { icon: 'view_carousel', note: 'Hero — главный баннер. File: выбор из библиотеки или загрузка.', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Hero (главный баннер)', 'en-US': 'Hero' } },
    schema: { name: 'formex_hero' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'badge', type: 'string', meta: { interface: 'input', note: 'Метка над заголовком' } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'subtitle', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'], note: 'Фон баннера (опционально)' } },
      { field: 'btn1_text', type: 'string', meta: { interface: 'input' } },
      { field: 'btn1_link', type: 'string', meta: { interface: 'input' } },
      { field: 'btn2_text', type: 'string', meta: { interface: 'input' } },
      { field: 'btn2_link', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_about_block',
    meta: { icon: 'info', note: 'Блок «О компании» на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'О компании', 'en-US': 'About Block' } },
    schema: { name: 'formex_about_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'label', type: 'string', meta: { interface: 'input' } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'image', type: 'uuid', meta: { interface: 'file-image', special: ['file'], note: 'Фото завода' } },
      { field: 'stat1_num', type: 'string', meta: { interface: 'input' } },
      { field: 'stat1_label', type: 'string', meta: { interface: 'input' } },
      { field: 'stat2_num', type: 'string', meta: { interface: 'input' } },
      { field: 'stat2_label', type: 'string', meta: { interface: 'input' } },
      { field: 'btn_text', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_catalog_block',
    meta: { icon: 'folder_open', note: 'Блок «Каталог» на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Блок Каталог', 'en-US': 'Catalog Block' } },
    schema: { name: 'formex_catalog_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'label', type: 'string', meta: { interface: 'input' } },
      { field: 'btn_text', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_production_block',
    meta: { icon: 'precision_manufacturing', note: 'Блок «Производство» на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Блок Производство', 'en-US': 'Production Block' } },
    schema: { name: 'formex_production_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'label', type: 'string', meta: { interface: 'input' } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'list_items', type: 'json', meta: { interface: 'input-code', options: { language: 'json' }, note: 'Массив строк: ["пункт 1", "пункт 2"]' } },
      { field: 'btn_text', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_projects_block',
    meta: { icon: 'collections', note: 'Блок «Портфолио» на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Блок Портфолио', 'en-US': 'Projects Block' } },
    schema: { name: 'formex_projects_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'label', type: 'string', meta: { interface: 'input' } },
      { field: 'btn_text', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_contacts_block',
    meta: { icon: 'contact_mail', note: 'Блок «Контакты» и форма на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Контакты и форма', 'en-US': 'Contacts Block' } },
    schema: { name: 'formex_contacts_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'label', type: 'string', meta: { interface: 'input' } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'form_title', type: 'string', meta: { interface: 'input' } },
      { field: 'form_subtitle', type: 'string', meta: { interface: 'input' } },
      { field: 'form_placeholder_name', type: 'string', meta: { interface: 'input' } },
      { field: 'form_placeholder_phone', type: 'string', meta: { interface: 'input' } },
      { field: 'form_placeholder_message', type: 'string', meta: { interface: 'input' } },
      { field: 'form_btn', type: 'string', meta: { interface: 'input' } },
    ],
  },
  {
    collection: 'formex_dealer_block',
    meta: { icon: 'handshake', note: 'Блок «Стать партнёром» на главной', display_template: '{{ lang }}', group: 'formex_grp_main', translation: { 'ru-RU': 'Стать партнёром', 'en-US': 'Dealer Block' } },
    schema: { name: 'formex_dealer_block' },
    fields: [
      { field: 'lang', type: 'string', schema: { is_nullable: false }, meta: { interface: 'select-dropdown', options: { choices: [{ text: 'ru', value: 'ru' }, { text: 'en', value: 'en' }, { text: 'ky', value: 'ky' }] } } },
      { field: 'title', type: 'string', meta: { interface: 'input' } },
      { field: 'description', type: 'text', meta: { interface: 'input-multiline' } },
      { field: 'btn_text', type: 'string', meta: { interface: 'input' } },
    ],
  },
];

async function main() {
  console.log('Formex Directus Bootstrap');
  console.log('URL:', BASE, '\n');

  try {
    await ensureAuth();
    await api('/users/me');
    console.log('Подключение OK\n');

    const existing = (await api('/collections')).data || [];
    const names = new Set((existing).map((c) => c.collection));

    for (const folder of FOLDER_COLLECTIONS) {
      if (names.has(folder.collection)) {
        // Обновляем meta (включая translation) для уже существующих папок
        try {
          await api(`/collections/${folder.collection}`, 'PATCH', { meta: folder.meta });
          console.log('Папка обновлена:', folder.collection);
        } catch (e) {
          if (!e.message?.includes('404')) console.warn('Папка', folder.collection, ':', e.message);
        }
        continue;
      }
      try {
        await api('/collections', 'POST', folder);
        names.add(folder.collection);
        console.log('Папка создана:', folder.collection);
      } catch (e) {
        if (e.message?.includes('already exists')) names.add(folder.collection);
        else console.warn('Папка', folder.collection, ':', e.message);
      }
    }

    for (const col of COLLECTIONS) {
      if (names.has(col.collection)) {
        console.log('Коллекция уже есть:', col.collection);
        const metaPatch = {};
        if (col.meta?.display_template) metaPatch.display_template = col.meta.display_template;
        if (col.meta?.group != null) metaPatch.group = col.meta.group;
        if (col.meta?.translation) metaPatch.translation = col.meta.translation;
        if (col.meta?.hidden != null) metaPatch.hidden = col.meta.hidden;
        if (Object.keys(metaPatch).length > 0) {
          await api(`/collections/${col.collection}`, 'PATCH', { meta: metaPatch });
          if (metaPatch.group) console.log('  → группа:', metaPatch.group);
        }
        for (const f of col.fields || []) {
          if (f.meta?.interface === 'select-dropdown' && f.meta?.options?.choices) {
            try {
              await api(`/fields/${col.collection}/${f.field}`, 'PATCH', { meta: { interface: 'select-dropdown', options: f.meta.options } });
              console.log('  → поле', f.field, ': select-dropdown');
            } catch (e) {
              if (!e.message?.includes('404')) console.warn('  поле', f.field, ':', e.message);
            }
          }
        }
        continue;
      }
      const { collection, meta, schema, fields } = col;
      try {
        await api('/collections', 'POST', { collection, meta, schema, fields });
        console.log('Создана:', collection);
      } catch (e) {
        if (e.message?.includes('already exists')) {
          console.log('Коллекция уже есть:', collection);
          names.add(collection);
          const metaPatch = {};
          if (meta?.display_template) metaPatch.display_template = meta.display_template;
          if (meta?.group != null) metaPatch.group = meta.group;
          if (meta?.translation) metaPatch.translation = meta.translation;
          if (meta?.hidden != null) metaPatch.hidden = meta.hidden;
          if (Object.keys(metaPatch).length > 0) {
            try { await api(`/collections/${collection}`, 'PATCH', { meta: metaPatch }); } catch (_) {}
          }
          for (const f of col.fields || []) {
            if (f.meta?.interface === 'select-dropdown' && f.meta?.options?.choices) {
              try { await api(`/fields/${collection}/${f.field}`, 'PATCH', { meta: { interface: 'select-dropdown', options: f.meta.options } }); } catch (_) {}
            }
          }
        } else throw e;
      }
    }

    // Миграция: удалить дубликаты главной (index) из formex_pages — главная обслуживается типизированными блоками
    try {
      await api('/items/formex_pages?filter[page][_eq]=index', 'DELETE');
      console.log('Миграция: удалены дубликаты formex_pages (page=index)');
    } catch (_) {}
    const hasData = (await api('/items/formex_settings?limit=1')).data?.length > 0;
    const hasBlocks = (await api('/items/formex_index_blocks?limit=1')).data?.length > 0;
    let hasTypedHero = false;
    try {
      hasTypedHero = (await api('/items/formex_hero?limit=1')).data?.length > 0;
    } catch (_) {}

    if (!hasTypedHero) {
      console.log('\nЗаполнение типизированных блоков (formex_hero и др.)...');
      const heroData = [
        { lang: 'ru', badge: 'B2B РЕШЕНИЯ', title: 'Комплексные решения для современной архитектуры', subtitle: 'FORMEX — ведущий кыргызский производитель алюминиевых систем и решений в Центральной Азии.', btn1_text: 'Смотреть каталог', btn1_link: 'catalog.html', btn2_text: 'О компании', btn2_link: 'about.html' },
        { lang: 'en', badge: 'B2B SOLUTIONS', title: 'Comprehensive Solutions for Modern Architecture', subtitle: 'FORMEX — the leading Kyrgyz manufacturer of aluminum systems and solutions in Central Asia.', btn1_text: 'View Catalog', btn1_link: 'catalog.html', btn2_text: 'About Company', btn2_link: 'about.html' },
        { lang: 'ky', badge: 'B2B ЧЕЧИМДЕР', title: 'Заманбап архитектура үчүн кешендүү чечимдер', subtitle: 'FORMEX — Борбордук Азиядагы алюминий системаларынын ири кыргыз өндүрүүчүсү.', btn1_text: 'Каталогду кароо', btn1_link: 'catalog.html', btn2_text: 'Компания жөнүндө', btn2_link: 'about.html' },
      ];
      const aboutData = [
        { lang: 'ru', label: 'НАДЕЖНОСТЬ И ОПЫТ', title: 'О компании Formex', description: 'FORMEX — ведущий производитель алюминиевых систем и инженерных решений в Центральной Азии, признанный рынком за высокое качество, технологическое лидерство и ответственность. Полный цикл: от проектирования до экструзии и покраски. Формируем устойчивую ценность для строительства, промышленности и партнёров.', stat1_num: '10+', stat1_label: 'Лет опыта', stat2_num: '500+', stat2_label: 'Объектов', btn_text: 'Контакты и заявка' },
        { lang: 'en', label: 'RELIABILITY AND EXPERIENCE', title: 'About Formex', description: 'FORMEX is the leading manufacturer of aluminum systems and engineered solutions in Central Asia, recognized by the market for high quality, technological excellence, and responsibility.', stat1_num: '10+', stat1_label: 'Years of experience', stat2_num: '500+', stat2_label: 'Projects completed', btn_text: 'Contacts & Request' },
        { lang: 'ky', label: 'ИШЕНИМДҮҮЛҮК ЖАНА ТАЖРИЙБЕ', title: 'Formex компаниясы жөнүндө', description: 'FORMEX — Борбордук Азиядагы алюминий системаларынын ири өндүрүүчүсү.', stat1_num: '10+', stat1_label: 'Жыл тажрибе', stat2_num: '500+', stat2_label: 'Объект', btn_text: 'Байланыш жана өтүнмө' },
      ];
      const catalogData = [
        { lang: 'ru', label: 'СИСТЕМНЫЕ РЕШЕНИЯ', btn_text: 'Каталог продукции' },
        { lang: 'en', label: 'SYSTEM SOLUTIONS', btn_text: 'Product Catalog' },
        { lang: 'ky', label: 'СИСТЕМАЛЫК ЧЕЧИМДЕР', btn_text: 'Продукция каталогу' },
      ];
      const productionData = [
        { lang: 'ru', label: 'ТЕХНОЛОГИИ', title: 'Производство', description: 'Экструзия, автоматизированная покраска RAL и лабораторный контроль на каждом этапе. Гарантия на покрытие — 15 лет.', list_items: ['Прессовые комплексы для профилей любой сложности', 'Линия порошковой покраски Gema', 'Входной и выходной контроль качества'], btn_text: 'Подробнее о производстве' },
        { lang: 'en', label: 'TECHNOLOGIES', title: 'Production', description: 'Extrusion, automated RAL painting, and laboratory quality control at every stage. 15-year coating warranty.', list_items: ['Press systems for profiles of any complexity', 'Gema powder coating line', 'Incoming and outgoing quality control'], btn_text: 'More about Production' },
        { lang: 'ky', label: 'ТЕХНОЛОГИЯЛАР', title: 'Өндүрүш', description: 'Экструзия, RAL автоматташтырылган боялоо жана ар бир этапта лабораториялык контроль. 15 жыл каптоого кепилдик.', list_items: ['Каалаган татаалдыктагы профилдер үчүн пресс комплекстары', 'Gema күкүм боялоо линиясы', 'Кирүү жана чыгуу сапат контролу'], btn_text: 'Өндүрүш жөнүндө көбүрөөк' },
      ];
      const projectsBlockData = [
        { lang: 'ru', label: 'ПОРТФОЛИО', btn_text: 'Реализованные объекты' },
        { lang: 'en', label: 'PORTFOLIO', btn_text: 'Completed Projects' },
        { lang: 'ky', label: 'ПОРТФОЛИО', btn_text: 'Ишке ашкан объекттер' },
      ];
      const contactsData = [
        { lang: 'ru', label: 'СВЯЗАТЬСЯ С НАМИ', title: 'Контакты', description: 'Свяжитесь с нами для обсуждения проекта или расчёта стоимости. Formex – лидер на рынке профильных алюминиевых систем. Надёжный производственный партнёр в Центральной Азии.', form_title: 'Получить консультацию', form_subtitle: 'Свяжемся с вами в течение 15 минут', form_placeholder_name: 'Ваше имя*', form_placeholder_phone: 'Телефон*', form_placeholder_message: 'Ваш проект или вопрос', form_btn: 'Отправить запрос' },
        { lang: 'en', label: 'CONTACT US', title: 'Contacts', description: 'Contact us to discuss your project or get a quote. Formex – the leader in the aluminum profile systems market.', form_title: 'Get a Consultation', form_subtitle: 'We will contact you within 15 minutes', form_placeholder_name: 'Your name*', form_placeholder_phone: 'Phone*', form_placeholder_message: 'Your project or question', form_btn: 'Send Request' },
        { lang: 'ky', label: 'БИЗ МЕНЕН БАЙЛАНЫШЫҢЫЗ', title: 'Байланыш', description: 'Долбоорун талкуулоо же наркын эсептөө үчүн биз менен байланышыңыз. Formex – алюминий профилдик системалардын рыногундагы лидер.', form_title: 'Консультация алуу', form_subtitle: '15 мүнөт ичинде сиз менен байланышабыз', form_placeholder_name: 'Атыңыз*', form_placeholder_phone: 'Телефон*', form_placeholder_message: 'Долбооруңуз же сурооңуз', form_btn: 'Өтүнмө жөнөтүү' },
      ];
      const dealerData = [
        { lang: 'ru', title: 'Стать партнёром Formex', description: 'Партнёрские цены, техническая поддержка и образцы для строительных компаний. Оставьте заявку через форму выше или напишите на info@formex.kg.', btn_text: 'Отправить заявку' },
        { lang: 'en', title: 'Become a Formex Partner', description: 'Partner prices, technical support, and samples for construction companies. Submit your request via the form above or email info@formex.kg.', btn_text: 'Submit Request' },
        { lang: 'ky', title: 'Formex өнөктөшү болуңуз', description: 'Курулуш компаниялары үчүн өнөктөштүк баалуулуктар, техникалык колдоо жана үлгүлөр. Жогорудагы форма аркылуу өтүнмө калтырыңыз же info@formex.kg почтага жазыңыз.', btn_text: 'Өтүнмө жөнөтүү' },
      ];
      await api('/items/formex_hero', 'POST', heroData);
      await api('/items/formex_about_block', 'POST', aboutData);
      await api('/items/formex_catalog_block', 'POST', catalogData);
      await api('/items/formex_production_block', 'POST', productionData);
      await api('/items/formex_projects_block', 'POST', projectsBlockData);
      await api('/items/formex_contacts_block', 'POST', contactsData);
      await api('/items/formex_dealer_block', 'POST', dealerData);
      console.log('Типизированные блоки созданы.');
    }

    if (hasData && hasBlocks) {
      console.log('\nДанные уже есть. Пропуск seed.');
      return;
    }
    if (hasData && !hasBlocks) {
      console.log('\nДобавляю блоки главной страницы (formex_index_blocks)...');
    }

    if (!hasData) {
    console.log('\nЗаполнение данными...');
    await api('/items/formex_settings', 'POST', [
      { key: 'contacts', lang: 'ru', value: { company: 'ОсОО «Формекс»', phone: '+996 (773) 41 11 14', email: 'info@formex.kg', address: 'Бишкек, ул. Чолпонатинская 2а', hours: 'Пн–Пт 9:00–18:00' } },
      { key: 'contacts', lang: 'en', value: { company: 'Formex LLC', phone: '+996 (773) 41 11 14', email: 'info@formex.kg', address: 'Bishkek, 2a Cholponatinskaya St.', hours: 'Mon–Fri 9:00–18:00' } },
      { key: 'contacts', lang: 'ky', value: { company: '«Формекс» ЖЧК', phone: '+996 (773) 41 11 14', email: 'info@formex.kg', address: 'Бишкек, Чолпон-Ата көчөсү 2а', hours: 'Дүй-Жұм 9:00–18:00' } },
      { key: 'footer', lang: 'ru', value: { tagline: 'Formex – лидер на рынке профильных алюминиевых систем.', copyright: '© 2026 Formex. Все права защищены.' } },
      { key: 'footer', lang: 'en', value: { tagline: 'Formex – the leader in the aluminum profile systems market.', copyright: '© 2026 Formex. All rights reserved.' } },
      { key: 'footer', lang: 'ky', value: { tagline: 'Formex – алюминий профилдик системалардын рыногундагы лидер.', copyright: '© 2026 Formex. Бардык укуктар корголгон.' } },
    ]);

    const trans = [
      { key: 'nav_about', lang: 'ru', value: 'О нас' }, { key: 'nav_about', lang: 'en', value: 'About Us' }, { key: 'nav_about', lang: 'ky', value: 'Биз жөнүндө' },
      { key: 'nav_catalog', lang: 'ru', value: 'Продукция' }, { key: 'nav_catalog', lang: 'en', value: 'Products' }, { key: 'nav_catalog', lang: 'ky', value: 'Продукция' },
      { key: 'nav_production', lang: 'ru', value: 'Производство' }, { key: 'nav_production', lang: 'en', value: 'Production' }, { key: 'nav_production', lang: 'ky', value: 'Өндүрүш' },
      { key: 'nav_projects', lang: 'ru', value: 'Проекты' }, { key: 'nav_projects', lang: 'en', value: 'Projects' }, { key: 'nav_projects', lang: 'ky', value: 'Долбоорлор' },
      { key: 'nav_materials', lang: 'ru', value: 'Материалы' }, { key: 'nav_materials', lang: 'en', value: 'Materials' }, { key: 'nav_materials', lang: 'ky', value: 'Материалдар' },
      { key: 'btn_order_call', lang: 'ru', value: 'Заказать звонок' }, { key: 'btn_order_call', lang: 'en', value: 'Request a Call' }, { key: 'btn_order_call', lang: 'ky', value: 'Чалуу сурап калуу' },
      { key: 'btn_partnership', lang: 'ru', value: 'Сотрудничество' }, { key: 'btn_partnership', lang: 'en', value: 'Partnership' }, { key: 'btn_partnership', lang: 'ky', value: 'Өнөктөштүк' },
    ];
    await api('/items/formex_translations', 'POST', trans);

    const cats = [
      { slug: 'windows-doors', name: 'Оконно-дверные системы', lang: 'ru', sort: 1 }, { slug: 'windows-doors', name: 'Window & Door Systems', lang: 'en', sort: 1 }, { slug: 'windows-doors', name: 'Терезе-эшик системалары', lang: 'ky', sort: 1 },
      { slug: 'facade', name: 'Фасадные системы', lang: 'ru', sort: 2 }, { slug: 'facade', name: 'Facade Systems', lang: 'en', sort: 2 }, { slug: 'facade', name: 'Фасаддык системалар', lang: 'ky', sort: 2 },
      { slug: 'partitions', name: 'Офисные перегородки', lang: 'ru', sort: 3 }, { slug: 'partitions', name: 'Office Partitions', lang: 'en', sort: 3 }, { slug: 'partitions', name: 'Кеңсе бөлүштүргүчтөрү', lang: 'ky', sort: 3 },
      { slug: 'ventilated', name: 'Вентилируемые фасадные системы', lang: 'ru', sort: 4 }, { slug: 'ventilated', name: 'Ventilated Facade Systems', lang: 'en', sort: 4 }, { slug: 'ventilated', name: 'Абаланган фасаддык системалар', lang: 'ky', sort: 4 },
      { slug: 'special', name: 'Спец проекты', lang: 'ru', sort: 5 }, { slug: 'special', name: 'Special Projects', lang: 'en', sort: 5 }, { slug: 'special', name: 'Атайын долбоорлор', lang: 'ky', sort: 5 },
    ];
    await api('/items/formex_catalog_categories', 'POST', cats);

    const steps = [
      { icon: '🏭', title: 'Экструзия', description: 'Профили любой сложности', lang: 'ru', sort: 1 }, { icon: '🏭', title: 'Extrusion', description: 'Profiles of any complexity', lang: 'en', sort: 1 }, { icon: '🏭', title: 'Экструзия', description: 'Каалаган татаалдыктагы профилдер', lang: 'ky', sort: 1 },
      { icon: '✨', title: 'Покраска', description: 'RAL, гарантия 15 лет', lang: 'ru', sort: 2 }, { icon: '✨', title: 'Coating', description: 'RAL, 15-year warranty', lang: 'en', sort: 2 }, { icon: '✨', title: 'Боялоо', description: 'RAL, 15 жыл кепилдик', lang: 'ky', sort: 2 },
      { icon: '📋', title: 'Контроль', description: 'Прочность и геометрия', lang: 'ru', sort: 3 }, { icon: '📋', title: 'Quality Control', description: 'Strength and geometry', lang: 'en', sort: 3 }, { icon: '📋', title: 'Контроль', description: 'Бекемдик жана геометрия', lang: 'ky', sort: 3 },
    ];
    await api('/items/formex_production_steps', 'POST', steps);

    // Главная (index) — только в типизированных блоках (formex_hero и др.), не дублируем в formex_pages
    const aboutRu = { hero: { label: 'КОМПАНИЯ', title: 'О Formex', subtitle: 'Ведущий производитель алюминиевых систем и инженерных решений в Центральной Азии.' }, about: { label: 'НАДЕЖНОСТЬ И ОПЫТ', title: 'О компании Formex', description: 'FORMEX — ведущий производитель алюминиевых систем и инженерных решений в Центральной Азии.' } };
    await api('/items/formex_pages', 'POST', [
      { page: 'about', lang: 'ru', content: aboutRu },
      { page: 'about', lang: 'en', content: { hero: { label: 'COMPANY', title: 'About Formex', subtitle: 'The leading manufacturer of aluminum systems and engineered solutions in Central Asia.' } } },
      { page: 'about', lang: 'ky', content: { hero: { label: 'КОМПАНИЯ', title: 'Formex жөнүндө', subtitle: 'Борбордук Азиядагы алюминий системаларынын ири өндүрүүчүсү.' } } },
    ]);

    const catalogPages = [
      { page: 'catalog', lang: 'ru', content: { hero: { label: 'СИСТЕМНЫЕ РЕШЕНИЯ', title: 'Каталог продукции', subtitle: 'Оконно-дверные и фасадные системы, офисные перегородки, вентилируемые фасады и спец проекты.' } } },
      { page: 'catalog', lang: 'en', content: { hero: { label: 'SYSTEM SOLUTIONS', title: 'Product Catalog', subtitle: 'Window and door systems, facade systems, office partitions, ventilated facades, and special projects.' } } },
      { page: 'catalog', lang: 'ky', content: { hero: { label: 'СИСТЕМАЛЫК ЧЕЧИМДЕР', title: 'Продукция каталогу', subtitle: 'Терезе-эшик жана фасаддык системалар, кеңсе бөлүштүргүчтөрү, абаланган фасаддар жана атайын долбоорлор.' } } },
      { page: 'production', lang: 'ru', content: { hero: { label: 'ТЕХНОЛОГИИ', title: 'Производство', subtitle: 'Полный цикл: экструзия, покраска и контроль качества на собственном заводе в Бишкеке.' } } },
      { page: 'production', lang: 'en', content: { hero: { label: 'TECHNOLOGIES', title: 'Production', subtitle: 'Full cycle: extrusion, coating, and quality control at our own factory in Bishkek.' } } },
      { page: 'production', lang: 'ky', content: { hero: { label: 'ТЕХНОЛОГИЯЛАР', title: 'Өндүрүш', subtitle: 'Толук цикл: экструзия, боялоо жана Бишкектеги өз заводубузда сапат контролу.' } } },
      { page: 'projects', lang: 'ru', content: { hero: { label: 'ПОРТФОЛИО', title: 'Реализованные объекты', subtitle: 'Жилые комплексы, бизнес-центры и общественные здания с нашими алюминиевыми системами.' } } },
      { page: 'projects', lang: 'en', content: { hero: { label: 'PORTFOLIO', title: 'Completed Projects', subtitle: 'Residential complexes, business centers, and public buildings with our aluminum systems.' } } },
      { page: 'projects', lang: 'ky', content: { hero: { label: 'ПОРТФОЛИО', title: 'Ишке ашкан объекттер', subtitle: 'Турак жай комплекстары, бизнес борборлору жана коомдук имараттар биздин алюминий системаларыбыз менен.' } } },
      { page: 'materials', lang: 'ru', content: { hero: { label: 'СЫРЬЁ И КОМПЛЕКТУЮЩИЕ', title: 'Материалы', subtitle: 'Первичный алюминий, покрытия RAL, остекление и комплектующие для наших систем.' } } },
      { page: 'materials', lang: 'en', content: { hero: { label: 'RAW MATERIALS AND COMPONENTS', title: 'Materials', subtitle: 'Primary aluminum, RAL coatings, glazing, and components for our systems.' } } },
      { page: 'materials', lang: 'ky', content: { hero: { label: 'ЧЫГАРМА ЖАНА КОМПОНЕНТТЕР', title: 'Материалдар', subtitle: 'Биринчилик алюминий, RAL каптоолор, айнектелүү жана биздин системалар үчүн комплектующдар.' } } },
    ];
    await api('/items/formex_pages', 'POST', catalogPages);
    }

    // Блоки главной страницы (каждый блок — отдельная запись)
    const blocksRu = [
      { block_id: 'hero', lang: 'ru', sort: 1, content: { badge: 'B2B РЕШЕНИЯ', title: 'Комплексные решения для современной архитектуры', subtitle: 'FORMEX — ведущий кыргызский производитель алюминиевых систем и решений в Центральной Азии.', btn1_text: 'Смотреть каталог', btn1_link: 'catalog.html', btn2_text: 'О компании', btn2_link: 'about.html' } },
      { block_id: 'about', lang: 'ru', sort: 2, content: { label: 'НАДЕЖНОСТЬ И ОПЫТ', title: 'О компании Formex', description: 'FORMEX — ведущий производитель алюминиевых систем и инженерных решений в Центральной Азии, признанный рынком за высокое качество, технологическое лидерство и ответственность. Полный цикл: от проектирования до экструзии и покраски. Формируем устойчивую ценность для строительства, промышленности и партнёров.', stat1_num: '10+', stat1_label: 'Лет опыта', stat2_num: '500+', stat2_label: 'Объектов', btn_text: 'Контакты и заявка' } },
      { block_id: 'catalog', lang: 'ru', sort: 3, content: { label: 'СИСТЕМНЫЕ РЕШЕНИЯ', btn_text: 'Каталог продукции' } },
      { block_id: 'production', lang: 'ru', sort: 4, content: { label: 'ТЕХНОЛОГИИ', title: 'Производство', description: 'Экструзия, автоматизированная покраска RAL и лабораторный контроль на каждом этапе. Гарантия на покрытие — 15 лет.', list_items: ['Прессовые комплексы для профилей любой сложности', 'Линия порошковой покраски Gema', 'Входной и выходной контроль качества'], btn_text: 'Подробнее о производстве' } },
      { block_id: 'projects', lang: 'ru', sort: 5, content: { label: 'ПОРТФОЛИО', btn_text: 'Реализованные объекты' } },
      { block_id: 'contacts', lang: 'ru', sort: 6, content: { label: 'СВЯЗАТЬСЯ С НАМИ', title: 'Контакты', description: 'Свяжитесь с нами для обсуждения проекта или расчёта стоимости. Formex – лидер на рынке профильных алюминиевых систем. Надёжный производственный партнёр в Центральной Азии.', form_title: 'Получить консультацию', form_subtitle: 'Свяжемся с вами в течение 15 минут', form_placeholder_name: 'Ваше имя*', form_placeholder_phone: 'Телефон*', form_placeholder_message: 'Ваш проект или вопрос', form_btn: 'Отправить запрос' } },
      { block_id: 'dealer', lang: 'ru', sort: 7, content: { title: 'Стать партнёром Formex', description: 'Партнёрские цены, техническая поддержка и образцы для строительных компаний. Оставьте заявку через форму выше или напишите на info@formex.kg.', btn_text: 'Отправить заявку' } },
    ];
    const blocksEn = [
      { block_id: 'hero', lang: 'en', sort: 1, content: { badge: 'B2B SOLUTIONS', title: 'Comprehensive Solutions for Modern Architecture', subtitle: 'FORMEX — the leading Kyrgyz manufacturer of aluminum systems and solutions in Central Asia.', btn1_text: 'View Catalog', btn1_link: 'catalog.html', btn2_text: 'About Company', btn2_link: 'about.html' } },
      { block_id: 'about', lang: 'en', sort: 2, content: { label: 'RELIABILITY AND EXPERIENCE', title: 'About Formex', description: 'FORMEX is the leading manufacturer of aluminum systems and engineered solutions in Central Asia, recognized by the market for high quality, technological excellence, and responsibility.', stat1_num: '10+', stat1_label: 'Years of experience', stat2_num: '500+', stat2_label: 'Projects completed', btn_text: 'Contacts & Request' } },
      { block_id: 'catalog', lang: 'en', sort: 3, content: { label: 'SYSTEM SOLUTIONS', btn_text: 'Product Catalog' } },
      { block_id: 'production', lang: 'en', sort: 4, content: { label: 'TECHNOLOGIES', title: 'Production', description: 'Extrusion, automated RAL painting, and laboratory quality control at every stage. 15-year coating warranty.', list_items: ['Press systems for profiles of any complexity', 'Gema powder coating line', 'Incoming and outgoing quality control'], btn_text: 'More about Production' } },
      { block_id: 'projects', lang: 'en', sort: 5, content: { label: 'PORTFOLIO', btn_text: 'Completed Projects' } },
      { block_id: 'contacts', lang: 'en', sort: 6, content: { label: 'CONTACT US', title: 'Contacts', description: 'Contact us to discuss your project or get a quote. Formex – the leader in the aluminum profile systems market.', form_title: 'Get a Consultation', form_subtitle: 'We will contact you within 15 minutes', form_placeholder_name: 'Your name*', form_placeholder_phone: 'Phone*', form_placeholder_message: 'Your project or question', form_btn: 'Send Request' } },
      { block_id: 'dealer', lang: 'en', sort: 7, content: { title: 'Become a Formex Partner', description: 'Partner prices, technical support, and samples for construction companies. Submit your request via the form above or email info@formex.kg.', btn_text: 'Submit Request' } },
    ];
    const blocksKy = [
      { block_id: 'hero', lang: 'ky', sort: 1, content: { badge: 'B2B ЧЕЧИМДЕР', title: 'Заманбап архитектура үчүн кешендүү чечимдер', subtitle: 'FORMEX — Борбордук Азиядагы алюминий системаларынын ири кыргыз өндүрүүчүсү.', btn1_text: 'Каталогду кароо', btn1_link: 'catalog.html', btn2_text: 'Компания жөнүндө', btn2_link: 'about.html' } },
      { block_id: 'about', lang: 'ky', sort: 2, content: { label: 'ИШЕНИМДҮҮЛҮК ЖАНА ТАЖРИЙБЕ', title: 'Formex компаниясы жөнүндө', description: 'FORMEX — Борбордук Азиядагы алюминий системаларынын ири өндүрүүчүсү.', stat1_num: '10+', stat1_label: 'Жыл тажрибе', stat2_num: '500+', stat2_label: 'Объект', btn_text: 'Байланыш жана өтүнмө' } },
      { block_id: 'catalog', lang: 'ky', sort: 3, content: { label: 'СИСТЕМАЛЫК ЧЕЧИМДЕР', btn_text: 'Продукция каталогу' } },
      { block_id: 'production', lang: 'ky', sort: 4, content: { label: 'ТЕХНОЛОГИЯЛАР', title: 'Өндүрүш', description: 'Экструзия, RAL автоматташтырылган боялоо жана ар бир этапта лабораториялык контроль. 15 жыл каптоого кепилдик.', list_items: ['Каалаган татаалдыктагы профилдер үчүн пресс комплекстары', 'Gema күкүм боялоо линиясы', 'Кирүү жана чыгуу сапат контролу'], btn_text: 'Өндүрүш жөнүндө көбүрөөк' } },
      { block_id: 'projects', lang: 'ky', sort: 5, content: { label: 'ПОРТФОЛИО', btn_text: 'Ишке ашкан объекттер' } },
      { block_id: 'contacts', lang: 'ky', sort: 6, content: { label: 'БИЗ МЕНЕН БАЙЛАНЫШЫҢЫЗ', title: 'Байланыш', description: 'Долбоорун талкуулоо же наркын эсептөө үчүн биз менен байланышыңыз. Formex – алюминий профилдик системалардын рыногундагы лидер.', form_title: 'Консультация алуу', form_subtitle: '15 мүнөт ичинде сиз менен байланышабыз', form_placeholder_name: 'Атыңыз*', form_placeholder_phone: 'Телефон*', form_placeholder_message: 'Долбооруңуз же сурооңуз', form_btn: 'Өтүнмө жөнөтүү' } },
      { block_id: 'dealer', lang: 'ky', sort: 7, content: { title: 'Formex өнөктөшү болуңуз', description: 'Курулуш компаниялары үчүн өнөктөштүк баалуулуктар, техникалык колдоо жана үлгүлөр. Жогорудагы форма аркылуу өтүнмө калтырыңыз же info@formex.kg почтага жазыңыз.', btn_text: 'Өтүнмө жөнөтүү' } },
    ];
    await api('/items/formex_index_blocks', 'POST', [...blocksRu, ...blocksEn, ...blocksKy]);
    console.log('Блоки главной страницы созданы (formex_index_blocks)');

    if (!hasData) {
    await api('/items/formex_reviews', 'POST', [
      { quote: 'Заказывали остекление фасада. Подобрали систему под наш объект, всё смонтировали в срок. Довольны результатом.', author: 'Заказчик коммерческого объекта', type: 'text', lang: 'ru', sort: 1 },
      { quote: 'Вентилируемые фасады заказывали под объект в Оше. Профиль привезли в срок, консультации по монтажу помогли избежать ошибок.', author: 'Подрядчик, Ош', type: 'text', lang: 'ru', sort: 2 },
    ]);

    await api('/items/formex_certificates', 'POST', [
      { title: 'Сертификат качества', sort: 1 },
      { title: 'Сертификат соответствия', sort: 2 },
      { title: 'ISO 9001:2015', sort: 3 },
    ]);

    await api('/items/formex_projects', 'POST', [
      { name: 'Азиямол', description: 'Поставка и монтаж алюминиевых систем.', lang: 'ru', sort: 1 },
      { name: 'Дордой плаза', description: 'Остекление и фасадные решения.', lang: 'ru', sort: 2 },
      { name: 'Авангард', description: 'ЖК Елисейские поле, БЦ Авангард, Авангард сити — полный цикл остекления.', lang: 'ru', sort: 3 },
      { name: 'Aziyamol', description: 'Supply and installation of aluminum systems.', lang: 'en', sort: 1 },
      { name: 'Dordoy Plaza', description: 'Glazing and facade solutions.', lang: 'en', sort: 2 },
    ]);
    }

    const allCollections = new Set(((await api('/collections')).data || []).map((c) => c.collection));
    for (const [coll, grp] of Object.entries(COLLECTION_GROUPS)) {
      if (allCollections.has(coll)) {
        try {
          await api(`/collections/${coll}`, 'PATCH', { meta: { group: grp } });
        } catch (_) {}
      }
    }
    console.log('\nИерархия коллекций обновлена (по страницам и контенту).');

    console.log('\nГотово! Админка:', BASE);
    console.log('Загрузите изображения для проектов и сертификатов в File Library и привяжите к записям.');
    console.log('Настройте Public роль: Read на formex_* коллекции.');
  } catch (e) {
    console.error('Ошибка:', e.message);
    process.exit(1);
  }
}

main();
