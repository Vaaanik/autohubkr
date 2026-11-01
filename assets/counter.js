/* АвтоХаб: справжні лічильники з бази (дія stats.public). Показуємо число, лише коли воно не менше CFG.counterMin. */
(function () {
  // кнопки «Швидше в Telegram»: t.me/<бот>?start=driver_<utm_source>
  var C0 = window.AUTOHUB_CONFIG || {}, btns = document.querySelectorAll('[data-tg-start]');
  if (!btns.length) return;
  var put = function (bot) {
    if (!bot) return;
    var src = ((location.search.match(/[?&]utm_source=([^&]+)/) || [])[1] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);
    Array.prototype.forEach.call(btns, function (a) {
      a.href = 'https://t.me/' + bot + '?start=' + a.getAttribute('data-tg-start') + (src ? '_' + src : '');
      a.rel = 'noopener'; a.hidden = false;
    });
  };
  if (C0.tgBot) return put(C0.tgBot);
  if (!C0.formEndpoint) return;
  fetch(C0.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'stats.public' }) })
    .then(function (r) { return r.json(); }).then(function (s) { if (s && s.ok) put(s.tgBot); }).catch(function () {});
})();
(function () {
  var CFG = window.AUTOHUB_CONFIG || {}, url = CFG.formEndpoint;
  if (!url) return;
  var min = typeof CFG.counterMin === 'number' ? CFG.counterMin : 10;
  var kind = /\/services\//.test(location.pathname) ? 'services' : /\/drivers\//.test(location.pathname) ? 'drivers' : '';
  var meter = document.getElementById('meter'), live = document.getElementById('liveCount');
  if (kind && typeof CFG[kind + 'Taken'] === 'number') return; // число задано вручну в config.js
  if (!meter && !live) return;
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'stats.public' }) })
    .then(function (r) { return r.json(); })
    .then(function (s) {
      if (!s || !s.ok) return;
      if (meter && kind) {
        var total = CFG[kind + 'Total'] || (kind === 'drivers' ? 300 : 30), n = Math.min(s[kind], total);
        if (n < min) return;
        meter.classList.add('on');
        document.getElementById('meterBar').style.width = Math.min(100, n / total * 100) + '%';
        document.getElementById('meterText').textContent = 'Зайнято ' + n + ' з ' + total + ' місць';
      }
      if (live) {
        var parts = [];
        if (s.catalog > 0) parts.push('<b>' + s.catalog + '</b> сервісів міста вже в каталозі');
        if (s.drivers >= min) parts.push('<b>' + s.drivers + '</b> водіїв у тесті');
        if (s.services >= min) parts.push('<b>' + s.services + '</b> сервісів-партнерів');
        if (parts.length) { live.innerHTML = parts.join(' · '); live.hidden = false; }
      }
    })
    .catch(function () {});
})();
