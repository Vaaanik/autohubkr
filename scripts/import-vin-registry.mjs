// АвтоХаб: завантаження відкритого реєстру МВС (транспортні засоби з VIN) у таблицю vin_registry в Supabase.
// Джерела (data.gov.ua, відкриті дані, CC BY):
//   • МВС «Відомості про транспортні засоби та їх власників» — річні архіви (VIN є з 2021 року)
//   • ГСЦ МВС «Інформація про зареєстровані транспортні засоби (включаючи VIN)» — поточний рік, оновлюється щомісяця
// Беремо лише записи області REGION_PREFIX за КОАТУУ (12 — Дніпропетровська) і для кожного VIN — найсвіжіший запис.
// Персональних даних у наборі немає; ми зберігаємо лише технічні характеристики авто.
//
// Запуск (GitHub Actions, див. .github/workflows/vin-registry.yml):
//   SUPABASE_SERVICE_KEY=... node scripts/import-vin-registry.mjs
// Змінні: SUPABASE_URL, REGION_PREFIX (порожньо = вся Україна), DRY_RUN=1 (лише порахувати).
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uukjizyksppxeakafsua.supabase.co';
const KEY = process.env.SUPABASE_SERVICE_KEY || '';
const REGION = process.env.REGION_PREFIX === undefined ? '12' : (process.env.REGION_PREFIX === 'all' ? '' : process.env.REGION_PREFIX);
const DRY = process.env.DRY_RUN === '1';
const API = 'https://data.gov.ua/api/3/action/package_show?id=';
const PKG_YEARS = '0ffd8b75-0628-48cc-952a-9302f9799ec0';   // МВС: річні архіви
const PKG_CURRENT = '348dbb24-a545-4d8c-95d5-18d35c593ca1'; // ГСЦ МВС: поточний рік з VIN
const KINDS = /ЛЕГКОВИЙ|ВАНТАЖНИЙ|СПЕЦІАЛІЗОВАНИЙ ЛЕГКОВИЙ/; // без мотоциклів, причепів, тракторів

if (!KEY && !DRY) { console.error('Немає SUPABASE_SERVICE_KEY: додайте його в GitHub → Settings → Secrets → Actions. Поки що лише рахую.'); }
// CHECK_VIN=... : лише знайти цей VIN у всіх файлах (без фільтра області) і показати записи
const CHECK = String(process.env.CHECK_VIN || '').toUpperCase().replace(/\s+/g, '');
const COUNT_ONLY = DRY || !KEY || !!CHECK;
const found = [];

async function resources(id) {
  const r = await fetch(API + id); const j = await r.json();
  if (!j.success) throw new Error('data.gov.ua: ' + id);
  return j.result.resources;
}

// Простий потоковий розбір CSV (лапки, роздільник ; або ,).
function splitLine(line, d) {
  const out = []; let cur = '', q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"') { if (line[i + 1] === '"') { cur += '"'; i++; } else q = false; } else cur += c; }
    else if (c === '"') q = true;
    else if (c === d) { out.push(cur); cur = ''; }
    else cur += c;
  }
  out.push(cur); return out;
}
const HDR = { koatuu: ['koatuu', 'reg_addr_koatuu'], dreg: ['dreg', 'd_reg'], brand: ['brand'], model: ['model'], vin: ['vin'], year: ['makeyear', 'make_year'],
  color: ['color'], kind: ['kind'], purpose: ['purpose'], body: ['body'], fuel: ['fuel'], capacity: ['capacity'], power: ['powerkwt', 'power_kwt'], weight: ['ownweight', 'own_weight'] };

const best = new Map();
let seen = 0, kept = 0;
function take(f) {
  seen++;
  const vin = String(f.vin || '').toUpperCase().replace(/\s+/g, '');
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) return;
  if (CHECK) { if (vin === CHECK) { found.push(f); console.log('  ЗНАЙДЕНО:', JSON.stringify({ дата: f.dreg, марка: f.brand, модель: f.model, рік: f.year, колір: f.color, кузов: f.body, паливо: f.fuel, обʼєм: f.capacity, кВт: f.power, вид: (f.kind || '') + ' ' + (f.purpose || ''), КОАТУУ: f.koatuu })); } return; }
  if (REGION && !String(f.koatuu || '').startsWith(REGION)) return;
  // У старих архівах вид ТЗ у KIND, у нових — у purpose («ЛЕГКОВИЙ»), тож перевіряємо обидва.
  if ((f.kind || f.purpose) && !KINDS.test(String(f.kind || '') + ' ' + String(f.purpose || ''))) return;
  const prev = best.get(vin);
  // дати бувають «2026-01-01» і «09.12.2021»: приводимо до РРРР-ММ-ДД, щоб правильно визначати найсвіжіший запис
  const raw = String(f.dreg || '').trim(), dm = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  const d = dm ? dm[3] + '-' + dm[2] + '-' + dm[1] : raw.slice(0, 10);
  if (prev && prev.d_reg > d) return;
  const n = (v) => { const x = Number(String(v || '').replace(',', '.')); return isFinite(x) && x > 0 ? x : null; };
  best.set(vin, { vin, brand: String(f.brand || '').trim().slice(0, 60), model: String(f.model || '').trim().slice(0, 80), year: n(f.year) ? Math.round(n(f.year)) : null,
    color: String(f.color || '').trim().slice(0, 40), body: String(f.body || '').trim().slice(0, 60), fuel: String(f.fuel || '').trim().slice(0, 60),
    capacity: n(f.capacity) ? Math.round(n(f.capacity)) : null, power_kw: n(f.power), weight: n(f.weight) ? Math.round(n(f.weight)) : null, d_reg: d });
  kept++;
}

// Читаємо потік рядків з команди (unzip -p або curl) з автовизначенням кодування (UTF-8 або Windows-1251).
function readStream(cmd, args) {
  return new Promise((resolve, reject) => {
    const p = spawn(cmd, args, { stdio: ['ignore', 'pipe', 'inherit'] });
    let dec = null, buf = '', cols = null, delim = ',', lines = 0;
    const onLine = (line) => {
      if (!line) return;
      if (!cols) {
        delim = (line.match(/;/g) || []).length > (line.match(/,/g) || []).length ? ';' : ',';
        const h = splitLine(line, delim).map((x) => x.trim().toLowerCase().replace(/^﻿/, ''));
        cols = {}; for (const k in HDR) { const i = h.findIndex((x) => HDR[k].includes(x)); if (i !== -1) cols[k] = i; }
        if (cols.vin === undefined) { console.log('  у файлі немає VIN, пропускаю. Заголовок:', h.join(',')); p.kill(); return; }
        return;
      }
      lines++;
      const v = splitLine(line, delim), f = {};
      for (const k in cols) f[k] = v[cols[k]];
      take(f);
    };
    p.stdout.on('data', (chunk) => {
      if (!dec) { const cut = chunk.lastIndexOf(10); try { new TextDecoder('utf-8', { fatal: true }).decode(chunk.subarray(0, cut > 0 ? cut : chunk.length)); dec = new TextDecoder('utf-8'); } catch (_) { dec = new TextDecoder('windows-1251'); } }
      buf += dec.decode(chunk, { stream: true });
      let i; while ((i = buf.indexOf('\n')) !== -1) { onLine(buf.slice(0, i).replace(/\r$/, '')); buf = buf.slice(i + 1); }
    });
    p.on('close', () => { if (buf) onLine(buf.replace(/\r$/, '')); console.log('  рядків:', lines); resolve(); });
    p.on('error', reject);
  });
}

async function download(url, file) {
  await new Promise((res, rej) => { const p = spawn('curl', ['-sSfL', '--retry', '3', '-o', file, url], { stdio: 'inherit' }); p.on('close', (c) => c ? rej(new Error('curl ' + c + ' ' + url)) : res()); });
}

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'vinreg-'));
const years = (await resources(PKG_YEARS))
  .map((r) => ({ url: r.url, y: Number((String(r.description || '') + ' ' + r.name).match(/20\d\d/)?.[0] || 0), desc: r.description || r.name }))
  .filter((r) => r.y >= 2021 && /\.zip$/i.test(r.url));
const current = (await resources(PKG_CURRENT)).filter((r) => /\.csv$/i.test(r.url));
// Від старих до нових: свіжіший запис перезаписує старий.
years.sort((a, b) => a.y - b.y);
for (const r of years) {
  console.log('Архів', r.y, '—', r.desc.trim());
  const f = path.join(tmp, 'y.zip');
  await download(r.url, f);
  await readStream('unzip', ['-p', f]);
  fs.rmSync(f, { force: true });
  console.log('  у вибірці VIN:', best.size);
}
for (const r of current) {
  console.log('Поточний файл ГСЦ:', r.description || r.name);
  await readStream('curl', ['-sSfL', '--retry', '3', r.url]);
  console.log('  у вибірці VIN:', best.size);
}
console.log('Переглянуто записів:', seen, '· унікальних VIN у вибірці:', best.size);
if (CHECK) { console.log(found.length ? 'VIN ' + CHECK + ' знайдено в офіційних даних МВС: ' + found.length + ' записів.' : 'VIN ' + CHECK + ' НЕ знайдено в офіційних даних МВС за 2021–2026 роки.'); process.exit(0); }
if (COUNT_ONLY) { console.log('Режим підрахунку: у базу нічого не записано.'); process.exit(0); }

// Зберігаємо реєстр файлами в Supabase Storage (кошик vin-registry): база лишається маленькою, а на безкоштовному тарифі
// є 1 ГБ сховища. Кожен VIN потрапляє в один із 4096 файлів за першими 3 символами SHA-256 від VIN (~1,4 тис. рядків, ~25 КБ gzip).
// Рядок: VIN, марка, модель, рік, об'єм см³, паливо, кузов, колір, кВт, дата останньої дії — через табуляцію.
const crypto = await import('node:crypto');
const zlib = await import('node:zlib');
const shards = new Map();
const clean = (v) => String(v == null ? '' : v).replace(/[\t\r\n]+/g, ' ').trim();
for (const r of best.values()) {
  const key = crypto.createHash('sha256').update(r.vin).digest('hex').slice(0, 3);
  if (!shards.has(key)) shards.set(key, []);
  shards.get(key).push([r.vin, r.brand, r.model, r.year || '', r.capacity || '', r.fuel, r.body, r.color, r.power_kw || '', r.d_reg].map(clean).join('\t'));
}
best.clear();
const prefix = process.env.REGISTRY_VERSION || 'v1';
const hdr = { apikey: KEY, 'x-upsert': 'true', 'Content-Type': 'application/gzip', 'Cache-Control': 'max-age=86400' };
if (!KEY.startsWith('sb_')) hdr.Authorization = 'Bearer ' + KEY;
const keys = [...shards.keys()];
let done = 0, bytes = 0, failed = 0;
async function put(key) {
  const body = zlib.gzipSync(Buffer.from(shards.get(key).join('\n'), 'utf8'), { level: 9 });
  bytes += body.length;
  for (let a = 0; a < 5; a++) {
    const r = await fetch(SUPABASE_URL + '/storage/v1/object/vin-registry/' + prefix + '/' + key + '.tsv.gz', { method: 'POST', headers: hdr, body });
    if (r.ok) { done++; return; }
    const t = (await r.text()).slice(0, 200);
    if (a === 4) { failed++; console.error('Помилка файлу', key, r.status, t); }
    await new Promise((res) => setTimeout(res, 1500 * (a + 1)));
  }
}
for (let i = 0; i < keys.length; i += 16) {
  await Promise.all(keys.slice(i, i + 16).map(put));
  if (i % 512 === 0) console.log('Файлів завантажено:', done, 'з', keys.length, '·', Math.round(bytes / 1048576), 'МБ');
}
console.log('Готово: файлів', done, 'з', keys.length, '· разом ~' + Math.round(bytes / 1048576) + ' МБ у сховищі');
if (failed) process.exit(1);
