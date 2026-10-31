/**
 * АвтоХаб MVP: серверна частина застосунку autohubkr.com/app/.
 * Дані зберігаються в Google Таблиці SHEET_ID (листи створюються автоматично).
 * Окремий скрипт (не прив'язаний до таблиці): так його можна створити в акаунті vaaanik8@gmail.com,
 * коли в браузері відкрито кілька акаунтів Google.
 *
 * Розгортання: «Розгорнути» → «Нове розгортання» → «Веб-застосунок»,
 * виконувати від імені «Я», доступ «Усі». Адресу /exec вписати в assets/config.js → appEndpoint.
 *
 * Модерація: новий СТО з'являється в каталозі лише після того, як на листі «СТО»
 * у колонці «Активний» поставити TRUE (приходить лист-сповіщення).
 *
 * Довідкові СТО: рядки з порожнім «ID власника» (джерело «каталог») показуються водіям
 * з кнопками «Подзвонити» і «На карті», але заявки в них не надсилаються.
 *
 * Адміністратор: на листі «Користувачі» змінити «Роль» потрібного акаунта на admin.
 * Координати СТО для карти: OpenStreetMap (Nominatim), кнопка в адмін-панелі або функція geocodeAll().
 *
 * AI-помічник (Google Gemini): «Налаштування проєкту» → «Властивості скрипту» →
 * GEMINI_API_KEY = ключ з aistudio.google.com. Необов'язково: GEMINI_MODEL.
 */

var ADMIN_EMAIL = 'vaaanik8@gmail.com';
// З 31.10.2026 дані й логіка живуть у Supabase (supabase/functions/api). Цей скрипт лише пересилає листи адміністратору.
var MIGRATED = true;
var RELAY_LIMIT = 60; // листів на годину
var SHEET_ID = '1q05aDr-xorCI6q8YmOO4aVuPQpg1foL0RqP1YGD2PSc'; // «АвтоХаб MVP: дані застосунку»
var SESSION_DAYS = 60;
var MAX_LEN = 1500;

var T = {
  users:    { name: 'Користувачі', cols: ['id', 'role', 'name', 'phone', 'pin_hash', 'salt', 'sto_id', 'created'],
              heads: ['ID', 'Роль', "Ім'я", 'Телефон', 'PIN (хеш)', 'Сіль', 'ID СТО', 'Створено'] },
  sessions: { name: 'Сесії', cols: ['token', 'user_id', 'expires'],
              heads: ['Токен', 'ID користувача', 'Діє до'] },
  cars:     { name: 'Авто', cols: ['id', 'user_id', 'make', 'model', 'year', 'plate', 'vin', 'mileage', 'created', 'deleted'],
              heads: ['ID', 'ID власника', 'Марка', 'Модель', 'Рік', 'Номер', 'VIN', 'Пробіг, км', 'Створено', 'Видалено'] },
  stos:     { name: 'СТО', cols: ['id', 'owner_id', 'name', 'district', 'address', 'phone', 'services', 'hours', 'about', 'active', 'created', 'source', 'lat', 'lng'],
              heads: ['ID', 'ID власника', 'Назва', 'Район', 'Адреса', 'Телефон', 'Послуги', 'Графік', 'Про сервіс', 'Активний', 'Створено', 'Джерело', 'Широта', 'Довгота'] },
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
var URGENCY = ['Можна планувати', 'Варто не відкладати', 'Небезпечно їхати'];
var GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
var AI_LIMIT = 15; // запитів до AI на одного водія за 6 годин
var NO_LOCK = { 'ai.diagnose': true, 'meta': true, 'admin.geocode': true };
var DISTRICT_HINTS = [['Центрально-Міськ', 0], ['Центрально-Городск', 0], ['Металург', 1], ['Металлург', 1], ['Жовтнев', 1], ['Октябрьск', 1],
  ['Саксаган', 2], ['Довгинц', 3], ['Долгинц', 3], ['Покровськ', 4], ['Покровск', 4], ['Дзержин', 4], ['Тернів', 5], ['Терновск', 5], ['Інгулец', 6], ['Ингулец', 6]];
var STATUS = { new: 'Нова', accepted: 'Прийнята', declined: 'Відхилена', in_work: 'У роботі', done: 'Виконана', cancelled: 'Скасована' };

/* ---------- вхід ---------- */

function doGet() { return out_({ ok: true, service: 'autohub-mvp' }); }

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (req.action === 'relay.notify') return out_(relayNotify_(req));
    if (MIGRATED && req.action !== 'meta') return out_({ ok: false, error: 'Застосунок оновлено. Оновіть сторінку.' });
    var fn = ACTIONS[req.action];
    if (!fn) return out_({ ok: false, error: 'Невідома дія' });
    if (!NO_LOCK[req.action]) lock.waitLock(20000);
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
  'meta': function () { return { categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS, urgency: URGENCY }; },
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

  'ai.diagnose': aiDiagnose_,

  'admin.stats': adminStats_,
  'admin.stos': adminStos_,
  'admin.sto.set': adminStoSet_,
  'admin.requests': adminRequests_,
  'admin.users': adminUsers_,
  'admin.geocode': function (r) { auth_(r, 'admin'); return geocodeBatch_(Math.min(Number(r.limit) || 25, 40), r.retry === true); },

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

/* ---------- пересилання листів для сервера Supabase ---------- */
// Лист іде лише на ADMIN_EMAIL, тож сторонній запит не може надіслати пошту комусь іншому; є ліміт на годину.
function relayNotify_(r) {
  var cache = CacheService.getScriptCache();
  var n = Number(cache.get('relay_n') || 0);
  if (n >= RELAY_LIMIT) return { ok: false, error: 'limit' };
  cache.put('relay_n', String(n + 1), 3600);
  var subject = s_(r.subject).slice(0, 150), body = s_(r.body);
  if (!subject) return { ok: false, error: 'empty' };
  MailApp.sendEmail(ADMIN_EMAIL, '[АвтоХаб] ' + subject, body + '\n\nАдмін-панель: https://autohubkr.com/app/');
  return { ok: true };
}

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
      hours: s_(st.hours), about: s_(st.about), active: false, created: now_(), source: 'реєстрація' });
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
  var list = table_('stos').all().filter(isActive_);
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
  // Спершу партнери (приймають заявки), далі довідкові сервіси.
  res.sort(function (a, b) { return (a.listed ? 1 : 0) - (b.listed ? 1 : 0) || (b.rating || 0) - (a.rating || 0) || b.reviews - a.reviews; });
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
  if (!sto || !isActive_(sto)) fail_('Сервіс недоступний');
  if (!sto.owner_id) fail_('Цей сервіс ще не підключений до АвтоХабу. Зателефонуйте йому напряму.');
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

/* ---------- адміністратор ---------- */

function adminStats_(r) {
  auth_(r, 'admin');
  var users = table_('users').all(), stos = table_('stos').all(), reqs = table_('requests').all(), cars = table_('cars').all();
  var byStatus = {}; Object.keys(STATUS).forEach(function (k) { byStatus[k] = 0; });
  reqs.forEach(function (q) { byStatus[q.status] = (byStatus[q.status] || 0) + 1; });
  var week = Utilities.formatDate(new Date(Date.now() - 7 * 864e5), 'Europe/Kiev', 'yyyy-MM-dd');
  return { stats: {
    drivers: users.filter(function (u) { return u.role === 'driver'; }).length,
    stoUsers: users.filter(function (u) { return u.role === 'sto'; }).length,
    newUsersWeek: users.filter(function (u) { return String(u.created) >= week; }).length,
    cars: cars.filter(function (c) { return !c.deleted; }).length,
    partners: stos.filter(function (s) { return s.owner_id && isActive_(s); }).length,
    pending: stos.filter(function (s) { return s.owner_id && !isActive_(s); }).length,
    listed: stos.filter(function (s) { return !s.owner_id; }).length,
    noCoords: stos.filter(function (s) { return !Number(s.lat); }).length,
    requests: reqs.length, requestsWeek: reqs.filter(function (q) { return String(q.created) >= week; }).length,
    byStatus: byStatus, reviews: table_('reviews').all().length,
    aiReady: !!PropertiesService.getScriptProperties().getProperty('GEMINI_API_KEY')
  }, statuses: STATUS };
}

function adminStos_(r) {
  auth_(r, 'admin');
  var users = table_('users').all();
  var list = table_('stos').all().map(function (s) {
    var p = pubSto_(s, true);
    p.owner = null;
    if (s.owner_id) { var o = users.filter(function (u) { return u.id === s.owner_id; })[0]; p.owner = o ? { name: o.name, phone: o.phone } : { name: '—', phone: '' }; }
    p.source = s.source; p.created = s.created; p.geo = String(s.lat).charAt(0) === 'x' ? 'not_found' : (Number(s.lat) ? 'ok' : '');
    return p;
  });
  var rank = function (s) { return s.owner && !s.active ? 0 : s.owner ? 1 : 2; };
  list.sort(function (a, b) { return rank(a) - rank(b) || (a.created < b.created ? 1 : -1); });
  return { stos: list };
}

function adminStoSet_(r) {
  auth_(r, 'admin');
  var sto = table_('stos').find('id', String(r.id || ''));
  if (!sto) fail_('Сервіс не знайдено');
  var f = r.fields || {}, patch = {};
  if (r.active !== undefined) patch.active = r.active === true;
  if (f.name !== undefined) patch.name = need_(f.name, 'Вкажіть назву');
  if (f.district !== undefined) patch.district = f.district ? oneOf_(f.district, DISTRICTS) : '';
  if (f.address !== undefined) { patch.address = s_(f.address); if (patch.address !== sto.address) { patch.lat = ''; patch.lng = ''; } }
  if (f.phone !== undefined) patch.phone = f.phone ? phone_(f.phone) : '';
  if (f.services !== undefined) patch.services = list_(f.services, CATEGORIES).join(', ');
  if (f.hours !== undefined) patch.hours = s_(f.hours);
  if (f.about !== undefined) patch.about = s_(f.about);
  if (f.lat !== undefined || f.lng !== undefined) {
    var la = Number(f.lat), ln = Number(f.lng);
    if (f.lat === '' && f.lng === '') { patch.lat = ''; patch.lng = ''; }
    else if (la > 47 && la < 49 && ln > 32 && ln < 35) { patch.lat = la; patch.lng = ln; }
    else fail_('Координати мають бути в районі Кривого Рогу');
  }
  table_('stos').update(sto, patch);
  // Під час активації одразу шукаємо сервіс на карті, якщо координат ще немає.
  if (patch.active === true && !Number(sto.lat) && sto.address) {
    try { var g = geocodeOne_(sto.address);
      if (g && !g.notFound) table_('stos').update(sto, { lat: g.lat, lng: g.lng, district: sto.district || g.district });
    } catch (e) { console.error(e); }
  }
  var p = pubSto_(sto, true); p.source = sto.source; p.geo = String(sto.lat).charAt(0) === 'x' ? 'not_found' : (Number(sto.lat) ? 'ok' : '');
  return { sto: p };
}

function adminRequests_(r) {
  auth_(r, 'admin');
  var cars = table_('cars').all(), stos = table_('stos').all(), users = table_('users').all(), reviews = table_('reviews').all();
  var by = function (arr, id) { for (var i = 0; i < arr.length; i++) if (arr[i].id === id) return arr[i]; return null; };
  var all = table_('requests').all();
  all.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
  return { requests: all.slice(0, 300).map(function (q) {
    var p = pubReq_(q), car = by(cars, q.car_id), sto = by(stos, q.sto_id), d = by(users, q.driver_id), rv = reviews.filter(function (v) { return v.request_id === q.id; })[0];
    p.car = car ? carTitle_(car) : ''; p.sto = sto ? { name: sto.name, phone: sto.phone } : null;
    p.driver = d ? { name: d.name, phone: d.phone } : null; p.review = rv ? { rating: rv.rating, text: rv.text } : null;
    return p;
  }), total: all.length };
}

function adminUsers_(r) {
  auth_(r, 'admin');
  var cars = table_('cars').all(), reqs = table_('requests').all(), stos = table_('stos').all();
  var list = table_('users').all().map(function (u) {
    var st = u.sto_id ? stos.filter(function (s) { return s.id === u.sto_id; })[0] : null;
    return { id: u.id, role: u.role, name: u.name, phone: u.phone, created: u.created, sto: st ? st.name : '',
      cars: cars.filter(function (c) { return c.user_id === u.id && !c.deleted; }).length,
      requests: reqs.filter(function (q) { return q.driver_id === u.id || (u.sto_id && q.sto_id === u.sto_id); }).length };
  });
  list.sort(function (a, b) { return a.created < b.created ? 1 : -1; });
  return { users: list };
}

/* ---------- координати (OpenStreetMap Nominatim) ---------- */

function geocodeOne_(address) {
  var base = String(address || '').trim();
  if (!base) return null;
  var plain = base.replace(/^(вул\.|вулиця|ул\.|улица|пр-т|просп\.|проспект|пров\.|провулок|пер\.|бул\.|бульвар)\s*/i, '');
  var street = plain.replace(/,?\s*\d.*$/, '').trim(); // без номера будинку: точність до вулиці
  var tries = [base + ', Кривий Ріг', plain + ', Кривий Ріг'];
  if (street && street.length > 3) tries.push(street + ', Кривий Ріг');
  for (var i = 0; i < tries.length; i++) {
    if (tries.indexOf(tries[i]) !== i) continue;
    var url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=ua&accept-language=uk' +
      '&viewbox=33.05,48.15,33.65,47.62&bounded=1&q=' + encodeURIComponent(tries[i]);
    var resp = UrlFetchApp.fetch(url, { muteHttpExceptions: true, headers: { 'User-Agent': 'AutoHubKR/1.0 (info@autohubkr.com)' } });
    Utilities.sleep(1100); // правила Nominatim: не частіше 1 запиту на секунду
    if (resp.getResponseCode() !== 200) continue;
    var arr = JSON.parse(resp.getContentText() || '[]');
    if (arr.length) {
      var a = arr[0].address || {}, txt = [a.city_district, a.borough, a.suburb, a.district].filter(String).join(' '), dist = '';
      for (var k = 0; k < DISTRICT_HINTS.length; k++) if (txt.indexOf(DISTRICT_HINTS[k][0]) !== -1) { dist = DISTRICTS[DISTRICT_HINTS[k][1]]; break; }
      return { lat: Math.round(Number(arr[0].lat) * 1e6) / 1e6, lng: Math.round(Number(arr[0].lon) * 1e6) / 1e6, district: dist };
    }
  }
  return { notFound: true };
}

/** Визначає координати й район для СТО без координат. Мережеві запити йдуть без блокування, запис — під блокуванням. */
function geocodeBatch_(limit, retry) {
  // Звичайний прохід: ще не шукані. Повторний (retry): ті, що не знайшлися раз (x); після другої невдачі — xx.
  var todo = table_('stos').all().filter(function (s) { return s.address && (retry ? s.lat === 'x' : (!Number(s.lat) && String(s.lat).charAt(0) !== 'x')); }).slice(0, limit);
  var found = [];
  todo.forEach(function (s) { var g = geocodeOne_(s.address); if (g) found.push([s.id, g]); });
  var lock = LockService.getScriptLock(); lock.waitLock(20000);
  try {
    _cache = {};
    var ok = 0, miss = 0;
    found.forEach(function (x) {
      var s = table_('stos').find('id', x[0]); if (!s) return;
      if (x[1].notFound) { table_('stos').update(s, { lat: retry ? 'xx' : 'x', lng: '' }); miss++; return; }
      var patch = { lat: x[1].lat, lng: x[1].lng };
      if (!s.district && x[1].district) patch.district = x[1].district;
      table_('stos').update(s, patch); ok++;
    });
    var left = table_('stos').all().filter(function (s) { return s.address && (retry ? s.lat === 'x' : (!Number(s.lat) && String(s.lat).charAt(0) !== 'x')); }).length;
    return { done: ok, notFound: miss, left: left };
  } finally { lock.releaseLock(); }
}

/** Запустіть у редакторі, щоб визначити координати всіх СТО (до ~5 хвилин). */
function geocodeAll() {
  var t0 = Date.now(), res;
  do { res = geocodeBatch_(20); console.log(JSON.stringify(res)); } while (res.left && Date.now() - t0 < 270000);
}

/** Повторний пошук для СТО, які раніше не знайшлися (з пошуком до рівня вулиці). */
function geocodeRetry() {
  var t0 = Date.now(), res;
  do { res = geocodeBatch_(15, true); console.log(JSON.stringify(res)); } while (res.left && Date.now() - t0 < 250000);
}

/* ---------- AI-помічник (Google Gemini) ---------- */

function aiDiagnose_(r) {
  var u = auth_(r, 'driver');
  var text = need_(r.description, 'Опишіть проблему');
  if (text.length < 10) fail_('Опишіть проблему трохи детальніше');
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('GEMINI_API_KEY');
  if (!key) fail_('AI-помічник ще не налаштований');
  var cache = CacheService.getScriptCache();
  var ck = 'ai_' + u.id;
  var used = Number(cache.get(ck) || 0);
  if (used >= AI_LIMIT) fail_('Ліміт AI-підказок вичерпано. Спробуйте за кілька годин.');
  cache.put(ck, String(used + 1), 21600);

  var carInfo = '';
  if (r.car_id) {
    var c = table_('cars').find('id', String(r.car_id));
    if (c && c.user_id === u.id && !c.deleted) carInfo = [c.make, c.model, c.year].filter(String).join(' ') + (c.mileage ? ', пробіг ' + c.mileage + ' км' : '');
  }
  var system = [
    'Ти помічник застосунку АвтоХаб (Кривий Ріг, Україна). Водій описує проблему з авто, а ти даєш попередню оцінку перед візитом на СТО.',
    'Відповідай лише українською, коротко і зрозуміло людині без технічної освіти.',
    'category: одна категорія з переліку. urgency: «Небезпечно їхати», якщо є ознаки проблем з гальмами, кермом, підвіскою на ходу, запах палива, дим, перегрів, червоні лампи на панелі; інакше оціни реально.',
    'causes: 2–4 ймовірні причини, від найімовірнішої, кожна одним реченням. checks: 1–3 безпечні перевірки, які водій може зробити сам без інструментів (або порожньо).',
    'ask_sto: 1–3 питання, які варто поставити майстру. request_text: чіткий опис для заявки в СТО від першої особи, 1–3 речення, лише факти з опису водія, нічого не вигадуй.',
    'summary: одне речення-висновок. Не стверджуй діагноз упевнено і не давай інструкцій з ремонту.',
    'Якщо текст не про авто, category «Інше», а в summary попроси описати проблему з авто.'
  ].join('\n');
  var prompt = (carInfo ? 'Авто: ' + carInfo + '\n' : '') + 'Опис водія: ' + text;
  var schema = { type: 'OBJECT', properties: {
    category: { type: 'STRING', enum: CATEGORIES }, urgency: { type: 'STRING', enum: URGENCY },
    summary: { type: 'STRING' }, causes: { type: 'ARRAY', items: { type: 'STRING' } },
    checks: { type: 'ARRAY', items: { type: 'STRING' } }, ask_sto: { type: 'ARRAY', items: { type: 'STRING' } },
    request_text: { type: 'STRING' } }, required: ['category', 'urgency', 'summary', 'causes', 'request_text'] };
  var body = JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.3, maxOutputTokens: 4096 } });
  var custom = props.getProperty('GEMINI_MODEL');
  // Моделі, що нещодавно не відповіли, тимчасово пропускаємо: так відповідь приходить швидше.
  var models = custom ? [custom] : GEMINI_MODELS.filter(function (m, i) { return i === GEMINI_MODELS.length - 1 || !cache.get('ai_skip_' + m); });
  var lastCode = 0;
  for (var i = 0; i < models.length; i++) {
    var resp = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', {
      method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key }, payload: body, muteHttpExceptions: true });
    lastCode = resp.getResponseCode();
    if (lastCode === 200) {
      var data = JSON.parse(resp.getContentText());
      var parts = (((data.candidates || [])[0] || {}).content || {}).parts || [];
      var raw = parts.map(function (p) { return p.thought ? '' : (p.text || ''); }).join('');
      var a;
      try { a = JSON.parse(raw); } catch (e) { console.error('AI JSON', raw); fail_('AI не зміг відповісти. Спробуйте переформулювати.'); }
      var arr = function (v, n) { return (Array.isArray(v) ? v : []).map(s_).filter(String).slice(0, n); };
      return { ai: { category: CATEGORIES.indexOf(a.category) !== -1 ? a.category : 'Інше',
        urgency: URGENCY.indexOf(a.urgency) !== -1 ? a.urgency : URGENCY[1], summary: s_(a.summary),
        causes: arr(a.causes, 4), checks: arr(a.checks, 3), ask_sto: arr(a.ask_sto, 3), request_text: s_(a.request_text), model: models[i] } };
    }
    console.error('Gemini ' + models[i] + ' → ' + lastCode + ': ' + resp.getContentText().slice(0, 300));
    if (!custom && i < models.length - 1) cache.put('ai_skip_' + models[i], '1', lastCode === 404 ? 21600 : 600);
    if ([404, 429, 500, 503].indexOf(lastCode) === -1) break; // інші помилки (ключ тощо) не лікуються іншою моделлю
  }
  cache.put(ck, String(used), 21600); // невдалий запит не рахуємо
  fail_(lastCode === 429 ? 'AI зараз перевантажений. Спробуйте за хвилину.' : 'AI тимчасово недоступний. Спробуйте пізніше.');
}

/* ---------- публічні подання ---------- */

function pubUser_(u) { return { id: u.id, role: u.role, name: u.name, phone: u.phone }; }
function pubCar_(c) { return pick_(c, ['id', 'make', 'model', 'year', 'plate', 'vin', 'mileage']); }
function pubSto_(s, own) {
  var p = pick_(s, ['id', 'name', 'district', 'address', 'phone', 'hours', 'about']);
  var la = Number(s.lat), ln = Number(s.lng);
  if (la && ln) { p.lat = la; p.lng = ln; }
  p.services = String(s.services || '').split(', ').filter(String);
  p.listed = !s.owner_id;
  if (own) p.active = isActive_(s);
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
  var ss = book_();
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

function isActive_(s) { return s.active === true || String(s.active).toUpperCase() === 'TRUE'; }
function book_() { return SpreadsheetApp.openById(SHEET_ID); }
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
  try { if (ADMIN_EMAIL) MailApp.sendEmail(ADMIN_EMAIL, '[АвтоХаб] ' + subject, body + '\n\nТаблиця: ' + book_().getUrl()); }
  catch (e) { console.error(e); }
}

/** Запустіть один раз у редакторі: створить усі листи з заголовками. */
function setup() {
  Object.keys(T).forEach(function (k) {
    table_(k);
    var sh = book_().getSheetByName(T[k].name);
    sh.getRange(1, 1, 1, T[k].heads.length).setValues([T[k].heads]).setFontWeight('bold'); // нові колонки отримують заголовки
  });
}
