#!/usr/bin/env node
/**
 * Formex — экспорт контента из Directus в JSON.
 * Используется в GitHub Actions для публикации на GitHub Pages.
 *
 * Запуск: node scripts/export-content.mjs
 * Требует: DIRECTUS_URL (публичный URL API, без auth — Public Read)
 * Опционально: OUTPUT_DIR (по умолчанию ../frontend/data)
 */

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = process.env.DIRECTUS_URL || process.env.DIRECTUS_PUBLIC_URL || '';
const OUTPUT_DIR = process.env.OUTPUT_DIR || join(__dirname, '..', '..', 'frontend', 'data');

if (!BASE) {
  console.error('Задайте DIRECTUS_URL или DIRECTUS_PUBLIC_URL');
  process.exit(1);
}

const api = async (path) => {
  const r = await fetch(`${BASE.replace(/\/$/, '')}${path}`);
  if (!r.ok) throw new Error(`GET ${path}: ${r.status}`);
  return r.json();
};

function assetUrl(id) {
  if (!id) return null;
  const base = BASE.replace(/\/$/, '');
  return id.startsWith('http') ? id : `${base}/assets/${id}`;
}

async function main() {
  console.log('Export content from', BASE, '→', OUTPUT_DIR);

  const langs = ['ru', 'en', 'ky'];

  // Settings
  const settingsByLang = {};
  for (const lang of langs) {
    const res = await api(`/items/formex_settings?filter[lang][_eq]=${lang}`);
    const list = res?.data || [];
    const s = {};
    list.forEach((x) => { s[x.key] = x.value; });
    settingsByLang[lang] = s;
  }

  // Index blocks (typed)
  const indexByLang = {};
  for (const lang of langs) {
    const [heroR, aboutR, catalogR, prodR, projectsR, contactsR, dealerR] = await Promise.all([
      api(`/items/formex_hero?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_about_block?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_catalog_block?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_production_block?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_projects_block?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_contacts_block?filter[lang][_eq]=${lang}&limit=1`),
      api(`/items/formex_dealer_block?filter[lang][_eq]=${lang}&limit=1`),
    ]);
    const hero = heroR?.data?.[0];
    const about = aboutR?.data?.[0];
    const catalog = catalogR?.data?.[0];
    const prod = prodR?.data?.[0];
    const projects = projectsR?.data?.[0];
    const contacts = contactsR?.data?.[0];
    const dealer = dealerR?.data?.[0];

    const content = {};
    if (hero) content.hero = { badge: hero.badge, title: hero.title, subtitle: hero.subtitle, image: assetUrl(hero.image), btn1_text: hero.btn1_text, btn1_link: hero.btn1_link, btn2_text: hero.btn2_text, btn2_link: hero.btn2_link };
    if (about) content.about = { label: about.label, title: about.title, description: about.description, image: assetUrl(about.image), stat1_num: about.stat1_num, stat1_label: about.stat1_label, stat2_num: about.stat2_num, stat2_label: about.stat2_label, btn_text: about.btn_text };
    if (catalog) content.catalog = { label: catalog.label, btn_text: catalog.btn_text };
    if (prod) content.production = { label: prod.label, title: prod.title, description: prod.description, list_items: prod.list_items, btn_text: prod.btn_text };
    if (projects) content.projects = { label: projects.label, btn_text: projects.btn_text };
    if (contacts) content.contacts = { label: contacts.label, title: contacts.title, description: contacts.description, form_title: contacts.form_title, form_subtitle: contacts.form_subtitle, form_placeholder_name: contacts.form_placeholder_name, form_placeholder_phone: contacts.form_placeholder_phone, form_placeholder_message: contacts.form_placeholder_message, form_btn: contacts.form_btn };
    if (dealer) content.dealer = { title: dealer.title, description: dealer.description, btn_text: dealer.btn_text };

    if (Object.keys(content).length === 0) {
      const blocksRes = await api(`/items/formex_index_blocks?filter[lang][_eq]=${lang}&sort=sort&fields=block_id,content`);
      const blocks = blocksRes?.data || [];
      blocks.forEach((b) => { if (b.block_id && b.content) content[b.block_id] = b.content; });
    }
    indexByLang[lang] = content;
  }

  // Other pages
  const pages = ['about', 'catalog', 'production', 'projects', 'materials'];
  const pagesByPage = {};
  for (const page of pages) {
    pagesByPage[page] = {};
    for (const lang of langs) {
      const res = await api(`/items/formex_pages?filter[page][_eq]=${page}&filter[lang][_eq]=${lang}&limit=1`);
      pagesByPage[page][lang] = res?.data?.[0]?.content || {};
    }
  }

  const exportData = {
    _meta: { exported: new Date().toISOString(), directus: BASE },
    settings: settingsByLang,
    index: indexByLang,
    pages: pagesByPage,
  };

  if (!existsSync(OUTPUT_DIR)) mkdirSync(OUTPUT_DIR, { recursive: true });
  const outPath = join(OUTPUT_DIR, 'content.json');
  writeFileSync(outPath, JSON.stringify(exportData, null, 2), 'utf-8');
  // content.js — встраивается в страницу, не требует fetch (обходит CORS и кеш)
  const jsPath = join(OUTPUT_DIR, 'content.js');
  writeFileSync(jsPath, `window.FORMEX_CONTENT=${JSON.stringify(exportData)};`, 'utf-8');
  console.log('Written:', outPath, jsPath);
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
