
/* ---------- Supabase: адаптер таблиць і HTTP-обробник ---------- */
// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

// Ключ з повним доступом платформа передає сама: SUPABASE_SERVICE_ROLE_KEY (старі ключі) або SUPABASE_SECRET_KEYS (нові).
function serviceKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  const raw = Deno.env.get('SUPABASE_SECRET_KEYS') || '';
  try { const o = JSON.parse(raw); return o.default || Object.values(o)[0]; } catch (_) { return raw; }
}
const sb = createClient(Deno.env.get('SUPABASE_URL'), serviceKey(), { auth: { persistSession: false } });
const PK = { kv: 'key', sessions: 'token' };
const pk = (t) => PK[t] || 'id';
const chk = ({ data, error }) => { if (error) throw new Error(error.message); return data; };

const db = {
  all: async (t) => chk(await sb.from(t).select('*').range(0, 9999)) || [],
  where: async (t, c, v) => chk(await sb.from(t).select('*').eq(c, v).range(0, 9999)) || [],
  in: async (t, c, vs) => vs.length ? (chk(await sb.from(t).select('*').in(c, vs)) || []) : [],
  find: async (t, c, v) => chk(await sb.from(t).select('*').eq(c, v).limit(1).maybeSingle()),
  insert: async (t, o) => { chk(await sb.from(t).insert(o)); return o; },
  update: async (t, id, patch) => chk(await sb.from(t).update(patch).eq(pk(t), id).select('*').single()),
  upsert: async (t, o) => { chk(await sb.from(t).upsert(o)); },
  removeWhere: async (t, c, v) => { chk(await sb.from(t).delete().eq(c, v)); }
};

// Листи адміністратору надсилає старий скрипт Google (дія relay.notify), бо в Supabase немає своєї пошти.
const MAIL_RELAY = 'https://script.google.com/macros/s/AKfycbzt3ji9te4beOmCgvywZSMUL7WsU1lqRxnM005T11vXVNcGGV1b-3BrPWL4Q8D4YY4C/exec';
function notify(subject, body) {
  const p = fetch(MAIL_RELAY, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'relay.notify', subject, body }) })
    .then((r) => r.text()).catch((e) => console.error('notify', e));
  try { EdgeRuntime.waitUntil(p); } catch (_) { /* поза Supabase */ }
}

// Фото авто: приватний кошик car-photos, посилання для перегляду підписані на 7 днів.
const BUCKET = 'car-photos';
const storage = {
  put: async (path, bytes, type) => { const { error } = await sb.storage.from(BUCKET).upload(path, bytes, { contentType: type, upsert: true }); if (error) throw new Error(error.message); },
  remove: async (paths) => { await sb.storage.from(BUCKET).remove(paths); },
  sign: async (paths) => {
    const { data, error } = await sb.storage.from(BUCKET).createSignedUrls(paths, 7 * 86400);
    if (error) { console.error('sign', error.message); return {}; }
    const out = {}; (data || []).forEach((x) => { if (x.signedUrl) out[x.path] = x.signedUrl; }); return out;
  }
};
const b64decode = (s) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
const bg = (p) => { try { EdgeRuntime.waitUntil(p); } catch (_) { /* поза Supabase */ } };

// Лист будь-якому адресату через той самий скрипт Google (дія relay.mail, потрібен секрет RELAY_SECRET в обох місцях).
async function mail(to, subject, html, text) {
  const secret = Deno.env.get('RELAY_SECRET') || '';
  if (!secret) return { ok: false, error: 'немає RELAY_SECRET' };
  try {
    const r = await fetch(MAIL_RELAY, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'relay.mail', secret, to, subject, html, text }) });
    return JSON.parse(await r.text());
  } catch (e) { console.error('mail', e); return { ok: false, error: String(e) }; }
}

// Telegram Bot API. Секрет вебхука виводимо з токена, тож окремий секрет не потрібен.
const TG_TOKEN = Deno.env.get('TELEGRAM_BOT_TOKEN') || '';
async function tg(method, payload) {
  if (!TG_TOKEN) return { ok: false };
  const r = await fetch('https://api.telegram.org/bot' + TG_TOKEN + '/' + method, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  const j = await r.json().catch(() => ({ ok: false }));
  if (!j.ok) console.error('tg ' + method, j.description || r.status);
  return j;
}

const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const hex2 = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const TG_SECRET = TG_TOKEN ? hex2(await crypto.subtle.digest('SHA-256', new TextEncoder().encode('autohub-webhook:' + TG_TOKEN))).slice(0, 48) : '';
const api = makeApi(db, {
  uuid: () => crypto.randomUUID(),
  sha256hex: async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))),
  env: { get GEMINI_API_KEY() { return Deno.env.get('GEMINI_API_KEY') || ''; }, get GEMINI_MODEL() { return Deno.env.get('GEMINI_MODEL') || ''; },
    get BAZA_GAI_KEY() { return Deno.env.get('BAZA_GAI_KEY') || ''; }, TG_ON: !!TG_TOKEN, TG_SECRET, API_URL: Deno.env.get('SUPABASE_URL') + '/functions/v1/api' },
  fetch: (u, o) => fetch(u, o),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  notify, storage, b64decode, mail, tg, bg
});

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info', 'Access-Control-Max-Age': '86400' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let body = {};
  if (req.method === 'POST') { try { body = JSON.parse(await req.text() || '{}'); } catch (_) { body = {}; } }
  else body = { action: 'meta' };
  const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || req.headers.get('cf-connecting-ip') || '';
  const res = await api(body, { ip, tgSecret: req.headers.get('x-telegram-bot-api-secret-token') || '' });
  return new Response(JSON.stringify(res), { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
});
