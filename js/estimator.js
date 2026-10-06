/* Build Your Load: estimator core (state, pricing, UI). The 3D scene lives in estimator-3d.js
   and is loaded lazily with three.js only when this section nears the viewport. */
(function () {
  var S = window.SITE || {}, E = S.estimator, d = document;
  var root = d.getElementById('est');
  if (!E || !root) return;

  var $ = function (s, c) { return (c || d).querySelector(s); };
  var T = E.trailer, FULL = T.fullCuFt;
  var X = window.t || function (k, v, f) { return f != null ? f : k; };   /* translate */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var digits = (S.phoneDigits || '').replace(/\D/g, '');
  var THREE_URL = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  var defs = {};
  E.items.forEach(function (it) { defs[it.id] = it; });
  var state = { items: [], uid: 0, celebrated: false, token: 0 };
  var view = null;
  var els = {
    picker: $('#est-picker'), tier: $('#est-tier'), meter: $('#est-meter'), fill: $('#est-fill'),
    meter2: $('#est-meter2'), fill2: $('#est-fill2'), over: $('#est-over'), price: $('#est-price'),
    live: $('#est-live'), summary: $('#est-summary'), text: $('#est-text'), call: $('#est-call'),
    toast: $('#est-toast'), scale: root.querySelectorAll('.meter-scale span'),
    surprise: $('#est-surprise'), clear: $('#est-clear'), sound: $('#est-sound'), stage: $('#est-stage'),
    loading: $('#est-loading')
  };

  /* ---------- translated names ---------- */
  function lbl(it) { return X('item_' + it.id + '_label', null, it.label); }
  function nm(it, n) { return n === 1 ? X('item_' + it.id + '_name', null, it.name) : X('item_' + it.id + '_plural', null, it.plural); }
  function tierLabel(tier) { return X('tier_' + tier.key, null, tier.label); }

  /* ---------- pricing ---------- */
  function range(key) { var p = S.prices[key]; return [p[0], p[1]]; }
  function tierFor(vol, units) {
    if (units === 1) return E.tiers[0];
    for (var i = 1; i < E.tiers.length; i++) if (vol <= E.tiers[i].maxCuFt) return E.tiers[i];
    return E.tiers[E.tiers.length - 1];
  }
  function totals() {
    var vol = 0, units = 0, fees = 0;
    state.items.forEach(function (p) { var it = defs[p.id]; vol += it.vol; units += it.units; fees += it.fee || 0; });
    return { vol: vol, units: units, fees: fees };
  }
  function estimate() {
    var t = totals();
    if (!state.items.length) return null;
    var low = 0, high = 0, tier, trips = Math.ceil(t.vol / FULL), over = t.vol > FULL;
    if (!over) {
      tier = tierFor(t.vol, t.units); var r = range(tier.key); low = r[0]; high = r[1];
    } else {
      var fullTrips = Math.floor(t.vol / FULL), rem = t.vol - fullTrips * FULL, rf = range('full');
      low = rf[0] * fullTrips; high = rf[1] * fullTrips;
      if (rem > 0) { var rr = range(tierFor(rem, 2).key); low += rr[0]; high += rr[1]; }
      tier = E.tiers[E.tiers.length - 1];
    }
    return { vol: t.vol, units: t.units, fees: t.fees, tier: tier, trips: trips, over: over, low: low + t.fees, high: high + t.fees };
  }
  function money(n) { return '$' + n; }
  function rangeText(e) { return money(e.low) + ' – ' + money(e.high); }

  function itemsText() {
    var counts = {}, out = [];
    state.items.forEach(function (p) { counts[p.id] = (counts[p.id] || 0) + defs[p.id].units; });
    E.items.forEach(function (it) {
      var n = counts[it.id]; if (n) out.push(n + ' ' + nm(it, n));
    });
    return out.join(', ');
  }

  /* ---------- UI ---------- */
  var disp = { low: 0, high: 0 }, priceRaf = 0;
  function tweenPrice(low, high) {
    cancelAnimationFrame(priceRaf);
    var from = { low: disp.low, high: disp.high }, t0 = performance.now(), dur = reduce ? 0 : 550;
    function step(now) {
      var k = dur ? Math.min((now - t0) / dur, 1) : 1, e = 1 - Math.pow(1 - k, 3);
      disp.low = Math.round(from.low + (low - from.low) * e);
      disp.high = Math.round(from.high + (high - from.high) * e);
      els.price.textContent = money(disp.low) + ' – ' + money(disp.high);
      if (k < 1) priceRaf = requestAnimationFrame(step);
    }
    priceRaf = requestAnimationFrame(step);
  }

  var liveTimer = 0;
  function render() {
    var e = estimate(), tot = totals(), counts = {};
    state.items.forEach(function (p) { counts[p.id] = (counts[p.id] || 0) + 1; });

    var pct = Math.min(tot.vol / FULL, 1) * 100;
    els.fill.style.width = pct + '%';
    els.meter.setAttribute('aria-valuenow', Math.round(pct));
    els.meter.setAttribute('aria-valuetext', e ? tierLabel(e.tier) + (e.over ? ', ' + X('est_over_vt') : '') : X('est_tier_empty'));
    els.meter.classList.toggle('full', pct >= 95);
    var over = !!(e && e.over);
    els.meter2.hidden = !over; els.over.hidden = !over;
    if (over) els.fill2.style.width = Math.min((tot.vol - FULL) / FULL, 1) * 100 + '%';
    els.tier.textContent = !e ? X('est_tier_empty') : (over ? X('est_tier_over') : tierLabel(e.tier));
    var active = !e ? -1 : (over ? 4 : (e.tier.key === 'single' ? 0 : E.tiers.indexOf(e.tier)));
    Array.prototype.forEach.call(els.scale, function (s, i) { s.classList.toggle('on', i === active); });

    if (e) tweenPrice(e.low, e.high); else { cancelAnimationFrame(priceRaf); disp.low = disp.high = 0; els.price.textContent = '—'; }

    var list = itemsText();
    els.summary.textContent = !e ? X('est_summary_empty')
      : list + ' · ' + (over ? X('est_trailers', { n: e.trips }) : tierLabel(e.tier)) + (e.fees ? ' · ' + X('est_includes_addons', { n: e.fees }) : '');
    clearTimeout(liveTimer);
    liveTimer = setTimeout(function () {
      els.live.textContent = e ? X('est_live', { low: money(e.low), high: money(e.high) }) + ' ' + (over ? X('est_live_over') : tierLabel(e.tier)) : X('est_live_empty');
    }, 500);

    /* text / call buttons */
    if (digits) {
      var body = e ? X('sms_body', { items: list, tier: over ? X('sms_trailers', { n: e.trips }) : tierLabel(e.tier), range: rangeText(e) })
                   : X('sms_empty');
      els.text.href = 'sms:+' + digits + '?&body=' + encodeURIComponent(body);
      els.call.href = 'tel:+' + digits;
    } else { els.text.removeAttribute('href'); els.call.removeAttribute('href'); }

    /* cards */
    Array.prototype.forEach.call(els.picker.children, function (card) {
      var id = card.getAttribute('data-id'), it = defs[id], n = counts[id] || 0, badge = $('.badge', card);
      badge.hidden = !n; badge.textContent = n * it.units;
      card.classList.toggle('has', !!n);
      $('.item-minus', card).disabled = !n;
      $('.item-add', card).setAttribute('aria-label', n ? X('est_add_aria_n', { label: lbl(it), n: n * it.units }) : X('est_add_aria', { label: lbl(it) }));
    });
    els.clear.disabled = !state.items.length;

    if (view) view.setFill(tot.vol);
    if (tot.vol >= E.celebrateAtCuFt) {
      if (!state.celebrated) { state.celebrated = true; toast(X('toast_full'), 4200); if (view) view.confetti(); }
    } else state.celebrated = false;
  }

  var toastTimer = 0;
  function toast(msg, ms) {
    els.toast.textContent = msg; els.toast.classList.add('show');
    clearTimeout(toastTimer); toastTimer = setTimeout(function () { els.toast.classList.remove('show'); }, ms || 2600);
  }

  /* ---------- actions ---------- */
  function canAdd(id) {
    if (state.items.length >= E.maxPlacements || totals().vol + defs[id].vol > FULL * E.maxTrailers) {
      toast(X('toast_cap', { n: E.maxTrailers })); return false;
    }
    return true;
  }
  function add(id, quiet) {
    if (!canAdd(id)) return false;
    var p = { uid: ++state.uid, id: id };
    state.items.push(p);
    if (view) view.add(p, state.items);
    render(); return true;
  }
  function removeUid(uid) {
    for (var i = 0; i < state.items.length; i++) if (state.items[i].uid === uid) {
      state.items.splice(i, 1);
      if (view) view.remove(uid, state.items);
      render(); return;
    }
  }
  function removeOne(id) {
    for (var i = state.items.length - 1; i >= 0; i--) if (state.items[i].id === id) { removeUid(state.items[i].uid); return; }
  }
  function clearAll(fast) {
    state.token++;
    state.items = [];
    if (view) view.clear(fast);
    render();
  }
  var lastPreset = -1;
  function surprise() {
    var n; do { n = Math.floor(Math.random() * E.presets.length); } while (E.presets.length > 1 && n === lastPreset);
    lastPreset = n;
    var pre = E.presets[n], ids = [];
    Object.keys(pre.mix).forEach(function (id) { if (defs[id]) for (var i = 0; i < pre.mix[id]; i++) ids.push(id); });
    var had = state.items.length;
    clearAll(true);
    var token = state.token;
    toast(X('toast_loading', { name: X('preset_' + pre.id, null, pre.name) }), 2400);
    var step = function (i) {
      if (token !== state.token || i >= ids.length) return;
      add(ids[i], true);
      setTimeout(function () { step(i + 1); }, view ? 150 : 0);
    };
    setTimeout(function () { step(0); }, view && had ? 320 : 0);
  }

  /* ---------- picker (rebuilt when the language changes) ---------- */
  function buildPicker() {
    els.picker.innerHTML = '';
    E.items.forEach(function (it) {
      var card = d.createElement('div');
      card.className = 'item'; card.setAttribute('data-id', it.id);
      var feeHint = it.fee ? '+$' + it.fee : '';
      card.innerHTML =
        '<button type="button" class="item-add" aria-label="">' +
          '<span class="badge" hidden>0</span>' +
          '<svg class="ico" aria-hidden="true"><use href="#e-' + it.id + '"/></svg>' +
          '<span class="item-name"></span></button>' +
        '<div class="item-foot"><button type="button" class="item-minus" disabled>−</button>' +
          '<span class="item-fee">' + feeHint + '</span></div>';
      $('.item-name', card).textContent = lbl(it);
      $('.item-minus', card).setAttribute('aria-label', X('est_minus_aria', { name: nm(it, 1) }));
      els.picker.appendChild(card);
    });
  }
  buildPicker();
  els.picker.addEventListener('click', function (e) {
    var card = e.target.closest('.item'); if (!card) return;
    var id = card.getAttribute('data-id');
    if (e.target.closest('.item-minus')) removeOne(id); else if (e.target.closest('.item-add')) add(id);
  });
  els.surprise.addEventListener('click', surprise);
  els.clear.addEventListener('click', function () { clearAll(false); });

  /* sound toggle (off by default; audio is created lazily by the 3D view on first enable) */
  var soundOn = !!E.soundDefault;
  function paintSound() {
    els.sound.setAttribute('aria-pressed', soundOn);
    els.sound.setAttribute('aria-label', X(soundOn ? 'est_sound_aria_on' : 'est_sound_aria_off'));
    $('span', els.sound).textContent = X(soundOn ? 'est_sound_on' : 'est_sound_off');
    $('use', els.sound).setAttribute('href', soundOn ? '#i-sound-on' : '#i-sound-off');
  }
  els.sound.addEventListener('click', function () { soundOn = !soundOn; paintSound(); if (view) view.setSound(soundOn); });
  paintSound();

  /* camera presets */
  root.addEventListener('click', function (e) {
    var b = e.target.closest('[data-view]');
    if (b && view) view.setView(b.getAttribute('data-view'));
  });

  /* ---------- 2D fallback / lazy 3D ---------- */
  function fallback(why) {
    root.classList.add('est-2d'); root.setAttribute('data-mode', '2d');
    if (els.loading) els.loading.hidden = true;
    els.sound.hidden = true;
    view = null;
    if (window.console && why) console.info('[estimator] 2D mode:', why);
  }
  function webglOK() {
    try { var c = d.createElement('canvas'); return !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl'))); }
    catch (e) { return false; }
  }
  function script(src, ok, bad) {
    var s = d.createElement('script'); s.src = src; s.async = true; s.onload = ok; s.onerror = bad; d.head.appendChild(s);
  }
  function start3D() {
    script(THREE_URL, function () {
      script('js/estimator-3d.js', function () {
        var api = null;
        try {
          api = window.HaulEstimator3D({
            canvas: $('#est-canvas'), stage: els.stage, config: E,
            onPick: removeUid
          });
        } catch (err) { api = null; if (window.console) console.info('[estimator] 3D init failed', err); }
        if (!api) { fallback('3D init failed'); return; }
        view = api; root.setAttribute('data-mode', '3d');
        if (els.loading) els.loading.hidden = true;
        view.setSound(soundOn);
        /* replay anything added while loading */
        state.items.forEach(function (p) { view.add(p, state.items, true); });
        view.setFill(totals().vol);
      }, function () { fallback('estimator-3d.js failed to load'); });
    }, function () { fallback('three.js failed to load'); });
  }

  if (reduce) fallback('prefers-reduced-motion');
  else if (!webglOK()) fallback('WebGL unavailable');
  else if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (es[0].isIntersecting) { io.disconnect(); start3D(); }
    }, { rootMargin: '600px 0px' });
    io.observe(root);
  } else start3D();

  /* language switch: rebuild translated labels and re-render the summary, price and links */
  d.addEventListener('langchange', function () { buildPicker(); paintSound(); render(); });

  render();
})();
