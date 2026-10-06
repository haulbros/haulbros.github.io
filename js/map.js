/* Service-area map: Leaflet + OpenStreetMap tiles, loaded lazily when the section nears the viewport.
   Center, radius and cities come from js/config.js (SITE.serviceMap). If Leaflet fails to load, a styled
   city list is shown instead. */
(function () {
  var S = window.SITE || {}, M = S.serviceMap, d = document;
  var wrap = d.getElementById('map-wrap');
  if (!M || !wrap) return;

  var LEAFLET_VERSION = '1.9.4';
  var BASE = 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/' + LEAFLET_VERSION + '/';
  var T = window.t || function (k, v, f) { return f != null ? f : k; };
  var $ = function (id) { return d.getElementById(id); };
  var mapEl = $('svc-map'), loading = $('map-loading'), hint = $('map-hint'), fb = $('map-fallback'), list = $('city-list');
  var digits = (S.phoneDigits || '').replace(/\D/g, '');
  var coarse = !!(window.matchMedia && matchMedia('(pointer: coarse)').matches);
  var reduce = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
  var MI = 1609.344;

  /* great-circle distance in miles */
  function miles(a, b) {
    var R = 3958.8, rad = Math.PI / 180, dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return 2 * R * Math.asin(Math.sqrt(h));
  }
  /* only cities that really fall inside the service circle */
  var cities = M.cities.filter(function (c) { return miles(M.center, c) <= M.radiusMiles; });

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function smsHref(city) {
    return digits ? 'sms:+' + digits + '?&body=' + encodeURIComponent(T('map_popup_sms', { city: city })) : null;
  }
  function popupHtml(c) {
    var href = smsHref(c.name), link = esc(T('map_popup_link'));
    return '<strong>' + esc(T('map_popup_title', { city: c.name })) + '</strong> ' +
      (href ? '<a class="pop-link" href="' + href + '">' + link + '</a>' : link);
  }

  /* ---------- fallback: styled city list ---------- */
  var done = false;
  function fallback(why) {
    if (done) return; done = true;
    if (window.console && why) console.info('[map] fallback list:', why);
    loading.hidden = true; mapEl.hidden = true; hint.hidden = true;
    list.innerHTML = '';
    cities.forEach(function (c) {
      var li = d.createElement('li');
      li.innerHTML = '<svg class="ico" aria-hidden="true"><use href="#i-pin"/></svg>';
      li.appendChild(d.createTextNode(c.name));
      list.appendChild(li);
    });
    fb.hidden = false;
    wrap.classList.add('is-fallback');
  }

  /* ---------- the map ---------- */
  var map = null, markers = [];
  function init() {
    var L = window.L;
    if (!L) return fallback('Leaflet missing');
    var c = M.center;
    map = L.map(mapEl, {
      center: [c.lat, c.lng], zoom: 9, zoomSnap: 0.25, zoomDelta: 0.5,
      scrollWheelZoom: false,                 /* enabled on click, see below */
      dragging: !coarse,                      /* phones: one finger scrolls the page, two fingers move the map */
      tap: false, zoomAnimation: !reduce, fadeAnimation: !reduce, markerZoomAnimation: !reduce
    });
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a> contributors'
    }).addTo(map);

    var circle = L.circle([c.lat, c.lng], {
      radius: M.radiusMiles * MI, color: '#39ff9c', weight: 2, opacity: 0.9,
      fillColor: '#39ff9c', fillOpacity: 0.07, className: 'svc-circle', interactive: false
    }).addTo(map);

    var offsets = { top: [0, -10], bottom: [0, 10], left: [-10, 0], right: [10, 0] };
    cities.forEach(function (city, i) {
      var isCenter = Math.abs(city.lat - c.lat) < 0.02 && Math.abs(city.lng - c.lng) < 0.02;
      var m = L.marker([city.lat, city.lng], {
        icon: L.divIcon({ className: 'svc-pin' + (isCenter ? ' center' : ''), html: '<span></span>', iconSize: [24, 24], iconAnchor: [12, 12] }),
        title: city.name, alt: city.name, keyboard: true, riseOnHover: true
      }).addTo(map);
      var dir = city.dir || 'top';
      m.bindTooltip(city.name, { permanent: true, direction: dir, offset: offsets[dir], className: 'svc-label' + (city.major ? '' : ' minor'), opacity: 1 });
      m.bindPopup(function () { return popupHtml(city); }, { className: 'svc-popup', autoPanPadding: [16, 16], maxWidth: 240 });
      m._city = city; markers.push(m);
    });

    /* show the whole circle, and keep it fitted until the visitor moves the map */
    var touched = false;
    function fit() { map.invalidateSize(false); mapEl.classList.toggle('map-compact', mapEl.clientWidth < 640); map.fitBounds(circle.getBounds(), { padding: [6, 6], animate: false }); map.setMinZoom(map.getZoom() - 1.5); }
    fit();
    mapEl.addEventListener('pointerdown', function () { touched = true; });
    mapEl.addEventListener('wheel', function () { touched = true; }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(function () { mapEl.classList.toggle('map-compact', mapEl.clientWidth < 640); if (touched) map.invalidateSize(false); else fit(); }).observe(mapEl);
    else window.addEventListener('resize', function () { if (!touched) fit(); });

    /* desktop: wheel zoom only after the map is clicked, so page scrolling is never trapped */
    if (!coarse) {
      map.on('click', function () { map.scrollWheelZoom.enable(); });
      mapEl.addEventListener('mouseleave', function () { map.scrollWheelZoom.disable(); });
    }
    paintHint(); hint.hidden = false;
    paintLeaflet(); map.on('popupopen', paintLeaflet);
    loading.hidden = true; done = true;
  }
  /* Leaflet's built-in control labels follow the page language */
  function paintLeaflet() {
    if (!map) return;
    var c = map.getContainer();
    [['.leaflet-control-zoom-in', 'map_zoom_in'], ['.leaflet-control-zoom-out', 'map_zoom_out'], ['.leaflet-popup-close-button', 'map_close']].forEach(function (p) {
      Array.prototype.forEach.call(c.querySelectorAll(p[0]), function (el) { var v = T(p[1]); el.setAttribute('title', v); el.setAttribute('aria-label', v); });
    });
    var lf = c.querySelector('.leaflet-control-attribution a[href*="leafletjs"]');
    if (lf) lf.setAttribute('title', T('map_leaflet'));
  }
  function paintHint() { hint.textContent = T(coarse ? 'map_hint_touch' : 'map_hint_wheel'); }

  d.addEventListener('langchange', function () {
    if (hint) paintHint();
    paintLeaflet();
    markers.forEach(function (m) { if (m.isPopupOpen()) m.getPopup().setContent(popupHtml(m._city)); });
  });

  /* ---------- lazy loading ---------- */
  function load() {
    var timer = setTimeout(function () { fallback('timeout'); }, 12000), cssOk = false, jsOk = false;
    function ready() { if (cssOk && jsOk && !done) { clearTimeout(timer); try { init(); } catch (e) { fallback(String(e)); } } }
    function bad(w) { clearTimeout(timer); fallback(w); }
    var link = d.createElement('link'); link.rel = 'stylesheet'; link.href = BASE + 'leaflet.min.css';
    link.onload = function () { cssOk = true; ready(); }; link.onerror = function () { bad('leaflet css failed'); };
    d.head.appendChild(link);
    var sc = d.createElement('script'); sc.src = BASE + 'leaflet.min.js'; sc.async = true;
    sc.onload = function () { jsOk = true; ready(); }; sc.onerror = function () { bad('leaflet js failed'); };
    d.head.appendChild(sc);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) { if (es[0].isIntersecting) { io.disconnect(); load(); } }, { rootMargin: '600px 0px' });
    io.observe(wrap);
  } else load();
})();
