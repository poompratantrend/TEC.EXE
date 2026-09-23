import { createStage, tex, smooth, makeFloor, makeBin, makeCoin, makeTruck, makeRings, makeDust, makeCuteWaste, isMobile } from '../kit.js';

export default function home(canvas) {
  const S = createStage(canvas, { cam: [0, 3.2, 13], bloom: 0.5 });
  if (!S) return null;
  const { scene, camera, mouse } = S;
  scene.add(makeFloor());
  const bin = makeBin(tex('assets/biohazard-label.png'));
  bin.scale.setScalar(1.35); scene.add(bin);
  const logo = tex('assets/itec-logo.png');
  const coin = makeCoin(tex('assets/trend-e.png'), 0.95); coin.position.set(2.7, 4.6, -1.6); scene.add(coin);
  const rings = makeRings([2.1, 2.5, 2.85]); rings.position.y = 2.1; scene.add(rings);
  const truck = makeTruck(logo); truck.scale.setScalar(0.42); scene.add(truck);
  const dust = makeDust(700, 34); scene.add(dust);
  // cute infectious-waste characters that spiral out of the bin while the lid is open
  const toys = makeCuteWaste();
  toys.forEach((o, i) => { o.visible = false; o.userData.base = 0.95; o.userData.dir = i % 2 ? 1 : -1; o.userData.a0 = i * 2.4; scene.add(o); });
  const MOUTH = 2.26 * 1.35, P = 6.8, OPEN_AT = 0.5, CLOSE_AT = 4.9, FLY = 2.4, GAP = 0.17;
  const clamp01 = v => Math.max(0, Math.min(1, v));

  S.onResize.push((w, h) => {
    // model sits right of the text on desktop, below it on mobile
    if (isMobile()) camera.setViewOffset(w, h, 0, h * 0.06, w, h);
    else camera.setViewOffset(w, h, -w * 0.17, 0, w, h);
  });
  S.onResize.forEach(f => f(canvas.clientWidth, canvas.clientHeight));

  S.onFrame(t => {
    bin.rotation.y = Math.sin(t * 0.35) * 0.3 + mouse.x * 0.5;
    const ph = t % P;
    const lid = smooth(clamp01((ph - 0.1) / 0.4)) * (1 - smooth(clamp01((ph - CLOSE_AT) / 0.45)));
    bin.userData.lid.rotation.x = -lid * 1.25;
    bin.position.y = Math.max(0, Math.sin(ph * 14) * 0.06 * (1 - clamp01(ph - 0.3)));   // little hop as it opens
    toys.forEach((o, i) => {
      const u = (ph - OPEN_AT - i * GAP) / FLY;                  // 0..1 flight progress
      if (u <= 0 || u >= 1) { o.visible = false; return; }
      o.visible = true;
      const k = Math.sin(Math.PI * u), d = o.userData;
      const ang = d.a0 + d.dir * u * Math.PI * 2.2, r = 1.9 * k;
      o.position.set(Math.cos(ang) * r, MOUTH + 0.15 + 1.35 * Math.pow(k, 0.7), Math.sin(ang) * r * 0.7 + 0.9 * k); // arcs in front of the open lid
      const pop = Math.min(1, u * 9, (1 - u) * 9);
      const stretch = 1 + Math.cos(Math.PI * u) * 0.12;          // squash & stretch
      o.scale.set(d.base * pop / Math.sqrt(stretch), d.base * pop * stretch, d.base * pop);
      o.rotation.set(Math.sin(t * 3 + i) * 0.25, Math.sin(t * 2 + i) * 0.5, d.dir * u * Math.PI * 1.5);
    });
    coin.rotation.y = t * 1.3; coin.position.y = 4.6 + Math.sin(t * 1.4) * 0.2;
    rings.userData.update(t);
    dust.userData.update(t);
    const a = t * 0.35, RX = 3.6, RZ = 3.8;          // ellipse around the bin, clear of bin + rings
    truck.position.set(Math.cos(a) * RX, 0, Math.sin(a) * RZ);
    truck.rotation.y = Math.atan2(-Math.cos(a) * RZ, -Math.sin(a) * RX); // face along the path
    truck.userData.update(t, 1.2);
    const sc = Math.min(scrollY / innerHeight, 1);
    const z = isMobile() ? 21 : 15;
    camera.position.set(mouse.x * 2.2, 3.9 - mouse.y * 1.0 + sc * 3, z + sc * 4);
    camera.lookAt(0, 2.9 - sc, 0);
  });
  return S;
}
