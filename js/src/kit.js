// Shared Three.js stage + procedural models for every page
import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

import EMBEDDED from './textures.js';

export { THREE };
export const isMobile = () => innerWidth < 980; // same breakpoint as the CSS layout
const lerp = (a, b, t) => a + (b - a) * t;
export const smooth = t => t * t * (3 - 2 * t);

/* ------------------------------------------------------------------ STAGE */
export function createStage(canvas, opt = {}) {
  const { bloom = 0.5, fogNear = 14, fogFar = 46, cam = [0, 2, 12], fov = 40, bg = 0x04130d } = opt;
  let renderer;
  for (const o of [{ antialias: true, powerPreference: 'high-performance' }, { antialias: false }]) {
    try { renderer = new THREE.WebGLRenderer({ canvas, ...o }); break; } catch (e) { console.warn('WebGL init failed', o, e); }
  }
  if (!renderer) return null;
  const mobile = isMobile();
  renderer.setPixelRatio(Math.min(devicePixelRatio, mobile ? 1.3 : 1.75));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = !mobile;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(bg);
  scene.fog = new THREE.Fog(bg, fogNear, fogFar);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;

  const camera = new THREE.PerspectiveCamera(fov, 1, 0.1, 200);
  camera.position.set(...cam);

  scene.add(new THREE.HemisphereLight(0xd8ffe6, 0x06180f, 0.45));
  const key = new THREE.DirectionalLight(0xffffff, 1.5);
  key.position.set(6, 10, 7);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -14, right: 14, top: 14, bottom: -14, near: 1, far: 40 });
  key.shadow.bias = -0.0006;
  key.shadow.normalBias = 0.05;   // removes striped self-shadowing (acne) on curved surfaces
  scene.add(key, key.target);
  const rim = new THREE.PointLight(0xb7f34a, 16, 30);
  rim.position.set(-6, 5, -4);
  scene.add(rim);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), bloom, 0.4, 1.15);
  composer.addPass(bloomPass);
  composer.addPass(new OutputPass());

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    stage.onResize.forEach(f => f(w, h));
  }

  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  addEventListener('pointermove', e => { mouse.tx = e.clientX / innerWidth * 2 - 1; mouse.ty = e.clientY / innerHeight * 2 - 1; });

  // checked every frame (an IntersectionObserver could report a stale "hidden" on load and freeze the scene)
  const onScreen = () => { const r = canvas.getBoundingClientRect(); return r.bottom > 0 && r.top < innerHeight && r.width > 0; };

  const clock = new THREE.Clock();
  const stage = { THREE, scene, camera, renderer, composer, key, rim, mouse, mobile, frames: [], onResize: [], onReady: null,
    onFrame(fn) { this.frames.push(fn); } };
  let first = true, failed = false;
  canvas.addEventListener('webglcontextlost', e => { e.preventDefault(); failed = true; stage.onFail?.(); });

  new ResizeObserver(resize).observe(canvas);
  resize();

  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    if (document.hidden || !onScreen()) return;
    const t = clock.elapsedTime;
    mouse.x = lerp(mouse.x, mouse.tx, 0.05);
    mouse.y = lerp(mouse.y, mouse.ty, 0.05);
    if (failed) return;
    try {
      stage.frameCount = (stage.frameCount || 0) + 1;
    for (const f of stage.frames) f(t, dt);
      composer.render();
    } catch (e) {
      failed = true; console.error('3D render error', e); stage.onFail?.(); return;
    }
    if (first) { first = false; stage.onReady?.(); }
  });
  return stage;
}

/* --------------------------------------------------------------- HELPERS */
const loader = new THREE.TextureLoader();
export function tex(url) {
  const t = loader.load(EMBEDDED[url] || url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}

let _sprite;
export function softSprite() {
  if (_sprite) return _sprite;
  const c = document.createElement('canvas'); c.width = c.height = 64;
  const g = c.getContext('2d');
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  return (_sprite = new THREE.CanvasTexture(c));
}

const DIM = 0.55; // global emissive dimmer — keeps glow, avoids blown-out white
const glow = (color, i = 3) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: i * DIM, roughness: 0.4 });
const plastic = (color, o = {}) => new THREE.MeshPhysicalMaterial({ color, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.15, ...o });
const metal = (color, r = 0.25) => new THREE.MeshStandardMaterial({ color, metalness: 1, roughness: r });
const shadow = o => { o.traverse(m => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } }); return o; };

/* Floating dust / sparks */
export function makeDust(n = 600, spread = 30, color = 0x7dffb2, size = 0.09) {
  const g = new THREE.BufferGeometry(), p = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { p[i * 3] = (Math.random() - 0.5) * spread; p[i * 3 + 1] = Math.random() * spread * 0.45; p[i * 3 + 2] = (Math.random() - 0.5) * spread; }
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color, size, map: softSprite(), transparent: true, opacity: 0.6, depthWrite: false, blending: THREE.AdditiveBlending }));
  pts.userData.update = t => { pts.rotation.y = t * 0.015; pts.position.y = Math.sin(t * 0.4) * 0.3; };
  return pts;
}

/* Reflective dark floor with glowing grid */
export function makeFloor(size = 80) {
  const g = new THREE.Group();
  const floor = new THREE.Mesh(new THREE.CircleGeometry(size / 2, 96),
    new THREE.MeshStandardMaterial({ color: 0x071c12, metalness: 0.55, roughness: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; g.add(floor);
  const grid = new THREE.GridHelper(size, size / 2, 0x2bd97a, 0x1a5c3a);
  grid.material.transparent = true; grid.material.opacity = 0.14; grid.position.y = 0.005; g.add(grid);
  return g;
}

/* Glowing pedestal */
export function makePedestal(r = 1.3) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.CylinderGeometry(r, r * 1.1, 0.35, 64), new THREE.MeshStandardMaterial({ color: 0x0c2a1c, metalness: 0.7, roughness: 0.3 }));
  base.position.y = 0.175; g.add(base);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r * 1.02, 0.03, 8, 96), glow(0xb7f34a, 2.2));
  ring.rotation.x = Math.PI / 2; ring.position.y = 0.36; g.add(ring);
  g.userData.ring = ring;
  return shadow(g);
}

/* ---------------------------------------------------------------- MODELS */
// Red wheelie bin modelled on the real I-TEC bins (biohazard label on front)
export function makeBin(labelTex, color = 0xd61f2c, opts = {}) {
  const g = new THREE.Group();
  const mat = plastic(color);
  const bodyGeo = new RoundedBoxGeometry(1.5, 2, 1.5, 4, 0.12);
  const pos = bodyGeo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const s = 1 - (1 - (pos.getY(i) + 1) / 2) * 0.14;
    pos.setX(i, pos.getX(i) * s); pos.setZ(i, pos.getZ(i) * s);
  }
  bodyGeo.computeVertexNormals();
  const body = new THREE.Mesh(bodyGeo, mat); body.position.y = 1.15; g.add(body);
  const rim = new THREE.Mesh(new RoundedBoxGeometry(1.64, 0.16, 1.64, 3, 0.05), mat); rim.position.y = 2.18; g.add(rim);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 2.26, -0.82); g.add(lidPivot);
  const lid = new THREE.Mesh(new RoundedBoxGeometry(1.7, 0.14, 1.74, 3, 0.06), mat); lid.position.set(0, 0.02, 0.86); lidPivot.add(lid);
  const grip = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.1, 0.16, 2, 0.04), mat); grip.position.set(0, -0.04, 1.72); lidPivot.add(grip);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 16), metal(0x333a37, 0.4)); bar.rotation.z = Math.PI / 2; bar.position.set(0, 2.05, -0.9); g.add(bar);
  const tire = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.8 });
  for (const x of [-0.62, 0.62]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 24), tire);
    w.rotation.z = Math.PI / 2; w.position.set(x, 0.28, -0.7); g.add(w);
  }
  if (labelTex) {
    const label = new THREE.Mesh(new THREE.PlaneGeometry(0.74, 1.0), new THREE.MeshStandardMaterial({ map: labelTex, roughness: 0.6, color: 0xbbbbbb }));
    if (opts.face) { label.scale.setScalar(0.62); label.position.set(0, 0.78, 0.69); }
    else label.position.set(0, 1.2, 0.72);
    label.rotation.x = 0.0525; g.add(label);   // match the body's taper so no edge sinks into it
  }
  g.userData.lid = lidPivot;
  if (opts.face) g.userData.face = addCheekyFace(g);
  return shadow(g);
}

// Spinning metal coin with a logo on both faces
export function makeCoin(faceTex, r = 1.1, rimColor = 0x1f4a35) {
  const g = new THREE.Group();
  // cylinder caps map UVs rotated 90°, so turn the logo upright on its own copy
  const ft = faceTex.clone(); ft.center.set(0.5, 0.5); ft.rotation = Math.PI / 2;
  const face = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.45, metalness: 0.1, color: 0xc8c8c8 });
  const coin = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.16, 96), [metal(rimColor, 0.2), face, face]);
  coin.rotation.x = Math.PI / 2; g.add(coin);
  for (const z of [0.085, -0.085]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.06, 16, 96), metal(rimColor, 0.3));
    ring.position.z = z; g.add(ring);
    const lime = new THREE.Mesh(new THREE.TorusGeometry(r + 0.075, 0.018, 8, 128), glow(0xb7f34a, 2));
    lime.position.z = z; g.add(lime);
  }
  return shadow(g);
}

// Flat rounded plaque with an image (ISO badges etc.)
export function makePlaque(imgTex, w = 2, h = 1.5) {
  const g = new THREE.Group();
  const back = new THREE.Mesh(new RoundedBoxGeometry(w + 0.2, h + 0.2, 0.12, 3, 0.06), plastic(0x9fb0a8, { roughness: 0.6 }));
  g.add(back);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: imgTex, roughness: 0.7, color: 0x9a9a9a }));
  front.position.z = 0.065; g.add(front);
  const edge = new THREE.Mesh(new THREE.TorusGeometry(0.01, 0.01, 2, 3), glow(0xb7f34a)); g.add(edge);
  return shadow(g);
}

// Collection truck: green cab + white box with I-TEC logo, GPS pin above
export function makeTruck(logoTex) {
  const g = new THREE.Group();
  const white = plastic(0xd9e0dc), green = plastic(0x0f8a4b), dark = new THREE.MeshStandardMaterial({ color: 0x1c2420, roughness: 0.7 });
  const box = new THREE.Mesh(new RoundedBoxGeometry(3.2, 1.8, 1.7, 4, 0.08), white); box.position.set(-0.55, 1.45, 0); g.add(box);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(3.22, 0.18, 1.72), green); stripe.position.set(-0.55, 0.78, 0); g.add(stripe);
  if (logoTex) for (const s of [1, -1]) {
    const d = new THREE.Mesh(new THREE.CircleGeometry(0.62, 48), new THREE.MeshStandardMaterial({ map: logoTex, roughness: 0.5, color: 0xcccccc }));
    d.position.set(-0.55, 1.5, 0.86 * s); if (s < 0) d.rotation.y = Math.PI; g.add(d);
  }
  const cab = new THREE.Mesh(new RoundedBoxGeometry(1.35, 1.45, 1.62, 4, 0.18), green); cab.position.set(1.75, 1.17, 0); g.add(cab);
  const glass = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.55, 1.4), new THREE.MeshPhysicalMaterial({ color: 0x0b1a14, roughness: 0.05, metalness: 0.5 }));
  glass.position.set(2.42, 1.48, 0); g.add(glass);
  const chassis = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.26, 1.34), dark); chassis.position.set(0.1, 0.55, 0); g.add(chassis);
  const wheels = [];
  const tire = new THREE.MeshStandardMaterial({ color: 0x121212, roughness: 0.85 });
  const hub = metal(0xaab4b0, 0.3);
  for (const x of [-1.45, 1.6]) for (const z of [0.72, -0.72]) {
    const w = new THREE.Group();
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.3, 28), tire); t.rotation.x = Math.PI / 2; w.add(t);
    const h = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.32, 6), hub); h.rotation.x = Math.PI / 2; w.add(h);
    w.position.set(x, 0.4, z); g.add(w); wheels.push(w);
  }
  for (const z of [0.52, -0.52]) {
    const hl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.16, 0.3), glow(0xfff1c4, 6)); hl.position.set(2.44, 0.82, z); g.add(hl);
    const tl = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.14, 0.24), glow(0xff2a2a, 4)); tl.position.set(-2.16, 0.78, z); g.add(tl);
  }
  // GPS pin
  const pin = new THREE.Group(); pin.position.set(0, 3.6, 0);
  const pm = glow(0xb7f34a, 2.5);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.32, 32, 16), pm); pin.add(head);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.6, 32), pm); tip.rotation.x = Math.PI; tip.position.y = -0.38; pin.add(tip);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 8), new THREE.MeshBasicMaterial({ color: 0x04130d })); dot.position.z = 0.26; pin.add(dot);
  const pulse = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.6, 48), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
  pulse.rotation.x = -Math.PI / 2; pulse.position.y = 0.02; g.add(pulse);
  g.add(pin);
  g.userData = { wheels, pin, pulse };
  g.userData.update = (t, speed = 1) => {
    wheels.forEach(w => { w.rotation.z -= 0.12 * speed; });
    pin.position.y = 3.6 + Math.sin(t * 3) * 0.15; pin.rotation.y = t * 1.5;
    const s = 1 + ((t * 0.8) % 1) * 3; pulse.scale.setScalar(s); pulse.material.opacity = 1 - ((t * 0.8) % 1);
  };
  return shadow(g);
}

// High-temperature incinerator with fire and chimney smoke
export function makeIncinerator() {
  const g = new THREE.Group();
  const concrete = new THREE.MeshStandardMaterial({ color: 0x7d8b86, roughness: 0.75, metalness: 0.2 });
  const steel = metal(0x9aa6a2, 0.35);
  const hall = new THREE.Mesh(new RoundedBoxGeometry(5.2, 3.2, 3.6, 3, 0.1), concrete); hall.position.y = 1.6; g.add(hall);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.2, 3.9), steel); roof.position.y = 3.25; g.add(roof);
  const mouth = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.25), glow(0xff5a12, 7)); mouth.position.set(-0.7, 1.05, 1.81); g.add(mouth);
  const frame = new THREE.Mesh(new THREE.BoxGeometry(2, 1.55, 0.1), metal(0x2c3330, 0.5)); frame.position.set(-0.7, 1.05, 1.76); g.add(frame);
  const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.55, 7, 32), concrete); chimney.position.set(1.6, 4.6, -0.8); g.add(chimney);
  for (const y of [6.4, 7.4]) {
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.42, 0.35, 32), plastic(0xd61f2c)); band.position.set(1.6, y, -0.8); g.add(band);
  }
  const beacon = new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 8), glow(0xff2a2a, 8)); beacon.position.set(1.6, 8.2, -0.8); g.add(beacon);
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.6, 32), steel); tank.position.set(-3.6, 1.3, -0.3); g.add(tank);
  const pipe = new THREE.Mesh(new THREE.TorusGeometry(1.1, 0.12, 12, 32, Math.PI), steel); pipe.position.set(-2.7, 2.6, -0.3); g.add(pipe);
  // hazard stripes at the loading dock
  const dock = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.12, 1.2), new THREE.MeshStandardMaterial({ color: 0xf2c230, roughness: 0.6 })); dock.position.set(-0.7, 0.06, 2.4); g.add(dock);
  shadow(g);

  const fireLight = new THREE.PointLight(0xff6a1a, 14, 12); fireLight.position.set(-0.7, 1.2, 3); g.add(fireLight);

  // fire particles
  const FN = 320, fg = new THREE.BufferGeometry(), fp = new Float32Array(FN * 3), fv = [];
  const resetF = i => { fp[i * 3] = -0.7 + (Math.random() - 0.5) * 1.5; fp[i * 3 + 1] = 0.5 + Math.random() * 0.3; fp[i * 3 + 2] = 1.75; fv[i] = [(Math.random() - 0.5) * 0.01, 0.012 + Math.random() * 0.02, 0.01 + Math.random() * 0.02, Math.random()]; };
  for (let i = 0; i < FN; i++) { resetF(i); fp[i * 3 + 1] += Math.random() * 1.2; }
  fg.setAttribute('position', new THREE.BufferAttribute(fp, 3));
  const fire = new THREE.Points(fg, new THREE.PointsMaterial({ color: 0xff8a2a, size: 0.3, map: softSprite(), transparent: true, opacity: 0.7, depthWrite: false, blending: THREE.AdditiveBlending }));
  g.add(fire);

  // smoke
  const SN = 90, sg = new THREE.BufferGeometry(), sp = new Float32Array(SN * 3), sl = new Float32Array(SN);
  for (let i = 0; i < SN; i++) { sl[i] = Math.random(); }
  sg.setAttribute('position', new THREE.BufferAttribute(sp, 3));
  const smoke = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0x9fb3aa, size: 1.6, map: softSprite(), transparent: true, opacity: 0.22, depthWrite: false }));
  g.add(smoke);

  g.userData.update = t => {
    for (let i = 0; i < FN; i++) {
      const v = fv[i];
      fp[i * 3] += v[0] + Math.sin(t * 6 + i) * 0.004; fp[i * 3 + 1] += v[1]; fp[i * 3 + 2] += v[2];
      if (fp[i * 3 + 1] > 2.3) resetF(i);
    }
    fg.attributes.position.needsUpdate = true;
    for (let i = 0; i < SN; i++) {
      sl[i] = (sl[i] + 0.0025) % 1;
      const l = sl[i];
      sp[i * 3] = 1.6 + l * 3 + Math.sin(i * 7.1 + t * 0.4) * 0.5 * l;
      sp[i * 3 + 1] = 8.3 + l * 6;
      sp[i * 3 + 2] = -0.8 + Math.cos(i * 3.3) * l;
    }
    sg.attributes.position.needsUpdate = true;
    fireLight.intensity = 11 + Math.sin(t * 20) * 2.5 + Math.random() * 3;
    mouth.material.emissiveIntensity = (6 + Math.sin(t * 13) * 1.2) * DIM;
    beacon.material.emissiveIntensity = (Math.sin(t * 4) > 0) ? 4 : 0.5;
  };
  return g;
}

// Holographic E-Manifest document
export function makeHolo() {
  const g = new THREE.Group();
  const c = document.createElement('canvas'); c.width = 512; c.height = 680;
  const x = c.getContext('2d');
  x.fillStyle = 'rgba(10,40,26,.55)'; x.fillRect(0, 0, 512, 680);
  x.strokeStyle = '#b7f34a'; x.lineWidth = 6; x.strokeRect(10, 10, 492, 660);
  x.fillStyle = '#b7f34a'; x.font = 'bold 46px Prompt, sans-serif'; x.fillText('E-MANIFEST', 40, 80);
  x.font = '22px Prompt, sans-serif'; x.fillStyle = '#9ff5c4'; x.fillText('เอกสารกำกับการขนส่งมูลฝอยติดเชื้อ', 40, 118);
  const rows = ['ผู้ก่อกำเนิด', 'ผู้ขนส่ง  I-TEC', 'น้ำหนัก (กก.)', 'GPS Route', 'สถานที่กำจัด'];
  rows.forEach((r, i) => {
    const y = 180 + i * 72;
    x.fillStyle = '#9ff5c4'; x.fillText(r, 40, y);
    x.fillStyle = 'rgba(183,243,74,.35)'; x.fillRect(240, y - 24, 190, 30);
    x.strokeStyle = '#b7f34a'; x.lineWidth = 4; x.strokeRect(450, y - 26, 30, 30);
    x.beginPath(); x.moveTo(456, y - 12); x.lineTo(464, y - 2); x.lineTo(478, y - 22); x.stroke();
  });
  for (let i = 0; i < 7; i++) for (let j = 0; j < 7; j++) if (Math.random() > 0.45 || i % 6 === 0 || j % 6 === 0) { x.fillStyle = '#b7f34a'; x.fillRect(40 + i * 16, 540 + j * 16, 14, 14); }
  x.save(); x.translate(360, 590); x.rotate(-0.2); x.strokeStyle = '#ff5a5a'; x.lineWidth = 5; x.strokeRect(-90, -38, 180, 76);
  x.fillStyle = '#ff7a7a'; x.font = 'bold 30px Prompt, sans-serif'; x.fillText('APPROVED', -78, 12); x.restore();
  const mapTex = new THREE.CanvasTexture(c); mapTex.colorSpace = THREE.SRGBColorSpace;
  const doc = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 3.2), new THREE.MeshBasicMaterial({ map: mapTex, transparent: true, side: THREE.DoubleSide, toneMapped: false, depthWrite: false }));
  doc.material.color.setScalar(1.0);
  doc.position.y = 3.2; g.add(doc);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.PlaneGeometry(2.5, 3.3)), new THREE.LineBasicMaterial({ color: 0xb7f34a, toneMapped: false }));
  edges.material.color.setScalar(1.1); edges.position.copy(doc.position); g.add(edges);
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 0.05), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, opacity: 0.9, toneMapped: false, side: THREE.DoubleSide }));
  scan.material.color.setScalar(1.3); g.add(scan);
  // projector
  const proj = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.1, 0.4, 48), metal(0x223029, 0.3)); proj.position.y = 0.2; g.add(proj);
  const pr = new THREE.Mesh(new THREE.TorusGeometry(0.75, 0.04, 8, 64), glow(0xb7f34a, 2.5)); pr.rotation.x = Math.PI / 2; pr.position.y = 0.42; g.add(pr);
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 0.75, 3.2, 48, 1, true), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, opacity: 0.04, side: THREE.DoubleSide, depthWrite: false, blending: THREE.AdditiveBlending }));
  beam.position.y = 2.05; g.add(beam);
  // floating check
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.5, 0, 0), new THREE.Vector3(-0.1, -0.4, 0), new THREE.Vector3(0.7, 0.6, 0)]);
  const check = new THREE.Mesh(new THREE.TubeGeometry(path, 32, 0.09, 12), glow(0xb7f34a, 2.5));
  check.position.set(1.9, 4.6, 0.4); g.add(check);
  const orbit = new THREE.Mesh(new THREE.TorusGeometry(2.2, 0.015, 6, 128), new THREE.MeshBasicMaterial({ color: 0x7dffb2, transparent: true, opacity: 0.3, toneMapped: false }));
  orbit.position.y = 3.2; orbit.rotation.x = Math.PI / 2.3; g.add(orbit);
  g.userData.update = t => {
    doc.rotation.y = Math.sin(t * 0.6) * 0.35; edges.rotation.y = doc.rotation.y;
    doc.position.y = edges.position.y = 3.2 + Math.sin(t * 1.2) * 0.1;
    scan.position.y = 1.7 + ((t * 0.5) % 1) * 3.1; scan.rotation.y = doc.rotation.y;
    check.rotation.y = t * 1.2; check.scale.setScalar(1 + Math.sin(t * 3) * 0.08);
    orbit.rotation.z = t * 0.5;
  };
  return g;
}

// Crystal award like the SME National Awards 2018 trophy
export function makeTrophy() {
  const g = new THREE.Group();
  const crystal = new THREE.Mesh(new THREE.OctahedronGeometry(1.2, 0),
    new THREE.MeshPhysicalMaterial({ color: 0xe8fff2, roughness: 0.02, transmission: 1, thickness: 1.2, ior: 1.6, iridescence: 0.6, clearcoat: 1 }));
  crystal.scale.set(1, 1.45, 0.35); crystal.position.y = 2.9; g.add(crystal);
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const x = c.getContext('2d'); x.fillStyle = '#ffffff'; x.textAlign = 'center';
  x.font = 'bold 70px Prompt, serif'; x.fillText('10th', 128, 80); x.font = 'bold 64px Prompt, serif'; x.fillText('SME', 128, 150); x.font = '34px Prompt, serif'; x.fillText('AWARDS 2018', 128, 205);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, toneMapped: false }));
  label.material.color.setScalar(0.95); label.position.set(0, 2.9, 0.05); g.add(label);
  const base = new THREE.Mesh(new RoundedBoxGeometry(1.8, 1.1, 0.9, 3, 0.06), new THREE.MeshStandardMaterial({ color: 0x151a18, metalness: 0.6, roughness: 0.25 }));
  base.position.y = 0.55; g.add(base);
  const plate = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.55, 0.02), metal(0x9aa6a2, 0.25)); plate.position.set(0, 0.55, 0.46); g.add(plate);
  const inner = new THREE.PointLight(0xb7f34a, 3, 5); inner.position.set(0, 2.9, 0.6); g.add(inner);
  g.userData.crystal = crystal;
  return shadow(g);
}

// Services props
export function makeHazardSign() {
  const g = new THREE.Group();
  const s = new THREE.Shape(); s.moveTo(0, 1.3); s.lineTo(1.2, -0.8); s.lineTo(-1.2, -0.8); s.closePath();
  const tri = new THREE.Mesh(new THREE.ExtrudeGeometry(s, { depth: 0.2, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 4 }), plastic(0xf5c518));
  g.add(tri);
  const blk = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.5 });
  const bar = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.9, 0.1, 2, 0.05), blk); bar.position.set(0, 0.3, 0.3); g.add(bar);
  const dot = new THREE.Mesh(new THREE.SphereGeometry(0.12, 16, 8), blk); dot.position.set(0, -0.4, 0.3); g.add(dot);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 12), metal(0x9aa6a2)); post.position.set(0, -1.5, 0.05); g.add(post);
  g.position.y = 2.1;
  const w = new THREE.Group(); w.add(g); return shadow(w);
}
export function makeGradCap() {
  const g = new THREE.Group(), blk = plastic(0x173d2b);
  const top = new THREE.Mesh(new RoundedBoxGeometry(2, 0.12, 2, 2, 0.04), blk); top.rotation.y = Math.PI / 4; top.position.y = 1.9; g.add(top);
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.8, 0.6, 32), blk); band.position.y = 1.55; g.add(band);
  const btn = new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 8), glow(0xb7f34a, 3)); btn.position.y = 1.98; g.add(btn);
  const cord = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.0, 8), glow(0xb7f34a, 3)); cord.position.set(0.9, 1.45, 0.3); cord.rotation.z = 0.2; g.add(cord);
  const book = new THREE.Mesh(new RoundedBoxGeometry(1.6, 0.3, 1.1, 2, 0.04), plastic(0x0f8a4b)); book.position.y = 0.95; g.add(book);
  const pages = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.22, 1.02), new THREE.MeshStandardMaterial({ color: 0xf4f1e6 })); pages.position.set(0.04, 0.95, 0); g.add(pages);
  return shadow(g);
}
export function makePedalBin() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.68, 1.7, 48), plastic(0xf6c9d8)); body.position.y = 1.2; g.add(body);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.77, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), plastic(0xffffff)); lid.scale.y = 0.35; lid.position.y = 2.05; g.add(lid);
  const pedal = new THREE.Mesh(new RoundedBoxGeometry(0.5, 0.08, 0.3, 2, 0.03), metal(0xcfd8d4)); pedal.position.set(0, 0.45, 0.78); g.add(pedal);
  const cross = new THREE.Group();
  const cm = glow(0xff6fa5, 2);
  cross.add(new THREE.Mesh(new RoundedBoxGeometry(0.45, 0.14, 0.05, 2, 0.02), cm), new THREE.Mesh(new RoundedBoxGeometry(0.14, 0.45, 0.05, 2, 0.02), cm));
  cross.position.set(0, 1.3, 0.74); g.add(cross);
  return shadow(g);
}
export function makeBinSet(labelTex) {
  const g = new THREE.Group();
  [[0xd61f2c, -1.1], [0xf5c518, 0], [0x1e5fd6, 1.1]].forEach(([c, x], i) => {
    const b = makeBin(i === 0 ? labelTex : null, c); b.scale.setScalar(0.5); b.position.set(x, 0, i === 1 ? -0.4 : 0); g.add(b);
  });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.55, 32, 16), plastic(0xe0303a, { roughness: 0.55, clearcoat: 0.4 }));
  bag.scale.set(1, 0.8, 0.9); bag.position.set(0.3, 0.45, 1.0); g.add(bag);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.4, 16), bag.material); knot.position.set(0.3, 1.0, 1.0); g.add(knot);
  return shadow(g);
}
export function makeShredder() {
  const g = new THREE.Group();
  // clear collection bin (the paper lands in here)
  const W = 1.5, D = 1.0, H = 1.15;
  const clear = new THREE.MeshPhysicalMaterial({ color: 0xd6ecf5, roughness: 0.08, transparent: true, opacity: 0.28, clearcoat: 1, side: THREE.DoubleSide, depthWrite: false });
  const frameM = plastic(0x2a302d);
  const binBox = new THREE.Mesh(new THREE.BoxGeometry(W, H, D, 1, 1, 1), clear); binBox.position.y = H / 2 + 0.02; g.add(binBox);
  const edges = new THREE.LineSegments(new THREE.EdgesGeometry(new THREE.BoxGeometry(W, H, D)), new THREE.LineBasicMaterial({ color: 0x3a423e }));
  edges.position.copy(binBox.position); g.add(edges);
  const floor = new THREE.Mesh(new RoundedBoxGeometry(W + 0.06, 0.06, D + 0.06, 2, 0.02), frameM); floor.position.y = 0.03; g.add(floor);
  // shredded pile inside
  const stripGeo = new THREE.BoxGeometry(0.035, 0.008, 0.34);
  const paperM = new THREE.MeshStandardMaterial({ color: 0xf4f1e6, roughness: 0.85 });
  const PILE = 260, pile = new THREE.InstancedMesh(stripGeo, paperM, PILE);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < PILE; i++) {
    const r = Math.random(), x = (Math.random() - 0.5) * (W - 0.15), z = (Math.random() - 0.5) * (D - 0.12);
    const hump = 0.42 * (1 - Math.abs(x) / W) * (1 - Math.abs(z) / D);          // heap is higher in the middle
    v.set(x, 0.08 + r * hump, z); e.set(Math.random() * 0.6, Math.random() * Math.PI, Math.random() * 0.6);
    m4.compose(v, q.setFromEuler(e), one); pile.setMatrixAt(i, m4);
  }
  g.add(pile);
  // shredder head sitting on the bin
  const head = new THREE.Mesh(new RoundedBoxGeometry(W + 0.14, 0.38, D + 0.14, 3, 0.08), plastic(0x1f2622)); head.position.y = H + 0.21; g.add(head);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.07), new THREE.MeshStandardMaterial({ color: 0x050505 })); slot.position.y = H + 0.405; g.add(slot);
  const slotGlow = new THREE.Mesh(new THREE.BoxGeometry(1.06, 0.012, 0.11), glow(0xb7f34a, 3)); slotGlow.position.y = H + 0.4; g.add(slotGlow);
  const throat = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.03, 0.12), new THREE.MeshStandardMaterial({ color: 0x050505 })); throat.position.y = H + 0.01; g.add(throat);
  const panel = new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.2, 0.03, 2, 0.02), plastic(0x2f3833)); panel.position.set(0.52, H + 0.21, (D + 0.14) / 2 + 0.01); g.add(panel);
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.035, 10, 8), glow(0xb7f34a, 5)); led.position.set(0.44, H + 0.21, (D + 0.14) / 2 + 0.03); g.add(led);
  const btn = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.03, 16), plastic(0xd61f2c)); btn.rotation.x = Math.PI / 2; btn.position.set(0.6, H + 0.21, (D + 0.14) / 2 + 0.03); g.add(btn);
  // sheet being fed in from the top
  const sheet = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 1.1), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8, side: THREE.DoubleSide }));
  g.add(sheet);
  // strips dropping from the throat into the bin
  const FALL = 22, falling = new THREE.InstancedMesh(stripGeo, paperM, FALL), seeds = [];
  for (let i = 0; i < FALL; i++) seeds.push({ o: Math.random(), x: (Math.random() - 0.5) * 0.9, z: (Math.random() - 0.5) * 0.08, spin: Math.random() * 6 });
  g.add(falling);
  g.userData.update = t => {
    const k = (t * 0.28) % 1;                                 // one sheet every ~3.5 s
    sheet.scale.y = 1 - k; sheet.position.set(0, H + 0.41 + 0.55 * (1 - k), 0);
    const running = k < 0.95;
    led.material.emissiveIntensity = (running ? 5 : 1) * DIM;
    seeds.forEach((sd, i) => {
      const f = (t * 0.9 + sd.o) % 1;                         // falls from the throat to the pile top
      v.set(sd.x + Math.sin(f * 5 + sd.spin) * 0.05, H - 0.03 - f * (H - 0.5), sd.z + f * 0.15);
      e.set(f * sd.spin, sd.spin, f * 2); m4.compose(v, q.setFromEuler(e), running ? one : v.clone().set(0, 0, 0)); falling.setMatrixAt(i, m4);
    });
    falling.instanceMatrix.needsUpdate = true;
  };
  shadow(g); binBox.castShadow = false;                     // clear plastic shouldn't cast a solid shadow
  return g;
}

// Stylised city + location pin (contact page)
export function makeCity(n = 220, spread = 36) {
  const g = new THREE.Group();
  const geo = new THREE.BoxGeometry(1, 1, 1); geo.translate(0, 0.5, 0);
  const mat = new THREE.MeshStandardMaterial({ color: 0x0f3325, metalness: 0.3, roughness: 0.5 });
  const city = new THREE.InstancedMesh(geo, mat, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), p = new THREE.Vector3(), s = new THREE.Vector3();
  let k = 0;
  for (let i = 0; i < n; i++) {
    const x = Math.round((Math.random() - 0.5) * spread / 2) * 2, z = Math.round((Math.random() - 0.5) * spread / 2) * 2;
    if (Math.hypot(x, z) < 4) continue;
    const h = 0.4 + Math.random() ** 2 * 4 * Math.max(0.3, 1 - Math.hypot(x, z) / spread);
    p.set(x, 0, z); s.set(1.4, h, 1.4); m.compose(p, q, s); city.setMatrixAt(k++, m);
  }
  city.count = k; city.castShadow = city.receiveShadow = true; g.add(city);
  const tops = new THREE.InstancedMesh(new THREE.BoxGeometry(1.42, 0.05, 1.42), glow(0x2bd97a, 0.7), k);
  for (let i = 0; i < k; i++) { city.getMatrixAt(i, m); m.decompose(p, q, s); if (Math.random() > 0.2) { m.makeScale(0, 0, 0); tops.setMatrixAt(i, m); continue; } p.y = s.y; s.set(1, 1, 1); m.compose(p, q, s); tops.setMatrixAt(i, m); }
  g.add(tops);
  // roads with moving lights (trucks heading to HQ)
  const cars = [], cm = glow(0xb7f34a, 6);
  for (let i = 0; i < 26; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.3), cm);
    c.userData = { axis: Math.random() > 0.5 ? 'x' : 'z', lane: (Math.round((Math.random() - 0.5) * 8) * 2 + 1), off: Math.random() * spread, sp: 2 + Math.random() * 3 };
    g.add(c); cars.push(c);
  }
  // pin
  const pin = new THREE.Group();
  const pm = glow(0xb7f34a, 2.2);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.9, 48, 24), pm); pin.add(head);
  const tip = new THREE.Mesh(new THREE.ConeGeometry(0.82, 1.7, 48), pm); tip.rotation.x = Math.PI; tip.position.y = -1.1; pin.add(tip);
  const hole = new THREE.Mesh(new THREE.SphereGeometry(0.36, 24, 12), new THREE.MeshStandardMaterial({ color: 0x04130d })); hole.position.z = 0.7; pin.add(hole);
  g.add(shadow(pin));
  const rings = [0, 1, 2].map(i => {
    const r = new THREE.Mesh(new THREE.RingGeometry(0.9, 1.05, 64), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, side: THREE.DoubleSide, toneMapped: false }));
    r.rotation.x = -Math.PI / 2; r.position.y = 0.03; r.userData.o = i / 3; g.add(r); return r;
  });
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 30, 16, 1, true), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, opacity: 0.06, blending: THREE.AdditiveBlending, depthWrite: false }));
  beam.position.y = 15; g.add(beam);
  g.userData.update = (t, dt) => {
    pin.position.y = 3 + Math.abs(Math.sin(t * 2)) * 0.8; pin.rotation.y = t;
    rings.forEach(r => { const k = (t * 0.5 + r.userData.o) % 1; r.scale.setScalar(1 + k * 6); r.material.opacity = 1 - k; });
    cars.forEach(c => {
      const d = c.userData; d.off = (d.off + d.sp * dt) % spread; const v = d.off - spread / 2;
      if (d.axis === 'x') c.position.set(v, 0.1, d.lane); else c.position.set(d.lane, 0.1, v);
    });
  };
  return g;
}

/* Orbit rings used as decoration */
export function makeRings(radii = [3, 3.8, 4.6]) {
  const g = new THREE.Group();
  radii.forEach((R, i) => {
    const m = new THREE.Mesh(new THREE.TorusGeometry(R, 0.012, 8, 256), new THREE.MeshBasicMaterial({ color: 0xb7f34a, transparent: true, opacity: 0.18 + i * 0.07, toneMapped: false }));
    m.material.color.setScalar(1.05);
    m.rotation.set(Math.PI / 2 + (i - 1) * 0.35, 0, i * 0.4);
    m.userData.s = (i % 2 ? -1 : 1) * (0.1 + i * 0.05);
    g.add(m);
  });
  g.userData.update = t => g.children.forEach(m => { m.rotation.z = t * m.userData.s; });
  return g;
}

/* Cheeky bin face: googly eyes that look around + blink, tongue sticking out */
function addCheekyFace(bin) {
  const f = new THREE.Group(); f.position.set(0, 1.72, 0.735); f.rotation.x = -0.07; bin.add(f);
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.25 });
  const black = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.15 });
  const eyes = [-1, 1].map(sx => {
    const e = new THREE.Group(); e.position.x = sx * 0.28; f.add(e);
    const ball = new THREE.Mesh(new THREE.SphereGeometry(0.15, 24, 16), white); ball.scale.z = 0.45; e.add(ball);
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.07, 16, 12), black); pupil.position.z = 0.06; pupil.scale.z = 0.5; e.add(pupil);
    const hi = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); hi.position.set(0.025, 0.03, 0.03); pupil.add(hi);
    const brow = new THREE.Mesh(new RoundedBoxGeometry(0.2, 0.04, 0.03, 2, 0.015), black); brow.position.set(0, 0.2, 0.02); brow.rotation.z = sx * -0.25; e.add(brow);
    return { e, pupil, brow };
  });
  const blush = new THREE.MeshBasicMaterial({ color: 0xff9ab8, transparent: true, opacity: 0.7 });
  for (const sx of [-1, 1]) { const b = new THREE.Mesh(new THREE.CircleGeometry(0.07, 20), blush); b.position.set(sx * 0.46, -0.16, 0.02); f.add(b); }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.13, 0.025, 8, 24, Math.PI), black); smile.rotation.z = Math.PI; smile.position.set(0, -0.1, 0.02); f.add(smile);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.08, 16, 12), new THREE.MeshStandardMaterial({ color: 0xff5f8a, roughness: 0.4 }));
  tongue.scale.set(1, 1.3, 0.45); tongue.position.set(0.05, -0.26, 0.03); f.add(tongue);
  return {
    update(t) {
      const blink = (t % 3.4) < 0.12 ? 0.1 : 1;
      const lx = Math.sin(t * 0.9) * 0.05, ly = Math.cos(t * 1.3) * 0.03;
      eyes.forEach((o, i) => { o.e.scale.y = blink; o.pupil.position.x = lx; o.pupil.position.y = ly; o.brow.position.y = 0.2 + (i ? Math.sin(t * 2) * 0.03 : 0); });
      tongue.rotation.z = Math.sin(t * 5) * 0.3; tongue.scale.y = 1.3 + Math.sin(t * 7) * 0.12;
    }
  };
}

/* Smooth road ribbon along a curve, glowing edge lines + centre dashes */
export function makeRoad(curve, width = 4.2, segs = 400) {
  const g = new THREE.Group();
  const up = new THREE.Vector3(0, 1, 0);
  const pts = curve.getSpacedPoints(segs);
  const frames = pts.map((p, i) => { const tg = curve.getTangentAt(i / segs); return { p, side: new THREE.Vector3().crossVectors(tg, up).normalize() }; });
  const strip = (off, w, y) => {
    const P = [], I = [];
    frames.forEach(({ p, side }, i) => {
      const a = p.clone().addScaledVector(side, off - w / 2), b = p.clone().addScaledVector(side, off + w / 2);
      P.push(a.x, y, a.z, b.x, y, b.z);
      if (i) { const k = i * 2; I.push(k - 2, k - 1, k, k - 1, k + 1, k); }
    });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); geo.setIndex(I); geo.computeVertexNormals();
    return geo;
  };
  const asphalt = new THREE.Mesh(strip(0, width, 0.02), new THREE.MeshStandardMaterial({ color: 0x101a15, roughness: 0.85, side: THREE.DoubleSide }));
  asphalt.receiveShadow = true; g.add(asphalt);
  const edgeM = new THREE.MeshStandardMaterial({ color: 0xb7f34a, emissive: 0xb7f34a, emissiveIntensity: 1.1, side: THREE.DoubleSide });
  for (const o of [-width / 2 + 0.1, width / 2 - 0.1]) g.add(new THREE.Mesh(strip(o, 0.08, 0.03), edgeM));
  const len = curve.getLength(), n = Math.floor(len / 2.2);
  const dash = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 0.12), new THREE.MeshStandardMaterial({ color: 0xf2c230, emissive: 0xf2c230, emissiveIntensity: 0.35 }), n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), one = new THREE.Vector3(1, 1, 1);
  for (let i = 0; i < n; i++) {
    const u = (i + 0.5) / n, p = curve.getPointAt(u), tg = curve.getTangentAt(u);
    e.set(-Math.PI / 2, Math.atan2(-tg.z, tg.x), 0, 'YXZ');   // lay flat, then turn along the road
    m.compose(new THREE.Vector3(p.x, 0.035, p.z), q.setFromEuler(e), one); dash.setMatrixAt(i, m);
  }
  g.add(dash);
  return g;
}

/* Little clinic with a glowing cross (start of the journey) */
export function makeClinic() {
  const g = new THREE.Group();
  const wall = plastic(0xb9c6bf, { roughness: 0.75, clearcoat: 0.1 });
  const main = new THREE.Mesh(new RoundedBoxGeometry(5, 3, 3.4, 3, 0.12), wall); main.position.y = 1.5; g.add(main);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(5.3, 0.25, 3.7), plastic(0x0f8a4b)); roof.position.y = 3.1; g.add(roof);
  const crossM = glow(0xff3b4e, 3);
  const c1 = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.28, 0.1), crossM), c2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.9, 0.1), crossM);
  [c1, c2].forEach(c => { c.position.set(0, 2.2, 1.72); g.add(c); });
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.6), new THREE.MeshStandardMaterial({ color: 0x7fd3ff, roughness: 0.1, metalness: 0.3 })); door.position.set(1.4, 0.8, 1.71); g.add(door);
  for (const x of [-1.6, -0.5]) { const w = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), new THREE.MeshStandardMaterial({ color: 0x6fb7d8, emissive: 0x7fd3ff, emissiveIntensity: 0.12 })); w.position.set(x, 1.2, 1.71); g.add(w); }
  return shadow(g);
}
export function makeTree(s = 1) {
  const g = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.8, 8), new THREE.MeshStandardMaterial({ color: 0x5a3d2b, roughness: 0.9 })); trunk.position.y = 0.4; g.add(trunk);
  const leaf = new THREE.MeshStandardMaterial({ color: 0x1f9d5a, roughness: 0.6, flatShading: true });
  [[0.9, 1.3, 1.1], [0.7, 1.1, 1.8], [0.45, 0.8, 2.4]].forEach(([r, h, y]) => { const c = new THREE.Mesh(new THREE.ConeGeometry(r, h, 7), leaf); c.position.y = y; g.add(c); });
  g.scale.setScalar(s);
  return shadow(g);
}

/* ------------------------------------------------ CUTE INFECTIOUS WASTE */
// Kawaii medical-waste characters that pop out of the bin on the home page
function cuteFace(g, x, y, z, s = 1) {
  const eyeM = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: 0.15 });
  const hiM = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const blushM = new THREE.MeshBasicMaterial({ color: 0xff8fb0, transparent: true, opacity: 0.85 });
  for (const sx of [-1, 1]) {
    const e = new THREE.Mesh(new THREE.SphereGeometry(0.05 * s, 14, 10), eyeM);
    e.position.set(x + sx * 0.085 * s, y, z); e.scale.z = 0.55; g.add(e);
    const h = new THREE.Mesh(new THREE.SphereGeometry(0.017 * s, 8, 6), hiM);
    h.position.set(x + sx * 0.085 * s + 0.016 * s, y + 0.02 * s, z + 0.025 * s); g.add(h);
    const b = new THREE.Mesh(new THREE.CircleGeometry(0.032 * s, 16), blushM);
    b.position.set(x + sx * 0.15 * s, y - 0.055 * s, z + 0.004); g.add(b);
  }
  const smile = new THREE.Mesh(new THREE.TorusGeometry(0.035 * s, 0.01 * s, 6, 16, Math.PI), eyeM);
  smile.rotation.z = Math.PI; smile.position.set(x, y - 0.035 * s, z); g.add(smile);
}
const glass = () => new THREE.MeshPhysicalMaterial({ color: 0xcdefff, roughness: 0.08, transparent: true, opacity: 0.45, clearcoat: 1 });
const liquid = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3, emissive: c, emissiveIntensity: 0.15 });

function cuteSyringe() {
  const g = new THREE.Group();
  const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.72, 24), glass()); barrel.rotation.z = Math.PI / 2; g.add(barrel);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.46, 20), liquid(0xe8344a)); fill.rotation.z = Math.PI / 2; fill.position.x = 0.1; g.add(fill);
  const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.36, 12), plastic(0xffffff)); rod.rotation.z = Math.PI / 2; rod.position.x = -0.5; g.add(rod);
  const thumb = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.04, 24), plastic(0xffffff)); thumb.rotation.z = Math.PI / 2; thumb.position.x = -0.69; g.add(thumb);
  const hub = new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.12, 16), plastic(0x7fd3ff)); hub.rotation.z = -Math.PI / 2; hub.position.x = 0.42; g.add(hub);
  const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.32, 8), metal(0xdfe6e3, 0.2)); needle.rotation.z = Math.PI / 2; needle.position.x = 0.63; g.add(needle);
  cuteFace(g, 0.05, 0.02, 0.145, 1);
  return g;
}
function cuteCapsule(c = 0xe8344a) {
  const g = new THREE.Group();
  const white = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.36, 8, 20), plastic(0xfafafa)); white.rotation.z = Math.PI / 2; g.add(white);
  const half = new THREE.Mesh(new THREE.CapsuleGeometry(0.176, 0.18, 8, 20), plastic(c)); half.rotation.z = Math.PI / 2; half.position.x = 0.09; g.add(half);
  cuteFace(g, -0.02, 0.02, 0.172, 0.95);
  return g;
}
function cuteMask() {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.38, 0.09, 3, 0.04), plastic(0x8fd3ff, { roughness: 0.6, clearcoat: 0.2 })); g.add(body);
  for (const y of [-0.08, 0.0]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.012, 0.1), plastic(0xbfe8ff)); p.position.y = y - 0.04; g.add(p); }
  for (const sx of [-1, 1]) { const l = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.014, 8, 24), plastic(0xffffff)); l.position.x = sx * 0.37; g.add(l); }
  cuteFace(g, 0, 0.08, 0.05, 0.9);
  return g;
}
function cuteBandage() {
  const g = new THREE.Group();
  const strip = new THREE.Mesh(new RoundedBoxGeometry(0.74, 0.24, 0.05, 3, 0.1), plastic(0xf2c9a0, { roughness: 0.7, clearcoat: 0.1 })); g.add(strip);
  const pad = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.2, 0.06, 2, 0.04), plastic(0xfff0e2, { roughness: 0.8 })); pad.position.z = 0.01; g.add(pad);
  cuteFace(g, 0, 0.015, 0.045, 0.85);
  return g;
}
function cuteTube() {
  const g = new THREE.Group();
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.56, 20, 1, true), glass()); g.add(tube);
  const bottom = new THREE.Mesh(new THREE.SphereGeometry(0.11, 20, 10, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), glass()); bottom.position.y = -0.28; g.add(bottom);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.095, 0.3, 18), liquid(0xe8344a)); fill.position.y = -0.14; g.add(fill);
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.125, 0.125, 0.1, 20), plastic(0xb7f34a)); cap.position.y = 0.31; g.add(cap);
  cuteFace(g, 0, 0.08, 0.115, 0.8);
  return g;
}
function cuteBag() {
  const g = new THREE.Group();
  const m = plastic(0xe0303a, { roughness: 0.45, clearcoat: 0.6 });
  const bag = new THREE.Mesh(new THREE.SphereGeometry(0.3, 28, 18), m); bag.scale.set(1, 0.9, 0.85); g.add(bag);
  const knot = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.2, 14), m); knot.position.y = 0.32; g.add(knot);
  for (const sx of [-1, 1]) { const ear = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), m); ear.position.set(sx * 0.07, 0.43, 0); ear.scale.set(1, 0.6, 0.6); g.add(ear); }
  cuteFace(g, 0, 0.02, 0.255, 1.05);
  return g;
}
export function makeCuteWaste() {
  const kinds = [cuteSyringe, () => cuteCapsule(0xe8344a), cuteMask, cuteBandage, cuteTube, cuteBag,
                 cuteBag, () => cuteCapsule(0x5bc0ff), cuteSyringe, cuteTube, () => cuteCapsule(0xb7f34a), cuteMask];
  return kinds.map(k => shadow(k()));
}

/* ------------------------------------------------ SERVICE STATIONS (v2) */
function canvasTex(w, h, draw) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
let _bagTex;
function bagTexture() {
  if (_bagTex) return _bagTex;
  // canvas wraps once around the bag (~3.5 units) and spans its height (~1.04), so 1024x288 keeps shapes round
  return (_bagTex = canvasTex(1024, 288, (x, w, h) => {
    x.fillStyle = '#d8232f'; x.fillRect(0, 0, w, h);
    const R = 46;                                         // standard biohazard trefoil, drawn in black
    x.save(); x.translate(w / 2, h * 0.44); x.fillStyle = '#141414';
    for (let i = 0; i < 3; i++) {
      x.save(); x.rotate(i * Math.PI * 2 / 3);
      x.beginPath(); x.arc(0, -R * 0.44, R * 0.48, 0, Math.PI * 2); x.fill();
      x.globalCompositeOperation = 'destination-out';
      x.beginPath(); x.arc(0, -R * 0.56, R * 0.35, 0, Math.PI * 2); x.fill();
      x.globalCompositeOperation = 'source-over'; x.restore();
    }
    x.globalCompositeOperation = 'destination-out';
    x.beginPath(); x.arc(0, 0, R * 0.16, 0, Math.PI * 2); x.fill();
    x.globalCompositeOperation = 'source-over';
    x.strokeStyle = '#141414'; x.lineWidth = R * 0.09;
    for (let i = 0; i < 3; i++) {                         // broken inner ring between the blades
      const a = i * Math.PI * 2 / 3 + Math.PI / 6;
      x.beginPath(); x.arc(0, 0, R * 0.34, a + 0.28, a + Math.PI * 2 / 3 - 0.28); x.stroke();
    }
    x.restore();
    x.fillStyle = '#141414'; x.textAlign = 'center';
    x.font = 'bold 30px Prompt, sans-serif'; x.fillText('ขยะติดเชื้อ', w / 2, h * 0.44 + R + 38);
    x.font = 'bold 17px Prompt, sans-serif'; x.fillText('INFECTIOUS WASTE', w / 2, h * 0.44 + R + 60);
    x.fillStyle = 'rgba(0,0,0,.08)'; for (let i = 0; i < 40; i++) x.fillRect(i * 26, 0, 2, h); // faint film texture
  }));
}
function redBag(s = 1) {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.34, 0.02], [0.5, 0.12], [0.57, 0.3], [0.56, 0.52], [0.48, 0.7], [0.32, 0.84], [0.15, 0.94], [0.08, 1.0], [0.07, 1.04]]
    .map(([r, y]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(prof, 48, -Math.PI, Math.PI * 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {                   // plastic wrinkles: pleats that gather toward the neck
    const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i), a = Math.atan2(x, z);
    const k = 1 + 0.045 * Math.sin(a * 9 + y * 4) * Math.min(1, y * 1.6) + 0.02 * Math.sin(a * 23 + y * 11);
    pos.setX(i, x * k); pos.setZ(i, z * k * 0.9);
  }
  geo.computeVertexNormals();
  const m = new THREE.MeshPhysicalMaterial({ map: bagTexture(), roughness: 0.42, clearcoat: 0.7, clearcoatRoughness: 0.35, sheen: 0.3 });
  g.add(new THREE.Mesh(geo, m));
  const neckM = plastic(0xc81f2a, { roughness: 0.5 });
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.075, 0.16, 12), neckM); neck.position.y = 1.08; neck.rotation.y = 0.6; g.add(neck);
  for (const sx of [-1, 1]) {                             // the two flaps left after tying the bag
    const flap = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 10, 1, true), neckM);
    flap.position.set(sx * 0.1, 1.24, 0); flap.rotation.z = sx * -0.9; flap.rotation.x = Math.PI; flap.scale.z = 0.35; g.add(flap);
  }
  const tie = new THREE.Mesh(new THREE.TorusGeometry(0.065, 0.022, 8, 20), plastic(0xf5c518)); tie.rotation.x = Math.PI / 2; tie.position.y = 1.11; g.add(tie);
  g.scale.setScalar(s); return shadow(g);
}

// 01 infectious: bin with a working lid + red bags
export function stationInfectious(label) {
  const g = new THREE.Group();
  const bin = makeBin(label); g.add(bin);
  [[-1.25, 0.3, 0.8], [1.2, 0.2, 0.9], [1.0, -0.6, 0.65]].forEach(([x, z, s]) => { const b = redBag(s); b.position.set(x, 0, z); b.rotation.y = x * 0.18; g.add(b); });
  g.userData.update = t => { bin.userData.lid.rotation.x = -Math.max(0, Math.sin(t * 1.3)) * 1.1; };
  return g;
}
// 02 hazardous: orange hazardous-waste bin + what actually goes in it —
// chemical bottles, a mercury thermometer, a fluorescent tube, and syringes dropping into a sharps box
export function stationHazard() {
  const g = new THREE.Group();
  const binLabel = canvasTex(372, 501, (x, w, h) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#111'; x.fillRect(0, 0, w, 110);
    x.fillStyle = '#f5c518'; x.font = 'bold 64px Prompt, sans-serif'; x.textAlign = 'center'; x.fillText('ขยะอันตราย', w / 2, 76);
    x.save(); x.translate(w / 2, 270); x.rotate(Math.PI / 4);
    x.fillStyle = '#f29a1e'; x.fillRect(-95, -95, 190, 190); x.strokeStyle = '#111'; x.lineWidth = 10; x.strokeRect(-95, -95, 190, 190); x.restore();
    x.fillStyle = '#111'; x.font = 'bold 150px sans-serif'; x.fillText('!', w / 2, 322);
    x.font = 'bold 30px Prompt, sans-serif'; x.fillText('HAZARDOUS WASTE', w / 2, 455);
  });
  const bin = makeBin(binLabel, 0xf29a1e); bin.scale.setScalar(0.85); bin.position.set(-0.9, 0, -0.3); g.add(bin);

  const ghs = canvasTex(128, 128, (x) => {
    x.fillStyle = '#fff'; x.fillRect(0, 0, 128, 128); x.translate(64, 64); x.rotate(Math.PI / 4);
    x.strokeStyle = '#e0202e'; x.lineWidth = 9; x.strokeRect(-36, -36, 72, 72); x.rotate(-Math.PI / 4);
    x.fillStyle = '#111'; x.font = 'bold 56px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('!', 0, 3);
  });
  const amber = new THREE.MeshPhysicalMaterial({ color: 0x9a4a12, roughness: 0.1, transparent: true, opacity: 0.75, clearcoat: 1 });
  [[0.35, 0.55, 1.0], [0.75, 0.75, 0.8]].forEach(([x, z, s]) => {
    const b = new THREE.Group(); b.position.set(x, 0, z); b.scale.setScalar(s);
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.55, 28), amber); body.position.y = 0.28; b.add(body);
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.2, 0.14, 24), amber); neck.position.y = 0.62; b.add(neck);
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.1, 20), plastic(0xffffff)); cap.position.y = 0.74; b.add(cap);
    const lab = new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.26), new THREE.MeshStandardMaterial({ map: ghs, color: 0xcccccc })); lab.position.set(0, 0.3, 0.225); b.add(lab);
    g.add(b);
  });
  // mercury thermometer lying on the tray
  const thermo = new THREE.Group(); thermo.position.set(0.55, 0.05, 1.15); thermo.rotation.y = 0.5;
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.9, 12), glass()); tube.rotation.z = Math.PI / 2; thermo.add(tube);
  const merc = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.55, 8), metal(0xe6ecea, 0.05)); merc.rotation.z = Math.PI / 2; merc.position.x = -0.12; thermo.add(merc);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.055, 14, 10), metal(0xe6ecea, 0.05)); bulb.position.x = -0.45; thermo.add(bulb);
  g.add(thermo);
  // fluorescent tube (contains mercury)
  const lamp = new THREE.Group(); lamp.position.set(-0.2, 0.08, 1.2); lamp.rotation.y = -0.25;
  const glassT = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.5, 16), new THREE.MeshStandardMaterial({ color: 0xf4fbff, emissive: 0xdff4ff, emissiveIntensity: 0.25, roughness: 0.3 })); glassT.rotation.z = Math.PI / 2; lamp.add(glassT);
  for (const sx of [-1, 1]) { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.1, 16), metal(0xb8c2be)); e.rotation.z = Math.PI / 2; e.position.x = sx * 0.78; lamp.add(e); }
  g.add(lamp);
  // sharps container with syringes dropping in
  const sharps = new THREE.Group(); sharps.position.set(1.35, 0, -0.35);
  const sb = new THREE.Mesh(new RoundedBoxGeometry(0.75, 0.7, 0.55, 2, 0.06), plastic(0xf5c518)); sb.position.y = 0.35; sharps.add(sb);
  const sl = new THREE.Mesh(new RoundedBoxGeometry(0.78, 0.12, 0.58, 2, 0.04), plastic(0xd61f2c)); sl.position.y = 0.74; sharps.add(sl);
  const slot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.02, 0.1), new THREE.MeshStandardMaterial({ color: 0x111111 })); slot.position.y = 0.805; sharps.add(slot);
  g.add(sharps);
  const syr = [0, 1, 2].map(i => {
    const sGroup = new THREE.Group();
    const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.42, 14), glass()); sGroup.add(barrel);
    const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, 0.22, 12), new THREE.MeshStandardMaterial({ color: 0xe8344a })); fill.position.y = -0.05; sGroup.add(fill);
    const plunger = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 14), plastic(0xffffff)); plunger.position.y = 0.23; sGroup.add(plunger);
    const needle = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.2, 6), metal(0xdfe6e3, 0.1)); needle.position.y = -0.31; sGroup.add(needle);
    sGroup.userData.o = i / 3; g.add(sGroup); return sGroup;
  });
  const tray = new THREE.Mesh(new RoundedBoxGeometry(3.6, 0.08, 2.9, 2, 0.04), plastic(0x2a302d, { roughness: 0.7 })); tray.position.set(0.1, 0.04, 0.3); tray.receiveShadow = true; g.add(tray);
  g.userData.update = t => {
    syr.forEach(o => {
      const k = (t * 0.35 + o.userData.o) % 1;               // hover, tip down, drop through the slot
      o.visible = k < 0.9;
      o.position.set(1.35, 2.0 - Math.max(0, k - 0.4) * 2.4, -0.35);
      o.rotation.set(0, t, k < 0.4 ? Math.sin(t * 2 + o.userData.o * 6) * 0.3 : 0);
    });
    bin.userData.lid.rotation.x = -Math.max(0, Math.sin(t * 1.1)) * 0.9;
  };
  return shadow(g);
}
// 03 training: slide screen on a stand + podium + graduation cap over a book stack
export function stationTraining() {
  const g = new THREE.Group();
  const slide = canvasTex(512, 300, (x, w, h) => {
    x.fillStyle = '#0a2419'; x.fillRect(0, 0, w, h);
    x.fillStyle = '#b7f34a'; x.font = 'bold 34px Prompt, sans-serif'; x.fillText('การคัดแยกขยะติดเชื้อ', 28, 56);
    [['#d61f2c', 'ติดเชื้อ'], ['#f5c518', 'อันตราย'], ['#1e5fd6', 'ทั่วไป'], ['#19b865', 'รีไซเคิล']].forEach(([c, t], i) => {
      x.fillStyle = c; x.fillRect(34 + i * 118, 100, 86, 110); x.fillStyle = '#fff'; x.font = '22px Prompt, sans-serif'; x.fillText(t, 38 + i * 118, 245);
    });
    x.fillStyle = 'rgba(183,243,74,.6)'; x.fillRect(28, 268, 300, 8);
  });
  const frame = new THREE.Mesh(new RoundedBoxGeometry(2.7, 1.7, 0.12, 3, 0.05), plastic(0x1c2420)); frame.position.set(-0.5, 2.1, -0.3); g.add(frame);
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.5), new THREE.MeshBasicMaterial({ map: slide, toneMapped: false })); screen.position.set(-0.5, 2.1, -0.235); g.add(screen);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.3, 12), metal(0x9aa6a2)); pole.position.set(-0.5, 0.65, -0.3); g.add(pole);
  const foot = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.55, 0.06, 24), metal(0x3a423e)); foot.position.set(-0.5, 0.03, -0.3); g.add(foot);
  const podium = new THREE.Mesh(new RoundedBoxGeometry(0.9, 1.15, 0.6, 2, 0.06), plastic(0x0f8a4b)); podium.position.set(1.25, 0.58, 0.4); podium.rotation.y = -0.5; g.add(podium);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.92, 0.08, 0.62), glow(0xb7f34a, 2)); stripe.position.copy(podium.position).setY(0.95); stripe.rotation.y = -0.5; g.add(stripe);
  const cap = makeGradCap(); cap.scale.setScalar(0.55); cap.position.set(1.25, 1.15, 0.4); g.add(cap);
  g.userData.update = t => { cap.rotation.y = t * 0.8; cap.position.y = 1.15 + Math.sin(t * 2) * 0.06; };
  return shadow(g);
}
// 04 sanitary: pedal bin whose lid flips open + a pack of disposal bags
export function stationSanitary() {
  const g = new THREE.Group();
  const pink = plastic(0xf6c9d8), white = plastic(0xffffff);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.55, 1.5, 48), pink); body.position.y = 0.95; g.add(body);
  // open-ended band + recessed dark opening: no two faces share the top plane (that caused the stripes)
  const band = new THREE.Mesh(new THREE.CylinderGeometry(0.635, 0.635, 0.12, 48, 1, true), metal(0xdfe6e3, 0.2)); band.position.y = 1.64; g.add(band);
  const mouth = new THREE.Mesh(new THREE.CircleGeometry(0.56, 48), new THREE.MeshStandardMaterial({ color: 0x2a1c22, roughness: 0.9 })); mouth.rotation.x = -Math.PI / 2; mouth.position.y = 1.712; g.add(mouth);
  const hinge = new THREE.Group(); hinge.position.set(0, 1.72, -0.62); g.add(hinge);
  const lid = new THREE.Mesh(new THREE.SphereGeometry(0.64, 48, 16, 0, Math.PI * 2, 0, Math.PI / 2), white); lid.scale.y = 0.3; lid.position.z = 0.62; hinge.add(lid);
  const base = new THREE.Mesh(new THREE.CylinderGeometry(0.58, 0.6, 0.2, 48), white); base.position.y = 0.1; g.add(base);
  const pedal = new THREE.Mesh(new RoundedBoxGeometry(0.46, 0.07, 0.3, 2, 0.03), metal(0xcfd8d4)); pedal.position.set(0, 0.16, 0.66); g.add(pedal);
  const emblem = new THREE.Group(); emblem.position.set(0, 1.05, 0.6);
  const em = glow(0xff6fa5, 1.6);
  emblem.add(new THREE.Mesh(new RoundedBoxGeometry(0.34, 0.1, 0.04, 2, 0.02), em), new THREE.Mesh(new RoundedBoxGeometry(0.1, 0.34, 0.04, 2, 0.02), em)); g.add(emblem);
  const pack = new THREE.Mesh(new RoundedBoxGeometry(0.7, 0.5, 0.45, 3, 0.08), plastic(0xffe3ee, { roughness: 0.6 })); pack.position.set(1.15, 0.25, 0.4); pack.rotation.y = -0.4; g.add(pack);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.08, 0.47), plastic(0xff6fa5)); ribbon.position.copy(pack.position).setY(0.36); ribbon.rotation.y = -0.4; g.add(ribbon);
  g.userData.update = t => { const o = Math.max(0, Math.sin(t * 1.1)); hinge.rotation.x = -o * 1.2; pedal.position.y = 0.16 - o * 0.06; };
  return shadow(g);
}
// 05 equipment: colour-coded bins, sharps container, bag roll
export function stationEquipment(label) {
  const g = new THREE.Group();
  [[0xd61f2c, -1.05, 0, label], [0xf5c518, 0, -0.45, null], [0x1e5fd6, 1.05, 0, null]].forEach(([c, x, z, l]) => {
    const b = makeBin(l, c); b.scale.setScalar(0.52); b.position.set(x, 0, z); g.add(b);
  });
  const sharps = new THREE.Group(); sharps.position.set(-0.5, 0, 1.05);
  const sb = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.55, 0.45, 2, 0.05), plastic(0xf5c518)); sb.position.y = 0.28; sharps.add(sb);
  const sl = new THREE.Mesh(new RoundedBoxGeometry(0.62, 0.1, 0.47, 2, 0.03), plastic(0xd61f2c)); sl.position.y = 0.6; sharps.add(sl);
  g.add(sharps);
  const roll = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.7, 24), plastic(0xd8232f, { roughness: 0.5 })); roll.rotation.z = Math.PI / 2; roll.position.set(0.55, 0.22, 1.05); g.add(roll);
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.72, 12), plastic(0xffffff)); core.rotation.z = Math.PI / 2; core.position.copy(roll.position); g.add(core);
  return shadow(g);
}
// 06 documents: shredder + PDPA padlock shield hovering over a paper stack
export function stationDocs() {
  const g = new THREE.Group();
  const shred = makeShredder(); shred.position.x = -0.6; g.add(shred);
  const stack = new THREE.Group(); stack.position.set(1.0, 0, 0.3);
  for (let i = 0; i < 8; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 1.2), new THREE.MeshStandardMaterial({ color: i % 2 ? 0xf4f1e6 : 0xffffff, roughness: 0.8 })); s.position.y = 0.03 + i * 0.055; s.rotation.y = (i % 3 - 1) * 0.05; stack.add(s); }
  g.add(stack);
  const lock = new THREE.Group(); lock.position.set(1.0, 1.5, 0.3);
  const body = new THREE.Mesh(new RoundedBoxGeometry(0.6, 0.5, 0.22, 3, 0.06), glow(0xb7f34a, 1.4)); lock.add(body);
  const shackle = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.05, 10, 24, Math.PI), metal(0xdfe6e3, 0.2)); shackle.position.y = 0.25; lock.add(shackle);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.24, 12), new THREE.MeshStandardMaterial({ color: 0x0a2419 })); hole.rotation.x = Math.PI / 2; lock.add(hole);
  g.add(lock);
  g.userData.update = t => { shred.userData.update(t); lock.rotation.y = t * 1.1; lock.position.y = 1.5 + Math.sin(t * 2) * 0.08; };
  return shadow(g);
}
