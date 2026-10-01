// v3 — one holographic biohazard emblem that lives behind the whole page and drifts with the story.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

const lerp = (a, b, t) => a + (b - a) * t;
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const isMobile = () => innerWidth < 900;
const deg = d => d * Math.PI / 180;

/* ---------- geometry: biohazard trefoil built from real circle intersections ---------- */
function crescentShape() {
  // outer circle (0,d1,r1) minus cutting circle (0,d2,r2); opening points outward (+y)
  const d1 = 0.45, r1 = 0.5, d2 = 0.6, r2 = 0.37, D = d2 - d1;
  const y = (r1 * r1 - r2 * r2) / (2 * D) + (d1 + d2) / 2, x = Math.sqrt(r1 * r1 - (y - d1) ** 2);
  const aO1 = Math.atan2(y - d1, x), aO2 = Math.atan2(y - d1, -x);         // on the outer circle
  const aI1 = Math.atan2(y - d2, -x), aI2 = Math.atan2(y - d2, x);         // on the cutting circle
  const s = new THREE.Shape();
  s.moveTo(x, y);
  s.absarc(0, d1, r1, aO1, aO2 - Math.PI * 2, true);                       // long way round the bottom
  s.absarc(0, d2, r2, aI1, aI2 + Math.PI * 2, false);                      // back along the inside of the cut
  return s;
}
function makeTrefoil(material) {
  const g = new THREE.Group();
  const ext = { depth: 0.16, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.035, bevelSegments: 6, curveSegments: 64 };
  const blades = [0, 1, 2].map(i => {
    const geo = new THREE.ExtrudeGeometry(crescentShape(), ext); geo.translate(0, 0, -0.08);
    const m = new THREE.Mesh(geo, material);
    const pivot = new THREE.Group(); pivot.rotation.z = deg(i * 120); pivot.add(m); g.add(pivot);
    return { pivot, m };
  });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.31, 0.045, 32, 128), material); g.add(ring);
  const core = new THREE.Mesh(new THREE.SphereGeometry(0.09, 48, 24), material); g.add(core);
  g.userData = { blades, ring, core };
  return g;
}

/* ---------- stage ---------- */
export function startHolo(canvas) {
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (e) { return null; }
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.02).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  // holographic foil: iridescent clear-coated pearl that shifts colour with viewing angle
  const holo = new THREE.MeshPhysicalMaterial({
    color: 0xc8f5d8, emissive: 0x0e5a30, emissiveIntensity: 0.18, metalness: 0.15, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.04,
    iridescence: 0.75, iridescenceIOR: 1.6, iridescenceThicknessRange: [360, 560], sheen: 0.8, sheenColor: 0x9dffc4, envMapIntensity: 1.35
  });
  const emblem = makeTrefoil(holo);
  const rig = new THREE.Group(); rig.add(emblem); scene.add(rig);

  // green glass droplets orbiting the emblem
  const chrome = new THREE.MeshPhysicalMaterial({ color: 0x4ade80, metalness: 0.1, roughness: 0.05, transmission: 0.6, thickness: 0.4, clearcoat: 1, iridescence: 0.5, iridescenceIOR: 1.4, envMapIntensity: 1.4 });
  const drops = Array.from({ length: 7 }, (_, i) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.05 + (i % 3) * 0.025, 32, 16), chrome);
    m.userData = { r: 1.05 + (i % 4) * 0.18, s: 0.25 + i * 0.05, o: i * 0.9, tilt: (i % 2 ? 1 : -1) * (0.3 + i * 0.06) };
    rig.add(m); return m;
  });

  scene.add(new THREE.HemisphereLight(0xffffff, 0xd8f5e3, 0.6));
  const key = new THREE.DirectionalLight(0xffffff, 1.2); key.position.set(3, 4, 5); scene.add(key);
  const tintA = new THREE.PointLight(0x22c55e, 9, 12); tintA.position.set(-3, 1.5, 2.5); scene.add(tintA);
  const tintB = new THREE.PointLight(0xa3e635, 7, 12); tintB.position.set(3, -1.5, 2.5); scene.add(tintB);

  // rendered straight to the canvas: post-processing turns the transparent background into a grey haze

  const resize = () => {
    const w = innerWidth, h = innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  addEventListener('resize', resize); resize();

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; });

  // scroll choreography: each [data-holo] section declares where the emblem sits while it is on screen
  // data-holo="x y scale spin hue"  (x/y in viewport fractions, -1..1)
  const parse = el => { const [x, y, s, r, h] = el.dataset.holo.split(' ').map(Number); return { x, y, s, r, h: h || 0 }; };
  const marks = () => [...document.querySelectorAll('[data-holo]')].map(el => ({ el, ...parse(el) }));
  let M = marks(); addEventListener('resize', () => { M = marks(); });
  const pose = { x: 0, y: 0, s: 1, r: 0, h: 0 }, cur = { ...pose };
  const target = () => {
    const mid = innerHeight * 0.5;
    const cs = M.map(m => { const r = m.el.getBoundingClientRect(); return r.top + r.height * 0.5; });
    let i = 0; while (i < M.length - 1 && cs[i + 1] <= mid) i++;
    const a = M[i], b = M[Math.min(i + 1, M.length - 1)];
    const f = a === b || cs[i] >= mid ? 0 : ease(Math.max(0, Math.min(1, (mid - cs[i]) / (cs[i + 1] - cs[i]))));
    for (const k of ['x', 'y', 's', 'r', 'h']) pose[k] = lerp(a[k], b[k], f);
  };

  // intro: the three blades fly in and lock together
  const t0 = performance.now();
  let last = 0, ready = false;
  const halfH = () => Math.tan(deg(camera.fov / 2)) * camera.position.z, halfW = () => halfH() * camera.aspect;

  renderer.setAnimationLoop(now => {
    const dt = Math.min((now - (last || now)) / 1000, 0.05); last = now;
    if (document.hidden) return;
    const t = now / 1000, intro = Math.min(1, (now - t0) / 1600), ie = ease(intro);
    target();
    const k = 1 - Math.exp(-dt * 3.2);                                  // smooth follow (frame-rate independent)
    for (const key of Object.keys(cur)) cur[key] += (pose[key] - cur[key]) * k;
    mouse.x += (mouse.tx - mouse.x) * k; mouse.y += (mouse.ty - mouse.y) * k;

    const mob = isMobile(), base = mob ? 0.64 : 1.12;
    rig.position.set(cur.x * halfW() * 0.62, -cur.y * halfH() * 0.62 + Math.sin(t * 0.8) * 0.05, 0);
    rig.scale.setScalar(base * cur.s * (0.6 + 0.4 * ie));
    emblem.rotation.set(mouse.y * 0.25 + Math.sin(t * 0.5) * 0.08, mouse.x * 0.35 + cur.r + t * 0.12, t * 0.05);
    emblem.userData.blades.forEach((b, i) => {
      const a = deg(i * 120 + 90);
      b.m.position.set(Math.cos(a) * (1 - ie) * 2.6, Math.sin(a) * (1 - ie) * 2.6, (1 - ie) * 1.5);
      b.m.rotation.z = (1 - ie) * (i + 1) * 1.2;
    });
    emblem.userData.ring.scale.setScalar(ie);
    holo.iridescenceThicknessRange = [360 + cur.h * 40, 560 + cur.h * 80];
    drops.forEach(d => {
      const u = d.userData, a = t * u.s + u.o;
      d.position.set(Math.cos(a) * u.r, Math.sin(a) * u.r * Math.cos(u.tilt), Math.sin(a) * u.r * Math.sin(u.tilt));
      d.scale.setScalar(ie);
    });
    tintA.position.x = -3 + Math.sin(t * 0.6) * 1.2; tintB.position.y = -1.5 + Math.cos(t * 0.5);
    renderer.render(scene, camera);
    if (!ready) { ready = true; canvas.classList.add('ready'); }
  });
  return true;
}

startHolo(document.getElementById('holo')) || document.documentElement.classList.add('no-webgl');
