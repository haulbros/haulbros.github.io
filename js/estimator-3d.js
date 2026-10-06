/* 3D scene for the "Build Your Load" estimator. Loaded lazily after three.js (r128, global build).
   Everything is procedural (no model files). 1 world unit = 1 foot. */
window.HaulEstimator3D = function (opts) {
  var THREE = window.THREE;
  if (!THREE) return null;
  var canvas = opts.canvas, stage = opts.stage, E = opts.config, T = E.trailer;
  var BW = T.widthFt, BL = T.lengthFt, LH = T.loadHeightFt, FULL = T.fullCuFt;
  var DECK_Y = 1.9;
  var ACC = 0x39ff9c, CY = 0x22d3ee, BG = 0x080c17;
  var defs = {};
  E.items.forEach(function (it) { defs[it.id] = it; });

  var renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, powerPreference: 'high-performance' });
  } catch (err) { return null; }
  if (!renderer.getContext()) return null;
  var pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.setClearColor(BG, 1);

  var scene = new THREE.Scene();
  scene.fog = new THREE.Fog(BG, 40, 95);
  var camera = new THREE.PerspectiveCamera(38, 1.6, 0.5, 220);

  /* ---------- lights ---------- */
  scene.add(new THREE.HemisphereLight(0x8aa4d6, 0x05080f, 0.62));
  var sun = new THREE.DirectionalLight(0xe6eeff, 0.95);
  sun.position.set(-8, 24, 15);
  sun.target.position.set(-4, 0, 0);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  var sc = sun.shadow.camera;
  sc.left = -20; sc.right = 20; sc.top = 16; sc.bottom = -16; sc.near = 5; sc.far = 60;
  sun.shadow.bias = -0.0006;
  scene.add(sun); scene.add(sun.target);
  var glowLight = new THREE.PointLight(ACC, 0.7, 22, 2);
  glowLight.position.set(0, 0.8, 0);
  scene.add(glowLight);

  /* ---------- helpers ---------- */
  var matCache = {};
  function mat(color, o) {
    var key = color + (o ? JSON.stringify(o) : '');
    if (!matCache[key]) matCache[key] = new THREE.MeshLambertMaterial(Object.assign({ color: color }, o || {}));
    return matCache[key];
  }
  var stdCache = {};
  function std(color, rough, metal, extra) {
    var key = color + '|' + rough + '|' + metal + (extra ? JSON.stringify(extra) : '');
    if (!stdCache[key]) stdCache[key] = new THREE.MeshStandardMaterial(Object.assign({ color: color, roughness: rough, metalness: metal }, extra || {}));
    return stdCache[key];
  }
  var basicCache = {};
  function basic(color, o) {
    var key = color + (o ? JSON.stringify(o) : '');
    if (!basicCache[key]) basicCache[key] = new THREE.MeshBasicMaterial(Object.assign({ color: color }, o || {}));
    return basicCache[key];
  }
  var edgeCache = {};
  function edgeMat(color) {
    if (!edgeCache[color]) edgeCache[color] = new THREE.LineBasicMaterial({ color: color, transparent: true, opacity: 0.85 });
    return edgeCache[color];
  }
  function noRay() {}
  /* box with its bottom at y, centered on x/z */
  function box(parent, w, h, d, material, x, y, z, shadow) {
    var m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material);
    m.position.set(x || 0, (y || 0) + h / 2, z || 0);
    if (shadow !== false) m.castShadow = true;
    parent.add(m); return m;
  }
  function outline(mesh, color) {
    var l = new THREE.LineSegments(new THREE.EdgesGeometry(mesh.geometry), edgeMat(color));
    l.raycast = noRay; mesh.add(l); return l;
  }
  function cyl(parent, r, h, material, x, y, z, rotX, rotZ, seg) {
    var m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, seg || 16), material);
    m.position.set(x || 0, y || 0, z || 0);
    if (rotX) m.rotation.x = rotX;
    if (rotZ) m.rotation.z = rotZ;
    m.castShadow = true; parent.add(m); return m;
  }
  var ease = {
    out3: function (k) { return 1 - Math.pow(1 - k, 3); },
    inOut: function (k) { return k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2; }
  };
  var rnd = Math.random;

  /* ---------- floor ---------- */
  var ground = new THREE.Mesh(new THREE.CircleGeometry(80, 48), std(0x060a14, 1, 0));
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; scene.add(ground);
  var grid = new THREE.GridHelper(140, 70, ACC, ACC);
  grid.position.y = 0.02; grid.material.transparent = true; grid.material.opacity = 0.13;
  scene.add(grid);
  (function glowPad() {
    var c = document.createElement('canvas'); c.width = c.height = 128;
    var g = c.getContext('2d'), grd = g.createRadialGradient(64, 64, 4, 64, 64, 64);
    grd.addColorStop(0, 'rgba(57,255,156,0.55)'); grd.addColorStop(0.5, 'rgba(34,211,238,0.14)'); grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
    var tex = new THREE.CanvasTexture(c); tex.encoding = THREE.sRGBEncoding;
    var p = new THREE.Mesh(new THREE.PlaneGeometry(26, 14), new THREE.MeshBasicMaterial({ map: tex, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.38 }));
    p.rotation.x = -Math.PI / 2; p.position.set(0, 0.035, 0); scene.add(p);
  })();

  /* ---------- trailer + pickup ---------- */
  var trailer = new THREE.Group(); scene.add(trailer);
  var pivot = new THREE.Group(); pivot.position.set(BL / 2, DECK_Y, 0); trailer.add(pivot);
  var bed = new THREE.Group(); bed.position.x = -BL / 2; pivot.add(bed);   /* bed local origin = deck top, centered */
  var loadGroups = [new THREE.Group()];
  bed.add(loadGroups[0]);

  var steel = std(0x232d45, 0.5, 0.45), steelDark = std(0x141a2b, 0.6, 0.4);
  (function buildBed() {
    var deck = new THREE.Mesh(new THREE.BoxGeometry(BL, 0.25, BW), std(0x1b2336, 0.7, 0.3));
    deck.position.y = -0.125; deck.receiveShadow = true; deck.castShadow = true; bed.add(deck);
    var rz = BW / 2 - 0.075;
    [-1, 1].forEach(function (s) { box(bed, BL, 0.9, 0.15, steel, 0, 0, s * rz); });
    box(bed, 0.15, 0.9, BW, steel, BL / 2 - 0.075, 0, 0);
    box(bed, 0.15, 1.7, BW, steel, -BL / 2 + 0.075, 0, 0);
    var neon = basic(ACC);
    [-1, 1].forEach(function (s) {
      box(bed, BL, 0.06, 0.2, neon, 0, 0.9, s * rz, false);
      box(bed, BL, 0.05, 0.05, neon, 0, -0.27, s * (BW / 2), false);
    });
    box(bed, 0.2, 0.06, BW, neon, BL / 2 - 0.075, 0.9, 0, false);
    box(bed, 0.2, 0.06, BW, neon, -BL / 2 + 0.075, 1.7, 0, false);
    /* A-frame tongue + coupler */
    [-1, 1].forEach(function (s) {
      var bar = box(bed, 2.6, 0.22, 0.2, steelDark, -BL / 2 - 1.3, -0.62, s * 0.62, false);
      bar.rotation.y = s * -0.42; bar.position.x = -BL / 2 - 1.25;
    });
    box(bed, 0.5, 0.4, 0.5, steelDark, -BL / 2 - 2.55, -0.72, 0, false);
    /* fenders */
    [-1, 1].forEach(function (s) { box(bed, 3.2, 0.1, 1.1, steel, 0.8, 0.4, s * 2.95, false); });
  })();
  (function buildWheels() {
    var tire = std(0x0d1019, 0.9, 0), hub = std(0x9aa7c2, 0.35, 0.7), ring = basic(ACC);
    cyl(trailer, 0.13, BW + 1.2, steelDark, 0.8, 1.05, 0, Math.PI / 2, 0, 10);
    [-1, 1].forEach(function (s) {
      cyl(trailer, 1.05, 0.7, tire, 0.8, 1.05, s * 2.95, Math.PI / 2, 0, 24);
      cyl(trailer, 0.5, 0.74, hub, 0.8, 1.05, s * 2.95, Math.PI / 2, 0, 14);
      var r = new THREE.Mesh(new THREE.TorusGeometry(0.72, 0.035, 6, 28), ring);
      r.position.set(0.8, 1.05, s * 3.32); trailer.add(r);
    });
  })();

  var truck = new THREE.Group(); truck.position.x = -BL / 2 - 2.65; scene.add(truck);
  (function buildTruck() {
    var body = std(0x1a2338, 0.4, 0.55), trim = std(0x0e1424, 0.6, 0.4);
    var glass = std(0x0a1424, 0.15, 0.6, { emissive: 0x06303c, emissiveIntensity: 0.6 });
    var neon = basic(ACC), cy = basic(CY), red = basic(0xff2a4d);
    box(truck, 14.5, 1.7, 5.6, body, -7.25, 1.2, 0);
    [-1, 1].forEach(function (s) {                      /* bed walls */
      box(truck, 5.6, 1.0, 0.25, body, -2.8, 2.9, s * 2.68);
      box(truck, 5.6, 0.05, 0.3, neon, -2.8, 3.9, s * 2.68, false);
      box(truck, 14.4, 0.06, 0.05, neon, -7.25, 2.35, s * 2.82, false);
    });
    box(truck, 0.25, 1.0, 5.6, body, -0.12, 2.9, 0);    /* tailgate */
    [-1, 1].forEach(function (s) { box(truck, 0.1, 0.35, 0.9, red, 0.02, 2.95, s * 2.2, false); });
    box(truck, 0.5, 0.6, 5.8, trim, 0.2, 1.1, 0);       /* bumper */
    box(truck, 5.0, 2.5, 5.5, body, -8.1, 2.9, 0);      /* cab */
    box(truck, 3.5, 1.1, 5.56, glass, -7.9, 3.95, 0, false);
    box(truck, 0.06, 1.0, 3.6, glass, -5.57, 3.95, 0, false);
    box(truck, 3.7, 0.25, 5.3, body, -8.0, 5.4, 0);     /* roof */
    box(truck, 0.1, 1.0, 3.8, glass, -10.62, 3.9, 0, false); /* windshield band */
    box(truck, 3.9, 1.0, 5.5, body, -12.55, 2.9, 0);    /* hood */
    box(truck, 0.12, 0.7, 3.4, trim, -14.52, 2.9, 0, false);  /* grille */
    [-1, 1].forEach(function (s) { box(truck, 0.1, 0.22, 1.1, cy, -14.55, 3.45, s * 2.0, false); });
    box(truck, 0.5, 0.5, 5.7, trim, -14.4, 1.2, 0);     /* front bumper */
    var tire = std(0x0d1019, 0.9, 0), hub = std(0x9aa7c2, 0.35, 0.7);
    [-2.4, -11.6].forEach(function (x) {
      [-1, 1].forEach(function (s) {
        cyl(truck, 1.3, 0.85, tire, x, 1.3, s * 2.7, Math.PI / 2, 0, 24);
        cyl(truck, 0.66, 0.9, hub, x, 1.3, s * 2.7, Math.PI / 2, 0, 14);
        box(truck, 3.0, 0.12, 1.0, trim, x, 2.75, s * 2.85, false);
      });
    });
    var ball = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 8), steelDark);
    ball.position.set(0.28, 1.3, 0); truck.add(ball);
  })();

  /* ghost trailer: outline of the 2nd trip */
  var ghost = new THREE.Group(); ghost.position.x = BL + 2.5; ghost.visible = false; scene.add(ghost);
  var ghostMats = [];
  (function buildGhost() {
    function ln(geo, y) {
      var m = new THREE.LineBasicMaterial({ color: CY, transparent: true, opacity: 0 }); ghostMats.push(m);
      var l = new THREE.LineSegments(new THREE.EdgesGeometry(geo), m); l.position.y = y; ghost.add(l);
    }
    ln(new THREE.BoxGeometry(BL, 0.25, BW), DECK_Y - 0.125);
    ln(new THREE.BoxGeometry(BL, 0.9, BW), DECK_Y + 0.45);
    [-1, 1].forEach(function (s) {
      var m = new THREE.MeshBasicMaterial({ color: CY, transparent: true, opacity: 0, side: THREE.DoubleSide }); ghostMats.push(m);
      var r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 28), m);
      r.position.set(0.8, 1.05, s * 2.95); ghost.add(r);
    });
  })();
  var ghostLoad = new THREE.Group(); ghostLoad.position.y = DECK_Y; ghost.add(ghostLoad);
  loadGroups.push(ghostLoad);

  /* neon fill line (one per bed) */
  function makeFill(parent, y0) {
    var g = new THREE.Group(), neon = basic(ACC, { transparent: true, opacity: 0.95 }), mats = [neon];
    var plane = new THREE.Mesh(new THREE.PlaneGeometry(BL - 0.3, BW - 0.3),
      new THREE.MeshBasicMaterial({ color: ACC, transparent: true, opacity: 0.12, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
    plane.rotation.x = -Math.PI / 2; g.add(plane); mats.push(plane.material);
    var t = 0.07, w = BL - 0.3, d = BW - 0.3;
    [-1, 1].forEach(function (s) {
      var a = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), neon); a.position.z = s * d / 2; g.add(a);
      var b = new THREE.Mesh(new THREE.BoxGeometry(t, t, d), neon); b.position.x = s * w / 2; g.add(b);
    });
    g.visible = false; parent.add(g);
    return { g: g, plane: plane, mats: mats, y: 0, target: 0, y0: y0 };
  }
  var fills = [makeFill(bed, 0), makeFill(ghost, DECK_Y)];

  /* ---------- item models (origin = bottom center; dims in ft: x, y, z) ---------- */
  function sofa(g, w, h, d, c1, c2, c3, edge) {
    var base = box(g, w, h * 0.5, d, c1, 0, 0, 0);
    box(g, w, h * 0.5, d * 0.3, c2, 0, h * 0.5, -d * 0.35);
    [-1, 1].forEach(function (s) { box(g, 0.8, h * 0.36, d, c2, s * (w / 2 - 0.4), h * 0.5, 0); });
    var seats = Math.max(1, Math.round(w / 2.6)), sw = (w - 1.6) / seats;
    for (var i = 0; i < seats; i++) box(g, sw - 0.1, 0.4, d * 0.65, c3, -((w - 1.6) / 2) + sw * (i + 0.5), h * 0.5, d * 0.1);
    outline(base, edge);
    return [w, h, d];
  }
  var builders = {
    couch:    function (g) { return sofa(g, 7, 2.8, 3, mat(0x34456b), mat(0x3d5080), mat(0x4a5f96), CY); },
    loveseat: function (g) { return sofa(g, 5, 2.6, 2.8, mat(0x5a3d6e), mat(0x674680), mat(0x7a559a), CY); },
    recliner: function (g) { return sofa(g, 3, 3, 3, mat(0x4a3b2f), mat(0x57453a), mat(0x6a5546), ACC); },
    mattress: function (g) {
      var m = box(g, 6.6, 0.8, 4.9, mat(0xc9d3ea), 0, 0, 0); box(g, 6.3, 0.05, 4.6, mat(0xe6ecfb), 0, 0.8, 0, false);
      outline(m, ACC); return [6.6, 0.85, 4.9];
    },
    boxspring: function (g) { var m = box(g, 6.6, 0.7, 4.9, mat(0xa58a5e), 0, 0, 0); outline(m, ACC); return [6.6, 0.7, 4.9]; },
    fridge: function (g) {
      var m = box(g, 2.5, 5.7, 2.6, mat(0xdfe6f2), 0, 0, 0);
      box(g, 2.52, 0.07, 2.62, mat(0x6b7690), 0, 3.6, 0, false);
      box(g, 0.1, 1.3, 0.14, mat(0x7f8ba6), -0.9, 3.9, 1.34, false);
      box(g, 0.1, 1.0, 0.14, mat(0x7f8ba6), -0.9, 2.3, 1.34, false);
      outline(m, CY); return [2.5, 5.7, 2.6];
    },
    washer: function (g) {
      var m = box(g, 2.3, 3, 2.3, mat(0xe8edf7), 0, 0, 0);
      box(g, 2.3, 0.4, 0.55, mat(0x2b3550), 0, 2.6, 0.85, false);
      cyl(g, 0.78, 0.12, mat(0x25344f), 0, 1.4, 1.17, Math.PI / 2, 0, 20);
      cyl(g, 0.55, 0.14, mat(0x0c1730, { emissive: 0x0a3a50 }), 0, 1.4, 1.2, Math.PI / 2, 0, 20);
      outline(m, ACC); return [2.3, 3, 2.3];
    },
    dryer: function (g) {
      var m = box(g, 2.3, 3, 2.3, mat(0xcfd6e8), 0, 0, 0);
      box(g, 2.3, 0.4, 0.55, mat(0x2b3550), 0, 2.6, 0.85, false);
      [-0.7, 0, 0.7].forEach(function (x) { cyl(g, 0.11, 0.1, mat(0x9fb0d6), x, 2.8, 1.15, Math.PI / 2, 0, 8); });
      cyl(g, 0.78, 0.12, mat(0x25344f), 0, 1.35, 1.17, Math.PI / 2, 0, 20);
      cyl(g, 0.55, 0.14, mat(0x120c30, { emissive: 0x2a1a60 }), 0, 1.35, 1.2, Math.PI / 2, 0, 20);
      outline(m, CY); return [2.3, 3, 2.3];
    },
    stove: function (g) {
      var m = box(g, 2.5, 3, 2.2, mat(0x98a3b8), 0, 0, 0);
      box(g, 2.5, 0.8, 0.2, mat(0x7c869b), 0, 3, -1.0, false);
      [[-0.6, -0.4], [0.6, -0.4], [-0.6, 0.45], [0.6, 0.45]].forEach(function (p) { cyl(g, 0.32, 0.06, mat(0x10131c), p[0], 3.03, p[1], 0, 0, 14); });
      box(g, 1.7, 1.0, 0.06, mat(0x141a2c, { emissive: 0x0a2a38 }), 0, 0.9, 1.12, false);
      outline(m, ACC); return [2.5, 3.8, 2.2];
    },
    dresser: function (g) {
      var m = box(g, 4, 3, 1.6, mat(0x8a5a3a), 0, 0, 0);
      [0.95, 1.95].forEach(function (y) { box(g, 3.8, 0.05, 0.06, mat(0x3a2415), 0, y, 0.82, false); });
      [0.5, 1.5, 2.5].forEach(function (y) { box(g, 0.5, 0.12, 0.1, mat(0xd8b27a), 0, y, 0.84, false); });
      outline(m, ACC); return [4, 3, 1.6];
    },
    table: function (g) {
      var top = box(g, 5, 0.3, 3, mat(0x9c6b43), 0, 2.3, 0);
      [[-2.3, -1.3], [2.3, -1.3], [-2.3, 1.3], [2.3, 1.3]].forEach(function (p) { box(g, 0.3, 2.3, 0.3, mat(0x7a5233), p[0], 0, p[1]); });
      outline(top, CY); return [5, 2.6, 3];
    },
    tv: function (g) {
      var s = box(g, 3.6, 2.0, 0.16, mat(0x05070d, { emissive: 0x0a2236 }), 0, 0.3, 0);
      box(g, 1.2, 0.3, 0.7, mat(0x1a2030), 0, 0, 0);
      outline(s, CY); return [3.6, 2.3, 0.7];
    },
    grill: function (g) {
      var lid = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), std(0x2a3045, 0.35, 0.5));
      lid.scale.set(1.1, 0.75, 0.85); lid.position.y = 2.1; lid.castShadow = true; g.add(lid);
      var b = box(g, 2.2, 0.6, 1.6, mat(0x20263a), 0, 1.5, 0);
      [[-0.9, -0.6], [0.9, -0.6], [-0.9, 0.6], [0.9, 0.6]].forEach(function (p) { box(g, 0.12, 1.5, 0.12, mat(0x10131c), p[0], 0, p[1], false); });
      box(g, 1.3, 0.1, 0.1, mat(0xd04a3a), 0, 2.6, 0.85, false);
      outline(b, ACC); return [2.2, 2.9, 1.8];
    },
    tires: function (g) {
      var t = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.3, 10, 18), std(0x10131c, 0.9, 0));
      t.rotation.x = Math.PI / 2; t.position.y = 0.3; t.castShadow = true; g.add(t);
      cyl(g, 0.46, 0.34, mat(0x8895b3), 0, 0.3, 0, 0, 0, 12);
      var ring = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.02, 6, 24), basic(ACC));
      ring.rotation.x = Math.PI / 2; ring.position.y = 0.6; g.add(ring);
      return [2.1, 0.6, 2.1];
    },
    boxes: function (g) {
      var cols = [0xb98a52, 0xc79a60, 0xa87c46];
      [-1.4, 0, 1.4].forEach(function (x, i) { var b = box(g, 1.4, 1.2, 1.4, mat(cols[i]), x, 0, 0); box(g, 0.25, 0.02, 1.4, mat(0xe9d7aa), x, 1.2, 0, false); if (i === 1) outline(b, ACC); });
      [-0.7, 0.7].forEach(function (x, i) { box(g, 1.4, 1.2, 1.4, mat(cols[(i + 1) % 3]), x, 1.2, 0); });
      return [4.2, 2.4, 1.4];
    },
    bags: function (g) {
      var bagMat = std(0x151922, 0.3, 0.1);
      function bag(x, y, z, s) {
        var m = new THREE.Mesh(new THREE.SphereGeometry(0.8, 12, 10), bagMat);
        m.scale.set(s, 0.85 * s, s); m.position.set(x, y + 0.68 * s, z); m.castShadow = true; g.add(m);
        var k = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 6), bagMat); k.position.set(x, y + 1.4 * s, z); g.add(k);
      }
      bag(-1.1, 0, 0, 1); bag(0.2, 0, 0.1, 1.05); bag(1.3, 0, -0.1, 0.95); bag(-0.5, 0.9, 0, 0.9); bag(0.7, 0.9, 0.05, 0.9);
      var edge = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.015, 4, 16), basic(CY)); edge.rotation.x = Math.PI / 2; edge.position.set(0.2, 0.05, 0.1); g.add(edge);
      return [3.6, 2.3, 1.8];
    },
    yard: function (g) {
      var m1 = new THREE.Mesh(new THREE.IcosahedronGeometry(1.5, 1), std(0x2f7a4f, 0.9, 0, { flatShading: true }));
      m1.scale.set(1.25, 0.75, 1.1); m1.position.set(-0.3, 0.8, 0); m1.castShadow = true; g.add(m1);
      var m2 = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), std(0x3a9a60, 0.9, 0, { flatShading: true }));
      m2.scale.set(1.1, 0.8, 1); m2.position.set(1.3, 0.55, 0.5); m2.castShadow = true; g.add(m2);
      var wood = mat(0x6b4a2b);
      for (var i = 0; i < 9; i++) {
        var s = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.4, 5), wood);
        s.position.set(-1 + rnd() * 2.4, 1.1 + rnd() * 0.5, -0.8 + rnd() * 1.6);
        s.rotation.set(rnd() * 3, rnd() * 3, rnd() * 3); g.add(s);
      }
      return [4, 2.2, 3.5];
    }
  };
  function buildItem(id) {
    var g = new THREE.Group(), dims = builders[id] ? builders[id](g) : null;
    if (!dims) { var s = Math.max(1, Math.pow(defs[id].vol, 1 / 3)); box(g, s, s, s, mat(0x667799), 0, 0, 0); dims = [s, s, s]; }
    g.userData.dims = dims; return g;
  }

  /* ---------- load state + packing ---------- */
  var CELL = 0.5, NX = Math.round(BL / CELL), NZ = Math.round(BW / CELL);
  var entries = {};            /* uid -> entry */
  var order = [];              /* current placement order (uids) */
  var anims = [];              /* running animation functions */
  var dip = { pos: 0, vel: 0, target: 0 };
  var sound = { on: false, ctx: null };
  var vol = 0;

  function place(hm, dims) {
    var best = null;
    [0, 1].forEach(function (rot) {
      var w = rot ? dims[2] : dims[0], d = rot ? dims[0] : dims[2];
      var cw = Math.ceil(w / CELL - 1e-6), cd = Math.ceil(d / CELL - 1e-6);
      if (cw > NX || cd > NZ) return;
      for (var ix = 0; ix <= NX - cw; ix++) for (var iz = 0; iz <= NZ - cd; iz++) {
        var top = 0;
        for (var a = ix; a < ix + cw; a++) for (var b = iz; b < iz + cd; b++) { var h = hm[a * NZ + b]; if (h > top) top = h; }
        var score = top + ix * 0.01 + Math.abs(iz + cd / 2 - NZ / 2) * 0.004 + (rot ? 0.002 : 0) + (top + dims[1] > LH ? 50 : 0);
        if (!best || score < best.score) best = { score: score, ix: ix, iz: iz, cw: cw, cd: cd, top: top, rot: rot };
      }
    });
    if (!best) best = { ix: 0, iz: 0, cw: 1, cd: 1, top: LH, rot: 0 };
    for (var a = best.ix; a < best.ix + best.cw; a++) for (var b = best.iz; b < best.iz + best.cd; b++) hm[a * NZ + b] = best.top + dims[1];
    return {
      x: -BL / 2 + (best.ix + best.cw / 2) * CELL, y: best.top, z: -BW / 2 + (best.iz + best.cd / 2) * CELL,
      yaw: best.rot ? Math.PI / 2 : 0
    };
  }
  function layout(list) {
    var hms = [], cum = 0;
    order = [];
    list.forEach(function (p) {
      var e = entries[p.uid]; if (!e) return;
      var bi = Math.min(Math.floor(cum / FULL + 1e-6), E.maxTrailers - 1);
      cum += defs[e.id].vol;
      if (!hms[bi]) hms[bi] = new Float32Array(NX * NZ);
      e.bedIndex = bi; e.target = place(hms[bi], e.obj.userData.dims);
      order.push(p.uid);
    });
  }

  /* ---------- animation runner ---------- */
  function runAnim(fn) { anims.push(fn); }
  function stepAnims(dt) {
    for (var i = anims.length - 1; i >= 0; i--) if (anims[i](dt)) anims.splice(i, 1);
  }
  function disposeObj(o) {
    if (o.parent) o.parent.remove(o);
    o.traverse(function (n) { if (n.geometry) n.geometry.dispose(); });
  }

  function startDrop(e, instant) {
    var o = e.obj, H = 7 + rnd() * 2.5, rot0 = (rnd() - 0.5) * 1.4;
    loadGroups[e.bedIndex].add(o);
    if (instant) { o.position.set(e.target.x, e.target.y, e.target.z); o.rotation.y = e.target.yaw; e.settled = true; return; }
    var Tfall = Math.sqrt(2 * H / 55), t = 0, phase = 0;
    o.position.set(e.target.x, e.target.y + H, e.target.z);
    e.settled = false;
    runAnim(function (dt) {
      if (e.dead) return true;
      var tg = e.target; t += dt;
      if (phase === 0) {
        var k = Math.min(t / Tfall, 1);
        o.position.set(tg.x, tg.y + H * (1 - k * k), tg.z);
        o.rotation.y = tg.yaw + (1 - k) * rot0;
        o.scale.set(0.95, 1.08, 0.95);
        if (k >= 1) {
          phase = 1; t = 0; thud(defs[e.id].vol);
          dip.vel += Math.min(2.4, 0.5 + defs[e.id].vol / 28);
        }
      } else {
        var s = Math.exp(-7 * t) * Math.cos(21 * t);
        o.position.set(tg.x, tg.y, tg.z); o.rotation.y = tg.yaw;
        o.scale.set(1 + 0.17 * s, 1 - 0.3 * s, 1 + 0.17 * s);
        if (t > 0.75) { o.scale.set(1, 1, 1); e.settled = true; return true; }
      }
      return false;
    });
  }
  function startMove(e) {
    var o = e.obj, from = { x: o.position.x, y: o.position.y, z: o.position.z, yaw: o.rotation.y }, t = 0, dur = 0.38;
    if (o.parent !== loadGroups[e.bedIndex]) { loadGroups[e.bedIndex].add(o); o.position.set(e.target.x, e.target.y, e.target.z); o.rotation.y = e.target.yaw; return; }
    e.moving = (e.moving || 0) + 1; var mine = e.moving;
    runAnim(function (dt) {
      if (e.dead || e.moving !== mine) return true;
      t += dt; var k = ease.inOut(Math.min(t / dur, 1)), tg = e.target;
      o.position.set(from.x + (tg.x - from.x) * k, from.y + (tg.y - from.y) * k, from.z + (tg.z - from.z) * k);
      o.rotation.y = from.yaw + (tg.yaw - from.yaw) * k;
      return t >= dur;
    });
  }
  function popOut(e, delay) {
    var o = e.obj, t = -(delay || 0), x0 = o.position.x, y0 = o.position.y;
    pop();
    runAnim(function (dt) {
      t += dt; if (t < 0) return false;
      var k = Math.min(t / 0.3, 1), s = k < 0.25 ? 1 + k * 0.9 : 1.22 * (1 - ease.out3((k - 0.25) / 0.75));
      o.scale.set(s, s, s); o.position.y = y0 + k * 1.6; o.rotation.y += dt * 9;
      if (k >= 1) { disposeObj(o); return true; }
      return false;
    });
  }

  /* ---------- public actions ---------- */
  function add(p, list, instant) {
    var o = buildItem(p.id), e = { uid: p.uid, id: p.id, obj: o, bedIndex: 0, target: null, settled: false };
    o.userData.uid = p.uid; entries[p.uid] = e;
    layout(list);
    startDrop(e, instant);
    /* earlier items never move on add (placement depends only on earlier items) */
  }
  function remove(uid, list) {
    var e = entries[uid]; if (!e) return;
    delete entries[uid]; e.dead = true;
    popOut(e, 0);
    layout(list);
    Object.keys(entries).forEach(function (k) {
      var q = entries[k], o = q.obj, tg = q.target;
      if (!q.settled) return;                      /* still dropping: it already follows e.target */
      if (o.parent !== loadGroups[q.bedIndex] || Math.abs(o.position.x - tg.x) + Math.abs(o.position.y - tg.y) + Math.abs(o.position.z - tg.z) > 0.01) startMove(q);
    });
  }
  var tip = { angle: 0, busy: false };
  function clear(fast) {
    var list = Object.keys(entries).map(function (k) { return entries[k]; });
    entries = {}; order = [];
    if (!list.length) return;
    list.forEach(function (e) { e.dead = true; e.moving = (e.moving || 0) + 1; });
    if (fast) { list.forEach(function (e, i) { popOut(e, i * 0.025); }); return; }
    if (tip.busy) { list.forEach(function (e, i) { popOut(e, i * 0.02); }); return; }
    tip.busy = true;
    var t = 0, maxDelay = 0;
    list.forEach(function (e) {
      var o = e.obj;
      if (e.bedIndex > 0) { popOut(e, 0.1 + Math.random() * 0.3); return; }
      var delay = (BL / 2 - o.position.x) / BL * 0.5 + rnd() * 0.12, tt = -delay, vx = 0, x0 = o.position.x, y0 = o.position.y, sx = rnd() - 0.5;
      maxDelay = Math.max(maxDelay, delay);
      runAnim(function (dt) {
        tt += dt; if (tt < 0) return false;
        vx += 24 * dt * Math.min(1, Math.abs(tip.angle) / 0.3 + 0.1);
        o.position.x += vx * dt;
        var out = o.position.x - BL / 2;
        if (out > 0) { o.position.y = Math.max(y0 - out * 1.4, -DECK_Y + 0.2); o.rotation.z -= dt * (1.5 + sx); o.rotation.x += dt * sx * 2; }
        if (out > 2.5) { disposeObj(o); return true; }
        return false;
      });
    });
    thudSlide();
    var phase = 0, ta = 0;
    runAnim(function (dt) {
      ta += dt;
      if (phase === 0) {                           /* tilt up */
        var k = Math.min(ta / 0.6, 1); tip.angle = -0.36 * ease.inOut(k);
        if (k >= 1) { phase = 1; ta = 0; }
      } else if (phase === 1) {                    /* hold while items slide out */
        if (ta > 0.7 + maxDelay) { phase = 2; ta = 0; }
      } else {                                     /* settle back */
        var k2 = Math.min(ta / 0.6, 1); tip.angle = -0.36 * (1 - ease.inOut(k2));
        if (k2 >= 1) { tip.angle = 0; tip.busy = false; pivot.rotation.z = 0; return true; }
      }
      pivot.rotation.z = tip.angle;
      return false;
    });
  }
  function setFill(v) {
    vol = v;
    dip.target = Math.min(v / FULL, 1.3) * 0.17;
    for (var i = 0; i < 2; i++) {
      var f = Math.max(0, Math.min((v - i * FULL) / FULL, 1));
      fills[i].target = f > 0 ? f * LH + 0.04 : 0;
      fills[i].frac = f;
    }
    ghostGoal = v > FULL ? 1 : 0;
    camGoal.over = v > FULL ? 1 : 0;
    nudge();
  }

  /* confetti */
  var confetti = [], cMats = [basic(ACC, { side: THREE.DoubleSide }), basic(CY, { side: THREE.DoubleSide }), basic(0xff3df2, { side: THREE.DoubleSide }), basic(0xffe14d, { side: THREE.DoubleSide })];
  var cGeo = new THREE.PlaneGeometry(0.3, 0.18);
  for (var ci = 0; ci < 70; ci++) { var cm = new THREE.Mesh(cGeo, cMats[ci % 4]); cm.visible = false; scene.add(cm); confetti.push({ m: cm, life: 0, v: new THREE.Vector3(), r: new THREE.Vector3() }); }
  function burst() {
    confetti.forEach(function (c) {
      c.life = 1.8 + rnd() * 0.9; c.m.visible = true; c.m.scale.setScalar(1);
      c.m.position.set((rnd() - 0.5) * 6, 3.2 + rnd() * 1.5, (rnd() - 0.5) * 3);
      c.v.set((rnd() - 0.5) * 11, 8 + rnd() * 8, (rnd() - 0.5) * 9);
      c.r.set(rnd() * 12, rnd() * 12, rnd() * 12);
    });
    pop(); nudge();
  }
  function stepConfetti(dt) {
    confetti.forEach(function (c) {
      if (c.life <= 0) return;
      c.life -= dt; c.v.y -= 20 * dt;
      c.m.position.addScaledVector(c.v, dt); c.m.rotation.x += c.r.x * dt; c.m.rotation.y += c.r.y * dt;
      if (c.m.position.y < 0.06) { c.m.position.y = 0.06; c.v.multiplyScalar(0.2); }
      if (c.life < 0.5) c.m.scale.setScalar(Math.max(c.life / 0.5, 0.001));
      if (c.life <= 0) c.m.visible = false;
    });
  }

  /* ---------- sound (off by default; audio context is created on first enable) ---------- */
  function setSound(on) {
    sound.on = !!on;
    if (on && !sound.ctx) {
      try { var AC = window.AudioContext || window.webkitAudioContext; if (AC) sound.ctx = new AC(); } catch (e) { sound.ctx = null; }
    }
    if (on && sound.ctx && sound.ctx.state === 'suspended') sound.ctx.resume();
  }
  function tone(f0, f1, dur, gain, type) {
    var c = sound.ctx; if (!sound.on || !c) return;
    var o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type || 'sine'; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(gain, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(c.destination); o.start(t); o.stop(t + dur + 0.02);
  }
  function thud(v) { tone(150, 48, 0.16, Math.min(0.5, 0.22 + v / 160)); }
  function thudSlide() { tone(110, 40, 0.5, 0.2, 'triangle'); }
  function pop() { tone(520, 980, 0.09, 0.16); }

  /* ---------- camera + controls ---------- */
  var camCur = { theta: 0.78, phi: 1.1, zoom: 1, tx: -4, over: 0 };
  var camGoal = { theta: 0.78, phi: 1.1, zoom: 1, tx: -4, over: 0 };
  var baseR = 27, idle = 0, dragging = false, ghostGoal = 0, ghostA = 0;
  var VIEWS = { side: [0, 1.4], top: [0, 0.07], back: [Math.PI / 2, 1.34], home: [0.78, 1.1] };
  function setView(name) {
    var v = VIEWS[name]; if (!v) return;
    var dt = v[0] - camCur.theta; dt = Math.atan2(Math.sin(dt), Math.cos(dt));
    camGoal.theta = camCur.theta + dt; camGoal.phi = v[1]; camGoal.zoom = 1; idle = -2; nudge();
  }
  function clampGoal() {
    camGoal.phi = Math.max(0.06, Math.min(1.5, camGoal.phi));
    camGoal.zoom = Math.max(0.42, Math.min(1.7, camGoal.zoom));
  }
  function updateCamera(dt, auto) {
    if (auto && !dragging) { idle += dt; if (idle > 3.5 && !tip.busy) { camGoal.theta += dt * 0.11; } }
    var k = Math.min(1, dt * 6);
    camGoal.tx = camGoal.over ? 1.2 : -4;
    camCur.theta += (camGoal.theta - camCur.theta) * k;
    camCur.phi += (camGoal.phi - camCur.phi) * k;
    camCur.zoom += (camGoal.zoom - camCur.zoom) * k;
    camCur.tx += (camGoal.tx - camCur.tx) * Math.min(1, dt * 3);
    camCur.over += (camGoal.over - camCur.over) * Math.min(1, dt * 3);
    var r = baseR * camCur.zoom * (1 + camCur.over * 0.32), sp = Math.sin(camCur.phi);
    camera.position.set(camCur.tx + r * sp * Math.sin(camCur.theta), 1.5 + r * Math.cos(camCur.phi), r * sp * Math.cos(camCur.theta));
    camera.lookAt(camCur.tx, 1.5, 0);
  }

  var pointers = {}, down = null, pinch0 = 0;
  function pcount() { return Object.keys(pointers).length; }
  canvas.addEventListener('pointerdown', function (e) {
    try { canvas.setPointerCapture(e.pointerId); } catch (err) {}
    pointers[e.pointerId] = { x: e.clientX, y: e.clientY };
    idle = 0; dragging = true;
    if (pcount() === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 };
    if (pcount() === 2) { var p = Object.keys(pointers).map(function (k) { return pointers[k]; }); pinch0 = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y); down = null; }
    nudge();
  });
  canvas.addEventListener('pointermove', function (e) {
    var p = pointers[e.pointerId]; if (!p) return;
    var dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY; idle = 0;
    if (pcount() === 1) {
      camGoal.theta -= dx * 0.0075; camGoal.phi -= dy * 0.006; clampGoal();
      camCur.theta = camGoal.theta; camCur.phi = camGoal.phi;
      if (down) down.moved += Math.abs(dx) + Math.abs(dy);
    } else if (pcount() === 2) {
      var q = Object.keys(pointers).map(function (k) { return pointers[k]; }), dist = Math.hypot(q[0].x - q[1].x, q[0].y - q[1].y);
      if (pinch0) { camGoal.zoom /= dist / pinch0; clampGoal(); camCur.zoom = camGoal.zoom; }
      pinch0 = dist;
    }
    nudge();
  });
  function endPointer(e) {
    var had = pointers[e.pointerId]; delete pointers[e.pointerId];
    if (!pcount()) { dragging = false; pinch0 = 0; }
    if (had && down && e.type === 'pointerup' && down.moved < 8 && performance.now() - down.t < 450) pick(e.clientX, e.clientY);
    if (!pcount()) down = null;
  }
  canvas.addEventListener('pointerup', endPointer);
  canvas.addEventListener('pointercancel', endPointer);
  canvas.addEventListener('wheel', function (e) {
    var f = Math.exp(e.deltaY * (e.ctrlKey ? 0.01 : 0.0012)), z = camGoal.zoom * f;
    var cl = Math.max(0.42, Math.min(1.7, z));
    if (cl === camGoal.zoom) return;               /* at the limit: let the page scroll */
    e.preventDefault(); camGoal.zoom = cl; idle = 0; nudge();
  }, { passive: false });
  canvas.addEventListener('keydown', function (e) {
    var used = true;
    if (e.key === 'ArrowLeft') camGoal.theta -= 0.15; else if (e.key === 'ArrowRight') camGoal.theta += 0.15;
    else if (e.key === 'ArrowUp') camGoal.phi -= 0.1; else if (e.key === 'ArrowDown') camGoal.phi += 0.1;
    else if (e.key === '+' || e.key === '=') camGoal.zoom *= 0.9; else if (e.key === '-') camGoal.zoom *= 1.1;
    else used = false;
    if (used) { e.preventDefault(); clampGoal(); idle = 0; nudge(); }
  });

  var ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
  function pick(cx, cy) {
    var r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    var objs = Object.keys(entries).filter(function (k) { return entries[k].settled; }).map(function (k) { return entries[k].obj; });
    var hit = ray.intersectObjects(objs, true)[0];
    if (!hit) return;
    var o = hit.object; while (o && o.userData.uid === undefined) o = o.parent;
    if (o && opts.onPick) opts.onPick(o.userData.uid);
  }

  /* ---------- sizing, visibility, loop ---------- */
  function resize() {
    var w = stage.clientWidth, h = stage.clientHeight; if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
    baseR = 26 * Math.max(1, Math.pow(1.5 / camera.aspect, 0.7));
    nudge();
  }
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(stage); else window.addEventListener('resize', resize);

  var visible = true, tabVisible = !document.hidden, running = false, last = 0, raf = 0, slowFrames = 0, frames = 0, acc = 0, wake = 0;
  function nudge() { wake = 2.5; if (!running) setRun(); }
  function setRun() {
    var should = visible && tabVisible;
    if (should && !running) { running = true; last = performance.now(); raf = requestAnimationFrame(frame); }
    else if (!should && running) { running = false; cancelAnimationFrame(raf); }
  }
  if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; setRun(); }).observe(stage);
  document.addEventListener('visibilitychange', function () { tabVisible = !document.hidden; setRun(); });

  var pulse = 0, c1 = new THREE.Color(ACC), c2 = new THREE.Color(CY), tmp = new THREE.Color();
  function frame(now) {
    raf = requestAnimationFrame(frame);
    var dt = Math.min((now - last) / 1000, 0.05); last = now;
    pulse += dt;
    stepAnims(dt); stepConfetti(dt);
    /* suspension spring */
    dip.vel += (150 * (dip.target - dip.pos) - 12 * dip.vel) * dt; dip.pos += dip.vel * dt;
    pivot.position.y = DECK_Y - dip.pos;
    /* fill lines */
    fills.forEach(function (f, i) {
      f.y += (f.target - f.y) * Math.min(1, dt * 6);
      var show = f.target > 0 || f.y > 0.06;
      f.g.visible = show && (i === 0 || ghostA > 0.05);
      f.g.position.y = f.y0 + f.y + (i === 0 ? 0 : 0);
      var fr = f.frac || 0; tmp.copy(c1).lerp(c2, Math.min(1, fr * 1.2));
      var glow = 0.8 + (fr > 0.94 ? 0.2 * Math.sin(pulse * 8) : 0.08 * Math.sin(pulse * 3));
      f.mats[0].color.copy(tmp).multiplyScalar(glow); f.plane.material.color.copy(tmp);
    });
    glowLight.intensity = 0.65 + 0.12 * Math.sin(pulse * 2);
    /* ghost trailer fade */
    ghostA += (ghostGoal - ghostA) * Math.min(1, dt * 4);
    ghost.visible = ghostA > 0.02 || ghostLoad.children.length > 0;
    ghostMats.forEach(function (m) { m.opacity = 0.7 * ghostA; });
    updateCamera(dt, true);
    renderer.render(scene, camera);
    /* adaptive resolution: drop to 1x if the device struggles */
    acc += dt; frames++;
    if (frames === 40) {
      if (acc / frames > 0.034 && pixelRatio > 1) { pixelRatio = 1; renderer.setPixelRatio(1); resize(); }
      frames = 0; acc = 0;
    }
  }
  resize(); updateCamera(0.016, false); renderer.render(scene, camera);
  running = false; setRun();

  return { add: add, remove: remove, clear: clear, setFill: setFill, confetti: burst, setSound: setSound, setView: setView };
};
