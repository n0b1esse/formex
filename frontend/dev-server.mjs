#!/usr/bin/env node
/**
 * Formex — dev-сервер для фронтенда с прокси к Directus.
 * Решает проблему CORS: API и сайт на одном origin.
 *
 * Запуск: cd frontend && node dev-server.mjs
 * Сайт: http://localhost:3080
 * API прокси: http://localhost:3080/directus-api/ -> http://localhost:8055/
 */

import { createServer } from 'http';
import { readFileSync, existsSync } from 'fs';
import { join, extname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const PORT = 3080;
const DIRECTUS_URL = 'http://localhost:8055';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

async function proxyToDirectus(req, res) {
  const directusPath = (req.url || '/').replace(/^\/directus-api/, '') || '/';
  const url = new URL(directusPath, DIRECTUS_URL);
  const headers = { ...req.headers, host: url.host };
  delete headers.connection;

  try {
    const proxyReq = await fetch(url.toString(), {
      method: req.method,
      headers,
    });
    const proxyRes = proxyReq;
    res.writeHead(proxyRes.status, Object.fromEntries(proxyRes.headers.entries()));
    res.end(Buffer.from(await proxyRes.arrayBuffer()));
  } catch (e) {
    console.error('Proxy error:', e.message);
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('Proxy error: ' + e.message);
  }
}

async function handler(req, res) {
  const pathname = new URL(req.url || '/', 'http://localhost').pathname;

  if (pathname.startsWith('/directus-api')) {
    return proxyToDirectus(req, res);
  }

  if (!serveFileWithProxy(pathname, res)) {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  }
}

// Подмена API URL на прокси при отдаче HTML
function serveFileWithProxy(pathname, res) {
  let file = join(__dirname, pathname === '/' ? 'index.html' : pathname);
  if (!existsSync(file) && (pathname.endsWith('/') || !extname(pathname))) {
    const tryIndex = join(__dirname, pathname, 'index.html');
    if (existsSync(tryIndex)) file = tryIndex;
  }
  if (!existsSync(file)) return false;
  const ext = extname(file);
  let data;
  if (file.endsWith('.html')) {
    data = readFileSync(file, 'utf-8');
    if (data.includes('DIRECTUS_API_URL')) {
      data = data.replace(
        /window\.DIRECTUS_API_URL\s*=\s*window\.DIRECTUS_API_URL\s*\|\|\s*'[^']*'/,
        "window.DIRECTUS_API_URL = window.DIRECTUS_API_URL || 'http://localhost:3080/directus-api'"
      );
    }
    res.writeHead(200, { 'Content-Type': MIME[ext] });
    res.end(data);
  } else {
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    res.end(readFileSync(file));
  }
  return true;
}

createServer(handler).listen(PORT, () => {
  console.log(`Formex dev-сервер: http://localhost:${PORT}`);
  console.log(`Directus API прокси: http://localhost:${PORT}/directus-api/`);
  console.log('Откройте сайт в браузере — контент из Directus будет подгружаться.');
});
