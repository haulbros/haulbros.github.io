(function () {
  var S = window.SITE || {}, d = document, root = d.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---- Translation helpers (js/i18n.js loads first; fall back to English if it is missing) ---- */
  var T = window.t || function (k, v, f) { return f != null ? f : k; };
  function lang() { return window.I18N_API ? window.I18N_API.get() : 'en'; }

  /* ---- Bind business info from config.js (re-run when the language changes) ---- */
  var digits = (S.phoneDigits || '').replace(/\D/g, '');
  function money(r) { return '$' + r[0] + ' \u2013 $' + r[1]; }
  var pk = { single: 'price-single', quarter: 'price-quarter', half: 'price-half', three: 'price-three', full: 'price-full' };
  var al = $('#addons-list');
  function bind() {
    $$('[data-bind="phone"]').forEach(function (e) { if (S.phone) e.textContent = S.phone; });
    $$('[data-bind="email"]').forEach(function (e) { if (S.email) e.textContent = S.email; });
    var hrs = lang() === 'es' && S.hoursEs ? S.hoursEs : S.hours;
    $$('[data-bind="hours"]').forEach(function (e) { if (hrs) e.textContent = hrs; });
    $$('[data-bind-tel]').forEach(function (a) { if (digits) a.href = 'tel:+' + digits; else a.removeAttribute('href'); });
    $$('[data-bind-sms]').forEach(function (a) { if (digits) a.href = 'sms:+' + digits; else a.removeAttribute('href'); });
    $$('[data-bind-mail]').forEach(function (a) { if (S.email) a.href = 'mailto:' + S.email; else a.removeAttribute('href'); });
    $$('[data-bind-href]').forEach(function (a) {
      var u = S[a.getAttribute('data-bind-href')];
      if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } else { a.closest('li').hidden = true; }
    });
    Object.keys(pk).forEach(function (k) {
      var v = S.prices && S.prices[k], e = $('[data-bind="' + pk[k] + '"]');
      if (v && e) e.textContent = money(v);
    });
    if (al && S.addons) {
      al.innerHTML = '';
      S.addons.forEach(function (a, i) {
        var li = d.createElement('li'), l = d.createElement('span'), p = d.createElement('b');
        l.textContent = T('addon_' + i + '_label', null, a.label); p.textContent = T('addon_' + i + '_price', null, a.price);
        li.appendChild(l); li.appendChild(p); al.appendChild(li);
      });
    }
  }
  bind();
  if (S.showReviews) { var rv = $('#reviews'); if (rv) rv.hidden = false; }
  $('#year').textContent = new Date().getFullYear();

  /* ---- Header + nav ---- */
  var header = $('.site-header'), toggle = $('.nav-toggle'), menu = $('#menu');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', T(open ? 'menu_close' : 'menu_open'));
  }
  toggle.setAttribute('aria-label', T('menu_open'));
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); toggle.focus(); } });

  /* ---- Active nav link (scroll-spy) ---- */
  var spyLinks = $$('.menu a[href^="#"]:not(.btn)');
  function spy() {
    var cur = null, line = 120;
    spyLinks.forEach(function (a) {
      var sec = d.getElementById(a.getAttribute('href').slice(1));
      if (!sec) return;
      var r = sec.getBoundingClientRect();
      if (r.top <= line && r.bottom > line) cur = a;
    });
    spyLinks.forEach(function (a) {
      var on = a === cur; a.classList.toggle('active', on);
      if (on) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current');
    });
  }
  spy(); window.addEventListener('scroll', spy, { passive: true });

  /* ---- Scroll reveal (staggered within each group) ---- */
  var items = $$('.reveal');
  items.forEach(function (el) {
    var sibs = $$('.reveal', el.parentElement), i = sibs.indexOf(el);
    el.style.setProperty('--d', Math.min(i, 8) * 0.07 + 's');
  });
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    items.forEach(function (el) { io.observe(el); });
  } else items.forEach(function (el) { el.classList.add('in'); });

  /* ---- Quote form ---- */
  var form = $('#quote-form'), status = $('#form-status'), fileIn = $('#f-photos'), prev = $('#previews');
  var dateIn = $('#f-date');
  var t = new Date(); t.setMinutes(t.getMinutes() - t.getTimezoneOffset());
  dateIn.min = t.toISOString().slice(0, 10);

  var MAX_FILES = 8, MAX_MB = 10;
  /* Error messages are stored as keys so they can be re-translated when the language changes. */
  function setErr(el, key, vars) {
    if (key) { el.setAttribute('data-err', key); el._vars = vars; el.textContent = T(key, vars); }
    else { el.removeAttribute('data-err'); el._vars = null; el.textContent = ''; }
  }
  function photoError() {
    var f = fileIn.files;
    if (f.length > MAX_FILES) return ['err_photos_max', { n: MAX_FILES }];
    for (var i = 0; i < f.length; i++) {
      if (f[i].size > MAX_MB * 1048576) return ['err_photo_big', { name: f[i].name, mb: MAX_MB }];
      if (f[i].type.indexOf('image/') !== 0) return ['err_photo_type', { name: f[i].name }];
    }
    return null;
  }
  fileIn.addEventListener('change', function () {
    prev.innerHTML = '';
    var pe0 = photoError(); setErr($('#e-photos'), pe0 && pe0[0], pe0 && pe0[1]);
    if (pe0) return;
    Array.prototype.forEach.call(fileIn.files, function (f) {
      var li = d.createElement('li'), im = d.createElement('img');
      im.alt = T('photo_alt', { name: f.name }); im.src = URL.createObjectURL(f);
      im.onload = function () { URL.revokeObjectURL(im.src); };
      li.appendChild(im); prev.appendChild(li);
    });
  });

  function check(id, errId, msgKey, test) {
    var el = $('#' + id), box = el.closest('.field'), ok = test(el.value.trim());
    setErr($('#' + errId), ok ? null : msgKey);
    box.classList.toggle('invalid', !ok);
    el.setAttribute('aria-invalid', !ok);
    return ok ? null : el;
  }
  function validate() {
    var bad = [
      check('f-name', 'e-name', 'err_name', function (v) { return v.length > 1; }),
      check('f-phone', 'e-phone', 'err_phone', function (v) { return v.replace(/\D/g, '').length >= 10; }),
      check('f-email', 'e-email', 'err_email', function (v) { return !v || /^\S+@\S+\.\S+$/.test(v); }),
      check('f-addr', 'e-addr', 'err_addr', function (v) { return v.length > 2; }),
      check('f-what', 'e-what', 'err_what', function (v) { return v.length > 2; })
    ].filter(Boolean);
    var pe = photoError(); setErr($('#e-photos'), pe && pe[0], pe && pe[1]);
    if (pe) bad.push(fileIn);
    return bad;
  }

  function setBusy(b) {
    var btn = $('button[type=submit]', form), l = $('.btn-label', btn);
    btn.disabled = b;
    l.textContent = b ? T('form_sending') : T('get_my_free_quote');
    var sp = $('.spin', btn);
    if (b && !sp) { sp = d.createElement('span'); sp.className = 'spin'; sp.setAttribute('aria-hidden', 'true'); btn.insertBefore(sp, l); }
    if (!b && sp) sp.remove();
  }
  function say(key, ok) { status.setAttribute('data-key', key); status.textContent = T(key); status.className = 'status full ' + (ok ? 'ok' : 'bad'); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = ''; status.removeAttribute('data-key'); status.className = 'status full';
    var bad = validate();
    if (bad.length) { bad[0].focus(); return; }
    if (!S.formEndpoint) {
      say('form_not_connected', false);
      return;
    }
    setBusy(true);
    fetch(S.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset(); prev.innerHTML = '';
        say('form_ok', true);
      })
      .catch(function () { say('form_fail', false); })
      .then(function () { setBusy(false); });
  });

  /* ---- Language switch: re-bind links/hours/add-ons and re-translate dynamic messages ---- */
  d.addEventListener('langchange', function () {
    bind();
    toggle.setAttribute('aria-label', T(menu.classList.contains('open') ? 'menu_close' : 'menu_open'));
    Array.prototype.forEach.call(d.querySelectorAll('[data-err]'), function (el) { el.textContent = T(el.getAttribute('data-err'), el._vars); });
    if (status.getAttribute('data-key')) status.textContent = T(status.getAttribute('data-key'));
    var btn = $('button[type=submit] .btn-label', form);
    if (btn && !$('button[type=submit]', form).disabled) btn.textContent = T('get_my_free_quote');
    Array.prototype.forEach.call(prev.querySelectorAll('img'), function (im, i) { var f = fileIn.files[i]; if (f) im.alt = T('photo_alt', { name: f.name }); });
  });
})();
