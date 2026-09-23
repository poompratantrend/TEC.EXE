import { createStage, makeFloor, makeCity, makeDust, isMobile } from '../kit.js';

export default function contact(canvas) {
  const S = createStage(canvas, { cam: [10, 14, 18], bloom: 0.5, fogNear: 16, fogFar: 50 });
  if (!S) return null;
  const { scene, camera, mouse } = S;
  scene.add(makeFloor(90));
  const city = makeCity(isMobile() ? 140 : 260, 40); scene.add(city);
  scene.add(makeDust(500, 40));
  S.onResize.push((w, h) => {
    if (isMobile()) camera.setViewOffset(w, h, 0, -h * 0.2, w, h);
    else camera.setViewOffset(w, h, -w * 0.22, 0, w, h);
  });
  S.onResize.forEach(f => f(canvas.clientWidth, canvas.clientHeight));
  S.onFrame((t, dt) => {
    city.userData.update(t, dt);
    const a = t * 0.08 + mouse.x * 0.5;
    camera.position.set(Math.sin(a) * 20, 13 - mouse.y * 3, Math.cos(a) * 20);
    camera.lookAt(0, 2, 0);
  });
  return S;
}
