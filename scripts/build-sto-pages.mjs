// АвтоХаб: відкриті сторінки сервісів для пошуковиків.
// Бере каталог з API (дія sto.catalog, лише публічні дані) і пише:
//   sto/index.html            — каталог з фільтром за послугою й районом
//   sto/<slug>/index.html     — сторінка кожного сервісу
//   sitemap.xml, robots.txt
// Запуск: node scripts/build-sto-pages.mjs  (у GitHub Actions — щодня, див. .github/workflows/sto-pages.yml)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SITE = 'https://autohubkr.com';
const cfg = fs.readFileSync(path.join(ROOT, 'assets/config.js'), 'utf8');
const API = process.env.AUTOHUB_API || (cfg.match(/appEndpoint:\s*"([^"]+)"/) || [])[1];
if (!API) throw new Error('Не знайдено appEndpoint в assets/config.js');

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const TR = { а: 'a', б: 'b', в: 'v', г: 'h', ґ: 'g', д: 'd', е: 'e', є: 'ie', ж: 'zh', з: 'z', и: 'y', і: 'i', ї: 'i', й: 'i', к: 'k', л: 'l', м: 'm', н: 'n', о: 'o',
  п: 'p', р: 'r', с: 's', т: 't', у: 'u', ф: 'f', х: 'kh', ц: 'ts', ч: 'ch', ш: 'sh', щ: 'shch', ь: '', ю: 'iu', я: 'ia', ы: 'y', э: 'e', ё: 'e', ъ: '' };
const slugify = (name, id) => (String(name).toLowerCase().split('').map((c) => TR[c] !== undefined ? TR[c] : c).join('')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 50) || 'sto') + '-' + String(id).slice(0, 6).toLowerCase();
const telHref = (p) => 'tel:' + String(p || '').replace(/[^\d+]/g, '');
const fmtPhone = (p) => { const d = String(p || '').replace(/\D/g, ''); return d.length === 12 ? '+38 (' + d.slice(2, 5) + ') ' + d.slice(5, 8) + '-' + d.slice(8, 10) + '-' + d.slice(10) : p; };
const stars = (n) => { n = Math.round(n || 0); let s = ''; for (let i = 1; i <= 5; i++) s += i <= n ? '★' : '☆'; return s; };

const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'sto.catalog' }) });
const data = await res.json();
if (!data.ok || !Array.isArray(data.stos)) throw new Error('API не віддав каталог: ' + JSON.stringify(data).slice(0, 200));
const stos = data.stos.map((s) => ({ ...s, slug: slugify(s.name, s.id) })).sort((a, b) => (a.listed - b.listed) || (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name, 'uk'));
console.log('Сервісів у каталозі:', stos.length);

const head = (title, desc, canon, depth) => `<!doctype html>
<html lang="uk">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${SITE}${canon}">
<link rel="icon" href="/favicon.ico" sizes="48x48"><link rel="icon" href="/assets/icon-192.png" type="image/png" sizes="192x192"><link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<meta name="theme-color" content="#06111F">
<meta property="og:type" content="website"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:locale" content="uk_UA"><meta property="og:url" content="${SITE}${canon}"><meta property="og:image" content="${SITE}/assets/og-image.png"><meta name="twitter:card" content="summary_large_image">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@500;600;700&family=Onest:wght@400;500;600&display=swap" rel="stylesheet">
<link rel="stylesheet" href="${depth}assets/site.css?v=4">
<style>
.sto-grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fill,minmax(280px,1fr))}
.sto-card{display:block;background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:16px;text-decoration:none;color:inherit}
.sto-card:hover{border-color:var(--petrol)}
.sto-card h3{font-size:17px;margin:0 0 4px}.sto-card p{margin:0;font-size:14px;color:var(--ink-soft)}
.sto-tags{display:flex;flex-wrap:wrap;gap:6px;margin-top:10px}.sto-tags span{font-size:12px;border-radius:99px;padding:3px 9px;background:var(--line);color:var(--ink)}
.sto-badge{display:inline-block;font-size:12px;font-weight:700;border-radius:99px;padding:3px 9px;background:var(--petrol);color:#fff;margin-bottom:8px}
.sto-filters{display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px}.sto-filters select{min-height:44px;border-radius:10px;border:1.5px solid var(--line);padding:0 12px;font:inherit;background:#fff}
.sto-info{display:grid;gap:10px;margin:18px 0}.sto-info div{font-size:16px}.sto-info b{display:block;font-size:13px;color:var(--ink-soft);font-weight:500}
.sto-rv{background:#fff;border:1.5px solid var(--line);border-radius:12px;padding:12px 14px;margin-top:10px}
.sto-cta{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}
.crumbs{font-size:14px;color:var(--ink-soft);margin-bottom:10px}.crumbs a{color:inherit}
.sto-logo{width:48px;height:48px;border-radius:12px;object-fit:cover;float:right;margin-left:10px}
.sto-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;margin-top:12px}.sto-gal img{width:100%;aspect-ratio:1;object-fit:cover;border-radius:10px;display:block}
</style>
</head>
<body>
<header class="wrap top">
  <a class="logo" href="${depth}" aria-label="AutoHubKR, на головну"><img src="${depth}app/logo-head.webp" width="150" height="52" alt="AutoHubKR — навігатор автопослуг"></a>
  <nav class="topnav"><a class="sw" href="${depth}sto/">Сервіси</a><a class="small" href="${depth}drivers/">Для водіїв</a><a class="app" href="${depth}app/">Увійти</a></nav>
</header>
<main>`;
const foot = (depth) => `</main>
<footer>
  <div class="wrap foot">
    <span>АвтоХаб. Автомобільна спільнота Кривого Рогу. Дані про сервіси без позначки «партнер» зібрано з відкритих каталогів і можуть бути неточними.</span>
    <nav><a href="${depth}">Головна</a><a href="${depth}app/">Застосунок</a><a href="${depth}services/">Для сервісів</a><a href="${depth}privacy/">Конфіденційність</a></nav>
  </div>
</footer>
<script src="${depth}assets/config.js?v=6"></script>
<script src="${depth}assets/track.js"></script>
</body>
</html>
`;

const card = (s) => `<a class="sto-card" href="${esc(s.slug)}/" data-svc="${esc(s.services.join('|'))}" data-dist="${esc(s.district || '')}">
  ${s.logo ? `<img class="sto-logo" src="${esc(s.logo)}" alt="" loading="lazy">` : ''}${s.listed ? '' : '<span class="sto-badge">Партнер АвтоХабу</span>'}
  <h3>${esc(s.name)}</h3>
  <p>${esc([s.district, s.address].filter(Boolean).join(' · '))}</p>
  ${s.rating ? `<p style="margin-top:6px">${stars(s.rating)} ${esc(s.rating)} (${s.reviews})</p>` : ''}
  ${s.services.length ? `<div class="sto-tags">${s.services.map((x) => `<span>${esc(x)}</span>`).join('')}</div>` : ''}
</a>`;

const allSvc = [...new Set(stos.flatMap((s) => s.services))].sort((a, b) => a.localeCompare(b, 'uk'));
const allDist = [...new Set(stos.map((s) => s.district).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'uk'));

const outDir = path.join(ROOT, 'sto');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

fs.writeFileSync(path.join(outDir, 'index.html'), head('Автосервіси Кривого Рогу: СТО, шиномонтаж, автоелектрика | АвтоХаб',
  `Каталог ${stos.length} автосервісів Кривого Рогу: адреси, телефони, послуги й відгуки водіїв. Заявка в сервіс-партнер через застосунок АвтоХаб.`, '/sto/', '../') + `
<section style="padding:20px 0 40px"><div class="wrap">
  <h1>Автосервіси Кривого Рогу</h1>
  <p class="lead" style="color:var(--ink-soft);max-width:40em;margin:14px 0 22px">${stos.length} сервісів міста з адресами, послугами й відгуками. Партнерам АвтоХабу можна надіслати заявку з описом проблеми прямо із застосунку.</p>
  <div class="sto-filters">
    <select id="fSvc" aria-label="Послуга"><option value="">Усі послуги</option>${allSvc.map((x) => `<option>${esc(x)}</option>`).join('')}</select>
    <select id="fDist" aria-label="Район"><option value="">Усі райони</option>${allDist.map((x) => `<option>${esc(x)}</option>`).join('')}</select>
  </div>
  <div class="note" style="background:#fff;border:1.5px solid var(--line);border-radius:14px;padding:16px 18px;margin:0 0 18px"><b>Водій з Кривого Рогу?</b> Долучайтеся до закритого тесту АвтоХабу: гараж з історією ремонтів, нагадування про ТО й заявки в сервіси. <a href="../drivers/#join">Заповнити анкету водія</a>. Власник сервісу? <a href="../services/#join">Анкета для сервісів</a>.</div>
  <div class="sto-grid" id="grid">${stos.map(card).join('\n')}</div>
  <p id="none" hidden>За цими фільтрами сервісів немає.</p>
</div></section>
<script>
(function(){var g=document.getElementById('grid'),a=document.getElementById('fSvc'),b=document.getElementById('fDist');
function f(){var n=0;Array.prototype.forEach.call(g.children,function(c){var ok=(!a.value||c.dataset.svc.split('|').indexOf(a.value)!==-1)&&(!b.value||c.dataset.dist===b.value);c.hidden=!ok;if(ok)n++;});document.getElementById('none').hidden=n>0;}
a.onchange=f;b.onchange=f;})();
</script>
` + foot('../'));

for (const s of stos) {
  const dir = path.join(outDir, s.slug);
  fs.mkdirSync(dir, { recursive: true });
  const what = s.services.length ? s.services.join(', ').toLowerCase() : 'автосервіс';
  const appLink = `../../app/#/new?sto=${encodeURIComponent(s.id)}${s.services[0] ? '&cat=' + encodeURIComponent(s.services[0]) : ''}`;
  const ld = { '@context': 'https://schema.org', '@type': 'AutoRepair', name: s.name, url: `${SITE}/sto/${s.slug}/`,
    address: { '@type': 'PostalAddress', streetAddress: s.address || undefined, addressLocality: 'Кривий Ріг', addressRegion: 'Дніпропетровська область', addressCountry: 'UA' },
    telephone: s.phone || undefined, openingHours: s.hours || undefined, image: s.logo || (s.photos && s.photos[0]) || undefined,
    geo: s.lat ? { '@type': 'GeoCoordinates', latitude: s.lat, longitude: s.lng } : undefined,
    aggregateRating: s.rating ? { '@type': 'AggregateRating', ratingValue: s.rating, reviewCount: s.reviews } : undefined };
  const maps = s.lat ? `https://www.google.com/maps/search/?api=1&query=${s.lat},${s.lng}` : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(s.name + ', ' + (s.address ? s.address + ', ' : '') + 'Кривий Ріг')}`;
  fs.writeFileSync(path.join(dir, 'index.html'), head(`${s.name}: ${what}, Кривий Ріг | АвтоХаб`,
    `${s.name} у Кривому Розі${s.address ? ', ' + s.address : ''}. ${s.services.length ? 'Послуги: ' + s.services.join(', ') + '. ' : ''}Телефон, графік і відгуки водіїв.`, `/sto/${s.slug}/`, '../../') + `
<section style="padding:20px 0 40px"><div class="wrap" style="max-width:760px">
  <div class="crumbs"><a href="../">Автосервіси Кривого Рогу</a> › ${esc(s.district || 'Кривий Ріг')}</div>
  ${s.listed ? '' : '<span class="sto-badge">Партнер АвтоХабу</span>'}
  <h1>${s.logo ? `<img src="${esc(s.logo)}" alt="Логотип ${esc(s.name)}" style="width:56px;height:56px;border-radius:14px;object-fit:cover;vertical-align:middle;margin-right:10px">` : ''}${esc(s.name)}</h1>
  ${s.rating ? `<p style="font-size:17px;margin:8px 0 0">${stars(s.rating)} ${esc(s.rating)} · ${s.reviews} ${s.reviews === 1 ? 'відгук' : s.reviews < 5 ? 'відгуки' : 'відгуків'} після робіт через АвтоХаб</p>` : ''}
  <div class="sto-info">
    ${s.address ? `<div><b>Адреса</b>${esc(s.address)}, Кривий Ріг${s.district ? ' (' + esc(s.district) + ' район)' : ''} · <a href="${esc(maps)}" target="_blank" rel="noopener">на карті</a></div>` : ''}
    ${s.phone ? `<div><b>Телефон</b><a href="${esc(telHref(s.phone))}">${esc(fmtPhone(s.phone))}</a></div>` : ''}
    ${s.hours ? `<div><b>Графік</b>${esc(s.hours)}</div>` : ''}
    ${s.services.length ? `<div><b>Послуги</b><div class="sto-tags" style="margin-top:4px">${s.services.map((x) => `<span>${esc(x)}</span>`).join('')}</div></div>` : ''}
    ${s.about ? `<div><b>Про сервіс</b>${esc(s.about)}</div>` : ''}
  </div>
  <div class="sto-cta">
    ${s.listed ? (s.phone ? `<a class="btn" href="${esc(telHref(s.phone))}">Зателефонувати</a>` : '') : `<a class="btn" href="${esc(appLink)}">Надіслати заявку через АвтоХаб</a>`}
    <a class="btn dark" href="../../app/">Гараж і план ТО для вашого авто</a>
    <a class="btn dark" href="../../drivers/#join">Долучитися до тесту АвтоХабу</a>
  </div>
  ${s.listed ? `<p class="req-note" style="margin-top:14px">Цей сервіс ще не підключений до АвтоХабу, дані з відкритих каталогів. Ви власник? <a href="../../services/">Підключіть сервіс безкоштовно</a> і отримуйте заявки від водіїв.</p>` : ''}
  ${s.photos && s.photos.length ? `<h2 style="margin-top:30px">Фото робіт і цеху</h2><div class="sto-gal">${s.photos.map((u) => `<img src="${esc(u)}" alt="Фото ${esc(s.name)}" loading="lazy">`).join('')}</div>` : ''}
  ${s.lastReviews && s.lastReviews.length ? `<h2 style="margin-top:30px">Відгуки водіїв</h2>${s.lastReviews.map((v) => `<div class="sto-rv">${stars(v.rating)} <span style="color:var(--ink-soft);font-size:14px">${esc(v.date)}</span><div>${esc(v.text || 'Без коментаря')}</div></div>`).join('')}` : ''}
</div></section>
<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>
` + foot('../../'));
}

const pages = ['/', '/drivers/', '/services/', '/sto/', '/privacy/'].concat(stos.map((s) => `/sto/${s.slug}/`));
const day = new Date().toISOString().slice(0, 10);
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${pages.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${day}</lastmod></url>`).join('\n')}
</urlset>
`);
fs.writeFileSync(path.join(ROOT, 'robots.txt'), `User-agent: *\nDisallow: /app/\nDisallow: /outreach/\nSitemap: ${SITE}/sitemap.xml\n`);
console.log('Готово: сторінок сервісів', stos.length);
