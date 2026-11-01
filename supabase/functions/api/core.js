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
const FLOW = { accepted: ['new'], declined: ['new', 'accepted'], in_work: ['accepted'], done: ['accepted', 'in_work'], cancelled: ['new', 'accepted'] };
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

/* ---------- красиві сповіщення: лист (HTML) і Telegram ---------- */
const APP_URL = 'https://autohubkr.com/app/';
const he = (v) => String(v == null ? '' : v).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
// msg = { emoji, title, intro, rows: [[назва, значення]], quote, cta: { text, url }, note }
export function mailHtml(m) {
  const rows = (m.rows || []).filter((r) => r[1]).map((r) =>
    `<tr><td style="padding:8px 0;color:#5B6B7F;font-size:14px;width:38%;vertical-align:top">${he(r[0])}</td><td style="padding:8px 0;color:#06111F;font-size:15px;font-weight:600">${he(r[1])}</td></tr>`).join('');
  return `<!doctype html><html lang="uk"><body style="margin:0;background:#EDF0F3;font-family:Segoe UI,Roboto,Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDF0F3;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:16px;overflow:hidden">
<tr><td style="background:#06111F;padding:18px 24px"><span style="color:#fff;font-size:20px;font-weight:800;letter-spacing:.02em">Авто<span style="color:#3B8BFF">Хаб</span></span>
<span style="color:#8FA3B8;font-size:13px;float:right;margin-top:5px">Кривий Ріг</span></td></tr>
<tr><td style="padding:24px 24px 8px"><div style="font-size:28px;line-height:1">${he(m.emoji || '🔔')}</div>
<h1 style="margin:10px 0 6px;font-size:21px;color:#06111F">${he(m.title)}</h1>${m.intro ? `<p style="margin:0;color:#3A4A5E;font-size:15px;line-height:1.5">${he(m.intro)}</p>` : ''}</td></tr>
${m.quote ? `<tr><td style="padding:12px 24px 0"><div style="background:#F3F6FA;border-left:4px solid #1F7BFF;border-radius:8px;padding:12px 14px;color:#06111F;font-size:15px;line-height:1.5">${he(m.quote)}</div></td></tr>` : ''}
${rows ? `<tr><td style="padding:12px 24px 0"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #E3E8EE">${rows}</table></td></tr>` : ''}
${m.cta ? `<tr><td style="padding:22px 24px 6px"><a href="${he(m.cta.url)}" style="display:inline-block;background:#1F7BFF;color:#fff;text-decoration:none;font-weight:700;font-size:16px;padding:13px 22px;border-radius:10px">${he(m.cta.text)}</a></td></tr>` : ''}
<tr><td style="padding:16px 24px 24px;color:#7D8DA1;font-size:12px;line-height:1.5">${he(m.note || 'Ви отримали цей лист, бо ваш сервіс підключений до АвтоХабу. Налаштування сповіщень — у застосунку, розділ «Мій сервіс».')}</td></tr>
</table></td></tr></table></body></html>`;
}
export function mailText(m) {
  return [m.title, m.intro, m.quote ? '«' + m.quote + '»' : '', ...(m.rows || []).filter((r) => r[1]).map((r) => r[0] + ': ' + r[1]), m.cta ? m.cta.text + ': ' + m.cta.url : ''].filter(Boolean).join('\n');
}
export function tgHtml(m) {
  return [`${m.emoji || '🔔'} <b>${he(m.title)}</b>`, m.intro ? he(m.intro) : '', m.quote ? `<blockquote>${he(m.quote)}</blockquote>` : '',
    (m.rows || []).filter((r) => r[1]).map((r) => `<b>${he(r[0])}:</b> ${he(r[1])}`).join('\n')].filter(Boolean).join('\n\n');
}

// Час візиту: 'YYYY-MM-DDTHH:MM' → «03.11 (вт), 10:00»
const WD = ['нд', 'пн', 'вт', 'ср', 'чт', 'пт', 'сб'];
export function slotText(v) {
  const m = String(v || '').match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/);
  if (!m) return String(v || '');
  const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
  return m[3] + '.' + m[2] + ' (' + WD[d.getUTCDay()] + '), ' + m[4] + ':' + m[5];
}
const durText = (v, u) => v ? v + ' ' + (u === 'дн' ? (v % 10 === 1 && v % 100 !== 11 ? 'день' : (v % 10 >= 2 && v % 10 <= 4 && (v % 100 < 10 || v % 100 >= 20)) ? 'дні' : 'днів') : 'год') : '';

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

  /* --- налаштування застосунку з адмінки (kv 'settings'), читаються на початку кожного запиту --- */
  const SET_DEF = { otp_required: true, lead_to_tg: true, ai_limit: AI_LIMIT, counter_min: 10, notify_tg: true, notify_mail: true };
  let SET = Object.assign({}, SET_DEF);
  async function loadSettings() {
    try { const raw = await kvGet('settings'); SET = Object.assign({}, SET_DEF, raw ? JSON.parse(raw) : {}); } catch (e) { SET = Object.assign({}, SET_DEF); }
    return SET;
  }
  /* --- короткочасне сховище (ліміти) --- */
  const kvGet = async (k) => { const r = await db.find('kv', 'key', k); return r && new Date(r.expires) > new Date() ? r.val : null; };
  const kvPut = (k, v, sec) => db.upsert('kv', { key: k, val: String(v), expires: new Date(Date.now() + sec * 1000).toISOString() });
  const kvDel = (k) => db.removeWhere('kv', 'key', k);

  const bg = (p) => { const q = Promise.resolve(p).catch((e) => console.error('bg', e)); if (deps.bg) deps.bg(q); return q; };
  const tgOn = () => !!(deps.tg && env.TG_ON);
  const tgSend = (chat, m, buttons) => tgOn() && chat ? bg(deps.tg('sendMessage', { chat_id: chat, text: tgHtml(m), parse_mode: 'HTML', link_preview_options: { is_disabled: true },
    reply_markup: buttons ? { inline_keyboard: buttons.map((b) => [b.url.indexOf(APP_URL) === 0 ? { text: b.text, web_app: { url: b.url } } : { text: b.text, url: b.url }]) } : undefined })) : null;
  const tgKeyboard = (chat, text) => tgOn() && chat ? bg(deps.tg('sendMessage', { chat_id: chat, text, parse_mode: 'HTML',
    reply_markup: { keyboard: [[{ text: '🚗 Відкрити АвтоХаб', web_app: { url: APP_URL } }]], resize_keyboard: true, is_persistent: true, input_field_placeholder: 'АвтоХаб' } })) : null;
  const mailSend = (to, m) => deps.mail && to ? bg(deps.mail(to, '[АвтоХаб] ' + m.title, mailHtml(m), mailText(m))) : null;
  const adminTg = (m, buttons) => tgOn() ? bg(db.where('users', 'role', 'admin').then((list) => Promise.all(list.filter((a) => a.tg_chat).map((a) => tgSend(a.tg_chat, m, buttons))))) : null;
  // Лист адміністратору (як і раніше) + те саме в Telegram адміністраторам, які підключили бота.
  const notify = (subject, body) => {
    if (deps.notify && SET.notify_mail) deps.notify(subject, body);
    if (SET.notify_tg) adminTg({ emoji: '🛠', title: subject, intro: String(body || '').slice(0, 1500) }, [{ text: 'Адмін-панель', url: APP_URL }]);
  };

  /* --- облікові записи --- */
  const pubUser = (u) => { const p = { id: u.id, role: u.role, name: u.name, phone: u.phone, tg: !!u.tg_chat, dual: u.role !== 'admin' && !u.isAdmin && !!u.sto_id }; if (u.isAdmin || u.role === 'admin') p.isAdmin = true; return p; };
  const CAR_KEYS = ['id', 'make', 'model', 'year', 'plate', 'vin', 'mileage', 'engine', 'fuel', 'power', 'gearbox', 'drive', 'body', 'modification', 'equipment', 'market', 'about', 'info', 'docs_meta'].concat(CAR_DOCS.map((d) => d[0]));
  const pubCar = (c, urls) => {
    const p = pick(c, CAR_KEYS); p.photo = c.photo && urls ? (urls[c.photo] || '') : '';
    p.mileage_log = kmLog(c).slice().reverse();
    p.mileage_at = p.mileage_log.length ? p.mileage_log[0].date : '';
    return p;
  };
  // Історія пробігу: масив { date, km, src } у cars.mileage_log, від старих до нових.
  const kmLog = (c) => {
    const l = (Array.isArray(c.mileage_log) ? c.mileage_log : []).filter((e) => e && e.km);
    // авто, додані до появи історії: поточний пробіг стає першим записом
    return l.length || !c.mileage ? l : [{ date: String(c.created || '').slice(0, 10) || today(), km: Number(c.mileage), src: 'додано авто' }];
  };
  function kmPush(c, km, src, date) {
    const log = kmLog(c).concat([{ date: date || today(), km: Number(km), src: s_(src).slice(0, 80) }]);
    log.sort((a, b) => a.date < b.date ? -1 : a.date > b.date ? 1 : a.km - b.km);
    return log.slice(-200);
  }
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
    if (has('modification')) f.modification = s_(r.modification).slice(0, 120);
    if (has('equipment')) f.equipment = s_(r.equipment).slice(0, 120);
    if (has('about')) f.about = s_(r.about).slice(0, 2000);
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
    p.logo = s.logo && deps.storagePub ? deps.storagePub.url(s.logo) : '';
    p.photos = (Array.isArray(s.photos) ? s.photos : []).map((x) => deps.storagePub ? deps.storagePub.url(x) : '').filter(Boolean);
    if (!s.owner_id && s.partner === true) p.managed = true;   // партнер без власного акаунта: заявки веде зв'язковий
    if (own) { p.active = isActive(s); p.email = s.email || ''; }
    return p;
  }
  const pubReq = (q) => { const p = pick(q, ['id', 'car_id', 'sto_id', 'category', 'description', 'preferred', 'status', 'sto_comment', 'price', 'visit', 'work_done', 'mileage', 'visited', 'confirmed', 'visit_at', 'visit_state', 'dur_value', 'dur_unit', 'created', 'updated']);
    p.visit_options = Array.isArray(q.visit_options) ? q.visit_options : []; p.visit_log = Array.isArray(q.visit_log) ? q.visit_log : []; p.status_label = STATUS[q.status] || q.status; return p; };
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
    } else if (u.role !== 'admin') {
      // Один номер — два кабінети: водій може мати свій сервіс, а сервіс — свій гараж.
      if (r.as === 'sto' && u.sto_id) u = Object.assign({}, u, { role: 'sto' });
      else if (r.as === 'driver' && u.role === 'sto') u = Object.assign({}, u, { role: 'driver' });
    }
    if (role && u.role !== role) fail('Ця дія недоступна для вашого типу акаунта');
    return u;
  }

  /* --- підтвердження номера: код у Telegram (Telegram Gateway), Viber/SMS (TurboSMS) або безкоштовно через бота (поділитися контактом) --- */
  // бот рахується лише після «Налаштувати Telegram-бота» (вебхук встановлено), інакше реєстрація зависла б
  const otpCh = async () => ({ telegram: !!env.TG_GATEWAY_TOKEN, sms: !!env.TURBOSMS_TOKEN, viber: !!(env.TURBOSMS_TOKEN && env.TURBOSMS_VIBER_SENDER), bot: tgOn() && !!(await kvGet('tg_hook')) });
  const otpAvail = async () => { const c = await otpCh(); return c.telegram || c.sms || c.bot; };
  const otpOn = async () => SET.otp_required !== false && (await otpAvail());
  const otpMeta = async () => (await otpAvail()) ? Object.assign(await otpCh(), { required: SET.otp_required !== false }) : null;
  async function otpTarget(r) {
    const phone = phone_(r.phone), purpose = r.purpose === 'reset' ? 'reset' : 'register';
    const exists = await db.find('users', 'phone', phone);
    if (purpose === 'register' && exists) fail('Цей номер уже зареєстровано. Увійдіть або відновіть PIN.');
    if (purpose === 'reset' && !exists) fail('Акаунта з таким номером немає. Зареєструйтеся.');
    return { phone, purpose };
  }
  async function otpSend(r, meta) {
    const { phone, purpose } = await otpTarget(r);
    if (await kvGet('otp_wait_' + phone)) fail('Код уже надіслано. Новий можна отримати за хвилину.');
    if (!(await rate('otp_ip_' + (meta.ip || '-'), 12, 3600)) || !(await rate('otp_ph_' + phone, 5, 3600))) fail('Забагато спроб. Спробуйте за годину.');
    const code = String(1000 + parseInt(deps.uuid().replace(/-/g, '').slice(0, 8), 16) % 9000);
    const text = code + ' — код підтвердження АвтоХаб. Нікому його не повідомляйте.';
    let via = '';
    if (r.channel !== 'sms' && env.TG_GATEWAY_TOKEN) {
      try {
        const res = await deps.fetch('https://gatewayapi.telegram.org/sendVerificationMessage', { method: 'POST',
          headers: { Authorization: 'Bearer ' + env.TG_GATEWAY_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify({ phone_number: phone, code, ttl: 300 }) });
        const j = await res.json().catch(() => ({}));
        if (j && j.ok) via = 'telegram'; else console.error('tg gateway', JSON.stringify(j).slice(0, 300));
      } catch (e) { console.error('tg gateway', e); }
    }
    if (!via && env.TURBOSMS_TOKEN) {
      const body = { recipients: [phone.slice(1)], sms: { sender: env.TURBOSMS_SENDER || 'TurboSMS', text, hybrid_ttl: 120 } };
      if (env.TURBOSMS_VIBER_SENDER) body.viber = { sender: env.TURBOSMS_VIBER_SENDER, text, ttl: 120 };
      if (!env.TURBOSMS_VIBER_SENDER) delete body.sms.hybrid_ttl;
      try {
        const res = await deps.fetch('https://api.turbosms.ua/message/send.json', { method: 'POST',
          headers: { Authorization: 'Bearer ' + env.TURBOSMS_TOKEN, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const j = await res.json().catch(() => ({}));
        const one = Array.isArray(j.response_result) ? j.response_result[0] : null;
        if (one ? one.message_id : [0, 800, 801, 802].indexOf(Number(j.response_code)) !== -1) via = env.TURBOSMS_VIBER_SENDER ? 'viber' : 'sms';
        else console.error('turbosms', JSON.stringify(j).slice(0, 300));
      } catch (e) { console.error('turbosms', e); }
    }
    if (!via) fail((await otpCh()).bot ? 'Не вдалося надіслати код. Підтвердіть номер через Telegram-бота.' : 'Не вдалося надіслати код. Спробуйте пізніше.');
    await kvPut('otp_' + purpose + '_' + phone, JSON.stringify({ h: await hash(code, phone), n: 0 }), 600);
    await kvPut('otp_wait_' + phone, 1, 60);
    return { via };
  }
  // Безкоштовний шлях: бот просить «Поділитися номером», Telegram віддає власний номер користувача.
  async function otpBot(r) {
    const { phone, purpose } = await otpTarget(r);
    if (!(await otpCh()).bot) fail('Telegram-бот ще не налаштований');
    const nonce = deps.uuid().replace(/-/g, '').slice(0, 20);
    await kvPut('otpb_' + nonce, JSON.stringify({ phone, purpose, ok: false }), 900);
    return { nonce, url: 'https://t.me/' + (await tgBot()) + '?start=v_' + nonce };
  }
  async function otpBotCheck(r) {
    const b = JSON.parse(await kvGet('otpb_' + s_(r.nonce)) || 'null');
    if (!b) fail('Час підтвердження минув. Почніть ще раз.');
    return { confirmed: !!b.ok, error: b.err || '' };
  }
  async function otpVerify(phone, purpose, r) {
    if (purpose === 'register' ? !(await otpOn()) : !(await otpAvail())) return {};
    if (r.otp_nonce) {
      const k = 'otpb_' + s_(r.otp_nonce), b = JSON.parse(await kvGet(k) || 'null');
      if (!b || !b.ok || b.phone !== phone || b.purpose !== purpose) fail('Номер ще не підтверджено в Telegram');
      await kvDel(k);
      return { chat: b.chat || '', ok: true };
    }
    const k = 'otp_' + purpose + '_' + phone, rec = JSON.parse(await kvGet(k) || 'null');
    if (!rec) fail('Підтвердіть номер: отримайте код');
    if (rec.n >= 5) { await kvDel(k); fail('Забагато невдалих спроб. Отримайте новий код.'); }
    if ((await hash(String(r.otp_code || '').replace(/\D/g, ''), phone)) !== rec.h) { rec.n++; await kvPut(k, JSON.stringify(rec), 600); fail('Невірний код'); }
    await kvDel(k);
    return { ok: true };
  }
  async function pinReset(r) {
    const phone = phone_(r.phone), pin = String(r.pin || '');
    if (!/^\d{4,6}$/.test(pin)) fail('PIN має бути з 4–6 цифр');
    const u = await db.find('users', 'phone', phone);
    if (!u) fail('Акаунта з таким номером немає');
    if (!(await otpAvail())) fail('Відновлення PIN тимчасово недоступне. Напишіть на info@autohubkr.com');
    const v = await otpVerify(phone, 'reset', r);
    const salt = deps.uuid();
    const patch = { pin_hash: await hash(pin, salt), salt };
    if (v.chat) patch.tg_chat = v.chat;
    const upd = await db.update('users', u.id, patch);
    await db.removeWhere('sessions', 'user_id', u.id).catch(() => {});
    return session(upd);
  }

  async function register(r) {
    const role = r.role === 'sto' ? 'sto' : 'driver';
    const phone = phone_(r.phone);
    const pin = String(r.pin || '');
    if (!/^\d{4,6}$/.test(pin)) fail('PIN має бути з 4–6 цифр');
    const name = need(r.name, "Вкажіть ім'я");
    if (await db.find('users', 'phone', phone)) fail(role === 'sto' ? 'Цей номер уже зареєстровано як водія. Увійдіть і додайте сервіс у «Профілі»: обидва кабінети працюватимуть під одним номером.' : 'Цей номер уже зареєстровано. Увійдіть: гараж водія доступний і в акаунті сервісу.');
    let st = null, sto = null;
    if (role === 'sto') {
      st = r.sto || {};
      sto = { id: id(), owner_id: '', name: need(st.name, 'Вкажіть назву сервісу'), district: oneOf(st.district, DISTRICTS), address: need(st.address, 'Вкажіть адресу'),
        phone: phone_(st.phone || phone), services: list_(st.services, CATEGORIES).join(', '), hours: s_(st.hours), about: s_(st.about), active: false, created: now(), source: 'реєстрація', geo: '' };
      const em = s_(st.email).toLowerCase(); if (em) { if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(em)) fail('Перевірте email'); sto.email = em; }
    }
    const ver = await otpVerify(phone, 'register', r);
    const salt = deps.uuid();
    const user = { id: id(), role, name, phone, pin_hash: await hash(pin, salt), salt, sto_id: sto ? sto.id : '', created: now(), phone_ok: !!(ver.ok || ver.chat) };
    if (ver.chat) { for (const o of await db.where('users', 'tg_chat', ver.chat)) await db.update('users', o.id, { tg_chat: '' }); user.tg_chat = ver.chat; }
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
    if (u && !u.pin_hash) fail('Ви зареєструвалися через Telegram: відкрийте АвтоХаб у боті або задайте PIN кнопкою «Забули PIN?».');
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
  async function bumpMileage(car, km, src, date) {
    if (!km) return;
    const patch = { mileage_log: kmPush(car, km, src || 'запис обслуговування', date) };
    if (!car.mileage || Number(km) > Number(car.mileage)) patch.mileage = km;
    await db.update('cars', car.id, patch);
  }

  /* --- каталог СТО --- */
  async function catalog(r) {
    const [stos, reviews, done] = await Promise.all([db.where('stos', 'active', true), db.all('reviews'), db.where('requests', 'status', 'done')]);
    let list = stos;
    if (r.category) list = list.filter((s) => String(s.services).indexOf(r.category) !== -1);
    if (r.district) list = list.filter((s) => s.district === r.district);
    const res = list.map((s) => {
      const own = reviews.filter((v) => v.sto_id === s.id);
      const p = pubSto(s);
      p.reviews = own.length;
      p.rating = own.length ? Math.round(own.reduce((a, v) => a + Number(v.rating), 0) / own.length * 10) / 10 : null;
      p.done = done.filter((q) => q.sto_id === s.id).length;
      p.lastReviews = own.sort((a, b) => a.created < b.created ? 1 : -1).slice(0, 10).map((v) => ({ rating: v.rating, text: v.text, date: String(v.created).slice(0, 10) }));
      return p;
    });
    res.sort((a, b) => (a.listed ? 1 : 0) - (b.listed ? 1 : 0) || (b.rating || 0) - (a.rating || 0) || b.reviews - a.reviews || (a.name < b.name ? -1 : 1));
    return { stos: res };
  }

  async function stoAdd(r) {
    const u = await auth(r, 'driver');
    if (String(u.source || '').indexOf('tg:sto') === 0) bg(fnHit('sto_card', 'sto'));
    const real = await db.find('users', 'id', u.id);
    if (real.sto_id) fail('До цього номера вже прив\'язано сервіс');
    const st = r.sto || {};
    const sto = { id: id(), owner_id: u.id, name: need(st.name, 'Вкажіть назву сервісу'), district: oneOf(st.district, DISTRICTS), address: need(st.address, 'Вкажіть адресу'),
      phone: phone_(st.phone || real.phone), services: list_(st.services, CATEGORIES).join(', '), hours: s_(st.hours), about: s_(st.about), active: false, created: now(), source: 'реєстрація', geo: '' };
    const em = s_(st.email).toLowerCase(); if (em) { if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(em)) fail('Перевірте email'); sto.email = em; }
    const same = (await db.all('stos')).find((x) => !x.owner_id && x.phone && (x.phone === sto.phone || x.phone === real.phone));
    let stoId = sto.id;
    if (same) {
      const keep = { owner_id: u.id, name: sto.name, district: sto.district, address: sto.address, phone: sto.phone, services: sto.services || same.services, hours: sto.hours || same.hours, about: sto.about || same.about };
      if (sto.email) keep.email = sto.email;
      if (keep.address !== same.address) { keep.lat = null; keep.lng = null; keep.geo = ''; }
      await db.update('stos', same.id, keep); stoId = same.id;
    } else await db.insert('stos', sto);
    await db.update('users', u.id, { sto_id: stoId });
    notify((same ? 'СТО підтвердив свою картку: ' : 'Новий СТО чекає перевірки: ') + sto.name, 'Водій ' + real.name + ' (' + real.phone + ') додав свій сервіс до акаунта.\nАдреса: ' + sto.address +
      '\nПослуги: ' + sto.services + '\n\nПеревірка: autohubkr.com/app/ → СТО → Перевірка.');
    return { sto_id: stoId };
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
    if (f.email !== undefined) { const em = s_(f.email).toLowerCase(); if (em && !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(em)) fail('Перевірте email'); patch.email = em; }
    const upd = Object.keys(patch).length ? await db.update('stos', sto.id, patch) : sto;
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
    q.photos = await savePhotos(r.photos, 'req/' + q.id);
    await db.insert('requests', q);
    {
      const m = { emoji: '🚗', title: 'Нова заявка: ' + q.category, intro: 'Водій обрав ваш сервіс в АвтоХабі. Прийміть заявку, і ви побачите його телефон.',
        quote: q.description, rows: [['Авто', [car.make, car.model, car.year].filter(Boolean).join(' ')], ['Пробіг', car.mileage ? Number(car.mileage).toLocaleString('uk-UA') + ' км' : ''],
          ['Коли зручно', q.preferred], ['Фото', q.photos.length ? '📷 ' + q.photos.length + ' (у застосунку)' : ''], ['Сервіс', sto.name]], cta: { text: 'Відкрити заявку', url: APP_URL + '#/sto' } };
      if (sto.owner_id) {
        const owner = await db.find('users', 'id', sto.owner_id);
        if (owner) tgSend(owner.tg_chat, m, [{ text: '📋 Відкрити заявку', url: APP_URL + '#/sto' }]);
        mailSend(sto.email, m);
      }
    }
    notify((sto.owner_id ? 'Нова заявка в АвтоХабі → ' : 'Заявка для зв\'язкового: зателефонуйте → ') + sto.name,
      'СТО: ' + sto.name + ' (' + sto.phone + ')\nАвто: ' + carTitle(car) + '\nКатегорія: ' + q.category +
      '\nОпис: ' + q.description + '\nБажаний час: ' + (q.preferred || '—') + '\nВодій: ' + u.name + ', ' + u.phone);
    return { request: pubReq(q) };
  }

  // До 4 фото проблеми: стиснений у браузері JPEG → приватне сховище, перегляд за підписаними посиланнями.
  async function savePhotos(list, dir) {
    const arr = (Array.isArray(list) ? list : []).slice(0, 4), out = [];
    if (!arr.length) return out;
    if (!deps.storage) fail('Фото тимчасово недоступні');
    for (let i = 0; i < arr.length; i++) {
      const m = String(arr[i] || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
      if (!m) fail('Фото мають бути у форматі JPEG');
      const bytes = deps.b64decode(m[1]);
      if (bytes.length > PHOTO_MAX || !(bytes[0] === 0xFF && bytes[1] === 0xD8)) fail('Одне з фото завелике або пошкоджене');
      const path = dir + '/' + i + '-' + deps.uuid().slice(0, 6) + '.jpg';
      await deps.storage.put(path, bytes, 'image/jpeg');
      out.push(path);
    }
    return out;
  }
  async function signReqPhotos(rows, out) {
    const paths = rows.flatMap((q) => Array.isArray(q.photos) ? q.photos : []);
    const urls = paths.length && deps.storage ? await deps.storage.sign(paths) : {};
    out.forEach((p, i) => { p.photos = (Array.isArray(rows[i].photos) ? rows[i].photos : []).map((x) => urls[x]).filter(Boolean); });
    return out;
  }

  async function reqList(r) {
    const u = await auth(r);
    const mine = u.role === 'driver' ? await db.where('requests', 'driver_id', u.id) : await db.where('requests', 'sto_id', u.sto_id || '-');
    mine.sort((a, b) => a.created < b.created ? 1 : -1);
    const ids = (k) => [...new Set(mine.map((q) => q[k]))];
    const [cars, stos, users, reviews] = await Promise.all([db.in('cars', 'id', ids('car_id')), db.in('stos', 'id', ids('sto_id')),
      u.role === 'sto' ? db.in('users', 'id', ids('driver_id')) : Promise.resolve([]), db.in('reviews', 'request_id', mine.map((q) => q.id))]);
    const by = (arr, k, v) => arr.find((x) => x[k] === v) || null;
    return { requests: await signReqPhotos(mine, mine.map((q) => {
      const p = pubReq(q), car = by(cars, 'id', q.car_id), sto = by(stos, 'id', q.sto_id), rv = by(reviews, 'request_id', q.id);
      p.car = car ? carTitle(car) : '';
      if (u.role === 'sto' && car) { p.car_info = [car.modification, car.equipment, car.mileage ? 'пробіг ' + Number(car.mileage).toLocaleString('uk-UA') + ' км' : '', car.vin && q.status !== 'new' ? 'VIN ' + car.vin : ''].filter(Boolean).join(' · '); p.car_about = car.about || ''; }
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
    })) };
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
    if (to === 'accepted') {
      patch.code = String(1000 + Math.floor(Math.random() * 9000));
      if (r.visit_at !== undefined) {
        const at = slot_(r.visit_at);
        const dv = int(r.dur_value); if (!dv || dv > 365) fail('Вкажіть строк ремонту');
        patch.visit_at = at; patch.visit_state = 'sto'; patch.visit = slotText(at); patch.visit_options = [];
        patch.dur_value = dv; patch.dur_unit = r.dur_unit === 'дн' ? 'дн' : 'год';
        patch.visit_log = [{ at: now(), by: 'sto', kind: 'propose', slots: [at] }];
      }
    }
    if (r.comment !== undefined && u.role !== 'driver') patch.sto_comment = s_(r.comment);
    if (u.role === 'driver' && to === 'cancelled' && s_(r.comment)) patch.sto_comment = 'Водій: ' + s_(r.comment);
    if (r.price !== undefined && r.price !== '') patch.price = num(r.price);
    if (r.visit !== undefined) patch.visit = s_(r.visit);
    if (to === 'done') { patch.work_done = need(r.work_done, 'Опишіть виконані роботи'); patch.mileage = int(r.mileage); }
    const nq = await db.update('requests', q.id, patch);
    if (u.role === 'driver' && to === 'cancelled') {
      bg((async () => {
        const st = await db.find('stos', 'id', nq.sto_id); const car = await db.find('cars', 'id', nq.car_id);
        const m = { emoji: '❌', title: 'Водій скасував ' + (q.status === 'accepted' ? 'запис' : 'заявку'), intro: q.status === 'accepted' && q.visit ? 'Час ' + q.visit + ' звільнився.' : '',
          rows: [['Заявка', nq.category], ['Авто', car ? [car.make, car.model].join(' ') : ''], ['Причина', s_(r.comment)]] };
        const owner = st && st.owner_id ? await db.find('users', 'id', st.owner_id) : null;
        if (owner) tgSend(owner.tg_chat, m, [{ text: 'Відкрити заявки', url: APP_URL + '#/sto' }]);
        if (st && st.owner_id) mailSend(st.email, m);
        if (st && !st.owner_id) adminTg(Object.assign({}, m, { title: '[' + st.name + '] ' + m.title }));
      })());
    }
    if (u.role !== 'driver' && ['accepted', 'declined', 'done'].indexOf(to) !== -1) {
      bg((async () => {
        const [drv, st] = await Promise.all([db.find('users', 'id', nq.driver_id), db.find('stos', 'id', nq.sto_id)]);
        if (!drv || !drv.tg_chat) return;
        const money = nq.price ? Number(nq.price).toLocaleString('uk-UA') + ' грн' : '';
        const m = to === 'accepted' ? { emoji: '✅', title: (st ? st.name : 'Сервіс') + ' прийняв заявку', intro: nq.visit_state === 'sto' ? 'Підтвердіть час у застосунку або запропонуйте свій. Код візиту покажіть у сервісі.' : 'Покажіть код візиту в сервісі, коли приїдете.',
            rows: [['Запрошують', nq.visit], ['Строк ремонту', durText(nq.dur_value, nq.dur_unit)], ['Орієнтовна ціна', money], ['Код візиту', nq.code], ['Коментар', nq.sto_comment], ['Адреса', st ? st.address : ''], ['Телефон', st ? st.phone : '']] }
          : to === 'declined' ? { emoji: '↩️', title: (st ? st.name : 'Сервіс') + (q.status === 'accepted' ? ' скасував запис' : ' не зможе взяти заявку'), intro: 'Оберіть інший сервіс у застосунку.', rows: [['Причина', nq.sto_comment]] }
          : { emoji: '🏁', title: 'Роботи виконано: ' + (st ? st.name : ''), intro: 'Підтвердіть виконання й оцініть сервіс: це допоможе іншим водіям.', rows: [['Що зроблено', nq.work_done], ['Сума', money]] };
        await tgSend(drv.tg_chat, m, [{ text: to === 'accepted' && nq.visit_state === 'sto' ? '📅 Підтвердити час' : 'Відкрити в АвтоХабі', url: APP_URL + '#/requests' }]);
      })());
    }
    if (to === 'done') {
      const [sto, car] = await Promise.all([db.find('stos', 'id', nq.sto_id), db.find('cars', 'id', nq.car_id)]);
      await db.insert('history', { id: id(), car_id: nq.car_id, user_id: nq.driver_id, date: today(), work: nq.work_done, place: sto ? sto.name : '',
        price: nq.price, mileage: nq.mileage, request_id: nq.id, created: now(), confirmed: '' });
      if (car && nq.mileage) await bumpMileage(car, nq.mileage, 'сервіс' + (sto ? ': ' + sto.name : ''));
      try {
        const drv = await db.find('users', 'id', nq.driver_id);
        await db.insert('sto_jobs', { id: id(), sto_id: nq.sto_id, date: today(), client_name: drv ? drv.name : '', client_phone: drv ? drv.phone : '', car: car ? [car.make, car.model, car.year].filter(Boolean).join(' ') : '',
          plate: car ? car.plate || '' : '', vin: car ? car.vin || '' : '', mileage: nq.mileage, work: nq.work_done, price: nq.price, status: 'done', source: 'АвтоХаб', request_id: nq.id, note: '', created: now() });
      } catch (e) { console.error('sto_jobs', e); }
    }
    return { request: pubReq(nq) };
  }

  // Перевірка часу: формат і не в минулому (за київським часом сервера now()).
  function slot_(v) {
    const x = s_(v);
    if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(x)) fail('Оберіть дату й час');
    if (x.replace('T', ' ') < now().slice(0, 16)) fail('Цей час уже минув');
    if (x.slice(0, 10) > fmt(new Date(Date.now() + 120 * 864e5)).slice(0, 10)) fail('Оберіть дату в найближчі 4 місяці');
    return x;
  }
  // Запропонувати час (або перенести): водій — до 3 варіантів, сервіс — один.
  async function reqSlot(r) {
    const u = await auth(r);
    const q = await db.find('requests', 'id', String(r.id || ''));
    const side = u.role === 'driver' ? 'driver' : 'sto';
    if (!q || (side === 'driver' ? q.driver_id !== u.id : q.sto_id !== u.sto_id)) fail('Заявку не знайдено');
    if (q.status !== 'accepted') fail('Час можна змінити, поки авто не прийняли в роботу');
    const slots = [...new Set((Array.isArray(r.slots) ? r.slots : [r.slots]).filter(Boolean).map(slot_))].slice(0, side === 'driver' ? 3 : 1);
    if (!slots.length) fail('Оберіть дату й час');
    const log = (Array.isArray(q.visit_log) ? q.visit_log : []).concat([{ at: now(), by: side, kind: q.visit_state === 'confirmed' ? 'move' : 'propose', slots, note: s_(r.note).slice(0, 200) }]).slice(-20);
    const patch = side === 'driver' ? { visit_state: 'driver', visit_options: slots, visit_log: log, updated: now() }
      : { visit_state: 'sto', visit_at: slots[0], visit: slotText(slots[0]), visit_options: [], visit_log: log, updated: now() };
    const nq = await db.update('requests', q.id, patch);
    slotNotify(nq, side, slots, s_(r.note), q.visit_state === 'confirmed');
    return { request: pubReq(nq) };
  }
  // Підтвердити час: водій — запропонований сервісом, сервіс — один із варіантів водія.
  async function reqSlotOk(r) {
    const u = await auth(r);
    const q = await db.find('requests', 'id', String(r.id || ''));
    const side = u.role === 'driver' ? 'driver' : 'sto';
    if (!q || (side === 'driver' ? q.driver_id !== u.id : q.sto_id !== u.sto_id)) fail('Заявку не знайдено');
    if (q.status !== 'accepted') fail('Цей крок зараз недоступний');
    let at;
    if (side === 'driver') { if (q.visit_state !== 'sto') fail('Немає часу, який чекає вашого підтвердження'); at = q.visit_at; }
    else { const opts = Array.isArray(q.visit_options) ? q.visit_options : []; at = String(r.slot || ''); if (q.visit_state !== 'driver' || opts.indexOf(at) === -1) fail('Оберіть один із варіантів водія'); }
    if (at.replace('T', ' ') < now().slice(0, 16)) fail('Цей час уже минув. Запропонуйте інший.');
    const log = (Array.isArray(q.visit_log) ? q.visit_log : []).concat([{ at: now(), by: side, kind: 'confirm', slots: [at] }]).slice(-20);
    const nq = await db.update('requests', q.id, { visit_state: 'confirmed', visit_at: at, visit: slotText(at), visit_options: [], visit_log: log, updated: now() });
    slotNotify(nq, side, [at], '', false, true);
    return { request: pubReq(nq) };
  }
  // Сповіщення другої сторони про зміну часу (Telegram; сервісу — ще й лист).
  function slotNotify(q, by, slots, note, moved, confirmed) {
    bg((async () => {
      const [drv, st] = await Promise.all([db.find('users', 'id', q.driver_id), db.find('stos', 'id', q.sto_id)]);
      const car = await db.find('cars', 'id', q.car_id);
      const carT = car ? [car.make, car.model].filter(Boolean).join(' ') : '';
      const times = slots.map(slotText).join(' або ');
      if (by === 'sto' && drv) {
        const m = confirmed ? { emoji: '📅', title: 'Запис підтверджено: ' + (st ? st.name : ''), intro: 'Чекаємо вас ' + times + '. Не забудьте показати код візиту.', rows: [['Адреса', st ? st.address : ''], ['Код візиту', q.code]] }
          : { emoji: '🕒', title: (moved ? 'Сервіс пропонує перенести візит' : 'Сервіс пропонує інший час'), intro: 'Підтвердіть або запропонуйте свій варіант у застосунку.', rows: [['Час', times], ['Строк ремонту', durText(q.dur_value, q.dur_unit)], ['Коментар', note], ['Сервіс', st ? st.name : '']] };
        tgSend(drv.tg_chat, m, [{ text: confirmed ? 'Відкрити заявку' : '🕒 Відповісти', url: APP_URL + '#/requests' }]);
      }
      if (by === 'driver' && st) {
        const owner = st.owner_id ? await db.find('users', 'id', st.owner_id) : null;
        const m = confirmed ? { emoji: '📅', title: 'Водій підтвердив час: ' + times, intro: 'Запис на ' + carT + ' підтверджено.', rows: [['Заявка', q.category], ['Водій', drv ? drv.name : '']] }
          : { emoji: '🕒', title: moved ? 'Водій просить перенести візит' : 'Водій пропонує інший час', intro: 'Оберіть зручний варіант або запропонуйте свій.', rows: [['Варіанти', times], ['Коментар', note], ['Авто', carT], ['Заявка', q.category]],
            cta: { text: 'Відповісти', url: APP_URL + '#/sto' } };
        if (owner) tgSend(owner.tg_chat, m, [{ text: confirmed ? 'Відкрити заявку' : '🕒 Обрати час', url: APP_URL + '#/sto' }]);
        if (!confirmed) mailSend(st.email, m);
        if (!st.owner_id) adminTg(Object.assign({}, m, { title: '[' + st.name + '] ' + m.title }), [{ text: 'Кабінет сервісу', url: APP_URL }]);
      }
    })());
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

  /* --- журнал робіт сервісу: власні клієнти й роботи через АвтоХаб --- */
  const JOB_ST = ['in_work', 'done'];
  const pubJob = (j) => pick(j, ['id', 'date', 'client_name', 'client_phone', 'car', 'plate', 'vin', 'mileage', 'work', 'price', 'status', 'source', 'request_id', 'note', 'created']);
  function jobFields(r, partial) {
    const f = {}, has = (k) => !partial || r[k] !== undefined;
    if (has('date')) { const d = date_(r.date) || today(); if (d > today()) fail('Дата не може бути в майбутньому'); f.date = d; }
    if (has('client_name')) f.client_name = s_(r.client_name).slice(0, 120);
    if (has('client_phone')) { const ph = s_(r.client_phone); f.client_phone = ph ? (() => { try { return phone_(ph); } catch (e) { fail('Перевірте телефон клієнта'); } })() : ''; }
    if (has('car')) f.car = s_(r.car).slice(0, 120);
    if (has('plate')) f.plate = s_(r.plate).toUpperCase().replace(/\s+/g, '').slice(0, 12);
    if (has('vin')) f.vin = s_(r.vin).toUpperCase().replace(/\s+/g, '').slice(0, 17);
    if (has('mileage')) { const m = int(r.mileage); if (m && m > 2000000) fail('Перевірте пробіг'); f.mileage = m; }
    if (has('work')) f.work = s_(r.work);
    if (has('price')) f.price = r.price === '' || r.price === null ? null : num(r.price);
    if (has('status')) f.status = r.status ? oneOf(r.status, JOB_ST) : 'done';
    if (has('note')) f.note = s_(r.note).slice(0, 500);
    return f;
  }
  async function jobsList(r) {
    const u = await auth(r, 'sto');
    const rows = await db.where('sto_jobs', 'sto_id', u.sto_id || '-');
    rows.sort((a, b) => a.date < b.date ? 1 : a.date > b.date ? -1 : (a.created < b.created ? 1 : -1));
    return { jobs: rows.map(pubJob) };
  }
  async function jobsAdd(r) {
    const u = await auth(r, 'sto');
    if (!u.sto_id) fail('Сервіс не знайдено');
    const f = jobFields(r, false);
    if (!f.work) fail('Опишіть роботи');
    if (!f.car && !f.plate && !f.client_name) fail('Вкажіть клієнта, авто або номер');
    const j = Object.assign({ id: id(), sto_id: u.sto_id, source: 'власний', request_id: '', created: now() }, f);
    await db.insert('sto_jobs', j);
    return { job: pubJob(j) };
  }
  async function jobsUpdate(r) {
    const u = await auth(r, 'sto');
    const j = await db.find('sto_jobs', 'id', String(r.id || ''));
    if (!j || j.sto_id !== u.sto_id) fail('Запис не знайдено');
    const f = jobFields(r, true);
    if (f.work !== undefined && !f.work) fail('Опишіть роботи');
    return { job: pubJob(await db.update('sto_jobs', j.id, f)) };
  }
  async function jobsDelete(r) {
    const u = await auth(r, 'sto');
    const j = await db.find('sto_jobs', 'id', String(r.id || ''));
    if (!j || j.sto_id !== u.sto_id) fail('Запис не знайдено');
    if (j.request_id) fail('Запис із заявки АвтоХабу видалити не можна');
    await db.removeWhere('sto_jobs', 'id', j.id);
    return {};
  }

  /* --- фото сервісу: логотип і до 8 фото робіт та цеху (публічні) --- */
  async function stoPhotoOp(sto, r) {
    if (!deps.storagePub) fail('Фото тимчасово недоступні');
    const photos = Array.isArray(sto.photos) ? sto.photos.slice() : [];
    if (r.remove) {
      if (r.kind === 'logo') { if (sto.logo) await deps.storagePub.remove([sto.logo]).catch(() => {}); return db.update('stos', sto.id, { logo: '' }); }
      const url = String(r.remove), keep = photos.filter((x) => deps.storagePub.url(x) !== url);
      const gone = photos.filter((x) => keep.indexOf(x) === -1);
      if (gone.length) await deps.storagePub.remove(gone).catch(() => {});
      return db.update('stos', sto.id, { photos: keep });
    }
    const m = String(r.image || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if (!m) fail('Надішліть фото у форматі JPEG');
    const bytes = deps.b64decode(m[1]);
    if (bytes.length > PHOTO_MAX) fail('Фото завелике');
    if (!(bytes[0] === 0xFF && bytes[1] === 0xD8)) fail('Це не схоже на фото JPEG');
    if (r.kind !== 'logo' && photos.length >= 8) fail('Можна додати до 8 фото. Видаліть зайві.');
    const path = sto.id + '/' + (r.kind === 'logo' ? 'logo' : 'p') + '-' + deps.uuid().slice(0, 8) + '.jpg';
    await deps.storagePub.put(path, bytes, 'image/jpeg');
    if (r.kind === 'logo') { if (sto.logo) await deps.storagePub.remove([sto.logo]).catch(() => {}); return db.update('stos', sto.id, { logo: path }); }
    photos.push(path);
    return db.update('stos', sto.id, { photos });
  }
  async function stoPhoto(r) {
    const u = await auth(r, 'sto');
    const sto = await db.find('stos', 'id', u.sto_id || '-');
    if (!sto) fail('Сервіс не знайдено');
    return { sto: pubSto(await stoPhotoOp(sto, r), true) };
  }
  async function adminStoPhoto(r) {
    await auth(r, 'admin');
    const sto = await db.find('stos', 'id', String(r.id || ''));
    if (!sto) fail('Сервіс не знайдено');
    const upd = await stoPhotoOp(sto, r);
    const p = pubSto(upd, true); p.source = upd.source; p.geo = geoOf(upd); p.partner = upd.partner === true;
    return { sto: p };
  }

  /* --- міні-застосунок Telegram: вхід і прив'язка за підписаними даними Telegram --- */
  async function tgAuth(r) {
    const tu = deps.tgCheck ? await deps.tgCheck(r.initData) : null;
    if (!tu || !tu.id) fail('Не вдалося перевірити Telegram');
    const u = (await db.where('users', 'tg_chat', String(tu.id)))[0];
    if (!u) return { linked: false, tgName: s_(tu.first_name) };
    return session(u);
  }
  // Міні-застосунок: «Увійти одним натиском» → запам'ятовуємо роль, далі Telegram надсилає боту контакт (requestContact)
  async function tgPrereg(r) {
    const tu = deps.tgCheck ? await deps.tgCheck(r.initData) : null;
    if (!tu || !tu.id) fail('Не вдалося перевірити Telegram');
    const role = r.role === 'sto' ? 'sto' : 'driver';
    await kvPut('tgreg_' + tu.id, JSON.stringify({ role, src: 'miniapp' }), 900);
    await fnHit('start', role); await fnHit('role', role);
    return {};
  }
  async function tgBind(r) {
    const u = await auth(r);
    const tu = deps.tgCheck ? await deps.tgCheck(r.initData) : null;
    if (!tu || !tu.id) fail('Не вдалося перевірити Telegram');
    const chat = String(tu.id);
    for (const o of await db.where('users', 'tg_chat', chat)) if (o.id !== u.id) await db.update('users', o.id, { tg_chat: '' });
    await db.update('users', u.id, { tg_chat: chat });
    return {};
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
    }, tg: { token: tgOn(), hook: !!(await kvGet('tg_hook')), bot: await botName() }, funnel: await (async () => { const o = {}; for (const st of FUNNEL) for (const rl of ['driver', 'sto']) o[st + '_' + rl] = Number(await kvGet('fn_' + st + '_' + rl) || 0); o.start_x = Number(await kvGet('fn_start_x') || 0); return o; })(), statuses: STATUS };
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
    let upd = Object.keys(patch).length ? await db.update('stos', sto.id, patch) : sto;
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
    return { requests: await signReqPhotos(top, top.map((q) => {
      const p = pubReq(q), car = by(cars, 'id', q.car_id), sto = by(stos, 'id', q.sto_id), d = by(users, 'id', q.driver_id), rv = by(reviews, 'request_id', q.id);
      p.car = car ? carTitle(car) : ''; p.sto = sto ? { id: sto.id, name: sto.name, phone: sto.phone, managed: !sto.owner_id } : null;
      p.driver = d ? { name: d.name, phone: d.phone } : null; p.review = rv ? { rating: rv.rating, text: rv.text } : null;
      p.admin_note = q.admin_note || ''; p.code = q.code || '';
      return p;
    })), total: all.length };
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
    if (used >= SET.ai_limit) fail('Ліміт AI-підказок вичерпано. Спробуйте за кілька годин.');
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
    const imgs = (Array.isArray(r.photos) ? r.photos : []).slice(0, 3).map((x) => String(x).match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/)).filter(Boolean)
      .map((m) => ({ inline_data: { mime_type: 'image/jpeg', data: m[1] } }));
    const a = await gemini(ck, used, system + (imgs.length ? '\nВодій додав фото: врахуй, що на них видно (лампи на панелі, сліди, пошкодження), але не вигадуй.' : ''), imgs.concat([{ text: prompt }]), schema);
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

  // Опис авто: характеристики, типова комплектація, слабкі місця й поради з ТО (AI, кеш на однакову версію 180 днів).
  async function carInfo(r) {
    const u = await auth(r, 'driver'); const c = await ownCar(u, r.id);
    if (!env.GEMINI_API_KEY) fail('Опис авто тимчасово недоступний');
    const parts = [c.make, c.model, c.year, c.modification, c.equipment, c.engine ? c.engine + ' л' : '', c.fuel, c.gearbox, c.drive, c.power ? c.power + ' к.с.' : '', c.body].filter(Boolean);
    const key = 'carinfo_' + nrm(parts.join('|')).slice(0, 180);
    let info = r.refresh ? null : JSON.parse(await kvGet(key) || 'null');
    if (!info) {
      const ck = 'ai_' + u.id, used = Number(await kvGet(ck) || 0);
      if (used >= SET.ai_limit) fail('Ліміт AI-запитів вичерпано. Спробуйте за кілька годин.');
      await kvPut(ck, used + 1, 21600);
      let opts = [];
      if (c.equipment && env.AUTO_RIA_KEY) {
        try { /* опції комплектації з довідника, якщо вони там є */
          const mods = (await riaMods({ token: r.token, as: r.as, make: c.make, model: c.model, year: c.year })).mods || [];
          const m = mods.find((x) => x.name === c.modification);
          if (m) { const eq = await riaEquips({ token: r.token, as: r.as, modification: m.id, year: c.year }); opts = (eq.options || {})[c.equipment] || []; }
        } catch (e) { opts = []; }
      }
      const system = ['Ти автоексперт. Опиши конкретну версію авто для власника в Україні, українською мовою, коротко й по суті.',
        'Пиши лише те, що загальновідомо для цієї моделі, покоління й двигуна. Якщо не впевнений у цифрі, не вказуй її. Не вигадуй.',
        'summary — 2–3 речення: що це за авто, покоління, для кого.',
        'specs — до 10 пар {k, v}: двигун (код, якщо відомий), потужність, крутний момент, розгін 0–100, витрата (змішаний цикл), об\'єм баку, моторне масло (допуск і об\'єм заправки), типорозмір шин, кліренс.',
        'equipment — до 15 пунктів типового оснащення саме цієї комплектації (якщо комплектацію вказано) або базового оснащення версії.' + (opts.length ? ' Опції з довідника вже є, спирайся на них.' : ''),
        'strengths — до 4 сильних сторін. weak — до 6 типових слабких місць і поломок цієї версії з орієнтовним пробігом. service — до 6 практичних порад з ТО (інтервали, ремінь/ланцюг ГРМ, масло в коробці).'].join('\n');
      const schema = { type: 'OBJECT', properties: { summary: { type: 'STRING' },
        specs: { type: 'ARRAY', items: { type: 'OBJECT', properties: { k: { type: 'STRING' }, v: { type: 'STRING' } }, required: ['k', 'v'] } },
        equipment: { type: 'ARRAY', items: { type: 'STRING' } }, strengths: { type: 'ARRAY', items: { type: 'STRING' } },
        weak: { type: 'ARRAY', items: { type: 'STRING' } }, service: { type: 'ARRAY', items: { type: 'STRING' } } }, required: ['summary'] };
      const a = await gemini(ck, used, system, [{ text: 'Авто: ' + parts.join(', ') + (opts.length ? '\nОпції комплектації з довідника: ' + opts.join('; ') : '') }], schema);
      const L = (x, n, len) => (Array.isArray(x) ? x : []).map((v) => s_(v).slice(0, len || 200)).filter(Boolean).slice(0, n);
      info = { summary: s_(a.summary).slice(0, 600), specs: (Array.isArray(a.specs) ? a.specs : []).map((x) => ({ k: s_(x.k).slice(0, 40), v: s_(x.v).slice(0, 80) })).filter((x) => x.k && x.v).slice(0, 10),
        equipment: opts.length ? opts.slice(0, 40) : L(a.equipment, 15), equipSrc: opts.length ? 'catalog' : 'ai', strengths: L(a.strengths, 4), weak: L(a.weak, 6), service: L(a.service, 6), at: today() };
      await kvPut(key, JSON.stringify(info), 180 * 86400);
    }
    const upd = await db.update('cars', c.id, { info });
    return { car: pubCar(upd, await signPhotos([upd])) };
  }

  // Фото або PDF поліса ОСЦПВ / КАСКО / Зеленої карти / протоколу техконтролю → строк дії в картку авто.
  // Відкритого API в МТСБУ немає (перевірка на сайті за капчею), тому строки беремо з самого документа.
  async function aiDoc(r) {
    const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
    if (!env.GEMINI_API_KEY) fail('Розпізнавання документів ще не налаштоване');
    const m = String(r.file || r.image || '').match(/^data:(image\/jpeg|application\/pdf);base64,([A-Za-z0-9+/=]+)$/);
    if (!m) fail('Надішліть фото (JPEG) або PDF поліса');
    if (m[2].length * 0.75 > PHOTO_MAX) fail('Файл завеликий, до 1,5 МБ');
    const ck = 'ai_' + u.id, used = Number(await kvGet(ck) || 0);
    if (used >= SET.ai_limit) fail('Ліміт розпізнавань вичерпано. Спробуйте за кілька годин.');
    await kvPut(ck, used + 1, 21600);
    const system = ['Ти розпізнаєш український автомобільний документ: поліс ОСЦПВ (автоцивілка, зокрема електронний), поліс КАСКО, Зелену карту або протокол обов\'язкового технічного контролю.',
      'kind: osago, kasko, green, inspection або other. until — останній день дії (YYYY-MM-DD), from — перший день дії. Для техконтролю until — дата наступного контролю.',
      'insurer — назва страхової компанії, number — номер поліса, plate — держномер авто, vin — VIN. Лише те, що видно в документі; чого немає, залиш порожнім. Не вигадуй.'].join('\n');
    const schema = { type: 'OBJECT', properties: { kind: { type: 'STRING', enum: ['osago', 'kasko', 'green', 'inspection', 'other'] }, until: { type: 'STRING' }, from: { type: 'STRING' },
      insurer: { type: 'STRING' }, number: { type: 'STRING' }, plate: { type: 'STRING' }, vin: { type: 'STRING' } }, required: ['kind'] };
    const a = await gemini(ck, used, system, [{ inline_data: { mime_type: m[1], data: m[2] } }, { text: 'Розпізнай документ.' }], schema);
    const field = { osago: 'osago_until', kasko: 'kasko_until', green: 'green_until', inspection: 'inspection_until' }[a.kind];
    if (!field) fail('Не схоже на поліс чи протокол техконтролю. Сфотографуйте документ рівно й повністю.');
    const until = date_(a.until);
    if (!until) fail('Не вдалося прочитати дату закінчення. Вкажіть її вручну.');
    const plate = s_(a.plate).toUpperCase().replace(/\s+/g, ''), vin = s_(a.vin).toUpperCase().replace(/\s+/g, '');
    const lat = (x) => x.replace(/[АВЕІКМНОРСТХ]/g, (ch) => 'ABEIKMHOPCTX'['АВЕІКМНОРСТХ'.indexOf(ch)]);
    const other = (plate && c.plate && lat(plate) !== lat(c.plate)) || (vin.length === 17 && c.vin && vin !== c.vin);
    const docMeta = Object.assign({}, c.docs_meta || {}, { [field]: { insurer: s_(a.insurer).slice(0, 80), number: s_(a.number).slice(0, 30), from: date_(a.from) || '', at: today() } });
    const upd = await db.update('cars', c.id, { [field]: until, docs_meta: docMeta });
    return { car: pubCar(upd, await signPhotos([upd])), doc: { field, until, insurer: docMeta[field].insurer, number: docMeta[field].number, mismatch: !!other } };
  }

  // Фото чека або заказ-наряду → чернетка запису в історію (водій перевіряє й зберігає сам).
  async function aiReceipt(r) {
    const u = await auth(r, 'driver');
    if (!env.GEMINI_API_KEY) fail('Розпізнавання чеків ще не налаштоване');
    const m = String(r.image || '').match(/^data:image\/jpeg;base64,([A-Za-z0-9+/=]+)$/);
    if (!m) fail('Надішліть фото чека у форматі JPEG');
    if (m[1].length * 0.75 > PHOTO_MAX) fail('Фото завелике');
    const ck = 'ai_' + u.id, used = Number(await kvGet(ck) || 0);
    if (used >= SET.ai_limit) fail('Ліміт розпізнавань вичерпано. Спробуйте за кілька годин.');
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
    const res = { drivers: leads.filter((l) => l.kind === 'driver').length, services: leads.filter((l) => l.kind === 'service').length, catalog: stos.length, tgBot: await botName(), counterMin: SET.counter_min };
    await kvPut('stats_public', JSON.stringify(res), 300);
    return res;
  }

  // Розшифровка VIN: vPIC (NHTSA, безкоштовно) → свій довідник виробників → за потреби Gemini для моделі.
  async function vinDecode(r) {
    const u = await auth(r, 'driver');
    const raw = s_(r.vin).toUpperCase().replace(/[\s-]+/g, '');
    const isVin = /^[A-HJ-NPR-Z0-9]{17}$/.test(raw);
    if (!isVin) fail('VIN має містити 17 символів (латиниця й цифри, без I, O, Q)');
    const plate = '';
    if (!(await rate('vin_' + u.id, 30, 3600))) fail('Забагато перевірок. Спробуйте за годину.');
    let vin = isVin ? raw : '';
    const out = { vin, plate, make: '', model: '', year: null, engine: null, fuel: '', power: null, gearbox: '', drive: '', body: '', color: '', stolen: false, source: [] };
    const tc = (x) => String(x).toLowerCase().replace(/(^|[\s-])([a-zа-яіїєґ])/g, (m0, a, b) => a + b.toUpperCase());
    const brandCase = (b) => /^(BMW|GMC|MINI|BYD|SEAT|ВАЗ|ЗАЗ|УАЗ|ГАЗ|DS|MG)$/i.test(b) ? String(b).toUpperCase() : tc(b);
    const modelCase = (m) => /^[A-Z0-9 .-]+$/.test(m) && /[A-Z]{3,}/.test(m) ? tc(m) : String(m || '');
    // 1) Офіційний відкритий реєстр МВС (data.gov.ua): усі авто, з якими були реєстраційні дії з 2021 року, вся Україна.
    let reg = null;
    if (vin && deps.vinShard) {
      try {
        const txt = await deps.vinShard((await deps.sha256hex(vin)).slice(0, 3));
        const line = txt ? txt.split('\n').find((l) => l.startsWith(vin + '\t')) : null;
        if (line) { const f = line.split('\t'); reg = { vin: f[0], brand: f[1], model: f[2], year: f[3], capacity: f[4], fuel: f[5], body: f[6], color: f[7], power_kw: f[8], d_reg: f[9] }; }
      } catch (e) { console.error('vinShard', e); reg = null; }
    }
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
      if (used < SET.ai_limit) {
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

  /* --- Telegram-бот: прив'язка акаунта й вебхук --- */
  async function tgBot() {
    const c = await kvGet('tg_bot');
    if (c) return c;
    const r = await deps.tg('getMe', {});
    const name = r && r.result && r.result.username;
    if (!name) fail('Telegram-бот не відповідає. Перевірте токен.');
    await kvPut('tg_bot', name, 86400);
    return name;
  }
  async function tgLink(r) {
    const u = await auth(r);
    if (!tgOn()) fail('Telegram-бот ще не налаштований');
    const code = deps.uuid().replace(/-/g, '').slice(0, 16);
    await kvPut('tglink_' + code, u.id, 1800);
    return { url: 'https://t.me/' + (await tgBot()) + '?start=' + code };
  }
  async function tgUnlink(r) {
    const u = await auth(r);
    const real = await db.find('users', 'id', u.id);
    if (real && real.tg_chat) { await db.update('users', u.id, { tg_chat: '' }); tgSend(real.tg_chat, { emoji: '👋', title: 'Сповіщення вимкнено', intro: 'Підключити знову можна в застосунку, розділ «Профіль».' }); }
    return {};
  }
  /* --- воронка в Telegram-боті: роль → «Поділитися номером» → акаунт створено → міні-застосунок --- */
  const FUNNEL = ['start', 'role', 'contact', 'reg', 'sto_card'];
  const botReady = async () => tgOn() && !!(await kvGet('tg_hook'));
  const botName = async () => { try { return (await botReady()) ? await tgBot() : ''; } catch (e) { return ''; } };
  const fnHit = async (stage, role) => { for (const k of ['fn_' + stage, 'fn_' + stage + '_' + (role || 'x')]) { const n = Number(await kvGet(k) || 0); await kvPut(k, n + 1, 10 * 365 * 86400); } };
  const ROLE_ASK = { emoji: '👋', title: 'Вітаємо в АвтоХабі', intro: 'Сервіс для водіїв і автосервісів Кривого Рогу: гараж з історією, заявки в перевірені СТО, відповіді й нагадування прямо в Telegram.\n\nХто ви?' };
  async function tgAskRole(chat) {
    await deps.tg('sendMessage', { chat_id: chat, parse_mode: 'HTML', text: tgHtml(ROLE_ASK),
      reply_markup: { inline_keyboard: [[{ text: '🚗 Я водій', callback_data: 'role:driver' }], [{ text: '🔧 У мене автосервіс', callback_data: 'role:sto' }]] } });
  }
  async function tgAskContact(chat, role) {
    const intro = role === 'sto'
      ? 'Сервіси-партнери отримують заявки від водіїв з описом проблеми, фото й даними авто, а відповідають і пропонують час прямо в застосунку.\n\nЩоб створити акаунт, натисніть «Поділитися номером» внизу.'
      : 'Додасте авто, і АвтоХаб нагадає про ТО й страховку, підкаже ймовірну причину несправності й надішле заявку в сервіс.\n\nЩоб створити акаунт, натисніть «Поділитися номером» внизу.';
    await deps.tg('sendMessage', { chat_id: chat, parse_mode: 'HTML', text: tgHtml({ emoji: role === 'sto' ? '🔧' : '🚗', title: role === 'sto' ? 'Для автосервісів' : 'Для водіїв', intro }),
      reply_markup: { keyboard: [[{ text: '📱 Поділитися номером', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
  }
  async function tgFunnelStart(chat, payload) {
    const linked = (await db.where('users', 'tg_chat', chat))[0];
    if (linked) {
      await tgKeyboard(chat, tgHtml({ emoji: '🚗', title: 'З поверненням, ' + linked.name, intro: 'Натисніть «Відкрити АвтоХаб» внизу.' }));
      return;
    }
    const lm = String(payload || '').match(/^l_([a-f0-9]{16})$/);
    if (lm) {
      const lid = await kvGet('leadtg_' + lm[1]), lead = lid ? await db.find('leads', 'id', lid) : null;
      if (lead) {
        const role = lead.kind === 'service' ? 'sto' : 'driver';
        await kvPut('tgreg_' + chat, JSON.stringify({ role, src: 'lead', lead: lead.id }), 7 * 86400);
        await fnHit('start', role); await fnHit('role', role);
        const who = lead.kind === 'service' ? s_((lead.data || {}).name) || lead.name : lead.name;
        await deps.tg('sendMessage', { chat_id: chat, parse_mode: 'HTML', text: tgHtml({ emoji: '🙌', title: 'Дякуємо за анкету' + (who ? ', ' + who : ''),
          intro: role === 'sto' ? 'Картку «' + lead.name + '» уже створено. Натисніть «Поділитися номером» внизу: створимо акаунт сервісу й прив\'яжемо до нього картку.' : 'Натисніть «Поділитися номером» внизу, і акаунт водія буде готовий за кілька секунд. Гараж, заявки в СТО й нагадування відкриваються прямо тут, у Telegram.' }),
          reply_markup: { keyboard: [[{ text: '📱 Поділитися номером', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
        return;
      }
    }
    const m = String(payload || '').match(/^(driver|sto)(?:_([a-z0-9_-]{1,40}))?$/i);
    const st = { role: m ? m[1].toLowerCase() : '', src: m && m[2] ? m[2].toLowerCase() : (payload && !m ? String(payload).slice(0, 40).toLowerCase().replace(/[^a-z0-9_-]/g, '') : '') };
    await kvPut('tgreg_' + chat, JSON.stringify(st), 7 * 86400);
    await fnHit('start', st.role);
    if (st.role) { await fnHit('role', st.role); await tgAskContact(chat, st.role); } else await tgAskRole(chat);
  }
  async function tgCallback(cq) {
    const chat = String(cq.message && cq.message.chat ? cq.message.chat.id : cq.from.id), data = String(cq.data || '');
    await deps.tg('answerCallbackQuery', { callback_query_id: cq.id });
    const m = data.match(/^role:(driver|sto)$/); if (!m) return;
    const st = JSON.parse(await kvGet('tgreg_' + chat) || '{}'); st.role = m[1];
    await kvPut('tgreg_' + chat, JSON.stringify(st), 7 * 86400);
    await fnHit('role', st.role);
    await tgAskContact(chat, st.role);
  }
  async function tgFunnelContact(chat, from, contact) {
    const st = JSON.parse(await kvGet('tgreg_' + chat) || 'null');
    if (!st || !st.role) { await tgAskRole(chat); return; }
    if (!from || String(contact.user_id) !== String(from.id)) { await tgSend(chat, { emoji: '⚠️', title: 'Це чужий контакт', intro: 'Натисніть саме кнопку «Поділитися номером».' }); return; }
    let phone = ''; try { phone = phone_(contact.phone_number); } catch (e) { phone = ''; }
    if (!phone) { await tgSend(chat, { emoji: '⚠️', title: 'Потрібен український номер', intro: 'Поки АвтоХаб працює лише з номерами +380. Зареєструйтеся на autohubkr.com/app/ з українським номером.' }); return; }
    await fnHit('contact', st.role);
    for (const o of await db.where('users', 'tg_chat', chat)) if (o.phone !== phone) await db.update('users', o.id, { tg_chat: '' });
    const lead = st.lead ? await db.find('leads', 'id', st.lead) : null;
    let u = await db.find('users', 'phone', phone), fresh = false;
    if (u) u = await db.update('users', u.id, { tg_chat: chat, phone_ok: true });
    else {
      const leadName = lead ? (lead.kind === 'service' ? s_((lead.data || {}).name) : lead.name) : '';
      const name = (leadName || [from.first_name, from.last_name].filter(Boolean).join(' ') || s_(contact.first_name) || 'Водій').slice(0, 60);
      u = { id: id(), role: 'driver', name, phone, pin_hash: '', salt: '', sto_id: '', created: now(), phone_ok: true, tg_chat: chat, source: ('tg:' + st.role + (st.src ? ':' + st.src : '')).slice(0, 60) };
      await db.insert('users', u); fresh = true;
      await fnHit('reg', st.role);
      notify((st.role === 'sto' ? 'Сервіс' : 'Водій') + ' зареєструвався через Telegram: ' + name, 'Телефон: ' + phone + (st.src ? '\nДжерело: ' + st.src : '') + (st.role === 'sto' ? '\nКартку сервісу ще треба заповнити в застосунку.' : ''));
    }
    await kvDel('tgreg_' + chat);
    if (lead) {
      await db.update('leads', lead.id, { status: 'joined', data: Object.assign({}, lead.data || {}, { user_id: u.id }) });
      const sid = (lead.data || {}).sto_id, card = sid ? await db.find('stos', 'id', sid) : null;
      if (lead.kind === 'service' && card && !card.owner_id && !u.sto_id) {
        await db.update('stos', card.id, Object.assign({ owner_id: u.id }, card.phone ? {} : { phone }));
        u = await db.update('users', u.id, { sto_id: card.id });
        notify('Сервіс з анкети підключив акаунт: ' + card.name, 'Власник: ' + u.name + ', ' + phone + '\nКартка ' + (isActive(card) ? 'вже активна.' : 'чекає перевірки: autohubkr.com/app/ → СТО → Перевірка.'));
      }
    }
    if (st.role === 'sto' && u.sto_id) {
      const card = await db.find('stos', 'id', u.sto_id);
      await tgKeyboard(chat, tgHtml({ emoji: '✅', title: (fresh ? 'Акаунт створено, ' : 'Вітаємо, ') + u.name, intro: 'Картку сервісу «' + (card ? card.name : '') + '» прив\'язано до вашого акаунта. Додайте адресу, графік, фото й логотип: так водії швидше вас оберуть.' + (card && !isActive(card) ? ' Після перевірки картка з\'явиться в каталозі.' : '') }));
      await tgSend(chat, { emoji: '🔧', title: 'Кабінет сервісу', intro: 'Тут заявки від водіїв, журнал робіт і картка сервісу.' }, [{ text: 'Відкрити кабінет сервісу', url: APP_URL + '?view=sto' }]);
      return;
    }
    const wantSto = st.role === 'sto' && !u.sto_id;
    await tgKeyboard(chat, tgHtml({ emoji: '✅', title: fresh ? 'Акаунт створено, ' + u.name : 'Ви вже в АвтоХабі, ' + u.name,
      intro: wantSto ? 'Залишився один крок: заповніть картку сервісу (назва, адреса, послуги, фото). Після перевірки водії бачитимуть вас у каталозі.' : 'Застосунок відкривається без пароля прямо тут. Сюди ж приходитимуть відповіді сервісів і нагадування.' }));
    await tgSend(chat, { emoji: wantSto ? '🔧' : '🚗', title: wantSto ? 'Картка сервісу' : 'Почніть з гаража', intro: wantSto ? 'Займе 2 хвилини.' : 'Додайте авто: VIN або марку й рік, решту заповнимо самі.' },
      [{ text: wantSto ? 'Заповнити картку сервісу' : 'Додати авто', url: APP_URL + (wantSto ? '?addsto=1' : '#/garage') }]);
  }
  async function tgUpdate(upd, meta) {
    if (!tgOn() || !env.TG_SECRET || meta.tgSecret !== env.TG_SECRET) return {};
    if (upd.callback_query) { await tgCallback(upd.callback_query); return {}; }
    const msg = upd.message; if (!msg || !msg.chat) return {};
    const chat = String(msg.chat.id), text = String(msg.text || '').trim();
    const ver = text.match(/^\/start\s+v_([a-f0-9]{20})$/);
    if (ver) {
      const b = JSON.parse(await kvGet('otpb_' + ver[1]) || 'null');
      if (!b) { await tgSend(chat, { emoji: '⌛', title: 'Посилання застаріло', intro: 'Поверніться в застосунок і почніть підтвердження ще раз.' }); return {}; }
      await kvPut('otpbchat_' + chat, ver[1], 900);
      await deps.tg('sendMessage', { chat_id: chat, parse_mode: 'HTML', text: tgHtml({ emoji: '📱', title: 'Підтвердіть номер', intro: 'Натисніть кнопку «Поділитися номером» внизу. Telegram передасть номер, прив\'язаний до вашого акаунта.' }),
        reply_markup: { keyboard: [[{ text: '📱 Поділитися номером', request_contact: true }]], resize_keyboard: true, one_time_keyboard: true } });
      return {};
    }
    if (msg.contact) {
      const nonce = await kvGet('otpbchat_' + chat);
      if (!nonce) { await tgFunnelContact(chat, msg.from, msg.contact); return {}; }
      const k = 'otpb_' + nonce, b = JSON.parse(await kvGet(k) || 'null');
      if (!b) { await tgSend(chat, { emoji: '⌛', title: 'Час минув', intro: 'Почніть підтвердження в застосунку ще раз.' }); return {}; }
      if (!msg.from || String(msg.contact.user_id) !== String(msg.from.id)) { await tgSend(chat, { emoji: '⚠️', title: 'Це чужий контакт', intro: 'Натисніть саме кнопку «Поділитися номером».' }); return {}; }
      let got = ''; try { got = phone_(msg.contact.phone_number); } catch (e) { got = ''; }
      if (got !== b.phone) {
        b.err = 'Номер у Telegram (' + (got || msg.contact.phone_number) + ') не збігається з указаним у застосунку'; await kvPut(k, JSON.stringify(b), 900);
        await tgKeyboard(chat, tgHtml({ emoji: '⚠️', title: 'Номер не збігається', intro: 'У Telegram ваш номер ' + (got || msg.contact.phone_number) + ', а в застосунку вказано ' + b.phone + '. Виправте номер у застосунку або отримайте код в SMS.' }));
        return {};
      }
      b.ok = true; b.chat = chat; delete b.err; await kvPut(k, JSON.stringify(b), 900); await kvDel('otpbchat_' + chat);
      await tgKeyboard(chat, tgHtml({ emoji: '✅', title: 'Номер підтверджено', intro: 'Поверніться в застосунок: реєстрація продовжиться сама. Сповіщення АвтоХабу приходитимуть у цей чат.' }));
      return {};
    }
    const start = text.match(/^\/start(?:\s+([a-f0-9]{16}))?/);
    if (start && start[1]) {
      const uid = await kvGet('tglink_' + start[1]);
      if (!uid) { await tgSend(chat, { emoji: '⌛', title: 'Посилання застаріло', intro: 'Відкрийте застосунок і натисніть «Підключити Telegram» ще раз.' }); return {}; }
      await kvDel('tglink_' + start[1]);
      (await db.where('users', 'tg_chat', chat)).forEach((o) => { if (o.id !== uid) db.update('users', o.id, { tg_chat: '' }); });
      const u = await db.update('users', uid, { tg_chat: chat });
      const what = u.role === 'sto' ? 'нові заявки від водіїв' : u.role === 'admin' ? 'нові заявки, анкети, сервіси на перевірці й спори' : 'відповіді сервісів на ваші заявки';
      await tgSend(chat, { emoji: '🎉', title: 'Telegram підключено, ' + u.name, intro: 'Тепер сюди приходитимуть ' + what + '. Вимкнути: команда /stop або кнопка в застосунку.' });
      await tgKeyboard(chat, 'Застосунок завжди під рукою: кнопка <b>«Відкрити АвтоХаб»</b> внизу чату.');
      return {};
    }
    const plain = text.match(/^\/start(?:\s+(\S+))?$/);
    if (plain && !(plain[1] && /^[a-f0-9]{16}$/.test(plain[1]))) { await tgFunnelStart(chat, plain[1] || ''); return {}; }
    if (/^\/stop/.test(text)) {
      for (const o of await db.where('users', 'tg_chat', chat)) await db.update('users', o.id, { tg_chat: '' });
      await tgSend(chat, { emoji: '👋', title: 'Сповіщення вимкнено', intro: 'Підключити знову можна в застосунку, розділ «Профіль».' });
      return {};
    }
    if (!(await db.where('users', 'tg_chat', chat)).length) { await tgFunnelStart(chat, ''); return {}; }
    await tgKeyboard(chat, tgHtml({ emoji: '🚗', title: 'АвтоХаб — автосервіси Кривого Рогу', intro: 'Гараж вашого авто, заявки в перевірені СТО й відповіді сервісів — прямо тут, у Telegram. Натисніть «Відкрити АвтоХаб» внизу. Увійдіть один раз, і бот підключиться сам.' }));
    return {};
  }
  async function adminTgSetup(r) {
    await auth(r, 'admin');
    if (!tgOn()) fail('Додайте TELEGRAM_BOT_TOKEN у Secrets Supabase і оновіть функцію');
    await kvDel('tg_bot');
    const bot = await tgBot();
    const res = await deps.tg('setWebhook', { url: env.API_URL, secret_token: env.TG_SECRET, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true });
    if (!res || !res.ok) fail('Telegram не прийняв вебхук: ' + ((res && res.description) || 'невідома помилка'));
    await kvPut('tg_hook', 1, 10 * 365 * 86400);
    await deps.tg('setMyCommands', { commands: [{ command: 'start', description: 'Почати / зареєструватися' }, { command: 'app', description: 'Відкрити застосунок' }, { command: 'stop', description: 'Вимкнути сповіщення' }] });
    await deps.tg('setChatMenuButton', { menu_button: { type: 'web_app', text: 'Відкрити АвтоХаб', web_app: { url: APP_URL } } });
    // кнопка меню для вже прив'язаних чатів (у кого раніше була інша) і нижня кнопка «Відкрити АвтоХаб»
    for (const u of (await db.all('users')).filter((x) => x.tg_chat)) {
      await deps.tg('setChatMenuButton', { chat_id: Number(u.tg_chat), menu_button: { type: 'web_app', text: 'Відкрити АвтоХаб', web_app: { url: APP_URL } } });
    }
    await deps.tg('setMyDescription', { description: 'АвтоХаб — автосервіси Кривого Рогу. Водіям: гараж з історією, нагадування про ТО й страховку, заявки в перевірені СТО. Сервісам: заявки від водіїв. Натисніть «Почати».' });
    await deps.tg('setMyShortDescription', { short_description: 'Автосервіси Кривого Рогу: заявки, гараж, нагадування' });
    return { bot };
  }
  async function adminMailTest(r) {
    const u = await auth(r, 'admin');
    const to = s_(r.to);
    if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(to)) fail('Вкажіть email');
    if (!deps.mail) fail('Пошта не налаштована');
    const res = await deps.mail(to, '[АвтоХаб] Тестовий лист', mailHtml({ emoji: '✉️', title: 'Тестовий лист АвтоХабу', intro: 'Так виглядатимуть листи сервісам про нові заявки.',
      quote: 'Під час гальмування б\'є кермо, особливо на швидкості.', rows: [['Авто', 'Skoda Octavia 2016'], ['Пробіг', '148 000 км'], ['Коли зручно', 'Завтра після 17:00']],
      cta: { text: 'Відкрити заявку', url: APP_URL + '#/sto' } }), 'Тестовий лист АвтоХабу');
    if (!res || !res.ok) fail('Лист не надіслано: ' + ((res && res.error) || 'перевірте RELAY_SECRET'));
    return { sentBy: u.name };
  }

  /* --- AUTO.RIA (developers.ria.com): модифікації, комплектації, середня ціна. Довідники кешуємо, щоб не витрачати ліміт. --- */
  async function ria(path, ttl) {
    if (!env.AUTO_RIA_KEY) fail('Підбір модифікацій тимчасово недоступний');
    const ck = 'ria_' + path;
    const c = await kvGet(ck);
    if (c) return JSON.parse(c);
    if (!(await rate('ria_hour', 28, 3600))) fail('Забагато запитів за годину. Спробуйте пізніше.');
    const resp = await deps.fetch('https://developers.ria.com' + path + (path.indexOf('?') === -1 ? '?' : '&') + 'api_key=' + encodeURIComponent(env.AUTO_RIA_KEY));
    const txt = await resp.text();
    let j = null; try { j = JSON.parse(txt); } catch (e) { j = null; }
    if (resp.status !== 200 || j === null) { console.error('ria', path, resp.status, txt.slice(0, 200)); return { _err: resp.status, _msg: (j && (j.message || (j.error && j.error.message))) || txt.slice(0, 120) }; }
    await kvPut(ck, JSON.stringify(j), ttl || 30 * 86400);
    return j;
  }
  const nrm = (x) => String(x || '').toLowerCase().replace(/[^0-9a-zа-яіїєґ]/g, '');
  async function riaIds(make, model) {
    const marks = await ria('/auto/categories/1/marks', 90 * 86400);
    if (marks._err) fail('Сервіс довідника не відповідає. Спробуйте пізніше.');
    const mk = marks.find((m) => nrm(m.name) === nrm(make));
    if (!mk) return null;
    const models = await ria('/auto/categories/1/marks/' + mk.value + '/models', 90 * 86400);
    if (models._err) fail('Сервіс довідника не відповідає. Спробуйте пізніше.');
    const q = nrm(model);
    const md = models.find((m) => nrm(m.name) === q) || models.find((m) => q && (nrm(m.name).indexOf(q) === 0 || q.indexOf(nrm(m.name)) === 0));
    return md ? { mark: mk.value, model: md.value, modelName: md.name } : { mark: mk.value };
  }
  // «2.0 TDI DSG (150 к.с.) 4Motion» → об'єм, потужність, паливо, коробка, привід
  function parseMod(n) {
    const t = String(n || ''), l = t.toLowerCase();
    const e = t.match(/(\d\.\d)/), p = t.match(/\((\d{2,4})\s*к\.?\s*с/i);
    return { engine: e ? Number(e[1]) : null, power: p ? Number(p[1]) : null,
      fuel: /(electro|електр|kwh|квт·год|\bev\b)/i.test(t) ? 'Електро' : /(hybrid|гібрид|phev|hev)/i.test(t) ? 'Гібрид' : /(tdi|cdi|crdi|dci|hdi|tdci|jtd|d4d|cdti|ddis|\bd\b|\d\.\dd|diesel|дизел|bitdi|tdv6|sdv6|xdrive\d+d|\d+d\b)/i.test(t) ? 'Дизель' : /(lpg|cng|газ)/i.test(t) ? 'Газ/бензин' : e ? 'Бензин' : '',
      gearbox: /(dsg|s.?tronic|робот|amt|dct|edc|powershift|smg|mmt|easytronic)/i.test(l) ? 'Робот' : /(cvt|варіатор|multitronic|xtronic|lineartronic)/i.test(l) ? 'Варіатор' : /(\bat\b|автомат|tiptronic|steptronic|\d-?at|aut\.?|automatic)/i.test(l) ? 'Автомат' : /(\bmt\b|механ|manual|\d-?mt)/i.test(l) ? 'Механіка' : '',
      drive: /(4motion|quattro|xdrive|4matic|awd|4wd|4x4|allgrip|all4|q4|sh-awd|e-four)/i.test(l) ? 'Повний' : '' };
  }
  async function riaMods(r) {
    await auth(r);
    const make = need(r.make, 'Оберіть марку'), model = need(r.model, 'Оберіть модель'), year = int(r.year);
    const ids = await riaIds(make, model);
    if (!ids || !ids.model) return { mods: [], note: 'Такої моделі немає в довіднику. Заповніть модифікацію вручну.' };
    const gens = await ria('/generations/by/models/' + ids.model + '/generations', 90 * 86400);
    const list = (Array.isArray(gens) ? gens : []).flatMap((x) => x.generations || []);
    const fit = list.filter((g) => !year || ((!g.yearFrom || g.yearFrom <= year) && (!g.yearTo || g.yearTo >= year)));
    const use = (fit.length ? fit : list).slice(0, 3);
    const mods = [];
    for (const g of use) {
      const ms = await ria('/modifications/by/generation/' + g.generationId + '/modifications', 90 * 86400);
      (Array.isArray(ms) ? ms : []).forEach((m) => mods.push(Object.assign({ id: m.value, name: m.name, gen: g.name, years: [g.yearFrom, g.yearTo || ''].filter(Boolean).join('–') }, parseMod(m.name))));
    }
    return { mods: mods.slice(0, 120), riaModel: ids.modelName || '' };
  }
  async function riaEquips(r) {
    await auth(r);
    const mid = int(r.modification); if (!mid) fail('Оберіть модифікацію');
    const eq = await ria('/auto_ria/equips_by_modifications?modificationId=' + mid, 90 * 86400);
    const list = Array.isArray(eq) ? eq : (eq && Array.isArray(eq.equips) ? eq.equips : []);
    const year = int(r.year);
    if (list[0] && !(await kvGet('ria_eq_shape'))) { console.log('ria equip shape', JSON.stringify(list[0]).slice(0, 600)); await kvPut('ria_eq_shape', 1, 86400); }
    const fit = list.filter((e) => !year || !e.year || Math.abs(Number(e.year) - year) <= 1);
    const names = [...new Set(fit.map((e) => s_(e.name)).filter(Boolean))];
    // якщо довідник віддає перелік опцій комплектації, передаємо його теж
    const opts = {};
    fit.forEach((e) => {
      const raw = e.options || e.equipOptions || e.params || e.features || [];
      const arr = (Array.isArray(raw) ? raw : Object.values(raw)).map((o) => s_(typeof o === 'string' ? o : (o && (o.name || o.title || o.value)) || '')).filter(Boolean);
      if (arr.length && s_(e.name)) opts[s_(e.name)] = [...new Set(arr)].slice(0, 80);
    });
    return { equips: names.slice(0, 60), options: opts };
  }
  // Середня ринкова ціна схожих авто на AUTO.RIA (той самий рік ±1), кеш 14 днів.
  async function riaPrice(r) {
    const u = await auth(r, 'driver'); const c = await ownCar(u, r.car_id);
    if (!c.year) fail('Вкажіть рік випуску авто');
    const ids = await riaIds(c.make, c.model);
    if (!ids || !ids.model) fail('Такої моделі немає в довіднику');
    const y = Number(c.year);
    let q = '/auto/average_price?marka_id=' + ids.mark + '&model_id=' + ids.model + '&yers=' + (y - 1) + '&yers=' + (y + 1);
    if (c.engine) q += '&engineVolume=' + c.engine;
    let res = await ria(q, 14 * 86400);
    if (res._err && c.engine) { q = q.replace(/&engineVolume=[\d.]+/, ''); res = await ria(q, 14 * 86400); }
    if (res._err) fail(res._err === 400 ? 'Замало оголошень для оцінки цього авто' : 'Оцінка зараз недоступна. Спробуйте пізніше.');
    const pc = res.percentiles || {};
    const n = (v) => v ? Math.round(Number(v) / 100) * 100 : null;
    const out = { price: n(res.interQuartileMean || res.arithmeticMean), low: n(pc['25.0'] || pc['25']), high: n(pc['75.0'] || pc['75']), total: res.total || 0, years: (y - 1) + '–' + (y + 1), engine: !!(c.engine && q.indexOf('engineVolume') !== -1), at: today() };
    await db.update('cars', c.id, { market: out });
    return { market: out };
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
    const bot = SET.lead_to_tg ? await botName() : '';
    if (!bot) return {};
    const t = deps.uuid().replace(/-/g, '').slice(0, 16);
    await kvPut('leadtg_' + t, row.id, 14 * 86400);
    return { tg: 'https://t.me/' + bot + '?start=l_' + t };
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

  async function adminSettings(r) {
    await auth(r, 'admin');
    const k = (name, on, what) => ({ name, on: !!on, what });
    return { settings: SET, defaults: SET_DEF,
      tg: { token: tgOn(), hook: !!(await kvGet('tg_hook')), bot: await botName() }, otp: await otpCh(),
      keys: [
        k('TELEGRAM_BOT_TOKEN', tgOn(), 'Telegram-бот: реєстрація, перехід з анкет, сповіщення, міні-застосунок'),
        k('GEMINI_API_KEY', env.GEMINI_API_KEY, 'AI: підказка несправності, розпізнавання чеків і полісів, опис авто'),
        k('GEMINI_MODEL', env.GEMINI_MODEL, 'Необов\'язково: конкретна модель Gemini' + (env.GEMINI_MODEL ? ' (' + env.GEMINI_MODEL + ')' : ', зараз автовибір')),
        k('AUTO_RIA_KEY', env.AUTO_RIA_KEY, 'Модифікації, комплектації й ринкова ціна авто'),
        k('RELAY_SECRET', env.MAIL_ON, 'Листи сервісам і адміністратору (через Google Apps Script)'),
        k('TG_GATEWAY_TOKEN', env.TG_GATEWAY_TOKEN, 'Коди підтвердження номера в Telegram ($0.01 за код)'),
        k('TURBOSMS_TOKEN', env.TURBOSMS_TOKEN, 'Коди підтвердження в SMS (TurboSMS)'),
        k('TURBOSMS_SENDER', env.TURBOSMS_SENDER, 'Ім\'я відправника SMS, зареєстроване в TurboSMS'),
        k('TURBOSMS_VIBER_SENDER', env.TURBOSMS_VIBER_SENDER, 'Відправник Viber: спершу Viber, потім SMS'),
        k('Реєстр МВС (VIN)', !!deps.vinShard, 'Розшифровка VIN з відкритого реєстру (оновлюється щомісяця автоматично)')
      ] };
  }
  async function adminSettingsSet(r) {
    await auth(r, 'admin');
    const p = r.patch || {}, cur = await loadSettings(), out = Object.assign({}, cur);
    ['otp_required', 'lead_to_tg', 'notify_tg', 'notify_mail'].forEach((k) => { if (p[k] !== undefined) out[k] = p[k] === true; });
    if (p.ai_limit !== undefined) { const n = int(p.ai_limit); if (!(n >= 0 && n <= 200)) fail('Ліміт AI: від 0 до 200'); out.ai_limit = n; }
    if (p.counter_min !== undefined) { const n = int(p.counter_min); if (!(n >= 0 && n <= 1000)) fail('Поріг лічильника: від 0 до 1000'); out.counter_min = n; }
    if (!out.notify_tg && !out.notify_mail) fail('Залиште хоча б один канал сповіщень адміністратору');
    await kvPut('settings', JSON.stringify(out), 20 * 365 * 86400);
    await kvDel('stats_public');
    SET = out;
    return { settings: out };
  }
  async function adminCacheClear(r) {
    await auth(r, 'admin');
    const pre = { ria: 'ria_', carinfo: 'carinfo_', stats: 'stats_public' }[r.kind];
    if (!pre) fail('Невідомий кеш');
    if (!db.removePrefix) fail('Очищення недоступне');
    await db.removePrefix('kv', 'key', pre);
    return {};
  }

  const META = { categories: CATEGORIES, districts: DISTRICTS, statuses: STATUS, urgency: URGENCY, car: CAR_OPTS, services: SERVICES, serviceGroups: SERVICE_GROUPS, carDocs: CAR_DOCS };
  const histOut = (h) => { const p = pick(h, ['id', 'date', 'work', 'place', 'price', 'mileage', 'request_id', 'confirmed']); p.services = String(h.services || '').split(',').filter(Boolean); return p; };

  const ACTIONS = {
    meta: async () => Object.assign({ ria: !!env.AUTO_RIA_KEY, otp: await otpMeta() }, META),
    register, login, 'otp.send': otpSend, 'otp.bot': otpBot, 'otp.bot.check': otpBotCheck, 'pin.reset': pinReset,
    logout: async (r) => { if (r.token) await db.removeWhere('sessions', 'token', String(r.token)); return {}; },
    me: async (r) => { const u = await auth(r); const sto = u.sto_id ? await db.find('stos', 'id', u.sto_id) : null; return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null }; },
    // одним запитом: користувач, довідники й авто (для швидкого старту застосунку)
    boot: async (r) => {
      const u = await auth(r);
      const [sto, cars] = await Promise.all([u.sto_id ? db.find('stos', 'id', u.sto_id) : null, u.role === 'driver' ? myCars(u) : []]);
      return { user: pubUser(u), sto: sto ? pubSto(sto, true) : null, cars, meta: Object.assign({ ria: !!env.AUTO_RIA_KEY, otp: await otpMeta() }, META) };
    },
    'cars.list': async (r) => ({ cars: await myCars(await auth(r, 'driver')) }),
    'cars.add': async (r) => {
      const u = await auth(r, 'driver');
      if ((await db.where('cars', 'user_id', u.id)).filter((c) => !c.deleted).length >= 10) fail('Можна додати до 10 авто');
      const c = Object.assign({ id: id(), user_id: u.id, created: now(), deleted: '', photo: '' }, carFields(r, false));
      c.mileage_log = c.mileage ? kmPush({}, c.mileage, 'додано авто') : [];
      await db.insert('cars', c);
      return { car: pubCar(c, {}) };
    },
    'cars.update': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.id);
      const f = carFields(r, true);
      if (f.mileage && Number(f.mileage) !== Number(c.mileage)) f.mileage_log = kmPush(c, f.mileage, 'вручну');
      const dm = Object.assign({}, c.docs_meta || {}); let dmCh = false;
      CAR_DOCS.forEach((d) => { if (f[d[0]] !== undefined && f[d[0]] !== (c[d[0]] || '') && dm[d[0]]) { delete dm[d[0]]; dmCh = true; } });
      if (dmCh) f.docs_meta = dm;
      const upd = await db.update('cars', c.id, f);
      return { car: pubCar(upd, await signPhotos([upd])) };
    },
    // Оновлення пробігу з датою; менше за попередній значення приймаємо лише як виправлення помилки.
    'cars.mileage': async (r) => {
      const u = await auth(r, 'driver'); const c = await ownCar(u, r.id);
      const km = int(r.mileage);
      if (!km || km > 2000000) fail('Вкажіть пробіг у кілометрах');
      const date = date_(r.date) || today();
      if (date > today()) fail('Дата не може бути в майбутньому');
      const log = kmLog(c);
      if (r.fix) {
        const keep = log.filter((e) => e.km <= km);
        const upd = await db.update('cars', c.id, { mileage: km, mileage_log: kmPush({ mileage_log: keep }, km, 'виправлено', date) });
        return { car: pubCar(upd, await signPhotos([upd])) };
      }
      const before = log.filter((e) => e.date <= date).reduce((m, e) => Math.max(m, e.km), 0);
      const after = log.filter((e) => e.date > date).reduce((m, e) => Math.min(m, e.km), Infinity);
      if (km < before) fail('Пробіг менший за попередній запис (' + before.toLocaleString('uk-UA') + ' км). Якщо там помилка, позначте «Виправити помилку».');
      if (km > after) fail('Пробіг більший, ніж у пізнішому записі. Перевірте дату.');
      const patch = { mileage_log: kmPush(c, km, s_(r.src) || 'вручну', date) };
      if (!c.mileage || km >= Number(c.mileage)) patch.mileage = km;
      const upd = await db.update('cars', c.id, patch);
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
    'req.create': reqCreate, 'req.list': reqList, 'req.update': reqUpdate, 'req.visit': reqVisit, 'req.confirm': reqConfirm, 'req.slot': reqSlot, 'req.slot.ok': reqSlotOk, 'sto.add': stoAdd,
    'stats.public': statsPublic, 'ai.receipt': aiReceipt, 'vin.decode': vinDecode,
    'tg.link': tgLink, 'tg.unlink': tgUnlink, 'admin.tg.setup': adminTgSetup, 'admin.mail.test': adminMailTest,
    'tg.auth': tgAuth, 'tg.bind': tgBind, 'tg.prereg': tgPrereg, 'sto.photo': stoPhoto, 'admin.sto.photo': adminStoPhoto,
    'ria.mods': riaMods, 'ria.equips': riaEquips, 'ria.price': riaPrice, 'cars.info': carInfo, 'ai.doc': aiDoc,
    'review.add': reviewAdd,
    'jobs.list': jobsList, 'jobs.add': jobsAdd, 'jobs.update': jobsUpdate, 'jobs.delete': jobsDelete,
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
      if (row.mileage) await bumpMileage(c, row.mileage, row.place ? 'обслуговування: ' + row.place : 'запис обслуговування', row.date);
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
    'admin.settings': adminSettings, 'admin.settings.set': adminSettingsSet, 'admin.cache.clear': adminCacheClear,
    'admin.geocode': async (r) => { await auth(r, 'admin'); return geocodeBatch(Math.min(Number(r.limit) || 25, 40), r.retry === true); }
  };

  return async function handle(req, meta) {
    meta = meta || {};
    try {
      // форми лендингів і лічильник переходів надсилають { type: driver | service | visit }
      await loadSettings();
      if (req && !req.action && (req.type === 'driver' || req.type === 'service')) { const r0 = await leadAdd(req, meta); r0.ok = true; return r0; }
      if (req && !req.action && req.type === 'visit') { await visitAdd(req, meta); return { ok: true }; }
      if (req && req.update_id !== undefined) { await tgUpdate(req, meta); return { ok: true }; }
      const fn = ACTIONS[req && req.action];
      if (!fn) return { ok: false, error: 'Невідома дія' };
      const res = (await fn(req, meta)) || {};
      res.ok = res.ok !== false;
      return res;
    } catch (err) {
      if (err && err.userMessage) return { ok: false, error: err.userMessage };
      console.error(err);
      return { ok: false, error: 'Помилка сервера. Спробуйте ще раз.' };
    }
  };
}
