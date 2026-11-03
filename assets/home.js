/* АвтоХаб: головна. Кнопки реєстрації (Telegram-бот або браузер), живі лічильники, поява блоків, липка кнопка. */
(function () {
  var CFG = window.AUTOHUB_CONFIG || {};
  var src = ((location.search.match(/[?&](?:utm_source|s)=([^&]+)/) || [])[1] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);

  var BOT = '';
  function wireOne(a) {
    var role = a.getAttribute('data-reg');
    a.href = BOT ? 'https://t.me/' + BOT + '?start=' + role + (src ? '_' + src : '') : 'app/?reg=' + role;
    if (BOT) a.rel = 'noopener';
  }
  function wire(bot) {
    if (!bot) return; BOT = bot;
    // головні кнопки: реєстрація в боті одним натиском; посилання «у браузері» лишається поруч
    Array.prototype.forEach.call(document.querySelectorAll('[data-reg]'), function (a) {
      a.href = 'https://t.me/' + bot + '?start=' + a.getAttribute('data-reg') + (src ? '_' + src : '');
      a.rel = 'noopener';
    });
  }

  // клік по кнопці реєстрації: подія для Google Ads
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('[data-reg],[data-reg-web]');
    if (!a || typeof window.gtag !== 'function') return;
    window.gtag('event', 'sign_up_start', { role: a.getAttribute('data-reg') || a.getAttribute('data-reg-web'), method: a.hasAttribute('data-reg') && /t\.me/.test(a.href) ? 'telegram' : 'web' });
  });

  if (CFG.tgBot) wire(CFG.tgBot);
  if (CFG.formEndpoint) {
    fetch(CFG.formEndpoint, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action: 'stats.public' }) })
      .then(function (r) { return r.json(); })
      .then(function (s) {
        if (!s || !s.ok) return;
        if (!CFG.tgBot) wire(s.tgBot);
        if (s.catalog > 0) Array.prototype.forEach.call(document.querySelectorAll('[data-n=catalog]'), function (el) { el.textContent = s.catalog; });
      }).catch(function () {});
  }

  // поява блоків
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window && !reduce) {
    var els = document.querySelectorAll('.pain,.fc,.sc2,.steps3 li,.founder,.faq details');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(els, function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  }

  // перемикач «Для водіїв / Для сервісів»: міняє перший екран, а блок сервісів ставить одразу під ним
  var body = document.body, stoSec = document.getElementById('sto'), heroSec = document.querySelector('.h-hero');
  var stoHome = stoSec ? { parent: stoSec.parentNode, next: stoSec.nextElementSibling } : null;
  var stick = document.getElementById('stick');
  function setAud(a, push) {
    body.setAttribute('data-aud', a);
    Array.prototype.forEach.call(document.querySelectorAll('.aud [data-aud]'), function (b) { b.setAttribute('aria-selected', String(b.getAttribute('data-aud') === a)); });
    if (stoSec && stoHome) {
      if (a === 'sto') { var m = document.querySelector('main'); m.insertBefore(stoSec, m.firstChild); }
      else stoHome.parent.insertBefore(stoSec, stoHome.next);
    }
    if (stick) {
      stick.querySelector('span').textContent = a === 'sto' ? 'Безкоштовно для сервісів' : 'Безкоштовно для водіїв';
      var sb = stick.querySelector('a'); sb.setAttribute('data-reg', a); sb.textContent = a === 'sto' ? 'Підключити сервіс' : 'Зареєструватися'; wireOne(sb);
    }
    if (push) { try { var qs = new URLSearchParams(location.search); if (a === 'sto') qs.set('for', 'sto'); else qs.delete('for'); var q = qs.toString(); history.replaceState(null, '', location.pathname + (q ? '?' + q : '') + location.hash); } catch (e) {} }
  }
  Array.prototype.forEach.call(document.querySelectorAll('.aud [data-aud]'), function (b) {
    b.addEventListener('click', function () { setAud(b.getAttribute('data-aud'), true); });
    b.addEventListener('keydown', function (e) {
      if (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight') return;
      var o = document.querySelector('.aud [data-aud]:not([data-aud="' + b.getAttribute('data-aud') + '"])'); o.focus(); o.click();
    });
  });
  Array.prototype.forEach.call(document.querySelectorAll('a[href="#sto"]'), function (l) {
    l.addEventListener('click', function () { if (body.getAttribute('data-aud') !== 'sto') setAud('sto', true); });
  });
  var want = /[?&]for=sto\b/.test(location.search) || location.hash === '#sto' ? 'sto' : 'driver';
  setAud(want, false);
  if (want === 'sto' && location.hash === '#sto') setTimeout(function () { stoSec.scrollIntoView(); }, 0);

  // липка кнопка: коли перший екран прокручено і ще не дійшли до фінального заклику
  var fin = document.querySelector('.h-final');
  if (stick && heroSec && 'IntersectionObserver' in window) {
    stick.hidden = false;
    var heroOut = false, finIn = false;
    var upd = function () { stick.classList.toggle('on', heroOut && !finIn); };
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd(); }).observe(heroSec);
    if (fin) new IntersectionObserver(function (es) { finIn = es[0].isIntersecting; upd(); }).observe(fin);
  }
})();
