// АвтоХаб: логіка API (спільна для Edge Function і локальних тестів).
// makeApi(db, deps) повертає handle(req) → відповідь-об'єкт. db — адаптер таблиць, deps — мережа, час, пошта.

export const CATEGORIES = ['Діагностика', 'Двигун', 'Ходова', 'Гальма', 'Електрика', 'ТО і мастило', 'Шини', 'Кузов і фарбування',
  'Кондиціонер', 'ГБО', 'Скло', 'Інше'];
export const DISTRICTS = ['Центрально-Міський', 'Металургійний', 'Саксаганський', 'Довгинцівський', 'Покровський', 'Тернівський', 'Інгулецький'];
export const STATUS = { new: 'Нова', accepted: 'Прийнята', declined: 'Відхилена', in_work: 'У роботі', done: 'Виконана', cancelled: 'Скасована' };
export const URGENCY = ['Можна планувати', 'Варто не відкладати', 'Небезпечно їхати'];
// Документи авто зі строком дії: [ключ, назва]
export const CAR_DOCS = [['osago_until', 'ОСЦПВ (автоцивілка)'], ['kasko_until', 'КАСКО'], ['inspection_until', 'Техогляд'], ['green_until', 'Зелена карта']];
// Характеристики авто (крок «Модифікація»)
export const CAR_OPTS = {
  fuels: ['Бензин', 'Дизель', 'Газ/бензин', 'Гібрид', 'Електро'],
  gearboxes: ['Механіка', 'Автомат', 'Робот', 'Варіатор'],
  drives: ['Передній', 'Задній', 'Повний'],
  bodies: ['Седан', 'Хетчбек', 'Універсал', 'Ліфтбек', 'Кросовер', 'Позашляховик', 'Мінівен', 'Купе', 'Кабріолет', 'Пікап', 'Фургон']
};
// Довідник робіт для історії й плану ТО: [код, назва, група, інтервал км, інтервал місяців, лише для пального]
// Інтервали орієнтовні; точні — у регламенті виробника.
export const SERVICE_GROUPS = ['ТО і рідини', 'Двигун і ГРМ', 'Гальма', 'Ходова і кермо', 'Трансмісія', 'Електрика', 'Шини', 'Кузов і салон', 'Інше', 'Витрати'];
export const SERVICES = [
  ['oil', 'Заміна оливи двигуна й фільтра', 0, 10000, 12], ['air_filter', 'Повітряний фільтр', 0, 20000, 24], ['cabin_filter', 'Салонний фільтр', 0, 15000, 12],
  ['fuel_filter', 'Паливний фільтр', 0, 40000, 48], ['spark_plugs', 'Свічки запалювання', 0, 40000, 48, 'petrol'], ['glow_plugs', 'Свічки розжарювання', 0, 100000, 0, 'diesel'],
  ['brake_fluid', 'Гальмівна рідина', 0, 40000, 24], ['coolant', 'Антифриз', 0, 60000, 48], ['mt_oil', 'Олива в механічній КПП', 0, 90000, 0],
  ['at_oil', 'Олива в АКПП / варіаторі', 0, 60000, 0], ['diff_oil', 'Олива в редукторах і роздатці', 0, 60000, 0], ['ps_fluid', 'Рідина гідропідсилювача', 0, 80000, 0],
  ['ac_service', 'Обслуговування кондиціонера', 0, 0, 24], ['gas_service', 'ТО газового обладнання (ГБО)', 0, 10000, 12, 'lpg'],
  ['timing_belt', 'Ремінь ГРМ з роликами', 1, 80000, 60], ['water_pump', 'Помпа', 1, 80000, 0], ['timing_chain', 'Ланцюг ГРМ', 1, 180000, 0],
  ['aux_belt', 'Приводний ремінь', 1, 60000, 48], ['valves', 'Регулювання клапанів', 1, 80000, 0], ['engine_mounts', 'Подушки двигуна', 1, 120000, 0],
  ['injectors', 'Форсунки (чистка або ремонт)', 1, 100000, 0], ['throttle', 'Чистка дросельної заслінки', 1, 40000, 0], ['egr_dpf', 'EGR / сажовий фільтр', 1, 150000, 0, 'diesel'],
  ['lambda', 'Лямбда-зонд', 1, 150000, 0], ['turbo', 'Турбіна', 1, 200000, 0], ['engine_repair', 'Ремонт двигуна', 1, 0, 0],
  ['pads_front', 'Передні гальмівні колодки', 2, 30000, 0], ['pads_rear', 'Задні гальмівні колодки', 2, 50000, 0], ['discs_front', 'Передні гальмівні диски', 2, 60000, 0],
  ['discs_rear', 'Задні диски або барабани', 2, 90000, 0], ['calipers', 'Обслуговування супортів', 2, 60000, 0], ['handbrake', 'Ручне гальмо', 2, 0, 0],
  ['shocks_front', 'Передні амортизатори', 3, 80000, 0], ['shocks_rear', 'Задні амортизатори', 3, 100000, 0], ['strut_mounts', 'Опори амортизаторів', 3, 80000, 0],
  ['springs', 'Пружини', 3, 0, 0], ['bushings', 'Сайлентблоки важелів', 3, 100000, 0], ['ball_joints', 'Кульові опори', 3, 80000, 0],
  ['stab_links', 'Стійки стабілізатора', 3, 50000, 0], ['tie_rods', 'Рульові тяги й наконечники', 3, 60000, 0], ['steering_rack', 'Рульова рейка', 3, 150000, 0],
  ['wheel_bearings', 'Ступичні підшипники', 3, 120000, 0], ['cv_joints', 'ШРУСи й пильники', 3, 120000, 0], ['alignment', 'Розвал-сходження', 3, 20000, 12],
  ['clutch', 'Зчеплення (комплект)', 4, 120000, 0], ['flywheel', 'Маховик', 4, 180000, 0], ['driveshaft', 'Карданний вал / підвісний підшипник', 4, 150000, 0], ['gearbox_repair', 'Ремонт КПП', 4, 0, 0],
  ['battery', 'Акумулятор', 5, 0, 60], ['alternator', 'Генератор', 5, 200000, 0], ['starter', 'Стартер', 5, 200000, 0], ['lights', 'Лампи й фари', 5, 0, 0], ['diagnostics', "Комп'ютерна діагностика", 5, 0, 0],
  ['tires_season', 'Сезонна заміна шин', 6, 0, 6], ['tires_new', 'Нові шини', 6, 50000, 72], ['balancing', 'Балансування коліс', 6, 0, 0], ['tire_repair', 'Ремонт шини', 6, 0, 0],
  ['body_repair', 'Кузовний ремонт / фарбування', 7, 0, 0], ['glass', 'Заміна скла', 7, 0, 0], ['wipers', 'Щітки склоочисника', 7, 0, 12], ['antirust', 'Антикорозійна обробка', 7, 0, 36], ['detailing', 'Мийка, хімчистка, полірування', 7, 0, 0],
  ['other', 'Інше', 8, 0, 0],
  ['fuel', 'Пальне', 9, 0, 0], ['insurance', 'Страховка', 9, 0, 0], ['parts', 'Запчастини й витратні матеріали', 9, 0, 0], ['fees', 'Збори, штрафи, документи', 9, 0, 0], ['parking', 'Паркування', 9, 0, 0]
];
const SERVICE_CODES = SERVICES.map((x) => x[0]);
const PHOTO_MAX = 1600000; // байтів після стиснення в браузері

const GEMINI_MODELS = ['gemini-3.5-flash-lite', 'gemini-3.6-flash', 'gemini-2.5-flash']; // перша — та, що відповідає на безкоштовному тарифі
const AI_LIMIT = 15;            // підказок AI на водія за 6 годин
const SESSION_DAYS = 60;
const MAX_LEN = 1500;
const FLOW = { accepted: ['new'], declined: ['new'], in_work: ['accepted'], done: ['accepted', 'in_work'], cancelled: ['new', 'accepted'] };
const DISTRICT_HINTS = [['Центрально-Міськ', 0], ['Центрально-Городск', 0], ['Металург', 1], ['Металлург', 1], ['Жовтнев', 1], ['Октябрьск', 1],
  ['Саксаган', 2], ['Довгинц', 3], ['Долгинц', 3], ['Покровськ', 4], ['Покровск', 4], ['Дзержин', 4], ['Тернів', 5], ['Терновск', 5], ['Інгулец', 6], ['Ингулец', 6]];

// VIN: код виробника (перші 3 символи) → марка, для авто без даних у vPIC (переважно європейський ринок).
const WMI = { TMB: 'Skoda', TMP: 'Skoda', WVW: 'Volkswagen', WV1: 'Volkswagen', WV2: 'Volkswagen', WVG: 'Volkswagen', '1VW': 'Volkswagen', '3VW': 'Volkswagen',
  WAU: 'Audi', WA1: 'Audi', TRU: 'Audi', WBA: 'BMW', WBS: 'BMW', WBX: 'BMW', WBY: 'BMW', '5UX': 'BMW', WDB: 'Mercedes-Benz', WDD: 'Mercedes-Benz', WDC: 'Mercedes-Benz',
  WDF: 'Mercedes-Benz', W1K: 'Mercedes-Benz', W1N: 'Mercedes-Benz', W1V: 'Mercedes-Benz', W0L: 'Opel', W0V: 'Opel', WF0: 'Ford', WF1: 'Ford', '1FA': 'Ford', '1FM': 'Ford', '1FT': 'Ford', '3FA': 'Ford',
  VF1: 'Renault', VF6: 'Renault', VF3: 'Peugeot', VR3: 'Peugeot', VF7: 'Citroen', VR7: 'Citroen', UU1: 'Dacia', VSS: 'Seat', VSK: 'Nissan', SJN: 'Nissan', JN1: 'Nissan', '1N4': 'Nissan',
  ZFA: 'Fiat', ZFF: 'Ferrari', ZAR: 'Alfa Romeo', KMH: 'Hyundai', TMA: 'Hyundai', NLH: 'Hyundai', '5NP': 'Hyundai', KNA: 'Kia', KNE: 'Kia', U5Y: 'Kia', U6Y: 'Kia', '5XY': 'Kia',
  JTD: 'Toyota', JTN: 'Toyota', JTE: 'Toyota', JTM: 'Toyota', JT2: 'Toyota', VNK: 'Toyota', SB1: 'Toyota', NMT: 'Toyota', '4T1': 'Toyota', '2T1': 'Toyota', '5YF': 'Toyota',
  JTH: 'Lexus', '2T2': 'Lexus', JHM: 'Honda', SHH: 'Honda', '1HG': 'Honda', '2HG': 'Honda', JMZ: 'Mazda', JM1: 'Mazda', JMB: 'Mitsubishi', JA3: 'Mitsubishi', JF1: 'Subaru', JF2: 'Subaru',
  JS2: 'Suzuki', TSM: 'Suzuki', VSE: 'Suzuki', YV1: 'Volvo', YV4: 'Volvo', SAL: 'Land Rover', SAJ: 'Jaguar', WP0: 'Porsche', WP1: 'Porsche', XTA: 'ВАЗ (Lada)', Y6D: 'ЗАЗ',
  KL1: 'Chevrolet', XUU: 'Chevrolet', '1G1': 'Chevrolet', '5YJ': 'Tesla', '7SA': 'Tesla', LRW: 'Tesla', LGX: 'BYD', LFV: 'Volkswagen', LSV: 'Volkswagen', '1C4': 'Jeep', '1J4': 'Jeep', '2C3': 'Chrysler' };
const VIN_YEAR = 'ABCDEFGHJKLMNPRSTVWXY123456789';
// Рік за 10-м символом: обираємо найпізніший цикл, що не в майбутньому.
function vinYear(vin) {
  const i = VIN_YEAR.indexOf(vin[9]);
  if (i === -1) return null;
  const max = new Date().getFullYear() + 1;
  let y = 1980 + i; while (y + 30 <= max) y += 30;
  return y;
}

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
  const pubUser = (u) => { const p = { id: u.id, role: u.role, name: u.name, phone: u.phone }; if (u.isAdmin || u.role === 'admin') p.isAdmin = true; return p; };
  const CAR_KEYS = ['id', 'make', 'model', 'year', 'plate', 'vin', 'mileage', 'engine', 'fuel', 'power', 'gearbox', 'drive', 'body'].concat(CAR_DOCS.map((d) => d[0]));
  const pubCar = (c, urls) => { const p = pick(c, CAR_KEYS); p.photo = c.photo && urls ? (urls[c.photo] || '') : ''; return p; };
  // Перевірка й нормалізація полів авто (спільна для додавання й редагування).
  function carFields(r, partial) {
    const f = {};
    const has = (k) => !partial || r[k] !== undefined;
    if (has('make')) f.make = need(r.make, 'Вкажіть марку').slice(0, 60);
    if (has('model')) f.model = need(r.model, 'Вкажіть модель').slice(0, 80);
    if (has('year')) { const y = int(r.year); if (y && (y < 1950 || y > new Date().getFullYear() + 1)) fail('Перевірте рік випуску'); f.year = y; }
    if (has('mileage')) { const m = int(r.mileage); if (m && m > 2000000) fail('Перевірте пробіг'); f.mileage = m; }
    if (has('plate')) f.plate = s_(r.plate).toUpperCase().replace(/\s+/g, '').slice(0, 12);
    if (has('vin')) { const v = s_(r.vin).toUpperCase().replace(/\s+/g, ''); if (v && !/^[A-HJ-NPR-Z0-9]{11,17}$/.test(v)) fail('VIN має містити 17 символів (латиниця й цифри)'); f.vin = v; }
    if (has('engine')) { const e = Number(String(r.engine || '').replace(',', '.')); if (r.engine && !(e >= 0.5 && e <= 8.5)) fail("Перевірте об'єм двигуна"); f.engine = r.engine ? Math.round(e * 10) / 10 : null; }
    if (has('power')) { const pw = int(r.power); if (pw && pw > 1500) fail('Перевірте потужність'); f.power = pw; }
    const opt = (k, list) => { if (has(k)) f[k] = r[k] ? oneOf(r[k], list) : ''; };
    opt('fuel', CAR_OPTS.fuels); opt('gearbox', CAR_OPTS.gearboxes); opt('drive', CAR_OPTS.drives); opt('body', CAR_OPTS.bodies);
    CAR_DOCS.forEach((d) => { if (has(d[0])) { const v = s_(r[d[0]]); if (v && !date_(v)) fail('Перевірте дату: ' + d[1]); f[d[0]] = date_(v); } });
    return f;
  }
  async function signPhotos(cars) {
    const paths = cars.map((c) => c.photo).filter(Boolean);
    return paths.length && deps.storage ? await deps.storage.sign(paths) : {};
  }
  function pubSto(s, own) {
    const p = pick(s, ['id', 'name', 'district', 'address', 'phone', 'hours', 'about']);
    if (s.lat && s.lng) { p.lat = Number(s.lat); p.lng = Number(s.lng); }
    p.services = String(s.services || '').split(', ').filter(String);
    p.listed = !s.owner_id && s.partner !== true;
    if (!s.owner_id && s.partner === true) p.managed = true;   // партнер без власного акаунта: заявки веде зв'язковий
    if (own) p.active = isActive(s);
    return p;
  }
  const pubReq = (q) => { const p = pick(q, ['id', 'car_id', 'sto_id', 'category', 'description', 'preferred', 'status', 'sto_comment', 'price', 'visit', 'work_done', 'mileage', 'visited', 'confirmed', 'created', 'updated']); p.status_label = STATUS[q.status] || q.status; return p; };
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
    let u = await db.find('users', 'id', s.user_id);
    if (!u) throw new UserError('Увійдіть знову', true);
    // Адміністратор може переглядати застосунок як водій (r.as = 'driver') або як обраний сервіс (r.as = 'sto', r.as_sto = id).
    if (u.role === 'admin' && (r.as === 'driver' || r.as === 'sto')) {
      let stoId = '';
      if (r.as === 'sto') {
        const st = await db.find('stos', 'id', String(r.as_sto || ''));
        if (!st || !(st.owner_id || st.partner === true)) fail('Оберіть сервіс для перегляду');
        stoId = st.id;
      }
      u = Object.assign({}, u, { role: r.as, sto_id: stoId, isAdmin: true });
    }
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
      // Картка з анкети чи довідника з тим самим телефоном: прив'язуємо її, щоб не було дубля.
      const same = (await db.all('stos')).find((x) => !x.owner_id && x.phone && (x.phone === sto.phone || x.phone === phone));
      if (same) {
        const keep = { owner_id: user.id, name: sto.name, district: sto.district, address: sto.address, phone: sto.phone, services: sto.services || same.services,
          hours: sto.hours || same.hours, about: sto.about || same.about };
        if (keep.address !== same.address) { keep.lat = null; keep.lng = null; keep.geo = ''; }
        await db.update('stos', same.id, keep);
        await db.update('users', user.id, { sto_id: same.id }); user.sto_id = same.id;
        notify('СТО підтвердив свою картку: ' + sto.name, 'Сервіс зареєструвався в застосунку й отримав наявну картку (' + (same.source || 'довідник') + ').\nКонтакт: ' + name + ', ' + phone +
          '\nКартка ' + (same.active ? 'вже активна.' : 'чекає перевірки: autohubkr.com/app/ → СТО → Перевірка.'));
        return session(user);
      }
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
  const myCars = async (u) => {
    const rows = (await db.where('cars', 'user_id', u.id)).filter((c) => !c.deleted).sort((a, b) => a.created < b.created ? -1 : 1);
    const urls = await signPhotos(rows);
    return rows.map((c) => pubCar(c, urls));
  };
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
    if (!sto.owner_id && sto.partner !== true) fail('Цей сервіс ще не підключений до АвтоХабу. Зателефонуйте йому напряму.');
    const open = (await db.where('requests', 'driver_id', u.id)).filter((q) => q.status === 'new');
    if (open.length >= 5) fail('У вас уже 5 нових заявок. Дочекайтеся відповіді сервісів.');
    const q = { id: id(), driver_id: u.id, car_id: car.id, sto_id: sto.id, category: oneOf(r.category, CATEGORIES), description: need(r.description, 'Опишіть проблему'),
      preferred: s_(r.preferred), status: 'new', sto_comment: '', price: null, visit: '', work_done: '', mileage: null, created: now(), updated: now() };
    await db.insert('requests', q);
    notify((sto.owner_id ? 'Нова заявка в АвтоХабі → ' : 'Заявка для зв\'язкового: зателефонуйте → ') + sto.name,
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
      // Код візиту бачить лише водій: показує його в сервісі, сервіс вводить код у застосунку.
      if (u.role === 'driver' && (q.status === 'accepted' || q.status === 'in_work') && !q.visited) p.code = q.code || '';
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
    if (to === 'accepted') patch.code = String(1000 + Math.floor(Math.random() * 9000));
    if (r.comment !== undefined) patch.sto_comment = s_(r.comment);
    if (r.price !== undefined && r.price !== '') patch.price = num(r.price);
    if (r.visit !== undefined) patch.visit = s_(r.visit);
    if (to === 'done') { patch.work_done = need(r.work_done, 'Опишіть виконані роботи'); patch.mileage = int(r.mileage); }
    const nq = await db.update('requests', q.id, patch);
    if (to === 'done') {
      const [sto, car] = await Promise.all([db.find('stos', 'id', nq.sto_id), db.find('cars', 'id', nq.car_id)]);
      await db.insert('history', { id: id(), car_id: nq.car_id, user_id: nq.driver_id, date: today(), work: nq.work_done, place: sto ? sto.name : '',
        price: nq.price, mileage: nq.mileage, request_id: nq.id, created: now(), confirmed: '' });
      if (car && nq.mileage) await bumpMileage(car, nq.mileage);
    }
    return { request: pubReq(nq) };
  }

  // Сервіс вводить код, який показав водій: так фіксується, що водій справді приїхав через АвтоХаб.
  async function reqVisit(r) {
    const u = await auth(r, 'sto');
    const q = await db.find('requests', 'id', String(r.id || ''));
    if (!q || q.sto_id !== u.sto_id) fail('Заявку не знайдено');
    if (q.status !== 'accepted' && q.status !== 'in_work') fail('Код вводять після того, як заявку прийнято');
    if (q.visited) return { request: pubReq(q) };
    const ck = 'code_' + q.id, tries = Number(await kvGet(ck) || 0);
    if (tries >= 5) fail('Забагато спроб. Зверніться до підтримки АвтоХабу.');
    if (!q.code || String(r.code || '').replace(/\D/g, '') !== q.code) { await kvPut(ck, tries + 1, 86400); fail('Код не збігається. Попросіть водія показати код із застосунку.'); }
    const patch = { visited: now(), updated: now() };
    if (q.status === 'accepted') patch.status = 'in_work';
    return { request: pubReq(await db.update('requests', q.id, patch)) };
  }

  // Водій підтверджує, що роботи виконано (або повідомляє про проблему). Підтверджена робота й відгук — основа рейтингу.
  async function reqConfirm(r) {
    const u = await auth(r, 'driver');
    const q = await db.find('requests', 'id', String(r.id || ''));
    if (!q || q.driver_id !== u.id) fail('Заявку не знайдено');
    if (q.status !== 'done') fail('Підтвердити можна після того, як сервіс позначить роботу виконаною');
    if (q.confirmed) fail('Ви вже відповіли на цю заявку');
    const ok = r.ok !== false;
    const nq = await db.update('requests', q.id, { confirmed: ok ? 'так' : 'спір', updated: now() });
    const h = (await db.where('history', 'request_id', q.id))[0];
    if (h) await db.update('history', h.id, { confirmed: ok ? 'так' : 'спір' });
    if (!ok) {
      const sto = await db.find('stos', 'id', q.sto_id);
      notify('Спір за заявкою в АвтоХабі → ' + (sto ? sto.name : ''), 'Водій ' + u.name + ' (' + u.phone + ') не підтвердив виконання.\nКоментар: ' + (s_(r.comment) || '—') +
        '\nРоботи за словами сервісу: ' + q.work_done + '\nСервіс: ' + (sto ? sto.name + ', ' + sto.phone : '—'));
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
      p.source = s.source; p.created = s.created; p.geo = geoOf(s); p.partner = s.partner === true;
      return p;
    });
    const rank = (s) => (s.owner && !s.active) || (!s.owner && !s.active && s.source === 'анкета') ? 0 : (s.owner || s.partner) ? 1 : 2;
    list.sort((a, b) => rank(a) - rank(b) || (a.created < b.created ? 1 : -1) || (a.name < b.name ? -1 : 1));
    return { stos: list };
  }

  async function adminStoSet(r) {
    await auth(r, 'admin');
    const sto = await db.find('stos', 'id', String(r.id || ''));
    if (!sto) fail('Сервіс не знайдено');
    const f = r.fields || {}, patch = {};
    if (r.active !== undefined) patch.active = r.active === true;
    if (r.partner !== undefined) { patch.partner = r.partner === true; if (patch.partner) patch.active = true; }
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
    const p = pubSto(upd, true); p.source = upd.source; p.geo = geoOf(upd); p.partner = upd.partner === true;
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
      p.car = car ? carTitle(car) : ''; p.sto = sto ? { id: sto.id, name: sto.name, phone: sto.phone, managed: !sto.owner_id } : null;
      p.driver = d ? { name: d.name, phone: d.phone } : null; p.review = rv ? { rating: rv.rating, text: rv.text } : null;
      p.admin_note = q.admin_note || ''; p.code = q.code || '';
      return p;
    }), total: all.length };
  }

  async function adminReqNote(r) {
    await auth(r, 'admin');
    const q = await db.find('requests', 'id', String(r.id || ''));
    if (!q) fail('Заявку не знайдено');
    await db.update('requests', q.id, { admin_note: s_(r.note) });
    return {};
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
    const a = await gemini(ck, used, system, [{ text: prompt }], schema);
    const arr = (v, n) => (Array.isArray(v) ? v : []).map(s_).filter(String).slice(0, n);
    return { ai: { category: CATEGORIES.indexOf(a.category) !== -1 ? a.category : 'Інше', urgency: URGENCY.indexOf(a.urgency) !== -1 ? a.urgency : URGENCY[1],
      summary: s_(a.summary), causes: arr(a.causes, 4), checks: arr(a.checks, 3), ask_sto: arr(a.ask_sto, 3), request_text: s_(a.request_text), model: a._model } };
  }

  // Запит до Gemini з перебором моделей. ck/used — лічильник ліміту водія (невдалий запит не рахуємо).
  async function gemini(ck, used, system, parts, schema) {
    const key = env.GEMINI_API_KEY;
    const body = JSON.stringify({ systemInstruction: { parts: [{ text: system }] }, contents: [{ role: 'user', parts }],
      generationConfig: { responseMimeType: 'application/json', responseSchema: schema, temperature: 0.2, maxOutputTokens: 4096 } });
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
        const out = ((((data.candidates || [])[0] || {}).content || {}).parts) || [];
        const raw = out.map((p) => p.thought ? '' : (p.text || '')).join('');
        let a;
        try { a = JSON.parse(raw); } catch (e) { console.error('AI JSON', raw); fail('AI не зміг відповісти. Спробуйте ще раз.'); }
        a._model = models[i];
        return a;
      }
      console.error('Gemini ' + models[i] + ' → ' + lastCode + ': ' + String(await resp.text()).slice(0, 300));
      if (!custom && i < models.length - 1) await kvPut('ai_skip_' + models[i], 1, lastCode === 404 ? 21600 : 600);
      if ([404, 429, 500, 503].indexOf(lastCode) === -1) break;
    }
    await kvPut(ck, used, 21600); // невдалий запит не рахуємо
    fail(lastCode === 429 ? 'AI зараз перевантажений. Спробуйте за хвилину.' : 'AI тимчасово недоступний. Спробуйте пізніше.');
  }

  // Фото чека або заказ-наряду → чернетка запису в історію (водій перевіряє й зберігає сам).
  async function aiReceipt(r) {
    const u = await auth(r, 'driver');
    if (!env.GEMINI_API_KEY) fail('Розпізнавання чеків ще не налаштоване');
    const m = String(r.image || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if (!m) fail('Надішліть фото чека у форматі JPEG');
    if (m[1].length * 0.75 > PHOTO_MAX) fail('Фото завелике');
    const ck = 'ai_' + u.id, used = Number(await kvGet(ck) || 0);
    if (used >= AI_LIMIT) fail('Ліміт розпізнавань вичерпано. Спробуйте за кілька годин.');
    await kvPut(ck, used + 1, 21600);
    const codes = SERVICES.map((x) => x[0] + ' — ' + x[1]).join('\n');
    const system = ['Ти розпізнаєш фото чека, накладної або заказ-наряду автосервісу чи АЗС в Україні для гаража водія.',
      'Повертай лише те, що видно на фото. Якщо поля немає, залиш порожнім (рядок) або 0 (число).',
      'date у форматі YYYY-MM-DD. price — підсумкова сума до сплати в гривнях. mileage — пробіг, якщо вказаний. place — назва продавця або сервісу.',
      'services — коди робіт із переліку, які точно відповідають позиціям чека. Для АЗС — fuel, для запчастин без робіт — parts.',
      'work — короткий перелік позицій українською, до 300 символів. Якщо це не чек, поверни ok=false.', 'Перелік кодів:', codes].join('\n');
    const schema = { type: 'OBJECT', properties: { ok: { type: 'BOOLEAN' }, date: { type: 'STRING' }, price: { type: 'NUMBER' }, mileage: { type: 'NUMBER' },
      place: { type: 'STRING' }, work: { type: 'STRING' }, services: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['ok'] };
    const a = await gemini(ck, used, system, [{ inline_data: { mime_type: 'image/jpeg', data: m[1] } }, { text: 'Розпізнай цей документ.' }], schema);
    if (!a.ok) fail('Не схоже на чек. Сфотографуйте чек рівно й при доброму світлі.');
    const d = date_(a.date);
    return { receipt: { date: d && d <= today() ? d : '', price: num(a.price), mileage: int(a.mileage), place: s_(a.place).slice(0, 120), work: s_(a.work).slice(0, 300),
      services: [...new Set(list_(a.services, SERVICE_CODES))] } };
  }

  // Публічні лічильники для сайту: скільки анкет і сервісів у каталозі (без персональних даних).
  async function statsPublic() {
    const cached = await kvGet('stats_public');
    if (cached) return JSON.parse(cached);
    const [leads, stos] = await Promise.all([db.all('leads'), db.where('stos', 'active', true)]);
    const res = { drivers: leads.filter((l) => l.kind === 'driver').length, services: leads.filter((l) => l.kind === 'service').length, catalog: stos.length };
    await kvPut('stats_public', JSON.stringify(res), 300);
    return res;
  }

  // Розшифровка VIN: vPIC (NHTSA, безкоштовно) → свій довідник виробників → за потреби Gemini для моделі.
  async function vinDecode(r) {
    const u = await auth(r, 'driver');
    // Приймаємо VIN або український держномер (кирилиця переводиться в латинські двійники).
    const CYR = { А: 'A', В: 'B', Е: 'E', І: 'I', К: 'K', М: 'M', Н: 'H', О: 'O', Р: 'P', С: 'C', Т: 'T', Х: 'X' };
    const raw = s_(r.vin || r.plate).toUpperCase().replace(/[\s-]+/g, '');
    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/.test(raw);
    const plate = isVin ? '' : raw.split('').map((c) => CYR[c] || c).join('');
    if (!isVin && !/^[A-Z0-9]{4,10}$/.test(plate)) fail('Введіть VIN (17 символів) або держномер, наприклад AE1234KP');
    if (!(await rate('vin_' + u.id, 30, 3600))) fail('Забагато перевірок. Спробуйте за годину.');
    let vin = isVin ? raw : '';
    const out = { vin, plate, make: '', model: '', year: null, engine: null, fuel: '', power: null, gearbox: '', drive: '', body: '', color: '', stolen: false, source: [] };
    const tc = (x) => String(x).toLowerCase().replace(/(^|[\s-])([a-zа-яіїєґ])/g, (m0, a, b) => a + b.toUpperCase());
    const brandCase = (b) => /^(BMW|GMC|MINI|BYD|SEAT|ВАЗ|ЗАЗ|УАЗ|ГАЗ|DS|MG)$/i.test(b) ? String(b).toUpperCase() : tc(b);
    const modelCase = (m) => /^[A-Z0-9 .-]+$/.test(m) && /[A-Z]{3,}/.test(m) ? tc(m) : String(m || '');
    // 0) Живий пошук у реєстрі МВС через baza-gai.com.ua (вся Україна, VIN — для реєстрацій з 2021 року). Відповідь кешуємо на 30 днів.
    if (env.BAZA_GAI_KEY) {
      const ck = 'bg_' + (isVin ? vin : plate);
      let g = null;
      const cached = await kvGet(ck);
      if (cached) { try { g = JSON.parse(cached); } catch (e) { g = null; } }
      else {
        try {
          const resp = await deps.fetch('https://baza-gai.com.ua/' + (isVin ? 'vin/' + vin : 'nomer/' + encodeURIComponent(plate)), { headers: { Accept: 'application/json', 'X-Api-Key': env.BAZA_GAI_KEY } });
          if (resp.status === 200) { g = await resp.json(); await kvPut(ck, JSON.stringify(g), 30 * 86400); }
          else if (resp.status === 404) { await kvPut(ck, 'null', 7 * 86400); }
          else console.error('baza-gai', resp.status, String(await resp.text()).slice(0, 200));
        } catch (e) { console.error('baza-gai', e); }
      }
      if (g && (g.vendor || (g.operations || []).length)) {
        const ops = g.operations || [];
        const last = ops.find((o) => o.is_last) || ops[0] || {};
        out.make = brandCase(g.vendor || last.vendor || '');
        out.model = modelCase(last.catalog_model_title || g.model || last.model || '');
        out.year = int(g.model_year || last.model_year);
        const cap = Number(last.displacement || (ops.find((o) => o.displacement) || {}).displacement); if (cap >= 500 && cap <= 8500) out.engine = Math.round(cap / 100) / 10;
        out.color = String((last.color && last.color.ua) || '').toLowerCase();
        const bd = String((last.body && last.body.ua) || '').toUpperCase();
        out.body = /ПІКАП/.test(bd) ? 'Пікап' : /КАБРІОЛЕТ/.test(bd) ? 'Кабріолет' : /КУПЕ/.test(bd) ? 'Купе' : /УНІВЕРСАЛ/.test(bd) ? 'Універсал' : /ХЕТЧБЕК/.test(bd) ? 'Хетчбек' : /СЕДАН/.test(bd) ? 'Седан' : /МІНІВЕН/.test(bd) ? 'Мінівен' : /ФУРГОН/.test(bd) ? 'Фургон' : '';
        if (!vin && /^[A-HJ-NPR-Z0-9]{17}$/.test(String(g.vin || ''))) vin = out.vin = g.vin;   // повний VIN, якщо сервіс його не маскує
        if (!out.plate && /^[A-Z0-9]{4,10}$/.test(String(g.digits || ''))) out.plate = g.digits;
        out.stolen = g.is_stolen === true;
        out.source.push('реєстр МВС');
      }
    }
    if (!vin && !out.make) fail('За цим номером авто не знайдено. Спробуйте VIN або заповніть дані вручну.');
    // 1) Відкритий реєстр МВС: авто, зареєстровані в Україні з 2021 року (Дніпропетровська область).
    let reg = null;
    if (vin) { try { reg = await db.find('vin_registry', 'vin', vin); } catch (e) { reg = null; } }
    if (reg && reg.brand) {
      if (!out.make) { out.make = brandCase(reg.brand); out.model = modelCase(reg.model); }
      if (reg.year && !out.year) out.year = Number(reg.year);
      const cap = Number(reg.capacity); if (cap >= 500 && cap <= 8500 && !out.engine) out.engine = Math.round(cap / 100) / 10;
      const kw = Number(reg.power_kw); if (kw > 0 && kw < 1100) out.power = Math.round(kw * 1.36);
      const f = String(reg.fuel || '').toUpperCase();
      out.fuel = /ЕЛЕКТР/.test(f) && /БЕНЗИН|ДИЗЕЛ/.test(f) ? 'Гібрид' : /ЕЛЕКТР/.test(f) ? 'Електро' : /ГАЗ/.test(f) ? 'Газ/бензин' : /ДИЗЕЛ/.test(f) ? 'Дизель' : /БЕНЗИН/.test(f) ? 'Бензин' : '';
      const b = String(reg.body || '').toUpperCase();
      if (!out.body) out.body = /ПІКАП/.test(b) ? 'Пікап' : /КАБРІОЛЕТ/.test(b) ? 'Кабріолет' : /КУПЕ/.test(b) ? 'Купе' : /УНІВЕРСАЛ/.test(b) ? 'Універсал' : /ЛІФТБЕК/.test(b) ? 'Ліфтбек' :
        /ХЕТЧБЕК/.test(b) ? 'Хетчбек' : /СЕДАН/.test(b) ? 'Седан' : /МІНІВЕН/.test(b) ? 'Мінівен' : /ФУРГОН/.test(b) ? 'Фургон' : /ПОЗАШЛЯХ|КРОСОВЕР/.test(b) ? 'Позашляховик' : '';
      if (!out.color) out.color = String(reg.color || '').toLowerCase();
      if (out.source.indexOf('реєстр МВС') === -1) out.source.push('реєстр МВС');
    }
    if (vin && (!out.make || !out.model)) try {
      const resp = await deps.fetch('https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVinValues/' + vin + '?format=json');
      const v = resp.status === 200 ? (((await resp.json()).Results) || [])[0] || {} : {};
      if (v.Make && !out.make) {
        const tc = (x) => String(x).toLowerCase().replace(/(^|[\s-])([a-zа-я])/g, (m0, a, b) => a + b.toUpperCase());
        out.make = /^(BMW|GMC|MINI|BYD|SEAT)$/i.test(v.Make) ? String(v.Make).toUpperCase() : tc(v.Make);
        out.model = s_(v.Model).slice(0, 80);
        const y = int(v.ModelYear); if (y && y > 1950) out.year = y;
        const e = Number(v.DisplacementL); if (e >= 0.5 && e <= 8.5) out.engine = Math.round(e * 10) / 10;
        const hp = int(v.EngineHP); if (hp && hp < 1500) out.power = hp;
        const f1 = String(v.FuelTypePrimary || ''), f2 = String(v.FuelTypeSecondary || '');
        out.fuel = /electric/i.test(f1) && !f2 ? 'Електро' : /electric/i.test(f2) ? 'Гібрид' : /diesel/i.test(f1) ? 'Дизель' : /(natural gas|petroleum gas|lpg|cng)/i.test(f1 + f2) ? 'Газ/бензин' : /gasoline|petrol/i.test(f1) ? 'Бензин' : '';
        const b = String(v.BodyClass || '');
        out.body = /pickup/i.test(b) ? 'Пікап' : /convertible|cabrio/i.test(b) ? 'Кабріолет' : /coupe/i.test(b) ? 'Купе' : /wagon/i.test(b) ? 'Універсал' : /minivan|mpv/i.test(b) ? 'Мінівен' :
          /van/i.test(b) ? 'Фургон' : /sport utility|suv|crossover/i.test(b) ? 'Кросовер' : /hatchback/i.test(b) ? 'Хетчбек' : /sedan/i.test(b) ? 'Седан' : '';
        const d = String(v.DriveType || '');
        out.drive = /awd|4wd|4x4|all.wheel|four.wheel/i.test(d) ? 'Повний' : /fwd|front/i.test(d) ? 'Передній' : /rwd|rear/i.test(d) ? 'Задній' : '';
        const t = String(v.TransmissionStyle || '');
        out.gearbox = /cvt|continuously/i.test(t) ? 'Варіатор' : /dual.clutch|dct|automated manual/i.test(t) ? 'Робот' : /automatic/i.test(t) ? 'Автомат' : /manual/i.test(t) ? 'Механіка' : '';
        out.source.push('vPIC');
      }
    } catch (e) { console.error('vPIC', e); }
    if (!out.make && WMI[vin.slice(0, 3)]) { out.make = WMI[vin.slice(0, 3)]; out.source.push('код виробника'); }
    // Для європейських авто vPIC часто плутає цикл років (1981 замість 2011): беремо пізніший.
    const ly = vinYear(vin);
    if (ly && !reg && (!out.year || (out.year + 30 === ly))) out.year = ly;
    if (!out.make) fail('Не вдалося розпізнати цей VIN. Заповніть дані вручну.');
    if (vin && !out.model && env.GEMINI_API_KEY) {
      const ck = 'ai_' + u.id, used = Number(await kvGet(ck) || 0);
      if (used < AI_LIMIT) {
        await kvPut(ck, used + 1, 21600);
        try {
          const a = await gemini(ck, used, 'Ти експерт з розшифровки VIN. Назви модель авто лише якщо впевнений за кодом VDS (символи 4–8) для цієї марки. ' +
            'Якщо не впевнений, поверни порожній model і confidence "low". Не вигадуй.', [{ text: 'VIN: ' + vin + '\nМарка: ' + out.make + (out.year ? '\nРік: ' + out.year : '') }],
            { type: 'OBJECT', properties: { model: { type: 'STRING' }, confidence: { type: 'STRING', enum: ['high', 'low'] } }, required: ['confidence'] });
          if (a.confidence === 'high' && s_(a.model)) { out.model = s_(a.model).slice(0, 80); out.modelGuess = true; out.source.push('AI'); }
        } catch (e) { /* модель лишаємо порожньою */ }
      }
    }
    return { car: out };
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
    let stoNote = '';
    if (kind === 'service') {
      try {
        const res = await stoFromLead(row, false);
        stoNote = res.existed ? '\n\nЦей сервіс уже є в каталозі, анкету прив\'язано до наявної картки.' : '\n\nКартку сервісу створено, вона чекає перевірки: autohubkr.com/app/ → СТО → Перевірка.';
      } catch (e) { console.error('stoFromLead', e); }
    }
    const lines = LEAD_KEYS[kind].filter((k) => data[k]).map((k) => LEAD_LABELS[k] + ': ' + data[k]);
    notify('Нова анкета (' + (kind === 'driver' ? 'водій' : 'сервіс') + '): ' + name + (kind === 'service' && data.name ? ' (' + data.name + ')' : ''),
      lines.join('\n') + stoNote + '\n\nУсі анкети: autohubkr.com/app/ → Анкети');
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
    const stoIdx = {}; (await db.where('stos', 'source', 'анкета')).concat(await db.where('stos', 'active', true)).forEach((x) => { stoIdx[x.id] = x; });
    return { leads: leads.map((l) => ({ id: l.id, kind: l.kind, created: l.created, name: l.name, contact: l.contact, status: l.status,
        sto_id: (l.data && l.data.sto_id) || '', sto_active: !!((l.data && l.data.sto_id && stoIdx[l.data.sto_id]) || {}).active, fields: LEAD_KEYS[l.kind].filter((k) => l.data && l.data[k]).map((k) => [LEAD_LABELS[k], l.data[k]]) })),
      visits: { total: visits.length, unique: uniq.size, week: visits.filter((v) => String(v.created) >= week).length,
        days: Array.from({ length: 14 }, (_, i) => { const d = fmt(new Date(Date.now() - (13 - i) * 864e5)).slice(0, 10); return [d, days[d] || 0]; }),
        sources: top(sources), pages: top(pages) } };
  }

  // Анкета сервісу з лендингу → картка в каталозі (довідкова, без власника; власник зможе зареєструватися пізніше).
  const LEAD_SVC = { 'Шиномонтаж': 'Шини', 'Діагностика': 'Діагностика', 'Ремонт ходової': 'Ходова', 'Двигун і КПП': 'Двигун', 'Автоелектрика': 'Електрика',
    'Кузовний ремонт і ЛКП': 'Кузов і фарбування', 'Кондиціонери': 'Кондиціонер', 'Скло й тонування': 'Скло' };
  async function adminLeadToSto(r) {
    await auth(r, 'admin');
    const l = await db.find('leads', 'id', String(r.id || ''));
    if (!l || l.kind !== 'service') fail('Анкету сервісу не знайдено');
    const res = await stoFromLead(l, true);
    // Натиск адміністратора = перевірку пройдено: показуємо картку водіям.
    let s0 = await db.find('stos', 'id', res.sto_id);
    if (s0 && !s0.active) s0 = await db.update('stos', s0.id, { active: true });
    if (l.status === 'new') await db.update('leads', l.id, { status: 'contacted' });
    if (s0) res.sto = Object.assign(pubSto(s0, true), { source: s0.source, geo: geoOf(s0) });
    return res;
  }
  // Картка СТО з анкети: шукаємо наявну за телефоном або назвою, інакше створюємо. active — чи показувати водіям одразу.
  async function stoFromLead(l, active) {
    const data = l.data || {};
    if (data.sto_id && await db.find('stos', 'id', data.sto_id)) return { sto_id: data.sto_id, existed: true };
    const svc = [...new Set(String(data.services || '').split(';').map((x) => LEAD_SVC[x.trim()] || (x.trim() ? 'Інше' : '')).filter(Boolean))];
    const digits = String(l.contact || '').replace(/\D/g, '');
    let phone = '';
    if (digits.length >= 9) { try { phone = phone_(l.contact); } catch (e) { phone = ''; } }
    const key = (x) => String(x || '').toLowerCase().replace(/сто|авто|auto|service|сервіс|сервис|[^0-9a-zа-яіїєґ]/g, '');
    const all = await db.all('stos');
    const dup = all.find((x) => (phone && x.phone === phone) || (key(x.name) && key(x.name) === key(l.name)));
    if (dup) {
      await db.update('leads', l.id, { data: Object.assign({}, data, { sto_id: dup.id }) });
      return { sto_id: dup.id, existed: true, sto: Object.assign(pubSto(dup, true), { source: dup.source, geo: geoOf(dup) }) };
    }
    const st = { id: id(), owner_id: '', name: l.name, district: DISTRICTS.indexOf(data.district) !== -1 ? data.district : '', address: '', phone,
      services: svc.join(', '), hours: '', about: '', active: !!active, created: now(), source: 'анкета', geo: '' };
    await db.insert('stos', st);
    await db.update('leads', l.id, { data: Object.assign({}, data, { sto_id: st.id }), status: l.status === 'new' ? 'contacted' : l.status });
    const p = pubSto(st, true); p.source = st.source; p.geo = geoOf(st);
    return { sto: p, sto_id: st.id, existed: false };
  }

  async function adminLeadSet(r) {
    await auth(r, 'admin');
    const l = await db.find('leads', 'id', String(r.id || ''));
    if (!l) fail('Анкету не знайдено');
    const st = oneOf(r.status, ['new', 'contacted', 'joined', 'rejected']);
    await db.update('leads', l.id, { status: st });
    return {};
  }

  const META = { categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS, urgency: URGENCY, car: CAR_OPTS, services: SERVICES, serviceGroups: SERVICE_GROUPS, carDocs: CAR_DOCS };
  const histOut = (h) => { const p = pick(h, ['id', 'date', 'work', 'place', 'price', 'mileage', 'request_id', 'confirmed']); p.services = String(h.services || '').split(',').filter(Boolean); return p; };

  const ACTIONS = {
    meta: async () => META,
    register, login,
    logout: async (r) => { if (r.token) await db.removeWhere('sessions', 'token', String(r.token)); return {}; },
    me: async (r) => { const u = await auth(r); const sto = u.sto_id ? await db.find('stos', 'id', u.sto_id) : null; return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null }; },
    // одним запитом: користувач, довідники й авто (для швидкого старту застосунку)
    boot: async (r) => {
      const u = await auth(r);
      const [sto, cars] = await Promise.all([u.sto_id ? db.find('stos', 'id', u.sto_id) : null, u.role === 'driver' ? myCars(u) : []]);
      return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null, cars, meta: META };
    },
    'cars.list': async (r) => ({ cars: await myCars(await auth(r, 'driver')) }),
    'cars.add': async (r) => {
      const u = await auth(r, 'driver');
      if ((await db.where('cars', 'user_id', u.id)).filter((c) => !c.deleted).length >= 10) fail('Можна додати до 10 авто');
      const c = Object.assign({ id: id(), user_id: u.id, created: now(), deleted: '', photo: '' }, carFields(r, false));
      await db.insert('cars', c);
      return { car: pubCar(c, {}) };
    },
    'cars.update': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.id);
      const upd = await db.update('cars', c.id, carFields(r, true));
      return { car: pubCar(upd, await signPhotos([upd])) };
    },
    // Фото авто: браузер стискає до ~1280 px JPEG і надсилає як data URL; зберігаємо в приватному сховищі.
    'cars.photo': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.id);
      if (!deps.storage) fail('Фото тимчасово недоступні');
      if (r.remove) { if (c.photo) await deps.storage.remove([c.photo]); await db.update('cars', c.id, { photo: '' }); return { photo: '' }; }
      const m = String(r.image || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
      if (!m) fail('Надішліть фото у форматі JPEG');
      const bytes = deps.b64decode(m[1]);
      if (bytes.length > PHOTO_MAX) fail('Фото завелике');
      if (!(bytes[0] === 0xFF && bytes[1] === 0xD8)) fail('Це не схоже на фото JPEG');
      const path = u.id + '/' + c.id + '-' + deps.uuid().slice(0, 8) + '.jpg';
      await deps.storage.put(path, bytes, 'image/jpeg');
      if (c.photo) await deps.storage.remove([c.photo]).catch(() => {});
      await db.update('cars', c.id, { photo: path });
      return { photo: (await deps.storage.sign([path]))[path] || '' };
    },
    'cars.delete': async (r) => { const u = await auth(r, 'driver'); const c = await ownCar(u, r.id); await db.update('cars', c.id, { deleted: 'так' }); return {}; },
    'sto.catalog': catalog,
    'sto.update': stoUpdate,
    'req.create': reqCreate, 'req.list': reqList, 'req.update': reqUpdate, 'req.visit': reqVisit, 'req.confirm': reqConfirm,
    'stats.public': statsPublic, 'ai.receipt': aiReceipt, 'vin.decode': vinDecode,
    'review.add': reviewAdd,
    'history.list': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
      const rows = await db.where('history', 'car_id', c.id);
      rows.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (a.created < b.created ? 1 : -1));
      return { history: rows.map(histOut) };
    },
    'history.add': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
      const services = [...new Set(list_(r.services, SERVICE_CODES))];
      const work = s_(r.work);
      if (!services.length && !work) fail('Оберіть виконані роботи або опишіть їх');
      const date = date_(r.date) || today();
      if (date > today()) fail('Дата не може бути в майбутньому');
      const row = { id: id(), car_id: c.id, user_id: u.id, date, work, services: services.join(','), place: s_(r.place).slice(0, 120),
        price: num(r.price), mileage: int(r.mileage), request_id: '', created: now() };
      await db.insert('history', row);
      if (row.mileage) await bumpMileage(c, row.mileage);
      return { record: histOut(row) };
    },
    'history.delete': async (r) => {
      const u = await auth(r, 'driver');
      const h = await db.find('history', 'id', String(r.id || ''));
      if (!h || h.user_id !== u.id) fail('Запис не знайдено');
      if (h.request_id) fail('Запис із виконаної заявки видалити не можна');
      await db.removeWhere('history', 'id', h.id);
      return {};
    },
    'ai.diagnose': aiDiagnose,
    'admin.stats': adminStats, 'admin.stos': adminStos, 'admin.sto.set': adminStoSet, 'admin.requests': adminRequests, 'admin.req.note': adminReqNote, 'admin.users': adminUsers,
    // тестовий сервіс адміністратора: щоб перевіряти режим «Сервіс», не чіпаючи справжніх партнерів
    'admin.sto.test': async (r) => {
      const u = await auth(r, 'admin');
      const mine = (await db.where('stos', 'owner_id', u.id))[0];
      if (mine) return { sto: pubSto(mine, true) };
      const st = { id: id(), owner_id: u.id, name: 'Тестовий сервіс (адмін)', district: DISTRICTS[0], address: 'тест', phone: u.phone,
        services: CATEGORIES.join(', '), hours: '', about: 'Службовий сервіс для перевірки. Поки не активний, водії його не бачать.', active: false, created: now(), source: 'тест', geo: '' };
      await db.insert('stos', st);
      return { sto: pubSto(st, true) };
    },
    'admin.leads': adminLeads, 'admin.lead.set': adminLeadSet, 'admin.lead.tosto': adminLeadToSto,
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
