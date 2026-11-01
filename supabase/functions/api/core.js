// АвтоХаб: логіка API (спільна для Edge Function і локальних тестів).
// makeApi(db, deps) повертає handle(req) → відповідь-об'єкт. db — адаптер таблиць, deps — мережа, час, пошта.

export const CATEGORIES = ['Діагностика', 'Двигун', 'Ходова', 'Гальма', 'Електрика', 'ТО і мастило', 'Шини', 'Кузов і фарбування',
  'Кондиціонер', 'ГБО', 'Скло', 'Інше'];
export const DISTRICTS = ['Центрально-Міський', 'Металургійний', 'Саксаганський', 'Довгинцівський', 'Покровський', 'Тернівський', 'Інгулецький'];
export const STATUS = { new: 'Нова', accepted: 'Прийнята', declined: 'Відхилена', in_work: 'У роботі', done: 'Виконана', cancelled: 'Скасована' };
export const URGENCY = ['Можна планувати', 'Варто не відкладати', 'Небезпечно їхати'];
const GEMINI_MODELS = ['gemini-3.6-flash', 'gemini-3.5-flash-lite', 'gemini-2.5-flash'];
const AI_LIMIT = 15;            // підказок AI на водія за 6 годин
const SESSION_DAYS = 60;
const MAX_LEN = 1500;
const FLOW = { accepted: ['new'], declined: ['new'], in_work: ['accepted'], done: ['accepted', 'in_work'], cancelled: ['new', 'accepted'] };
const DISTRICT_HINTS = [['Центрально-Міськ', 0], ['Центрально-Городск', 0], ['Металург', 1], ['Металлург', 1], ['Жовтнев', 1], ['Октябрьск', 1],
  ['Саксаган', 2], ['Довгинц', 3], ['Долгинц', 3], ['Покровськ', 4], ['Покровск', 4], ['Дзержин', 4], ['Тернів', 5], ['Терновск', 5], ['Інгулец', 6], ['Ингулец', 6]];

export class UserError extends Error { constructor(m, auth) { super(m); this.userMessage = m; this.auth = !!auth; } }
const fail = (m) => { throw new UserError(m); };

/* ---------- дрібниці ---------- */
const s_ = (v) => v === null || v === undefined ? '' : String(v).replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, MAX_LEN);
const need = (v, msg) => { const x = s_(v); if (!x) fail(msg); return x; };
const num = (v) => { const x = Number(String(v === undefined || v === null ? '' : v).replace(/[^\d.]/g, '')); return isFinite(x) && x > 0 ? x : null; };
const int = (v) => { const x = num(v); return x === null ? null : Math.round(x); };
const oneOf = (v, list) => list.indexOf(v) !== -1 ? v : fail('Оберіть значення зі списку');
const list_ = (v, allowed) => (Array.isArray(v) ? v : []).filter((x) => allowed.indexOf(x) !== -1);
const date_ = (v) => { const x = s_(v); return /^\d{4}-\d{2}-\d{2}$/.test(x) ? x : ''; };
const pick = (o, keys) => { const r = {}; keys.forEach((k) => { r[k] = o[k] === null || o[k] === undefined ? '' : o[k]; }); return r; };
const isActive = (s) => s.active === true || String(s.active).toUpperCase() === 'TRUE';
export function phone_(v) {
  let d = String(v || '').replace(/\D/g, '');
  if (d.length === 10 && d[0] === '0') d = '38' + d;
  if (d.length === 9) d = '380' + d;
  if (!/^380\d{9}$/.test(d)) fail('Вкажіть український номер телефону');
  return '+' + d;
}
const KYIV = new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Kiev', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false });
const fmt = (d) => KYIV.format(d).replace('T', ' ').slice(0, 16);
const carTitle = (c) => [c.make, c.model, c.year].filter((x) => x !== null && x !== undefined && x !== '').join(' ') + (c.plate ? ' · ' + c.plate : '');

export function makeApi(db, deps) {
  const now = () => fmt(deps.now ? deps.now() : new Date());
  const today = () => now().slice(0, 10);
  const id = () => deps.uuid().replace(/-/g, '').slice(0, 12);
  const hash = async (pin, salt) => deps.sha256hex(salt + ':' + pin);
  const env = deps.env || {};

  /* --- короткочасне сховище (ліміти) --- */
  const kvGet = async (k) => { const r = await db.find('kv', 'key', k); return r && new Date(r.expires) > new Date() ? r.val : null; };
  const kvPut = (k, v, sec) => db.upsert('kv', { key: k, val: String(v), expires: new Date(Date.now() + sec * 1000).toISOString() });
  const kvDel = (k) => db.removeWhere('kv', 'key', k);

  const notify = (subject, body) => { if (deps.notify) deps.notify(subject, body); };

  /* --- облікові записи --- */
  const pubUser = (u) => ({ id: u.id, role: u.role, name: u.name, phone: u.phone });
  const pubCar = (c) => pick(c, ['id', 'make', 'model', 'year', 'plate', 'vin', 'mileage']);
  function pubSto(s, own) {
    const p = pick(s, ['id', 'name', 'district', 'address', 'phone', 'hours', 'about']);
    if (s.lat && s.lng) { p.lat = Number(s.lat); p.lng = Number(s.lng); }
    p.services = String(s.services || '').split(', ').filter(String);
    p.listed = !s.owner_id;
    if (own) p.active = isActive(s);
    return p;
  }
  const pubReq = (q) => { const p = pick(q, ['id', 'car_id', 'sto_id', 'category', 'description', 'preferred', 'status', 'sto_comment', 'price', 'visit', 'work_done', 'mileage', 'created', 'updated']); p.status_label = STATUS[q.status] || q.status; return p; };
  const geoOf = (s) => (s.geo === 'x' || s.geo === 'xx') ? 'not_found' : (s.lat ? 'ok' : '');

  async function session(u) {
    const token = deps.uuid() + deps.uuid().slice(0, 8);
    const exp = fmt(new Date(Date.now() + SESSION_DAYS * 864e5)).slice(0, 10);
    await db.insert('sessions', { token, user_id: u.id, expires: exp });
    return { token, user: pubUser(u) };
  }
  async function auth(r, role) {
    const s = r.token ? await db.find('sessions', 'token', String(r.token)) : null;
    if (!s || s.expires < today()) throw new UserError('Увійдіть знову', true);
    const u = await db.find('users', 'id', s.user_id);
    if (!u) throw new UserError('Увійдіть знову', true);
    if (role && u.role !== role) fail('Ця дія недоступна для вашого типу акаунта');
    return u;
  }

  async function register(r) {
    const role = r.role === 'sto' ? 'sto' : 'driver';
    const phone = phone_(r.phone);
    const pin = String(r.pin || '');
    if (!/^\d{4,6}$/.test(pin)) fail('PIN має бути з 4–6 цифр');
    const name = need(r.name, "Вкажіть ім'я");
    if (await db.find('users', 'phone', phone)) fail('Цей номер уже зареєстровано. Увійдіть або зверніться до підтримки.');
    let st = null, sto = null;
    if (role === 'sto') {
      st = r.sto || {};
      sto = { id: id(), owner_id: '', name: need(st.name, 'Вкажіть назву сервісу'), district: oneOf(st.district, DISTRICTS), address: need(st.address, 'Вкажіть адресу'),
        phone: phone_(st.phone || phone), services: list_(st.services, CATEGORIES).join(', '), hours: s_(st.hours), about: s_(st.about), active: false, created: now(), source: 'реєстрація', geo: '' };
    }
    const salt = deps.uuid();
    const user = { id: id(), role, name, phone, pin_hash: await hash(pin, salt), salt, sto_id: sto ? sto.id : '', created: now() };
    try { await db.insert('users', user); } catch (e) { if (String(e.message || e).indexOf('duplicate') !== -1) fail('Цей номер уже зареєстровано. Увійдіть або зверніться до підтримки.'); throw e; }
    if (sto) {
      sto.owner_id = user.id;
      await db.insert('stos', sto);
      notify('Новий СТО чекає перевірки: ' + sto.name,
        'Сервіс: ' + sto.name + '\nРайон: ' + sto.district + '\nАдреса: ' + sto.address + '\nТелефон: ' + sto.phone +
        '\nПослуги: ' + sto.services + '\nКонтакт: ' + name + ', ' + phone + '\n\nАктивуйте сервіс в адмін-панелі: autohubkr.com/app/ → СТО → Перевірка.');
    }
    return session(user);
  }

  async function login(r) {
    const phone = phone_(r.phone);
    const key = 'tries_' + phone;
    const tries = Number(await kvGet(key) || 0);
    if (tries >= 5) fail('Забагато спроб. Зачекайте 10 хвилин.');
    const u = await db.find('users', 'phone', phone);
    if (!u || (await hash(String(r.pin || ''), u.salt)) !== u.pin_hash) {
      await kvPut(key, tries + 1, 600);
      fail('Невірний телефон або PIN');
    }
    await kvDel(key);
    return session(u);
  }

  /* --- авто --- */
  const myCars = async (u) => (await db.where('cars', 'user_id', u.id)).filter((c) => !c.deleted).sort((a, b) => a.created < b.created ? -1 : 1).map(pubCar);
  async function ownCar(u, cid) {
    const c = await db.find('cars', 'id', String(cid || ''));
    if (!c || c.user_id !== u.id || c.deleted) fail('Авто не знайдено');
    return c;
  }
  async function bumpMileage(car, km) { if (km && (!car.mileage || Number(km) > Number(car.mileage))) await db.update('cars', car.id, { mileage: km }); }

  /* --- каталог СТО --- */
  async function catalog(r) {
    const [stos, reviews] = await Promise.all([db.where('stos', 'active', true), db.all('reviews')]);
    let list = stos;
    if (r.category) list = list.filter((s) => String(s.services).indexOf(r.category) !== -1);
    if (r.district) list = list.filter((s) => s.district === r.district);
    const res = list.map((s) => {
      const own = reviews.filter((v) => v.sto_id === s.id);
      const p = pubSto(s);
      p.reviews = own.length;
      p.rating = own.length ? Math.round(own.reduce((a, v) => a + Number(v.rating), 0) / own.length * 10) / 10 : null;
      p.lastReviews = own.sort((a, b) => a.created < b.created ? 1 : -1).slice(0, 3).map((v) => ({ rating: v.rating, text: v.text, date: String(v.created).slice(0, 10) }));
      return p;
    });
    res.sort((a, b) => (a.listed ? 1 : 0) - (b.listed ? 1 : 0) || (b.rating || 0) - (a.rating || 0) || b.reviews - a.reviews || (a.name < b.name ? -1 : 1));
    return { stos: res };
  }

  async function stoUpdate(r) {
    const u = await auth(r, 'sto');
    const sto = await db.find('stos', 'id', u.sto_id);
    if (!sto) fail('Профіль сервісу не знайдено');
    const f = r.fields || {}, patch = {};
    if (f.name !== undefined) patch.name = need(f.name, 'Вкажіть назву');
    if (f.district !== undefined) patch.district = oneOf(f.district, DISTRICTS);
    if (f.address !== undefined) { patch.address = need(f.address, 'Вкажіть адресу'); if (patch.address !== sto.address) { patch.lat = null; patch.lng = null; patch.geo = ''; } }
    if (f.phone !== undefined) patch.phone = phone_(f.phone);
    if (f.services !== undefined) patch.services = list_(f.services, CATEGORIES).join(', ');
    if (f.hours !== undefined) patch.hours = s_(f.hours);
    if (f.about !== undefined) patch.about = s_(f.about);
    const upd = await db.update('stos', sto.id, patch);
    return { sto: pubSto(upd, true) };
  }

  /* --- заявки --- */
  async function reqCreate(r) {
    const u = await auth(r, 'driver');
    const car = await ownCar(u, r.car_id);
    const sto = await db.find('stos', 'id', String(r.sto_id || ''));
    if (!sto || !isActive(sto)) fail('Сервіс недоступний');
    if (!sto.owner_id) fail('Цей сервіс ще не підключений до АвтоХабу. Зателефонуйте йому напряму.');
    const open = (await db.where('requests', 'driver_id', u.id)).filter((q) => q.status === 'new');
    if (open.length >= 5) fail('У вас уже 5 нових заявок. Дочекайтеся відповіді сервісів.');
    const q = { id: id(), driver_id: u.id, car_id: car.id, sto_id: sto.id, category: oneOf(r.category, CATEGORIES), description: need(r.description, 'Опишіть проблему'),
      preferred: s_(r.preferred), status: 'new', sto_comment: '', price: null, visit: '', work_done: '', mileage: null, created: now(), updated: now() };
    await db.insert('requests', q);
    notify('Нова заявка в АвтоХабі → ' + sto.name,
      'СТО: ' + sto.name + ' (' + sto.phone + ')\nАвто: ' + carTitle(car) + '\nКатегорія: ' + q.category +
      '\nОпис: ' + q.description + '\nБажаний час: ' + (q.preferred || '—') + '\nВодій: ' + u.name + ', ' + u.phone);
    return { request: pubReq(q) };
  }

  async function reqList(r) {
    const u = await auth(r);
    const mine = u.role === 'driver' ? await db.where('requests', 'driver_id', u.id) : await db.where('requests', 'sto_id', u.sto_id || '-');
    mine.sort((a, b) => a.created < b.created ? 1 : -1);
    const ids = (k) => [...new Set(mine.map((q) => q[k]))];
    const [cars, stos, users, reviews] = await Promise.all([db.in('cars', 'id', ids('car_id')), db.in('stos', 'id', ids('sto_id')),
      u.role === 'sto' ? db.in('users', 'id', ids('driver_id')) : Promise.resolve([]), db.in('reviews', 'request_id', mine.map((q) => q.id))]);
    const by = (arr, k, v) => arr.find((x) => x[k] === v) || null;
    return { requests: mine.map((q) => {
      const p = pubReq(q), car = by(cars, 'id', q.car_id), sto = by(stos, 'id', q.sto_id), rv = by(reviews, 'request_id', q.id);
      p.car = car ? carTitle(car) : '';
      p.sto = sto ? { id: sto.id, name: sto.name, phone: sto.phone, address: sto.address } : null;
      p.review = rv ? { rating: rv.rating, text: rv.text } : null;
      if (u.role === 'sto') {
        const d = by(users, 'id', q.driver_id);
        // Телефон водія сервіс бачить лише після того, як прийняв заявку.
        p.driver = d ? { name: d.name, phone: q.status === 'new' || q.status === 'declined' ? '' : d.phone } : null;
      }
      return p;
    }) };
  }

  async function reqUpdate(r) {
    const u = await auth(r);
    const q = await db.find('requests', 'id', String(r.id || ''));
    if (!q) fail('Заявку не знайдено');
    const to = String(r.status || '');
    if (u.role === 'driver') {
      if (q.driver_id !== u.id) fail('Заявку не знайдено');
      if (to !== 'cancelled') fail('Водій може лише скасувати заявку');
    } else {
      if (q.sto_id !== u.sto_id) fail('Заявку не знайдено');
      if (to === 'cancelled') fail('Сервіс не скасовує заявку, а відхиляє її');
    }
    if (!FLOW[to] || FLOW[to].indexOf(q.status) === -1) fail('Цей крок зараз недоступний');
    const patch = { status: to, updated: now() };
    if (r.comment !== undefined) patch.sto_comment = s_(r.comment);
    if (r.price !== undefined && r.price !== '') patch.price = num(r.price);
    if (r.visit !== undefined) patch.visit = s_(r.visit);
    if (to === 'done') { patch.work_done = need(r.work_done, 'Опишіть виконані роботи'); patch.mileage = int(r.mileage); }
    const nq = await db.update('requests', q.id, patch);
    if (to === 'done') {
      const [sto, car] = await Promise.all([db.find('stos', 'id', nq.sto_id), db.find('cars', 'id', nq.car_id)]);
      await db.insert('history', { id: id(), car_id: nq.car_id, user_id: nq.driver_id, date: today(), work: nq.work_done, place: sto ? sto.name : '',
        price: nq.price, mileage: nq.mileage, request_id: nq.id, created: now() });
      if (car && nq.mileage) await bumpMileage(car, nq.mileage);
    }
    return { request: pubReq(nq) };
  }

  async function reviewAdd(r) {
    const u = await auth(r, 'driver');
    const q = await db.find('requests', 'id', String(r.request_id || ''));
    if (!q || q.driver_id !== u.id) fail('Заявку не знайдено');
    if (q.status !== 'done') fail('Відгук можна залишити після виконання робіт');
    if (await db.find('reviews', 'request_id', q.id)) fail('Відгук уже залишено');
    const rating = Math.round(Number(r.rating));
    if (!(rating >= 1 && rating <= 5)) fail('Оцінка від 1 до 5');
    await db.insert('reviews', { id: id(), request_id: q.id, sto_id: q.sto_id, driver_id: u.id, rating, text: s_(r.text), created: now() });
    return {};
  }

  /* --- адміністратор --- */
  async function adminStats(r) {
    await auth(r, 'admin');
    const [users, stos, reqs, cars, reviews, leads] = await Promise.all(['users', 'stos', 'requests', 'cars', 'reviews', 'leads'].map((t) => db.all(t)));
    const byStatus = {}; Object.keys(STATUS).forEach((k) => { byStatus[k] = 0; });
    reqs.forEach((q) => { byStatus[q.status] = (byStatus[q.status] || 0) + 1; });
    const week = fmt(new Date(Date.now() - 7 * 864e5)).slice(0, 10);
    return { stats: {
      drivers: users.filter((u) => u.role === 'driver').length, stoUsers: users.filter((u) => u.role === 'sto').length,
      newUsersWeek: users.filter((u) => String(u.created) >= week).length, cars: cars.filter((c) => !c.deleted).length,
      partners: stos.filter((s) => s.owner_id && isActive(s)).length, pending: stos.filter((s) => s.owner_id && !isActive(s)).length,
      listed: stos.filter((s) => !s.owner_id).length, noCoords: stos.filter((s) => !s.lat).length,
      requests: reqs.length, requestsWeek: reqs.filter((q) => String(q.created) >= week).length, byStatus, reviews: reviews.length,
      leadsDrivers: leads.filter((l) => l.kind === 'driver').length, leadsServices: leads.filter((l) => l.kind === 'service').length,
      leadsNew: leads.filter((l) => l.status === 'new').length,
      aiReady: !!env.GEMINI_API_KEY
    }, statuses: STATUS };
  }

  async function adminStos(r) {
    await auth(r, 'admin');
    const [stos, users] = await Promise.all([db.all('stos'), db.where('users', 'role', 'sto')]);
    const list = stos.map((s) => {
      const p = pubSto(s, true);
      p.owner = null;
      if (s.owner_id) { const o = users.find((u) => u.id === s.owner_id); p.owner = o ? { name: o.name, phone: o.phone } : { name: '—', phone: '' }; }
      p.source = s.source; p.created = s.created; p.geo = geoOf(s);
      return p;
    });
    const rank = (s) => s.owner && !s.active ? 0 : s.owner ? 1 : 2;
    list.sort((a, b) => rank(a) - rank(b) || (a.created < b.created ? 1 : -1) || (a.name < b.name ? -1 : 1));
    return { stos: list };
  }

  async function adminStoSet(r) {
    await auth(r, 'admin');
    const sto = await db.find('stos', 'id', String(r.id || ''));
    if (!sto) fail('Сервіс не знайдено');
    const f = r.fields || {}, patch = {};
    if (r.active !== undefined) patch.active = r.active === true;
    if (f.name !== undefined) patch.name = need(f.name, 'Вкажіть назву');
    if (f.district !== undefined) patch.district = f.district ? oneOf(f.district, DISTRICTS) : '';
    if (f.address !== undefined) { patch.address = s_(f.address); if (patch.address !== sto.address) { patch.lat = null; patch.lng = null; patch.geo = ''; } }
    if (f.phone !== undefined) patch.phone = f.phone ? phone_(f.phone) : '';
    if (f.services !== undefined) patch.services = list_(f.services, CATEGORIES).join(', ');
    if (f.hours !== undefined) patch.hours = s_(f.hours);
    if (f.about !== undefined) patch.about = s_(f.about);
    if (f.lat !== undefined || f.lng !== undefined) {
      const la = Number(String(f.lat).replace(',', '.')), ln = Number(String(f.lng).replace(',', '.'));
      if (f.lat === '' && f.lng === '') { patch.lat = null; patch.lng = null; patch.geo = ''; }
      else if (la > 47 && la < 49 && ln > 32 && ln < 35) { patch.lat = la; patch.lng = ln; patch.geo = 'ok'; }
      else fail('Координати мають бути в районі Кривого Рогу');
    }
    let upd = await db.update('stos', sto.id, patch);
    // Під час активації одразу шукаємо сервіс на карті, якщо координат ще немає.
    if (patch.active === true && !upd.lat && upd.address) {
      try {
        const g = await geocodeOne(upd.address);
        if (g && !g.notFound) upd = await db.update('stos', upd.id, { lat: g.lat, lng: g.lng, geo: 'ok', district: upd.district || g.district });
      } catch (e) { console.error(e); }
    }
    const p = pubSto(upd, true); p.source = upd.source; p.geo = geoOf(upd);
    return { sto: p };
  }

  async function adminRequests(r) {
    await auth(r, 'admin');
    const all = await db.all('requests');
    all.sort((a, b) => a.created < b.created ? 1 : -1);
    const top = all.slice(0, 300);
    const ids = (k) => [...new Set(top.map((q) => q[k]))];
    const [cars, stos, users, reviews] = await Promise.all([db.in('cars', 'id', ids('car_id')), db.in('stos', 'id', ids('sto_id')), db.in('users', 'id', ids('driver_id')), db.in('reviews', 'request_id', top.map((q) => q.id))]);
    const by = (arr, k, v) => arr.find((x) => x[k] === v) || null;
    return { requests: top.map((q) => {
      const p = pubReq(q), car = by(cars, 'id', q.car_id), sto = by(stos, 'id', q.sto_id), d = by(users, 'id', q.driver_id), rv = by(reviews, 'request_id', q.id);
      p.car = car ? carTitle(car) : ''; p.sto = sto ? { name: sto.name, phone: sto.phone } : null;
      p.driver = d ? { name: d.name, phone: d.phone } : null; p.review = rv ? { rating: rv.rating, text: rv.text } : null;
      return p;
    }), total: all.length };
  }

  async function adminUsers(r) {
    await auth(r, 'admin');
    const [users, cars, reqs, stos] = await Promise.all(['users', 'cars', 'requests', 'stos'].map((t) => db.all(t)));
    const list = users.map((u) => {
      const st = u.sto_id ? stos.find((s) => s.id === u.sto_id) : null;
      return { id: u.id, role: u.role, name: u.name, phone: u.phone, created: u.created, sto: st ? st.name : '',
        cars: cars.filter((c) => c.user_id === u.id && !c.deleted).length,
        requests: reqs.filter((q) => q.driver_id === u.id || (u.sto_id && q.sto_id === u.sto_id)).length };
    });
    list.sort((a, b) => a.created < b.created ? 1 : -1);
    return { users: list };
  }

  /* --- координати (OpenStreetMap Nominatim) --- */
  async function geocodeOne(address) {
    const base = String(address || '').trim();
    if (!base) return null;
    const plain = base.replace(/^(вул\.|вулиця|ул\.|улица|пр-т|просп\.|проспект|пров\.|провулок|пер\.|бул\.|бульвар)\s*/i, '');
    const street = plain.replace(/,?\s*\d.*$/, '').trim();
    const tries = [base + ', Кривий Ріг', plain + ', Кривий Ріг'];
    if (street && street.length > 3) tries.push(street + ', Кривий Ріг');
    for (let i = 0; i < tries.length; i++) {
      if (tries.indexOf(tries[i]) !== i) continue;
      const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=ua&accept-language=uk' +
        '&viewbox=33.05,48.15,33.65,47.62&bounded=1&q=' + encodeURIComponent(tries[i]);
      const resp = await deps.fetch(url, { headers: { 'User-Agent': 'AutoHubKR/1.0 (info@autohubkr.com)' } });
      if (deps.sleep) await deps.sleep(1100); // правила Nominatim: не частіше 1 запиту на секунду
      if (resp.status !== 200) continue;
      const arr = await resp.json();
      if (arr.length) {
        const a = arr[0].address || {}, txt = [a.city_district, a.borough, a.suburb, a.district].filter(Boolean).join(' ');
        let dist = '';
        for (const h of DISTRICT_HINTS) if (txt.indexOf(h[0]) !== -1) { dist = DISTRICTS[h[1]]; break; }
        return { lat: Math.round(Number(arr[0].lat) * 1e6) / 1e6, lng: Math.round(Number(arr[0].lon) * 1e6) / 1e6, district: dist };
      }
    }
    return { notFound: true };
  }

  async function geocodeBatch(limit, retry) {
    const all = await db.all('stos');
    const pending = (s) => s.address && (retry ? s.geo === 'x' : (!s.lat && s.geo !== 'x' && s.geo !== 'xx'));
    const todo = all.filter(pending).slice(0, limit);
    let ok = 0, miss = 0;
    for (const s of todo) {
      const g = await geocodeOne(s.address);
      if (!g) continue;
      if (g.notFound) { await db.update('stos', s.id, { geo: retry ? 'xx' : 'x' }); miss++; continue; }
      const patch = { lat: g.lat, lng: g.lng, geo: 'ok' };
      if (!s.district && g.district) patch.district = g.district;
      await db.update('stos', s.id, patch); ok++;
    }
    const left = (await db.all('stos')).filter(pending).length;
    return { done: ok, notFound: miss, left };
  }

  /* --- AI-помічник (Google Gemini) --- */
  async function aiDiagnose(r) {
    const u = await auth(r, 'driver');
    const text = need(r.description, 'Опишіть проблему');
    if (text.length < 10) fail('Опишіть проблему трохи детальніше');
    const key = env.GEMINI_API_KEY;
    if (!key) fail('AI-помічник ще не налаштований');
    const ck = 'ai_' + u.id;
    const used = Number(await kvGet(ck) || 0);
    if (used >= AI_LIMIT) fail('Ліміт AI-підказок вичерпано. Спробуйте за кілька годин.');
    await kvPut(ck, used + 1, 21600);
    let carInfo = '';
    if (r.car_id) {
      const c = await db.find('cars', 'id', String(r.car_id));
      if (c && c.user_id === u.id && !c.deleted) carInfo = [c.make, c.model, c.year].filter(Boolean).join(' ') + (c.mileage ? ', пробіг ' + c.mileage + ' км' : '');
    }
    const system = [
      'Ти помічник застосунку АвтоХаб (Кривий Ріг, Україна). Водій описує проблему з авто, а ти даєш попередню оцінку перед візитом на СТО.',
      'Відповідай лише українською, коротко і зрозуміло людині без технічної освіти.',
      'category: одна категорія з переліку. urgency: «Небезпечно їхати», якщо є ознаки проблем з гальмами, кермом, підвіскою на ходу, запах палива, дим, перегрів, червоні лампи на панелі; інакше оціни реально.',
      'causes: 2–4 ймовірні причини, від найімовірнішої, кожна одним реченням. checks: 1–3 безпечні перевірки, які водій може зробити сам без інструментів (або порожньо).',
      'ask_sto: 1–3 питання, які варто поставити майстру. request_text: чіткий опис для заявки в СТО від першої особи, 1–3 речення, лише факти з опису водія, нічого не вигадуй.',
      'summary: одне речення-висновок. Не стверджуй діагноз упевнено і не давай інструкцій з ремонту.',
      'Якщо текст не про авто, category «Інше», а в summary попроси описати проблему з авто.'
    ].join('\n');
    const prompt = (carInfo ? 'Авто: ' + carInfo + '\n' : '') + 'Опис водія: ' + text;
    const schema = { type: 'OBJECT', properties: {
      category: { type: 'STRING', enum: CATEGORIES }, urgency: { type: 'STRING', enum: URGENCY }, summary: { type: 'STRING' },
      causes: { type: 'ARRAY', items: { type: 'STRING' } }, checks: { type: 'ARRAY', items: { type: 'STRING' } }, ask_sto: { type: 'ARRAY', items: { type: 'STRING' } },
      request_text: { type: 'STRING' } }, required: ['category', 'urgency', 'summary', 'causes', 'request_text'] };
    const body = JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.3, maxOutputTokens: 4096 } });
    const custom = env.GEMINI_MODEL;
    const models = [];
    if (custom) models.push(custom);
    else for (let i = 0; i < GEMINI_MODELS.length; i++) if (i === GEMINI_MODELS.length - 1 || !(await kvGet('ai_skip_' + GEMINI_MODELS[i]))) models.push(GEMINI_MODELS[i]);
    let lastCode = 0;
    for (let i = 0; i < models.length; i++) {
      const resp = await deps.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + models[i] + ':generateContent', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, body });
      lastCode = resp.status;
      if (lastCode === 200) {
        const data = await resp.json();
        const parts = ((((data.candidates || [])[0] || {}).content || {}).parts) || [];
        const raw = parts.map((p) => p.thought ? '' : (p.text || '')).join('');
        let a;
        try { a = JSON.parse(raw); } catch (e) { console.error('AI JSON', raw); fail('AI не зміг відповісти. Спробуйте переформулювати.'); }
        const arr = (v, n) => (Array.isArray(v) ? v : []).map(s_).filter(String).slice(0, n);
        return { ai: { category: CATEGORIES.indexOf(a.category) !== -1 ? a.category : 'Інше', urgency: URGENCY.indexOf(a.urgency) !== -1 ? a.urgency : URGENCY[1],
          summary: s_(a.summary), causes: arr(a.causes, 4), checks: arr(a.checks, 3), ask_sto: arr(a.ask_sto, 3), request_text: s_(a.request_text), model: models[i] } };
      }
      console.error('Gemini ' + models[i] + ' → ' + lastCode + ': ' + String(await resp.text()).slice(0, 300));
      if (!custom && i < models.length - 1) await kvPut('ai_skip_' + models[i], 1, lastCode === 404 ? 21600 : 600);
      if ([404, 429, 500, 503].indexOf(lastCode) === -1) break;
    }
    await kvPut(ck, used, 21600); // невдалий запит не рахуємо
    fail(lastCode === 429 ? 'AI зараз перевантажений. Спробуйте за хвилину.' : 'AI тимчасово недоступний. Спробуйте пізніше.');
  }

  /* --- анкети з лендингів і перегляди сторінок --- */
  const LEAD_KEYS = {
    driver: ['name', 'telegram', 'car', 'vin', 'plate', 'services', 'services_other', 'search_now', 'top_feature', 'fleet_size', 'wishes', 'utm', 'referrer'],
    service: ['biz', 'name', 'telegram', 'social', 'district', 'services', 'services_other', 'posts', 'booking', 'capacity', 'ready', 'pay', 'crm_interest', 'crm_features', 'tools_now', 'wishes', 'utm', 'referrer']
  };
  const LEAD_LABELS = { name: "Ім'я", telegram: 'Telegram або телефон', car: 'Авто', vin: 'VIN', plate: 'Номер авто', services: 'Послуги', services_other: 'Інші послуги',
    search_now: 'Як шукає сервіс зараз', top_feature: 'Найважливіше', fleet_size: 'Скільки авто', wishes: 'Побажання до функцій', utm: 'Джерело (UTM)', referrer: 'Звідки прийшов',
    biz: 'Назва сервісу', social: 'Instagram або сайт', district: 'Район', posts: 'Постів або майстрів', booking: 'Як приймає записи', capacity: 'Вільна завантаженість',
    ready: 'Готовий приймати заявки', pay: 'Модель оплати', crm_interest: 'Потрібна єдина система', crm_features: 'Що найкорисніше в системі', tools_now: 'Чим веде облік зараз' };
  const clip = (v, n) => { if (v === null || v === undefined) return ''; const x = Array.isArray(v) ? v.join('; ') : String(v); return x.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '').trim().slice(0, n || 2000); };

  async function rate(key, limit, sec) {
    const n = Number(await kvGet(key) || 0);
    if (n >= limit) return false;
    await kvPut(key, n + 1, sec);
    return true;
  }

  async function leadAdd(r, meta) {
    const kind = r.type;
    if (!(await rate('lead_' + (meta.ip || '-'), 20, 3600))) fail('Забагато заявок. Спробуйте пізніше.');
    const data = {};
    LEAD_KEYS[kind].forEach((k) => { const v = clip(r[k]); if (v) data[k] = v; });
    const name = kind === 'service' ? clip(r.biz, 200) : clip(r.name, 200);
    const contact = clip(r.telegram, 200);
    if (!name || !contact) fail('Заповніть назву або ім\'я й контакт');
    const row = { id: id(), kind, created: now(), name, contact, data, status: 'new' };
    await db.insert('leads', row);
    const lines = LEAD_KEYS[kind].filter((k) => data[k]).map((k) => LEAD_LABELS[k] + ': ' + data[k]);
    notify('Нова анкета (' + (kind === 'driver' ? 'водій' : 'сервіс') + '): ' + name + (kind === 'service' && data.name ? ' (' + data.name + ')' : ''),
      lines.join('\n') + '\n\nУсі анкети: autohubkr.com/app/ → Анкети');
    return {};
  }

  async function visitAdd(r, meta) {
    if (!(await rate('visit_' + (meta.ip || '-'), 300, 3600))) return {};
    await db.insert('visits', { created: fmt(deps.now ? deps.now() : new Date()) + ':' + String(new Date().getSeconds()).padStart(2, '0'),
      page: clip(r.page, 200), source: clip(r.source, 200), device: clip(r.device, 40), new_visitor: r.new_visitor === 'так' || r.new_visitor === true,
      visitor: clip(r.visitor, 40), utm: clip(r.utm, 500), referrer: clip(r.referrer, 500) });
    return {};
  }

  async function adminLeads(r) {
    await auth(r, 'admin');
    const [leads, visits] = await Promise.all([db.all('leads'), db.all('visits')]);
    leads.sort((a, b) => a.created < b.created ? 1 : -1);
    const days = {}, sources = {}, pages = {}, uniq = new Set();
    const since = fmt(new Date(Date.now() - 13 * 864e5)).slice(0, 10);
    visits.forEach((v) => {
      const d = String(v.created).slice(0, 10);
      if (d >= since) days[d] = (days[d] || 0) + 1;
      sources[v.source || '—'] = (sources[v.source || '—'] || 0) + 1;
      pages[v.page || '/'] = (pages[v.page || '/'] || 0) + 1;
      if (v.visitor) uniq.add(v.visitor);
    });
    const top = (o) => Object.keys(o).map((k) => [k, o[k]]).sort((a, b) => b[1] - a[1]).slice(0, 8);
    const week = fmt(new Date(Date.now() - 7 * 864e5)).slice(0, 10);
    return { leads: leads.map((l) => ({ id: l.id, kind: l.kind, created: l.created, name: l.name, contact: l.contact, status: l.status,
        fields: LEAD_KEYS[l.kind].filter((k) => l.data && l.data[k]).map((k) => [LEAD_LABELS[k], l.data[k]]) })),
      visits: { total: visits.length, unique: uniq.size, week: visits.filter((v) => String(v.created) >= week).length,
        days: Array.from({ length: 14 }, (_, i) => { const d = fmt(new Date(Date.now() - (13 - i) * 864e5)).slice(0, 10); return [d, days[d] || 0]; }),
        sources: top(sources), pages: top(pages) } };
  }

  async function adminLeadSet(r) {
    await auth(r, 'admin');
    const l = await db.find('leads', 'id', String(r.id || ''));
    if (!l) fail('Анкету не знайдено');
    const st = oneOf(r.status, ['new', 'contacted', 'joined', 'rejected']);
    await db.update('leads', l.id, { status: st });
    return {};
  }

  const ACTIONS = {
    meta: async () => ({ categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS, urgency: URGENCY }),
    register, login,
    logout: async (r) => { if (r.token) await db.removeWhere('sessions', 'token', String(r.token)); return {}; },
    me: async (r) => { const u = await auth(r); const sto = u.sto_id ? await db.find('stos', 'id', u.sto_id) : null; return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null }; },
    // одним запитом: користувач, довідники й авто (для швидкого старту застосунку)
    boot: async (r) => {
      const u = await auth(r);
      const [sto, cars] = await Promise.all([u.sto_id ? db.find('stos', 'id', u.sto_id) : null, u.role === 'driver' ? myCars(u) : []]);
      return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null, cars, meta: { categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS, urgency: URGENCY } };
    },
    'cars.list': async (r) => ({ cars: await myCars(await auth(r, 'driver')) }),
    'cars.add': async (r) => {
      const u = await auth(r, 'driver');
      if ((await myCars(u)).length >= 10) fail('Можна додати до 10 авто');
      const year = int(r.year);
      if (year && (year < 1950 || year > new Date().getFullYear() + 1)) fail('Перевірте рік випуску');
      const c = { id: id(), user_id: u.id, make: need(r.make, 'Вкажіть марку'), model: need(r.model, 'Вкажіть модель'), year,
        plate: s_(r.plate).toUpperCase(), vin: s_(r.vin).toUpperCase(), mileage: int(r.mileage), created: now(), deleted: '' };
      await db.insert('cars', c);
      return { car: pubCar(c) };
    },
    'cars.delete': async (r) => { const u = await auth(r, 'driver'); const c = await ownCar(u, r.id); await db.update('cars', c.id, { deleted: 'так' }); return {}; },
    'sto.catalog': catalog,
    'sto.update': stoUpdate,
    'req.create': reqCreate, 'req.list': reqList, 'req.update': reqUpdate,
    'review.add': reviewAdd,
    'history.list': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
      const rows = await db.where('history', 'car_id', c.id);
      rows.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (a.created < b.created ? 1 : -1));
      return { history: rows.map((h) => pick(h, ['id', 'date', 'work', 'place', 'price', 'mileage', 'request_id'])) };
    },
    'history.add': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
      const row = { id: id(), car_id: c.id, user_id: u.id, date: date_(r.date) || today(), work: need(r.work, 'Опишіть роботи'), place: s_(r.place),
        price: num(r.price), mileage: int(r.mileage), request_id: '', created: now() };
      await db.insert('history', row);
      if (row.mileage) await bumpMileage(c, row.mileage);
      return { id: row.id };
    },
    'ai.diagnose': aiDiagnose,
    'admin.stats': adminStats, 'admin.stos': adminStos, 'admin.sto.set': adminStoSet, 'admin.requests': adminRequests, 'admin.users': adminUsers,
    'admin.leads': adminLeads, 'admin.lead.set': adminLeadSet,
    'admin.geocode': async (r) => { await auth(r, 'admin'); return geocodeBatch(Math.min(Number(r.limit) || 25, 40), r.retry === true); }
  };

  return async function handle(req, meta) {
    meta = meta || {};
    try {
      // форми лендингів і лічильник переходів надсилають { type: driver | service | visit }
      if (req && !req.action && (req.type === 'driver' || req.type === 'service')) { const r0 = await leadAdd(req, meta); r0.ok = true; return r0; }
      if (req && !req.action && req.type === 'visit') { await visitAdd(req, meta); return { ok: true }; }
      const fn = ACTIONS[req && req.action];
      if (!fn) return { ok: false, error: 'Невідома дія' };
      const res = (await fn(req)) || {};
      res.ok = res.ok !== false;
      return res;
    } catch (err) {
      if (err && err.userMessage) return { ok: false, error: err.userMessage };
      console.error(err);
      return { ok: false, error: 'Помилка сервера. Спробуйте ще раз.' };
    }
  };
}
