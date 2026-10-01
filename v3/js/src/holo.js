// v3 — one holographic biohazard emblem that drifts with the story. Between sections its three blades
// part, twist and lock back together, scrubbed by the scroll.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

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

  const resize = () => {
    renderer.setPixelRatio(dpr); renderer.setSize(innerWidth, innerHeight, false);
    camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; });

  // scroll choreography — each [data-holo] section declares a pose, a particle formation and whether the solid emblem shows.
  // The scroll position becomes one continuous number u (mark index + fraction) that we follow smoothly,
  // so poses AND formations are scrubbed by the scroll, never triggered.
  const parse = el => {
    const [x, y, s, r, h] = el.dataset.holo.split(' ').map(Number);
    return { el, x, y, s, r, h: h || 0 };
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
  let last = 0, ready = false, ft = 0, fn = 0;
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
    const P = {}; for (const q of ['x', 'y', 's', 'r', 'h']) P[q] = lerp(a[q], b[q], fe);

    const mob = isMobile(), base = mob ? 0.64 : 1.12;
    rig.position.set(P.x * halfW() * (mob ? 0.3 : 0.62), -P.y * halfH() * 0.62 + Math.sin(t * 0.8) * 0.05, 0);
    rig.scale.setScalar(base * P.s * (0.55 + 0.45 * ie));
    emblem.rotation.set(mouse.y * 0.25 + Math.sin(t * 0.5) * 0.08, mouse.x * 0.35 + P.r + t * 0.12, t * 0.05);

    // blades fly in on load; between two sections they part, twist and lock back (scrubbed by the scroll)
    const sp = ia === ib ? 0 : Math.sin(Math.PI * f);
    emblem.userData.blades.forEach((bl, i) => {
      const ang = deg(i * 120 + 90), out = (1 - ie) * 2.6 + sp * 0.32;
      bl.m.position.set(Math.cos(ang) * out, Math.sin(ang) * out, (1 - ie) * 1.5 + sp * 0.12 * (i - 1));
      bl.m.rotation.set(sp * 0.35 * (i % 2 ? 1 : -1), sp * 0.5, (1 - ie) * (i + 1) * 1.2 + sp * 0.4);
    });
    emblem.userData.ring.scale.setScalar(ie * (1 - sp * 0.25));
    emblem.userData.core.scale.setScalar(ie * (1 + sp * 0.6));
    skin.uniforms.uT.value = t; skin.uniforms.uA.value = ie;
    holo.iridescenceThicknessRange = [360 + P.h * 40, 560 + P.h * 80];
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
