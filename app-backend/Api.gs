/**
 * @OnlyCurrentDoc
 *
 * АвтоХаб MVP: серверна частина застосунку autohubkr.com/app/.
 * Дані зберігаються в цій Google Таблиці (листи створюються автоматично).
 *
 * Розгортання: «Розгорнути» → «Нове розгортання» → «Веб-застосунок»,
 * виконувати від імені «Я», доступ «Усі». Адресу /exec вписати в assets/config.js → appEndpoint.
 *
 * Модерація: новий СТО з'являється в каталозі лише після того, як на листі «СТО»
 * у колонці «Активний» поставити TRUE (приходить лист-сповіщення).
 */

var ADMIN_EMAIL = 'vaaanik8@gmail.com';
var SESSION_DAYS = 60;
var MAX_LEN = 1500;

var T = {
  users:    { name: 'Користувачі', cols: ['id', 'role', 'name', 'phone', 'pin_hash', 'salt', 'sto_id', 'created'],
              heads: ['ID', 'Роль', "Ім'я", 'Телефон', 'PIN (хеш)', 'Сіль', 'ID СТО', 'Створено'] },
  sessions: { name: 'Сесії', cols: ['token', 'user_id', 'expires'],
              heads: ['Токен', 'ID користувача', 'Діє до'] },
  cars:     { name: 'Авто', cols: ['id', 'user_id', 'make', 'model', 'year', 'plate', 'vin', 'mileage', 'created', 'deleted'],
              heads: ['ID', 'ID власника', 'Марка', 'Модель', 'Рік', 'Номер', 'VIN', 'Пробіг, км', 'Створено', 'Видалено'] },
  stos:     { name: 'СТО', cols: ['id', 'owner_id', 'name', 'district', 'address', 'phone', 'services', 'hours', 'about', 'active', 'created'],
              heads: ['ID', 'ID власника', 'Назва', 'Район', 'Адреса', 'Телефон', 'Послуги', 'Графік', 'Про сервіс', 'Активний', 'Створено'] },
  requests: { name: 'Заявки', cols: ['id', 'driver_id', 'car_id', 'sto_id', 'category', 'description', 'preferred', 'status',
                                     'sto_comment', 'price', 'visit', 'work_done', 'mileage', 'created', 'updated'],
              heads: ['ID', 'ID водія', 'ID авто', 'ID СТО', 'Категорія', 'Опис проблеми', 'Бажаний час', 'Статус',
                      'Коментар СТО', 'Ціна, грн', 'Запрошення на', 'Виконані роботи', 'Пробіг, км', 'Створено', 'Оновлено'] },
  history:  { name: 'Історія', cols: ['id', 'car_id', 'user_id', 'date', 'work', 'place', 'price', 'mileage', 'request_id', 'created'],
              heads: ['ID', 'ID авто', 'ID власника', 'Дата', 'Роботи', 'Де', 'Ціна, грн', 'Пробіг, км', 'ID заявки', 'Створено'] },
  reviews:  { name: 'Відгуки', cols: ['id', 'request_id', 'sto_id', 'driver_id', 'rating', 'text', 'created'],
              heads: ['ID', 'ID заявки', 'ID СТО', 'ID водія', 'Оцінка', 'Текст', 'Створено'] }
};

var CATEGORIES = ['Діагностика', 'Двигун', 'Ходова', 'Гальма', 'Електрика', 'ТО і мастило', 'Шини', 'Кузов і фарбування',
                  'Кондиціонер', 'ГБО', 'Скло', 'Інше'];
var DISTRICTS = ['Центрально-Міський', 'Металургійний', 'Саксаганський', 'Довгинцівський', 'Покровський', 'Тернівський', 'Інгулецький'];
var STATUS = { new: 'Нова', accepted: 'Прийнята', declined: 'Відхилена', in_work: 'У роботі', done: 'Виконана', cancelled: 'Скасована' };

/* ---------- вхід ---------- */

function doGet() { return out_({ ok: true, service: 'autohub-mvp' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    var fn = ACTIONS[req.action];
    if (!fn) return out_({ ok: false, error: 'Невідома дія' });
    lock.waitLock(20000);
    var res = fn(req);
    res.ok = res.ok !== false;
    return out_(res);
  } catch (err) {
    var msg = (err && err.userMessage) ? err.userMessage : 'Помилка сервера. Спробуйте ще раз.';
    if (!(err && err.userMessage)) console.error(err);
    return out_({ ok: false, error: msg });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

var ACTIONS = {
  'meta': function () { return { categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS }; },
  'register': register_,
  'login': login_,
  'logout': function (r) { var s = table_('sessions').find('token', r.token); if (s) table_('sessions').remove(s); return {}; },
  'me': function (r) { var u = auth_(r); return { user: pubUser_(u), sto: u.sto_id ? pubSto_(table_('stos').find('id', u.sto_id), true) : null }; },

  'cars.list': function (r) { var u = auth_(r, 'driver'); return { cars: myCars_(u) }; },
  'cars.add': carsAdd_,
  'cars.delete': function (r) {
    var u = auth_(r, 'driver'); var c = ownCar_(u, r.id);
    table_('cars').update(c, { deleted: 'так' }); return {};
  },

  'sto.catalog': catalog_,
  'sto.update': stoUpdate_,

  'req.create': reqCreate_,
  'req.list': reqList_,
  'req.update': reqUpdate_,

  'review.add': reviewAdd_,

  'history.list': function (r) {
    var u = auth_(r, 'driver'); var c = ownCar_(u, r.car_id);
    var rows = table_('history').all().filter(function (h) { return h.car_id === c.id; });
    rows.sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    return { history: rows.map(function (h) { return pick_(h, ['id', 'date', 'work', 'place', 'price', 'mileage', 'request_id']); }) };
  },
  'history.add': function (r) {
    var u = auth_(r, 'driver'); var c = ownCar_(u, r.car_id);
    var work = need_(r.work, 'Опишіть роботи');
    var row = table_('history').insert({ id: id_(), car_id: c.id, user_id: u.id, date: date_(r.date) || today_(),
      work: work, place: s_(r.place), price: num_(r.price), mileage: num_(r.mileage), request_id: '', created: now_() });
    if (row.mileage) bumpMileage_(c, row.mileage);
    return { id: row.id };
  }
};

/* ---------- облікові записи ---------- */

function register_(r) {
  var role = r.role === 'sto' ? 'sto' : 'driver';
  var phone = phone_(r.phone);
  var pin = String(r.pin || '');
  if (!/^\d{4,6}$/.test(pin)) fail_('PIN має бути з 4–6 цифр');
  var name = need_(r.name, "Вкажіть ім'я");
  var users = table_('users');
  if (users.find('phone', phone)) fail_('Цей номер уже зареєстровано. Увійдіть або зверніться до підтримки.');
  var salt = Utilities.getUuid();
  var user = users.insert({ id: id_(), role: role, name: name, phone: phone, pin_hash: hash_(pin, salt), salt: salt, sto_id: '', created: now_() });
  if (role === 'sto') {
    var st = r.sto || {};
    var sto = table_('stos').insert({ id: id_(), owner_id: user.id, name: need_(st.name, 'Вкажіть назву сервісу'),
      district: oneOf_(st.district, DISTRICTS), address: need_(st.address, 'Вкажіть адресу'),
      phone: phone_(st.phone || phone), services: list_(st.services, CATEGORIES).join(', '),
      hours: s_(st.hours), about: s_(st.about), active: false, created: now_() });
    users.update(user, { sto_id: sto.id });
    notify_('Новий СТО чекає перевірки: ' + sto.name,
      'Сервіс: ' + sto.name + '\nРайон: ' + sto.district + '\nАдреса: ' + sto.address + '\nТелефон: ' + sto.phone +
      '\nПослуги: ' + sto.services + "\nКонтакт: " + name + ', ' + phone +
      '\n\nЩоб показати сервіс у каталозі, поставте TRUE у колонці «Активний» на листі «СТО».');
  }
  return session_(user);
}

function login_(r) {
  var phone = phone_(r.phone);
  var cache = CacheService.getScriptCache();
  var key = 'tries_' + phone;
  var tries = Number(cache.get(key) || 0);
  if (tries >= 5) fail_('Забагато спроб. Зачекайте 10 хвилин.');
  var u = table_('users').find('phone', phone);
  if (!u || hash_(String(r.pin || ''), u.salt) !== u.pin_hash) {
    cache.put(key, String(tries + 1), 600);
    fail_('Невірний телефон або PIN');
  }
  cache.remove(key);
  return session_(u);
}

function session_(u) {
  var token = Utilities.getUuid() + Utilities.getUuid().slice(0, 8);
  var exp = new Date(Date.now() + SESSION_DAYS * 864e5);
  table_('sessions').insert({ token: token, user_id: u.id, expires: Utilities.formatDate(exp, 'Europe/Kiev', 'yyyy-MM-dd') });
  return { token: token, user: pubUser_(u) };
}

function auth_(r, role) {
  var s = r.token ? table_('sessions').find('token', String(r.token)) : null;
  if (!s || s.expires < today_()) { var e = new Error('auth'); e.userMessage = 'Увійдіть знову'; e.auth = true; throw e; }
  var u = table_('users').find('id', s.user_id);
  if (!u) fail_('Увійдіть знову');
  if (role && u.role !== role) fail_('Ця дія недоступна для вашого типу акаунта');
  return u;
}

/* ---------- авто ---------- */

function carsAdd_(r) {
  var u = auth_(r, 'driver');
  if (myCars_(u).length >= 10) fail_('Можна додати до 10 авто');
  var year = num_(r.year);
  if (year && (year < 1950 || year > new Date().getFullYear() + 1)) fail_('Перевірте рік випуску');
  var c = table_('cars').insert({ id: id_(), user_id: u.id, make: need_(r.make, 'Вкажіть марку'), model: need_(r.model, 'Вкажіть модель'),
    year: year, plate: s_(r.plate).toUpperCase(), vin: s_(r.vin).toUpperCase(), mileage: num_(r.mileage), created: now_(), deleted: '' });
  return { car: pubCar_(c) };
}

function myCars_(u) {
  return table_('cars').all().filter(function (c) { return c.user_id === u.id && !c.deleted; }).map(pubCar_);
}

function ownCar_(u, id) {
  var c = table_('cars').find('id', String(id || ''));
  if (!c || c.user_id !== u.id || c.deleted) fail_('Авто не знайдено');
  return c;
}

function bumpMileage_(car, km) {
  if (km && (!car.mileage || Number(km) > Number(car.mileage))) table_('cars').update(car, { mileage: km });
}

/* ---------- СТО ---------- */

function catalog_(r) {
  var reviews = table_('reviews').all();
  var list = table_('stos').all().filter(function (s) { return s.active === true || String(s.active).toUpperCase() === 'TRUE'; });
  if (r.category) list = list.filter(function (s) { return String(s.services).indexOf(r.category) !== -1; });
  if (r.district) list = list.filter(function (s) { return s.district === r.district; });
  var res = list.map(function (s) {
    var own = reviews.filter(function (v) { return v.sto_id === s.id; });
    var p = pubSto_(s);
    p.reviews = own.length;
    p.rating = own.length ? Math.round(own.reduce(function (a, v) { return a + Number(v.rating); }, 0) / own.length * 10) / 10 : null;
    p.lastReviews = own.slice(-3).reverse().map(function (v) { return { rating: v.rating, text: v.text, date: String(v.created).slice(0, 10) }; });
    return p;
  });
  res.sort(function (a, b) { return (b.rating || 0) - (a.rating || 0) || b.reviews - a.reviews; });
  return { stos: res };
}

function stoUpdate_(r) {
  var u = auth_(r, 'sto');
  var sto = table_('stos').find('id', u.sto_id);
  if (!sto) fail_('Профіль сервісу не знайдено');
  var f = r.fields || {};
  var patch = {};
  if (f.name !== undefined) patch.name = need_(f.name, 'Вкажіть назву');
  if (f.district !== undefined) patch.district = oneOf_(f.district, DISTRICTS);
  if (f.address !== undefined) patch.address = need_(f.address, 'Вкажіть адресу');
  if (f.phone !== undefined) patch.phone = phone_(f.phone);
  if (f.services !== undefined) patch.services = list_(f.services, CATEGORIES).join(', ');
  if (f.hours !== undefined) patch.hours = s_(f.hours);
  if (f.about !== undefined) patch.about = s_(f.about);
  table_('stos').update(sto, patch);
  return { sto: pubSto_(table_('stos').find('id', sto.id), true) };
}

/* ---------- заявки ---------- */

function reqCreate_(r) {
  var u = auth_(r, 'driver');
  var car = ownCar_(u, r.car_id);
  var sto = table_('stos').find('id', String(r.sto_id || ''));
  if (!sto || !(sto.active === true || String(sto.active).toUpperCase() === 'TRUE')) fail_('Сервіс недоступний');
  var open = table_('requests').all().filter(function (q) { return q.driver_id === u.id && (q.status === 'new'); });
  if (open.length >= 5) fail_('У вас уже 5 нових заявок. Дочекайтеся відповіді сервісів.');
  var q = table_('requests').insert({ id: id_(), driver_id: u.id, car_id: car.id, sto_id: sto.id,
    category: oneOf_(r.category, CATEGORIES), description: need_(r.description, 'Опишіть проблему'),
    preferred: s_(r.preferred), status: 'new', sto_comment: '', price: '', visit: '', work_done: '', mileage: '', created: now_(), updated: now_() });
  notify_('Нова заявка в АвтоХабі → ' + sto.name,
    'СТО: ' + sto.name + ' (' + sto.phone + ')\nАвто: ' + carTitle_(car) + '\nКатегорія: ' + q.category +
    '\nОпис: ' + q.description + '\nБажаний час: ' + (q.preferred || '—') + '\nВодій: ' + u.name + ', ' + u.phone);
  return { request: pubReq_(q) };
}

function reqList_(r) {
  var u = auth_(r);
  var all = table_('requests').all();
  var mine = u.role === 'driver' ? all.filter(function (q) { return q.driver_id === u.id; })
                                 : all.filter(function (q) { return q.sto_id === u.sto_id; });
  var cars = table_('cars').all(), stos = table_('stos').all(), users = table_('users').all(), reviews = table_('reviews').all();
  var by = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; };
  mine.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
  return { requests: mine.map(function (q) {
    var p = pubReq_(q);
    var car = by(cars, q.car_id), sto = by(stos, q.sto_id);
    p.car = car ? carTitle_(car) : '';
    p.sto = sto ? { id: sto.id, name: sto.name, phone: sto.phone, address: sto.address } : null;
    var rv = reviews.filter(function (v) { return v.request_id === q.id; })[0];
    p.review = rv ? { rating: rv.rating, text: rv.text } : null;
    if (u.role === 'sto') {
      var d = by(users, q.driver_id);
      // Телефон водія сервіс бачить лише після того, як прийняв заявку.
      p.driver = d ? { name: d.name, phone: q.status === 'new' || q.status === 'declined' ? '' : d.phone } : null;
    }
    return p;
  }) };
}

var FLOW = { accepted: ['new'], declined: ['new'], in_work: ['accepted'], done: ['accepted', 'in_work'], cancelled: ['new', 'accepted'] };

function reqUpdate_(r) {
  var u = auth_(r);
  var reqs = table_('requests');
  var q = reqs.find('id', String(r.id || ''));
  if (!q) fail_('Заявку не знайдено');
  var to = String(r.status || '');
  if (u.role === 'driver') {
    if (q.driver_id !== u.id) fail_('Заявку не знайдено');
    if (to !== 'cancelled') fail_('Водій може лише скасувати заявку');
  } else {
    if (q.sto_id !== u.sto_id) fail_('Заявку не знайдено');
    if (to === 'cancelled') fail_('Сервіс не скасовує заявку, а відхиляє її');
  }
  if (!FLOW[to] || FLOW[to].indexOf(q.status) === -1) fail_('Цей крок зараз недоступний');
  var patch = { status: to, updated: now_() };
  if (r.comment !== undefined) patch.sto_comment = s_(r.comment);
  if (r.price !== undefined && r.price !== '') patch.price = num_(r.price);
  if (r.visit !== undefined) patch.visit = s_(r.visit);
  if (to === 'done') {
    patch.work_done = need_(r.work_done, 'Опишіть виконані роботи');
    patch.mileage = num_(r.mileage);
  }
  reqs.update(q, patch);
  q = reqs.find('id', q.id);
  if (to === 'done') {
    var sto = table_('stos').find('id', q.sto_id);
    var car = table_('cars').find('id', q.car_id);
    table_('history').insert({ id: id_(), car_id: q.car_id, user_id: q.driver_id, date: today_(), work: q.work_done,
      place: sto ? sto.name : '', price: q.price, mileage: q.mileage, request_id: q.id, created: now_() });
    if (car && q.mileage) bumpMileage_(car, q.mileage);
  }
  return { request: pubReq_(q) };
}

function reviewAdd_(r) {
  var u = auth_(r, 'driver');
  var q = table_('requests').find('id', String(r.request_id || ''));
  if (!q || q.driver_id !== u.id) fail_('Заявку не знайдено');
  if (q.status !== 'done') fail_('Відгук можна залишити після виконання робіт');
  if (table_('reviews').find('request_id', q.id)) fail_('Відгук уже залишено');
  var rating = Math.round(num_(r.rating));
  if (!(rating >= 1 && rating <= 5)) fail_('Оцінка від 1 до 5');
  table_('reviews').insert({ id: id_(), request_id: q.id, sto_id: q.sto_id, driver_id: u.id, rating: rating, text: s_(r.text), created: now_() });
  return {};
}

/* ---------- публічні подання ---------- */

function pubUser_(u) { return { id: u.id, role: u.role, name: u.name, phone: u.phone }; }
function pubCar_(c) { return pick_(c, ['id', 'make', 'model', 'year', 'plate', 'vin', 'mileage']); }
function pubSto_(s, own) {
  var p = pick_(s, ['id', 'name', 'district', 'address', 'phone', 'hours', 'about']);
  p.services = String(s.services || '').split(', ').filter(String);
  if (own) p.active = s.active === true || String(s.active).toUpperCase() === 'TRUE';
  return p;
}
function pubReq_(q) {
  var p = pick_(q, ['id', 'car_id', 'sto_id', 'category', 'description', 'preferred', 'status', 'sto_comment', 'price', 'visit', 'work_done', 'mileage', 'created', 'updated']);
  p.status_label = STATUS[q.status] || q.status;
  return p;
}
function carTitle_(c) { return [c.make, c.model, c.year].filter(String).join(' ') + (c.plate ? ' · ' + c.plate : ''); }

/* ---------- таблиці ---------- */

var _cache = {};
function table_(key) {
  if (_cache[key]) return _cache[key];
  var def = T[key];
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(def.name);
  if (!sh) {
    sh = ss.insertSheet(def.name);
    sh.getRange(1, 1, 1, def.heads.length).setValues([def.heads]).setFontWeight('bold');
    sh.setFrozenRows(1);
  }
  var n = def.cols.length;
  var rows = null;
  function load() {
    if (rows) return rows;
    var last = sh.getLastRow();
    var vals = last > 1 ? sh.getRange(2, 1, last - 1, n).getValues() : [];
    rows = [];
    vals.forEach(function (v, i) {
      if (v.join('') === '') return;
      var o = { _row: i + 2 };
      def.cols.forEach(function (c, j) { o[c] = (v[j] === true || v[j] === false || typeof v[j] === 'number') ? v[j] : String(v[j]); });
      rows.push(o);
    });
    return rows;
  }
  function write(rowNum, obj) {
    var range = sh.getRange(rowNum, 1, 1, n);
    var vals = def.cols.map(function (c) { return obj[c] === undefined || obj[c] === null ? '' : obj[c]; });
    // Текстовий формат для всього, крім прапорця «Активний»: введене людиною не стане формулою.
    range.setNumberFormat('@');
    range.setValues([vals]);
  }
  var api = {
    all: function () { return load().slice(); },
    find: function (col, val) { var a = load(); for (var i = 0; i < a.length; i++) if (String(a[i][col]) === String(val)) return a[i]; return null; },
    insert: function (obj) {
      load();
      var rowNum = Math.max(sh.getLastRow() + 1, 2);
      var o = {}; def.cols.forEach(function (c) { o[c] = obj[c] === undefined ? '' : obj[c]; });
      write(rowNum, o);
      if (key === 'stos') sh.getRange(rowNum, def.cols.indexOf('active') + 1).setNumberFormat('General').setValue(obj.active === true);
      o._row = rowNum; rows.push(o);
      return o;
    },
    update: function (obj, patch) {
      Object.keys(patch).forEach(function (k) { obj[k] = patch[k]; });
      write(obj._row, obj);
      if (key === 'stos') sh.getRange(obj._row, def.cols.indexOf('active') + 1).setNumberFormat('General').setValue(obj.active === true || String(obj.active).toUpperCase() === 'TRUE');
      return obj;
    },
    remove: function (obj) { sh.getRange(obj._row, 1, 1, n).clearContent(); rows = null; }
  };
  _cache[key] = api;
  return api;
}

/* ---------- дрібниці ---------- */

function out_(o) { return ContentService.createTextOutput(JSON.stringify(o)).setMimeType(ContentService.MimeType.JSON); }
function fail_(msg) { var e = new Error(msg); e.userMessage = msg; throw e; }
function s_(v) { return v === null || v === undefined ? '' : String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, MAX_LEN); }
function need_(v, msg) { var x = s_(v); if (!x) fail_(msg); return x; }
function num_(v) { var x = Number(String(v === undefined || v === null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(x) && x > 0 ? x : ''; }
function oneOf_(v, list) { return list.indexOf(v) !== -1 ? v : fail_('Оберіть значення зі списку'); }
function list_(v, allowed) { return (Array.isArray(v) ? v : []).filter(function (x) { return allowed.indexOf(x) !== -1; }); }
function date_(v) { var x = s_(v); return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : ''; }
function phone_(v) {
  var d = String(v || '').replace(/\D/g, '');
  if (d.length === 10 && d[0] === '0') d = '38' + d;
  if (d.length === 9) d = '380' + d;
  if (!/^380\d{9}$/.test(d)) fail_('Вкажіть український номер телефону');
  return '+' + d;
}
function hash_(pin, salt) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, salt + ':' + pin)
    .map(function (b) { return ('0' + (b & 255).toString(16)).slice(-2); }).join('');
}
function id_() { return Utilities.getUuid().replace(/-/g, '').slice(0, 12); }
function now_() { return Utilities.formatDate(new Date(), 'Europe/Kiev', 'yyyy-MM-dd HH:mm'); }
function today_() { return Utilities.formatDate(new Date(), 'Europe/Kiev', 'yyyy-MM-dd'); }
function pick_(o, keys) { var r = {}; keys.forEach(function (k) { r[k] = o[k]; }); return r; }
function notify_(subject, body) {
  try { if (ADMIN_EMAIL) MailApp.sendEmail(ADMIN_EMAIL, '[АвтоХаб] ' + subject, body + '\n\nТаблиця: ' + SpreadsheetApp.getActiveSpreadsheet().getUrl()); }
  catch (e) { console.error(e); }
}

/** Запустіть один раз у редакторі: створить усі листи з заголовками. */
function setup() { Object.keys(T).forEach(function (k) { table_(k); }); }
