
/* ---------- Supabase: адаптер таблиць і HTTP-обробник ---------- */
// @ts-nocheck
import { createClient } from 'npm:@supabase/supabase-js@2.45.4';

const sb = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'), { auth: { persistSession: false } });
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

const hex = (buf) => Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
const api = makeApi(db, {
  uuid: () => crypto.randomUUID(),
  sha256hex: async (s) => hex(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s))),
  env: { get GEMINI_API_KEY() { return Deno.env.get('GEMINI_API_KEY') || ''; }, get GEMINI_MODEL() { return Deno.env.get('GEMINI_MODEL') || ''; } },
  fetch: (u, o) => fetch(u, o),
  sleep: (ms) => new Promise((r) => setTimeout(r, ms)),
  notify
});

const CORS = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'content-type, authorization, apikey, x-client-info', 'Access-Control-Max-Age': '86400' };

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  let body = {};
  if (req.method === 'POST') { try { body = JSON.parse(await req.text() || '{}'); } catch (_) { body = {}; } }
  else body = { action: 'meta' };
  const res = await api(body);
  return new Response(JSON.stringify(res), { headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8' } });
});
