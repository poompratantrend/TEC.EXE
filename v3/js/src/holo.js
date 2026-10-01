// v3 — one holographic biohazard emblem + a particle field that re-forms itself as the story scrolls:
// the solid emblem dissolves into a dot-matrix trefoil → collection truck → standards shield → photo wave → map pin.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { MeshSurfaceSampler } from 'three/addons/math/MeshSurfaceSampler.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const lerp = (a, b, t) => a + (b - a) * t;
const clamp01 = t => t < 0 ? 0 : t > 1 ? 1 : t;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const smooth = t => t * t * (3 - 2 * t);
const isMobile = () => innerWidth < 900;

const deg = d => d * Math.PI / 180;

/* ---------- geometry: biohazard trefoil built from real circle intersections ---------- */
function crescentShape() {
  // outer circle (0,d1,r1) minus cutting circle (0,d2,r2); opening points outward (+y)
  const d1 = 0.45, r1 = 0.5, d2 = 0.6, r2 = 0.37, D = d2 - d1;
  const y = (r1 * r1 - r2 * r2) / (2 * D) + (d1 + d2) / 2, x = Math.sqrt(r1 * r1 - (y - d1) ** 2);
  const aO1 = Math.atan2(y - d1, x), aO2 = Math.atan2(y - d1, -x);
  const aI1 = Math.atan2(y - d2, -x), aI2 = Math.atan2(y - d2, x);
  const s = new THREE.Shape();
  s.moveTo(x, y);
  s.absarc(0, d1, r1, aO1, aO2 - Math.PI * 2, true);
  s.absarc(0, d2, r2, aI1, aI2 + Math.PI * 2, false);
  return s;
}
const EXT = { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 6, curveSegments: 64 };
const bladeGeo = () => { const g = new THREE.ExtrudeGeometry(crescentShape(), EXT); g.translate(0, 0, -0.08); return g; };
const ringGeo = () => new THREE.TorusGeometry(0.31, 0.045, 32, 128);

// hologram skin: green fresnel rim + fine scanlines + a slow sweeping band
function holoSkin() {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uA: { value: 1 } },
    vertexShader: `varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ vec4 mv = modelViewMatrix * vec4(position,1.); vN = normalize(normalMatrix*normal); vV = normalize(-mv.xyz);
        vY = (modelMatrix*vec4(position,1.)).y; gl_Position = projectionMatrix*mv; }`,
    fragmentShader: `uniform float uT; uniform float uA; varying vec3 vN; varying vec3 vV; varying float vY;
      void main(){ float f = pow(1. - abs(dot(normalize(vN), normalize(vV))), 2.2);
        float scan = .5 + .5*sin(vY*160. - uT*5.);
        float band = smoothstep(.09, 0., abs(fract(vY*.45 - uT*.22) - .5));
        vec3 c = mix(vec3(.09,.64,.29), vec3(.75,.95,.4), f);
        float a = (f*.8 + scan*.05 + band*.32) * uA;
        gl_FragColor = vec4(c, a); }`
  });
}

function makeTrefoil(material, skin) {
  const g = new THREE.Group();
  const parts = [];
  const blades = [0, 1, 2].map(i => {
    const geo = bladeGeo();
    const m = new THREE.Mesh(geo, material), h = new THREE.Mesh(geo, skin);
    const pivot = new THREE.Group(); pivot.rotation.z = deg(i * 120); pivot.add(m); m.add(h); g.add(pivot);
    parts.push(pivot);
    return { pivot, m };
  });
  const rg = ringGeo();
  const ring = new THREE.Mesh(rg, material); ring.add(new THREE.Mesh(rg, skin)); g.add(ring);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 48, 24), material); g.add(core);
  parts.push(ring, core);
  g.userData = { blades, ring, core, parts };
  return g;
}

/* ---------- particle formations (all centred, roughly radius 1–1.3) ---------- */
const rnd = (a = 1) => (Math.random() * 2 - 1) * a;
function sampleGeo(geo, N) {
  const mesh = new THREE.Mesh(geo, new THREE.MeshBasicMaterial());
  const s = new MeshSurfaceSampler(mesh).build(), p = new THREE.Vector3(), out = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { s.sample(p); out.set([p.x, p.y, p.z], i * 3); }
  return out;
}
const flat = list => mergeGeometries(list.map(g => (g.index ? g.toNonIndexed() : g)).map(g => {
  for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
  return g;
}));
const SHAPES = {
  trefoil(N) {
    const gs = [0, 1, 2].map(i => bladeGeo().rotateZ(deg(i * 120)));
    return sampleGeo(flat([...gs, ringGeo()]), N);
  },
  truck(N) {
    const box = (w, h, d, x, y, z = 0) => new THREE.BoxGeometry(w, h, d, 6, 4, 4).translate(x, y, z);
    const wheel = (x, z) => new THREE.CylinderGeometry(0.19, 0.19, 0.1, 28).rotateX(Math.PI / 2).translate(x, -0.42, z);
    const parts = [box(1.45, 0.86, 0.82, -0.32, 0.12), box(0.56, 0.58, 0.8, 0.72, -0.02), box(0.5, 0.06, 0.78, 0.74, 0.3),
      box(2.1, 0.08, 0.7, 0.04, -0.33)];
    [-0.75, -0.2, 0.72].forEach(x => [0.42, -0.42].forEach(z => parts.push(wheel(x, z))));
    const o = sampleGeo(flat(parts), N);
    for (let i = 0; i < o.length; i++) o[i] *= 1.15;
    return o;
  },
  shield(N) {
    const S = k => {
      const s = new THREE.Shape();
      s.moveTo(0, 1.05 * k); s.quadraticCurveTo(0.55 * k, 0.95 * k, 0.88 * k, 0.78 * k);
      s.lineTo(0.84 * k, -0.05 * k); s.quadraticCurveTo(0.75 * k, -0.7 * k, 0, -1.08 * k);
      s.quadraticCurveTo(-0.75 * k, -0.7 * k, -0.84 * k, -0.05 * k); s.lineTo(-0.88 * k, 0.78 * k);
      s.quadraticCurveTo(-0.55 * k, 0.95 * k, 0, 1.05 * k);
      return s;
    };
    const rim = S(1); rim.holes.push(new THREE.Path(S(0.82).getPoints(64).reverse()));
    const tick = new THREE.Shape();
    [[-0.42, 0.02], [-0.14, -0.28], [0.44, 0.34], [0.32, 0.46], [-0.14, -0.02], [-0.3, 0.14]].forEach(([x, y], i) => i ? tick.lineTo(x, y) : tick.moveTo(x, y));
    const e = { depth: 0.2, bevelEnabled: false, curveSegments: 40 };
    const na = Math.floor(N * 0.62);
    const a = sampleGeo(flat([new THREE.ExtrudeGeometry(rim, e).translate(0, 0, -0.1)]), na);
    const b = sampleGeo(flat([new THREE.ExtrudeGeometry(tick, e).translate(0, 0, -0.05)]), N - na);
    const o = new Float32Array(N * 3); o.set(a); o.set(b, a.length);
    for (let i = 0; i < o.length; i++) o[i] *= 1.1;
    return o;
  },
  wave(N) {                                    // a rolling sheet of light behind the photos
    const o = new Float32Array(N * 3), c = Math.cos(1.05), s = Math.sin(1.05);
    for (let i = 0; i < N; i++) {
      const x = rnd(2.6), z = rnd(1.4), y = Math.sin(x * 2.1) * 0.2 + Math.cos(z * 3.2 + x) * 0.12;
      o.set([x, y * c - z * s, y * s + z * c], i * 3);
    }
    return o;
  },
  pin(N) {                                     // service area: a map pin
    const p = new THREE.Shape();
    p.moveTo(0, -1.15);
    p.bezierCurveTo(-0.25, -0.62, -0.78, -0.18, -0.78, 0.3);
    p.bezierCurveTo(-0.78, 0.78, -0.42, 1.1, 0, 1.1);
    p.bezierCurveTo(0.42, 1.1, 0.78, 0.78, 0.78, 0.3);
    p.bezierCurveTo(0.78, -0.18, 0.25, -0.62, 0, -1.15);
    p.holes.push(new THREE.Path().absarc(0, 0.32, 0.3, 0, Math.PI * 2, true));
    const o = sampleGeo(flat([new THREE.ExtrudeGeometry(p, { depth: 0.24, bevelEnabled: false, curveSegments: 48 }).translate(0, 0, -0.12)]), N);
    return o;
  }
};

/* ---------- stage ---------- */
export function startHolo(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  let dpr = Math.min(devicePixelRatio, 2);
  renderer.setPixelRatio(dpr);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.02).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // pearl-green foil: iridescent clear-coat that shifts colour with viewing angle
  const holo = new THREE.MeshPhysicalMaterial({
    color: 0xc8f5d8, emissive: 0x0e5a30, emissiveIntensity: 0.18, metalness: 0.15, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.75, iridescenceIOR: 1.6, iridescenceThicknessRange: [360, 560], sheen: 0.8, sheenColor: 0x9dffc4, envMapIntensity: 1.35
  });
  const skin = holoSkin();
  const emblem = makeTrefoil(holo, skin);
  const rig = new THREE.Group(); rig.add(emblem); scene.add(rig);

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8f5e3, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 4, 5); scene.add(key);
  const tintA = new THREE.PointLight(0x22c55e, 9, 12); tintA.position.set(-3, 1.5, 2.5); scene.add(tintA);
  const tintB = new THREE.PointLight(0xa3e635, 7, 12); tintB.position.set(3, -1.5, 2.5); scene.add(tintB);

  /* particles */
  const N = isMobile() ? 9000 : 15000;
  const shapes = Object.fromEntries(Object.keys(SHAPES).map(n => [n, SHAPES[n](N)]));
  const jit = new Float32Array(N * 3), delay = new Float32Array(N), seed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    jit.set([rnd(0.45), rnd(0.45), rnd(0.45)], i * 3);
    delay[i] = Math.random(); seed[i] = Math.random();
  }
  const pos = new Float32Array(N * 3); pos.set(shapes.trefoil);
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('seed', new THREE.BufferAttribute(seed, 1));
  pg.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 20);
  const pm = new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uT: { value: 0 }, uPx: { value: dpr }, uSize: { value: 11 }, uLightA: { value: 0.75 }, uFade: { value: 0 } },
    vertexShader: `attribute float seed; uniform float uT; uniform float uPx; uniform float uSize; varying float vS;
      void main(){ vec3 p = position;
        p += .008 * vec3(sin(uT*1.3 + seed*40.), cos(uT*1.1 + seed*31.), sin(uT*.9 + seed*23.));
        vec4 mv = modelViewMatrix * vec4(p,1.); vS = seed;
        gl_PointSize = uSize * uPx * (.8 + seed*.4) / -mv.z;
        gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `uniform float uLightA; uniform float uFade; uniform float uPx; varying float vS;
      void main(){ vec2 c = gl_PointCoord - .5; float d = length(c); if (d > .5) discard;
        float dot = smoothstep(.5, .32, d);
        float scan = .78 + .22 * step(.5, fract(gl_FragCoord.y / (3. * uPx)));
        vec3 col = mix(vec3(.05,.5,.25), vec3(.4,.75,.12), vS);
        gl_FragColor = vec4(col, uLightA * dot * scan * uFade); }`
  });
  const points = new THREE.Points(pg, pm);
  points.frustumCulled = false;
  emblem.add(points);

  const resize = () => {
    renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
    pm.uniforms.uPx.value = dpr;
  };
  addEventListener('resize', resize); resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; });

  // scroll choreography — each [data-holo] section declares a pose, a particle formation and whether the solid emblem shows.
  // The scroll position becomes one continuous number u (mark index + fraction) that we follow smoothly,
  // so poses AND formations are scrubbed by the scroll, never triggered.
  const parse = el => {
    const [x, y, s, r, h] = el.dataset.holo.split(' ').map(Number);
    const shape = el.dataset.shape || 'trefoil';
    // formations that must stay readable (truck, shield, wave) hold a 3/4 view instead of spinning
    return { el, x, y, s, r, h: h || 0, shape, e: el.dataset.emblem === '0' ? 0 : 1, w: ['truck', 'shield', 'wave'].includes(shape) ? 0 : 1 };
  };
  let M = [...document.querySelectorAll('[data-holo]')].map(parse);
  addEventListener('resize', () => { M = [...document.querySelectorAll('[data-holo]')].map(parse); });
  const targetU = () => {
    const mid = innerHeight * 0.5;
    const cs = M.map(m => { const r = m.el.getBoundingClientRect(); return r.top + r.height * 0.5; });
    let i = 0; while (i < M.length - 1 && cs[i + 1] <= mid) i++;
    if (i >= M.length - 1 || cs[i] >= mid) return i;
    return i + clamp01((mid - cs[i]) / (cs[i + 1] - cs[i]));
  };
  let u = targetU();

  // intro: nothing assembles until the curtain lifts
  let t0 = null;
  addEventListener('intro-done', () => { t0 = performance.now(); });
  setTimeout(() => { if (t0 === null) t0 = performance.now(); }, 6000);

  const halfH = () => Math.tan(deg(camera.fov / 2)) * camera.position.z, halfW = () => halfH() * camera.aspect;
  let last = 0, ready = false, lastKey = '', ft = 0, fn = 0, spin = 0;
  window.__holo = { get u() { return u; } };

  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    if (document.hidden) return;
    const t = now / 1000;
    const intro = t0 === null ? 0 : clamp01((now - t0) / 2200), ie = ease(intro);

    // follow the scroll
    const k = 1 - Math.exp(-dt * 3.4);
    u += (targetU() - u) * k;
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;
    const ia = Math.min(Math.floor(u), M.length - 1), ib = Math.min(ia + 1, M.length - 1), f = u - ia, a = M[ia], b = M[ib], fe = ease(f);
    const P = {}; for (const q of ['x', 'y', 's', 'r', 'h', 'e', 'w']) P[q] = lerp(a[q], b[q], fe);

    const mob = isMobile(), base = mob ? 0.64 : 1.12;
    rig.position.set(P.x * halfW() * (mob ? 0.3 : 0.62), -P.y * halfH() * 0.62 + Math.sin(t * 0.8) * 0.05, 0);
    rig.scale.setScalar(base * P.s * (0.55 + 0.45 * ie));
    spin += dt * 0.12 * P.w;
    emblem.rotation.set(mouse.y * 0.25 + Math.sin(t * 0.5) * 0.08, mouse.x * 0.35 + P.r + spin + Math.sin(t * 0.4) * 0.22 * (1 - P.w), t * 0.05 * P.e);

    // solid emblem: blades fly in, then shrink away whenever the particles take over
    const ev = smooth(clamp01(P.e)) * ie;
    emblem.userData.parts.forEach(p => { p.scale.setScalar(Math.max(ev, 0.0001)); p.visible = ev > 0.01; });
    emblem.userData.blades.forEach((bl, i) => {
      const ang = deg(i * 120 + 90);
      bl.m.position.set(Math.cos(ang) * (1 - ie) * 2.6, Math.sin(ang) * (1 - ie) * 2.6, (1 - ie) * 1.5);
      bl.m.rotation.z = (1 - ie) * (i + 1) * 1.2;
    });
    skin.uniforms.uT.value = t; skin.uniforms.uA.value = ev;
    holo.iridescenceThicknessRange = [360 + P.h * 40, 560 + P.h * 80];
    // particles: staggered morph between the two formations, bulging outward mid-flight
    const mk = `${a.shape}|${b.shape}|${f.toFixed(4)}`;
    if (mk !== lastKey) {
      lastKey = mk;
      const A = shapes[a.shape], B = shapes[b.shape], same = a.shape === b.shape;
      for (let i = 0; i < N; i++) {
        const j = i * 3;
        const ti = same ? 0 : smooth(clamp01(f * 1.7 - delay[i] * 0.7)), bul = Math.sin(Math.PI * ti);
        pos[j] = lerp(A[j], B[j], ti) + jit[j] * bul;
        pos[j + 1] = lerp(A[j + 1], B[j + 1], ti) + jit[j + 1] * bul;
        pos[j + 2] = lerp(A[j + 2], B[j + 2], ti) + jit[j + 2] * bul;
      }
      pg.attributes.position.needsUpdate = true;
    }
    pm.uniforms.uT.value = t;
    // dots only show while the solid emblem is away, so the hand-over reads as the emblem dissolving into them
    pm.uniforms.uFade.value = ie * (1 - ev);
    points.visible = ev < 0.99;
    pm.uniforms.uLightA.value = mob ? 0.55 : 0.75;
    pm.uniforms.uSize.value = mob ? 10 : 11;
    tintA.position.x = -3 + Math.sin(t * 0.6) * 1.2; tintB.position.y = -1.5 + Math.cos(t * 0.5);

    renderer.render(scene, camera);
    if (!ready) { ready = true; canvas.classList.add('ready'); dispatchEvent(new Event('holo-ready')); }

    // hold 60fps: if frames run long, lower the resolution a notch (never below 1x)
    ft += dt; fn++;
    if (fn === 90) { if (ft / fn > 0.021 && dpr > 1) { dpr = Math.max(1, dpr - 0.25); resize(); } ft = 0; fn = 0; }
  });
  return true;
}

startHolo(document.getElementById('holo')) || document.documentElement.classList.add('no-webgl');
