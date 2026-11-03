/* АвтоХаб: головна. Кнопки реєстрації (Telegram-бот або браузер), живі лічильники, поява блоків, липка кнопка. */
(function () {
  var CFG = window.AUTOHUB_CONFIG || {};
  var src = ((location.search.match(/[?&](?:utm_source|s)=([^&]+)/) || [])[1] || '').toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 30);

  function wire(bot) {
    if (!bot) return;
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
    var els = document.querySelectorAll('.pain,.fc,.sc2,.steps3 li,.pass-card,.founder,.faq details');
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (x) { if (x.isIntersecting) { x.target.classList.add('in'); io.unobserve(x.target); } });
    }, { rootMargin: '0px 0px -8% 0px' });
    Array.prototype.forEach.call(els, function (el, i) { el.classList.add('rv'); el.style.transitionDelay = (i % 4) * 60 + 'ms'; io.observe(el); });
  }

  // липка кнопка: коли головна кнопка вже не видна і ще не дійшли до фінального заклику
  var stick = document.getElementById('stick'), hero = document.getElementById('heroCta'), fin = document.querySelector('.h-final');
  if (stick && hero && 'IntersectionObserver' in window) {
    stick.hidden = false;
    var heroOut = false, finIn = false;
    var upd = function () { stick.classList.toggle('on', heroOut && !finIn); };
    new IntersectionObserver(function (es) { heroOut = !es[0].isIntersecting && es[0].boundingClientRect.top < 0; upd(); }).observe(hero);
    if (fin) new IntersectionObserver(function (es) { finIn = es[0].isIntersecting; upd(); }).observe(fin);
  }
})();
