(function () {
  var S = window.SITE || {}, d = document, root = d.documentElement;
  root.classList.add('js');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

  /* ---- Bind business info from config.js ---- */
  var digits = (S.phoneDigits || '').replace(/\D/g, '');
  $$('[data-bind="phone"]').forEach(function (e) { if (S.phone) e.textContent = S.phone; });
  $$('[data-bind="email"]').forEach(function (e) { if (S.email) e.textContent = S.email; });
  $$('[data-bind="hours"]').forEach(function (e) { if (S.hours) e.textContent = S.hours; });
  $$('[data-bind-tel]').forEach(function (a) { if (digits) a.href = 'tel:+' + digits; else a.removeAttribute('href'); });
  $$('[data-bind-sms]').forEach(function (a) { if (digits) a.href = 'sms:+' + digits; else a.removeAttribute('href'); });
  $$('[data-bind-mail]').forEach(function (a) { if (S.email) a.href = 'mailto:' + S.email; else a.removeAttribute('href'); });
  $$('[data-bind-href]').forEach(function (a) {
    var u = S[a.getAttribute('data-bind-href')];
    if (u) { a.href = u; a.target = '_blank'; a.rel = 'noopener'; } else { a.closest('li').hidden = true; }
  });
  var pk = { small: 'price-small', quarter: 'price-quarter', half: 'price-half', three: 'price-three', full: 'price-full' };
  Object.keys(pk).forEach(function (k) {
    var v = S.prices && S.prices[k], e = $('[data-bind="' + pk[k] + '"]');
    if (v && e) e.textContent = 'Starting at ' + v;
  });
  if (S.showReviews) { var rv = $('#reviews'); if (rv) rv.hidden = false; }
  $('#year').textContent = new Date().getFullYear();

  /* ---- Header + nav ---- */
  var header = $('.site-header'), toggle = $('.nav-toggle'), menu = $('#menu');
  var onScroll = function () { header.classList.toggle('scrolled', window.scrollY > 12); };
  onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  function setMenu(open) {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
  }
  toggle.addEventListener('click', function () { setMenu(!menu.classList.contains('open')); });
  menu.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') { setMenu(false); toggle.focus(); } });

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
  function photoError() {
    var f = fileIn.files;
    if (f.length > MAX_FILES) return 'Please choose up to ' + MAX_FILES + ' photos.';
    for (var i = 0; i < f.length; i++) {
      if (f[i].size > MAX_MB * 1048576) return f[i].name + ' is larger than ' + MAX_MB + ' MB.';
      if (f[i].type.indexOf('image/') !== 0) return f[i].name + ' is not an image.';
    }
    return '';
  }
  fileIn.addEventListener('change', function () {
    prev.innerHTML = '';
    var msg = photoError(); $('#e-photos').textContent = msg;
    if (msg) return;
    Array.prototype.forEach.call(fileIn.files, function (f) {
      var li = d.createElement('li'), im = d.createElement('img');
      im.alt = 'Selected photo: ' + f.name; im.src = URL.createObjectURL(f);
      im.onload = function () { URL.revokeObjectURL(im.src); };
      li.appendChild(im); prev.appendChild(li);
    });
  });

  function check(id, errId, msg, test) {
    var el = $('#' + id), box = el.closest('.field'), ok = test(el.value.trim());
    $('#' + errId).textContent = ok ? '' : msg;
    box.classList.toggle('invalid', !ok);
    el.setAttribute('aria-invalid', !ok);
    return ok ? null : el;
  }
  function validate() {
    var bad = [
      check('f-name', 'e-name', 'Please enter your name.', function (v) { return v.length > 1; }),
      check('f-phone', 'e-phone', 'Please enter a phone number we can reach.', function (v) { return v.replace(/\D/g, '').length >= 10; }),
      check('f-email', 'e-email', 'That email doesn’t look right.', function (v) { return !v || /^\S+@\S+\.\S+$/.test(v); }),
      check('f-addr', 'e-addr', 'Please enter your address or ZIP.', function (v) { return v.length > 2; }),
      check('f-what', 'e-what', 'Tell us what needs to be removed.', function (v) { return v.length > 2; })
    ].filter(Boolean);
    var pe = photoError(); $('#e-photos').textContent = pe;
    if (pe) bad.push(fileIn);
    return bad;
  }

  function setBusy(b) {
    var btn = $('button[type=submit]', form), l = $('.btn-label', btn);
    btn.disabled = b;
    l.textContent = b ? 'Sending…' : 'Get My Free Quote';
    var sp = $('.spin', btn);
    if (b && !sp) { sp = d.createElement('span'); sp.className = 'spin'; sp.setAttribute('aria-hidden', 'true'); btn.insertBefore(sp, l); }
    if (!b && sp) sp.remove();
  }
  function say(msg, ok) { status.textContent = msg; status.className = 'status full ' + (ok ? 'ok' : 'bad'); }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    status.textContent = ''; status.className = 'status full';
    var bad = validate();
    if (bad.length) { bad[0].focus(); return; }
    if (!S.formEndpoint) {
      say('The online form isn’t connected yet. Please call or text us your photos instead.', false);
      return;
    }
    setBusy(true);
    fetch(S.formEndpoint, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        form.reset(); prev.innerHTML = '';
        say('Thanks! We got your request and will text or call you with your free quote soon.', true);
      })
      .catch(function () { say('Something went wrong sending your request. Please call or text us instead.', false); })
      .then(function () { setBusy(false); });
  });
})();
