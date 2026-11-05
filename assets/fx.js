/* АвтоХаб: шар ефектів для сторінок сайту.
   Бібліотеки: anime.js 3.2.2 (поява тексту, лічильники) і Motion 12 (поява при прокрутці, пружини, прогрес).
   Прийоми карток, кнопок і фону — у дусі компонентів 21st.dev та Kokonut UI, переписані без React.
   Вимкнути: у assets/config.js поставити fx: false (сторінки працюють як раніше). */
(function () {
  var CFG = window.AUTOHUB_CONFIG || {};
  if (CFG.fx === false) return;
  if (window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var A = window.anime, M = window.Motion;
  if (!A || !M || !M.animate) return; // бібліотеки не завантажились — сторінка лишається без ефектів
  var root = document.documentElement; root.classList.add('fx');
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var fine = window.matchMedia && matchMedia('(hover: hover) and (pointer: fine)').matches;
  var home = document.body.classList.contains('home');

  /* 1. Смуга прогресу прокрутки (Motion scroll) */
  var bar = document.createElement('div'); bar.className = 'fx-progress'; bar.setAttribute('aria-hidden', 'true');
  document.body.appendChild(bar);
  try { M.scroll(M.animate(bar, { scaleX: [0, 1] }, { ease: 'linear' })); } catch (e) { bar.remove(); }

  /* 2. «Аврора» на нічному тлі */
  $$('.h-night, .h-sto, .h-final .wrap').forEach(function (el) {
    var a = document.createElement('div'); a.className = 'fx-aurora'; a.setAttribute('aria-hidden', 'true');
    a.innerHTML = '<i></i><i></i><i></i>'; el.insertBefore(a, el.firstChild);
  });

  /* 3. Заголовки: поява по словах (anime.js) */
  function splitWords(el) {
    if (!el || el.dataset.fxSplit) return [];
    el.dataset.fxSplit = '1';
    var out = [];
    Array.prototype.slice.call(el.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          var s = document.createElement('span'); s.className = 'fx-w'; s.textContent = part; frag.appendChild(s); out.push(s);
        });
        n.parentNode.replaceChild(frag, n);
      } else if (n.nodeType === 1 && n.tagName !== 'BR') { n.classList.add('fx-w'); out.push(n); }
    });
    return out;
  }
  function revealWords(el, delay) {
    var w = splitWords(el); if (!w.length) w = $$('.fx-w', el);
    A({ targets: w, translateY: [28, 0], opacity: [0, 1], filter: ['blur(8px)', 'blur(0px)'], easing: 'easeOutExpo', duration: 1100, delay: A.stagger(70, { start: delay || 0 }) });
  }
  function revealHeroCopy(copy) {
    if (!copy) return;
    revealWords(copy.querySelector('h1, .h1like'), 120);
    A({ targets: copy.querySelectorAll('.h-eye, .h-lead, .h-cta, .h-note, .h-proof li'), translateY: [18, 0], opacity: [0, 1], easing: 'easeOutCubic', duration: 800, delay: A.stagger(80, { start: 380 }) });
    tickers(copy);
  }
  var visibleCopy = function () { return $$('.h-copy').filter(function (c) { return c.offsetParent !== null; })[0]; };
  if (home) revealHeroCopy(visibleCopy());
  else { var h1 = document.querySelector('.hero h1'); if (h1) revealWords(h1, 100); }

  /* 4. Лічильники цифр (anime.js) */
  function tickers(scope) {
    $$('.h-proof b', scope).forEach(function (b) {
      if (b.hasAttribute('data-n')) return;
      var m = /^(\D*)(\d[\d\s]*)(.*)$/.exec(b.textContent.trim()); if (!m) return;
      var to = parseInt(m[2].replace(/\s/g, ''), 10); if (!(to > 1)) return;
      var o = { v: 0 };
      A({ targets: o, v: to, round: 1, easing: 'easeOutExpo', duration: 1600, delay: 500, update: function () { b.textContent = m[1] + o.v + m[3]; } });
    });
  }
  // число сервісів приходить із сервера пізніше: один раз прокручуємо до нового значення
  if (home) {
    $$('.h-proof [data-n=catalog]').forEach(function (b) {
      var mo = new MutationObserver(function () {
        var to = parseInt(b.textContent, 10); if (!(to > 0)) return;
        mo.disconnect(); var o = { v: Math.max(0, to - 40) };
        A({ targets: o, v: to, round: 1, easing: 'easeOutExpo', duration: 1400, update: function () { b.textContent = o.v; } });
      });
      mo.observe(b, { childList: true, characterData: true, subtree: true });
    });
  }

  /* 5. Поява блоків при прокрутці (Motion inView + stagger) */
  var groups = home
    ? ['.pain-grid', '.fg-body .fcards', '.sgrid', '.steps3', '.sshots', '.gal', '.faq', '.h-head', '.pass-grid', '.founder', '.h-final .wrap']
    : ['.sec-head', '.three', '.what', '.steps', '.comm-list', '.choose', '.app-strip', '.faq', '.form-box', 'section .wrap > .phones', '.hero-grid > :last-child'];
  groups.forEach(function (sel) {
    $$(sel).forEach(function (g) {
      var kids = Array.prototype.slice.call(g.children).filter(function (k) { return !k.classList.contains('fx-aurora') && getComputedStyle(k).display !== 'none'; });
      if (!kids.length) kids = [g];
      if (g.dataset.fxIn) return; g.dataset.fxIn = '1';
      kids.forEach(function (k) { k.style.opacity = '0'; });
      M.inView(g, function () {
        M.animate(kids, { opacity: [0, 1], y: [36, 0], scale: [0.97, 1] }, { delay: M.stagger(0.07), type: 'spring', stiffness: 140, damping: 20, mass: 0.9 });
      }, { amount: 0.15, margin: '0px 0px -40px 0px' });
    });
  });
  // підстраховка: якщо щось не потрапило в поле зору (друк, швидкий перехід за якорем) — показати
  setTimeout(function () { $$('[data-fx-in] > *').forEach(function (k) { if (k.style.opacity === '0' && k.getBoundingClientRect().top < innerHeight) k.style.opacity = '1'; }); }, 4000);

  /* 6. Телефони першого екрана: в'їзд пружиною, нахил за курсором */
  if (home) {
    $$('.h-visual').forEach(function (v) {
      var tilt = document.createElement('div'); tilt.className = 'fx-tilt';
      $$('.phone', v).forEach(function (p) { tilt.appendChild(p); }); v.insertBefore(tilt, v.firstChild);
      if (v.offsetParent !== null) M.animate(tilt, { opacity: [0, 1], y: [60, 0], rotate: [4, 0] }, { type: 'spring', stiffness: 70, damping: 14, delay: 0.25 });
      if (fine) {
        v.addEventListener('mousemove', function (e) {
          var r = v.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
          tilt.style.transform = 'rotateY(' + (x * 14).toFixed(2) + 'deg) rotateX(' + (-y * 10).toFixed(2) + 'deg)';
        });
        v.addEventListener('mouseleave', function () { tilt.style.transform = ''; });
      }
    });
  }

  /* 7. Картки з «прожектором» за курсором */
  if (fine) {
    $$('.pain, .fc, .sc2, .steps3 li, .three > div, .what > *, .steps > *, .faq details, .pick').forEach(function (c) {
      c.classList.add('fx-spot');
      c.addEventListener('mousemove', function (e) { var r = c.getBoundingClientRect(); c.style.setProperty('--mx', (e.clientX - r.left) + 'px'); c.style.setProperty('--my', (e.clientY - r.top) + 'px'); });
    });
  }

  /* 8. «Магнітні» головні кнопки */
  if (fine) {
    $$('.h-btn, .hero .btn').forEach(function (b) {
      b.addEventListener('mousemove', function (e) { var r = b.getBoundingClientRect(); b.style.transform = 'translate(' + ((e.clientX - r.left - r.width / 2) * 0.18).toFixed(1) + 'px,' + ((e.clientY - r.top - r.height / 2) * 0.28).toFixed(1) + 'px)'; });
      b.addEventListener('mouseleave', function () { b.style.transform = ''; });
    });
  }

  /* 9. Рамки-промені на головних блоках */
  $$('.founder, .h-final .wrap, .app-strip, .form-box').forEach(function (el) { el.classList.add('fx-beam'); });

  /* 10. Перемикач «Для водіїв / Для сервісів»: плашка їде пружиною, перший екран з'являється заново */
  var aud = document.querySelector('.aud');
  if (aud) {
    var pill = document.createElement('span'); pill.className = 'fx-pill'; pill.setAttribute('aria-hidden', 'true'); aud.insertBefore(pill, aud.firstChild);
    var place = function (animate) {
      var b = aud.querySelector('[aria-selected=true]'); if (!b) return;
      var to = { x: b.offsetLeft, width: b.offsetWidth };
      if (animate) M.animate(pill, { x: to.x, width: to.width }, { type: 'spring', stiffness: 380, damping: 32 });
      else { pill.style.width = to.width + 'px'; pill.style.transform = 'translateX(' + to.x + 'px)'; }
    };
    place(false); window.addEventListener('resize', function () { place(false); });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { place(false); });
    aud.addEventListener('click', function (e) {
      if (!e.target.closest('[data-aud]')) return;
      setTimeout(function () {
        place(true);
        revealHeroCopy(visibleCopy());
        $$('.h-visual').filter(function (v) { return v.offsetParent !== null; }).forEach(function (v) { var t = v.querySelector('.fx-tilt'); if (t) M.animate(t, { opacity: [0, 1], x: [40, 0] }, { type: 'spring', stiffness: 90, damping: 16 }); });
      }, 0);
    });
  }
})();
