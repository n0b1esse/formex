/** Formex Content API: Directus или data/content.json / window.FORMEX_CONTENT */
(function () {
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const API_URL = isLocalhost ? (window.DIRECTUS_API_URL || 'http://localhost:8055') : '';
  const getStaticUrl = () => {
    const base = (window.FORMEX_BASE != null) ? window.FORMEX_BASE : (() => {
      const parts = location.pathname.split('/').filter(Boolean);
      const first = parts[0];
      if (!first || first.includes('.') || first === 'en' || first === 'ky') return '';
      return '/' + first;
    })();
    return (base || '') + '/data/content.json';
  };

  const lang = document.documentElement.lang || 'ru';
  const page = getPageFromPath();

  let cache = {};

  function getPageFromPath() {
    const path = window.location.pathname;
    const match = path.match(/\/(en|ky)\/([a-z]+)\.html?$/) || path.match(/\/([a-z]+)\.html?$/);
    if (match) return (match[2] || match[1] || 'index').replace('.html', '');
    if (path.match(/\/(en|ky)\/?$/) || path.endsWith('/') || path.endsWith('/index.html')) return 'index';
    return 'index';
  }

  async function fetchJSON(url) {
    if (cache[url]) return cache[url];
    try {
      const r = await fetch(url);
      if (!r.ok) return null;
      const data = await r.json();
      cache[url] = data;
      return data;
    } catch (e) {
      console.warn('Formex Content API:', e.message);
      return null;
    }
  }

  function getNested(obj, path) {
    return path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : null), obj);
  }

  function escapeHtml(s) {
    const div = document.createElement('div');
    div.textContent = s;
    return div.innerHTML;
  }

  function applyContent(content, settings, baseUrl) {
    const assetBase = baseUrl || API_URL || location.origin;
    document.querySelectorAll('[data-directus]').forEach((el) => {
      const key = el.getAttribute('data-directus');
      if (!key) return;
      let value = null;
      if (key.startsWith('settings.')) {
        value = getNested(settings, key.replace('settings.', ''));
      } else {
        value = getNested(content, key);
      }
      if (value != null) {
        if (el.tagName === 'IMG' && typeof value === 'string') {
          el.src = value.startsWith('http') ? value : `${assetBase}/assets/${value}`;
        } else {
          el.textContent = String(value);
        }
      }
    });

    document.querySelectorAll('[data-directus-href]').forEach((el) => {
      const key = el.getAttribute('data-directus-href');
      const value = key?.startsWith('settings.') ? getNested(settings, key.replace('settings.', '')) : getNested(content, key);
      if (value != null) {
        let hrefVal = String(value);
        if (el.tagName === 'A' && hrefVal.includes('@') && !hrefVal.startsWith('mailto:')) hrefVal = 'mailto:' + hrefVal;
        el.href = hrefVal;
      }
    });

    document.querySelectorAll('[data-directus-placeholder]').forEach((el) => {
      const key = el.getAttribute('data-directus-placeholder');
      const value = getNested(content, key);
      if (value != null) el.placeholder = String(value);
    });

    document.querySelectorAll('[data-directus-list]').forEach((el) => {
      const key = el.getAttribute('data-directus-list');
      const value = getNested(content, key);
      if (Array.isArray(value) && (el.tagName === 'UL' || el.tagName === 'OL')) {
        el.innerHTML = value.map((v) => `<li>${escapeHtml(String(v))}</li>`).join('');
      }
    });
  }

  async function loadFromStatic() {
    if (window.FORMEX_CONTENT) {
      const data = window.FORMEX_CONTENT;
      const settings = data.settings?.[lang] || {};
      const content = page === 'index' ? (data.index?.[lang] || {}) : (data.pages?.[page]?.[lang] || {});
      return { content, settings };
    }
    const data = await fetchJSON(getStaticUrl());
    if (!data) return null;
    const settings = data.settings?.[lang] || {};
    let content = {};
    if (page === 'index') {
      content = data.index?.[lang] || {};
    } else {
      content = data.pages?.[page]?.[lang] || {};
    }
    return { content, settings };
  }

  async function loadFromApi() {
    const settingsRes = await fetchJSON(`${API_URL}/items/formex_settings?filter[lang][_eq]=${lang}`);
    let content = {};
    if (page === 'index') {
      const typed = await Promise.all([
        fetchJSON(`${API_URL}/items/formex_hero?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_about_block?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_catalog_block?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_production_block?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_projects_block?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_contacts_block?filter[lang][_eq]=${lang}&limit=1`),
        fetchJSON(`${API_URL}/items/formex_dealer_block?filter[lang][_eq]=${lang}&limit=1`),
      ]);
      const [heroR, aboutR, catalogR, prodR, projectsR, contactsR, dealerR] = typed;
      const hero = heroR?.data?.[0];
      const about = aboutR?.data?.[0];
      const catalog = catalogR?.data?.[0];
      const prod = prodR?.data?.[0];
      const projects = projectsR?.data?.[0];
      const contacts = contactsR?.data?.[0];
      const dealer = dealerR?.data?.[0];

      if (hero) content.hero = { badge: hero.badge, title: hero.title, subtitle: hero.subtitle, image: hero.image, btn1_text: hero.btn1_text, btn1_link: hero.btn1_link, btn2_text: hero.btn2_text, btn2_link: hero.btn2_link };
      if (about) content.about = { label: about.label, title: about.title, description: about.description, image: about.image, stat1_num: about.stat1_num, stat1_label: about.stat1_label, stat2_num: about.stat2_num, stat2_label: about.stat2_label, btn_text: about.btn_text };
      if (catalog) content.catalog = { label: catalog.label, btn_text: catalog.btn_text };
      if (prod) content.production = { label: prod.label, title: prod.title, description: prod.description, list_items: prod.list_items, btn_text: prod.btn_text };
      if (projects) content.projects = { label: projects.label, btn_text: projects.btn_text };
      if (contacts) content.contacts = { label: contacts.label, title: contacts.title, description: contacts.description, form_title: contacts.form_title, form_subtitle: contacts.form_subtitle, form_placeholder_name: contacts.form_placeholder_name, form_placeholder_phone: contacts.form_placeholder_phone, form_placeholder_message: contacts.form_placeholder_message, form_btn: contacts.form_btn };
      if (dealer) content.dealer = { title: dealer.title, description: dealer.description, btn_text: dealer.btn_text };

      if (Object.keys(content).length === 0) {
        const blocksRes = await fetchJSON(`${API_URL}/items/formex_index_blocks?filter[lang][_eq]=${lang}&sort=sort&fields=block_id,content`);
        const blocks = blocksRes?.data || [];
        blocks.forEach((b) => { if (b.block_id && b.content) content[b.block_id] = b.content; });
      }
    } else {
      const pageRes = await fetchJSON(
        `${API_URL}/items/formex_pages?filter[page][_eq]=${page}&filter[lang][_eq]=${lang}&limit=1`
      );
      content = pageRes?.data?.[0]?.content || {};
    }
    const settingsList = settingsRes?.data || [];
    const settings = {};
    settingsList.forEach((s) => { settings[s.key] = s.value; });
    return { content, settings };
  }

  async function init() {
    let result = null;
    if (API_URL) {
      try {
        result = await loadFromApi();
      } catch (e) {
        console.warn('Formex Content API: API failed, fallback to static', e.message);
      }
      // Если API вернул пустой контент — пробуем статику
      if (result && page === 'index' && !result.content?.hero && !result.content?.about) result = null;
    }
    if (!result) {
      result = await loadFromStatic();
    }
    if (!result) {
      console.warn('Formex Content API: no content loaded');
      return;
    }
    applyContent(result.content, result.settings, API_URL || location.origin);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
