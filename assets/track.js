/*
 * АвтоХаб: облік переходів на сайт.
 * Кожен перегляд сторінки записується в Google Таблицю (лист «Переходи»).
 * Мітка джерела береться з посилання: ?s=назва або ?utm_source=назва
 * і запам'ятовується до кінця візиту, тож заявка теж отримає це джерело.
 * Без cookies і сторонніх сервісів.
 */
(function () {
  var cfg = window.AUTOHUB_CONFIG || {};
  var url = cfg.formEndpoint;

  function get(store, k) { try { return window[store].getItem(k); } catch (e) { return null; } }
  function set(store, k, v) { try { window[store].setItem(k, v); } catch (e) {} }

  var p = new URLSearchParams(location.search);
  var src = {};
  if (p.get('s')) src.utm_source = p.get('s');
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach(function (k) {
    if (p.get(k)) src[k] = p.get(k);
  });

  // Джерело візиту: з посилання, інакше збережене на першій сторінці візиту.
  if (src.utm_source) set('sessionStorage', 'ah_src', JSON.stringify(src));
  else { try { src = JSON.parse(get('sessionStorage', 'ah_src') || '{}'); } catch (e) { src = {}; } }

  // Підставляємо джерело в приховане поле форми, якщо в адресі його вже немає.
  var utmField = document.getElementById('utm');
  if (utmField && src.utm_source && (!utmField.value || utmField.value === '{}')) {
    utmField.value = JSON.stringify(src);
  }

  if (!url || /^(file:|http:\/\/(localhost|127\.0\.0\.1))/.test(location.href)) return;

  // Ідентифікатор браузера: рахуємо унікальних відвідувачів, не людей.
  var vid = get('localStorage', 'ah_vid');
  var isNew = !vid;
  if (!vid) { vid = Date.now().toString(36) + Math.random().toString(36).slice(2, 8); set('localStorage', 'ah_vid', vid); }

  var page = location.pathname.replace(/^\/autohubkr/, '') || '/';
  var ref = document.referrer && document.referrer.indexOf(location.host) === -1 ? document.referrer : '';

  var body = JSON.stringify({
    type: 'visit',
    page: page,
    source: src.utm_source || (ref ? 'інший сайт' : 'пряме посилання'),
    utm: Object.keys(src).length ? JSON.stringify(src) : '',
    referrer: ref,
    device: window.matchMedia && window.matchMedia('(max-width: 760px)').matches ? 'телефон' : 'комп\'ютер',
    visitor: vid,
    new_visitor: isNew ? 'так' : 'ні'
  });

  try {
    fetch(url, { method: 'POST', mode: 'no-cors', keepalive: true,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: body });
  } catch (e) {}
})();
