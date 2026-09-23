import { createStage, THREE, tex, makeFloor, makePedestal, makeTrophy, makeCoin, makePlaque, makeDust, makeRings, isMobile } from '../kit.js';

export default function about(canvas) {
  const S = createStage(canvas, { cam: [0, 3.5, 12], bloom: 0.45 });
  if (!S) return null;
  const { scene, camera, mouse } = S;
  scene.add(makeFloor());
  scene.add(makeDust(600, 30));
  scene.add(makePedestal(1.6));
  const trophy = makeTrophy(); trophy.position.y = 0.36; scene.add(trophy);
  const rings = makeRings([3.6, 4.1]); rings.position.y = 2.6; scene.add(rings);
  const orbiters = [
    makeCoin(tex('assets/trend-e.png'), 0.9),
    makePlaque(tex('assets/iso-badges.png'), 1.5, 1.1),
    makePlaque(tex('assets/itec-logo.png'), 1.35, 1.34)   // full I-TEC logo, square so nothing is cropped
  ];
  orbiters.forEach(o => scene.add(o));
  const spot = new THREE.SpotLight(0xe8fff0, 28, 20, 0.45, 0.5); spot.position.set(0, 10, 4); spot.target = trophy; scene.add(spot);

  S.onResize.push((w, h) => {
    if (isMobile()) camera.clearViewOffset();
    else camera.setViewOffset(w, h, -w * 0.24, 0, w, h);
  });
  S.onResize.forEach(f => f(canvas.clientWidth, canvas.clientHeight));

  S.onFrame(t => {
    trophy.rotation.y = t * 0.45 + mouse.x * 0.8;
    trophy.userData.crystal.position.y = 2.9 + Math.sin(t * 1.5) * 0.08;
    orbiters.forEach((o, i) => {
      const a = t * 0.5 + i * (Math.PI * 2 / 3);
      o.position.set(Math.cos(a) * 2.7, 2.7 + Math.sin(t * 1.2 + i) * 0.35, Math.sin(a) * 2.7);
      o.lookAt(camera.position.x, o.position.y, camera.position.z);
      if (i === 0) o.rotateY(t * 2);
    });
    rings.userData.update(t);
    camera.position.set(mouse.x * 1.5, 3.5 - mouse.y, isMobile() ? 24 : 13.5);
    camera.lookAt(0, 2.4, 0);
  });
  return S;
}
