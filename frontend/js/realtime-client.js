/**
 * Formex Realtime — WebSocket-клиент для мгновенного обновления контента
 *
 * Подключается к formex-realtime, при событии content:update — вызывает
 * window.FormexContentApi.refresh() (если загружен content-api.js).
 *
 * Задайте window.REALTIME_WS_URL (например http://localhost:3001).
 * Если не задан — для localhost подставляется автоматически.
 */
(function () {
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const baseUrl = (window.REALTIME_WS_URL && String(window.REALTIME_WS_URL).trim())
    ? String(window.REALTIME_WS_URL).trim()
    : (isLocalhost ? 'http://localhost:3001' : '');
  if (!baseUrl) return;

  const script = document.createElement('script');
  script.src = 'https://cdn.socket.io/4.8.0/socket.io.min.js';
  script.crossOrigin = 'anonymous';
  script.onload = function () {
    const io = window.io;
    if (!io) return;
    const socket = io(baseUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });
    socket.on('content:update', function (data) {
      if (data && data.type === 'connected') return;
      if (typeof window.FormexContentApi !== 'undefined' && window.FormexContentApi.refresh) {
        window.FormexContentApi.refresh();
      }
    });
  };
  document.head.appendChild(script);
})();
