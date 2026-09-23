// Six service stations along one glowing road. Picking a service drives the I-TEC truck
// (and the camera) along the road to that station, so the services read as one connected network.
import { createStage, THREE, tex, smooth, makeFloor, makePedestal, makeDust, makeRoad, makeTruck, makeTree,
  stationInfectious, stationHazard, stationTraining, stationSanitary, stationEquipment, stationDocs, isMobile } from '../kit.js';

export default function services(canvas) {
  const S = createStage(canvas, { cam: [0, 4, 12], bloom: 0.45, fogNear: 14, fogFar: 48 });
  if (!S) return null;
  const { scene, camera, mouse, key } = S;

  const curve = new THREE.CatmullRomCurve3([[-4, 3], [8, 0], [18, 3], [28, 0], [38, 3], [48, 0], [58, 3], [70, 0]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
  const at = u => { const tan = curve.getTangentAt(u); return { p: curve.getPointAt(u), tan, side: new THREE.Vector3().crossVectors(tan, new THREE.Vector3(0, 1, 0)).normalize() }; };
  const faceTo = v => Math.atan2(v.x, v.z);

  const floor = makeFloor(200); floor.position.x = 33; scene.add(floor);
  const dust = makeDust(1200, 110); dust.position.x = 33; scene.add(dust);
  key.position.set(33, 16, 12); key.target.position.set(33, 0, 0);
  Object.assign(key.shadow.camera, { left: -45, right: 45, top: 20, bottom: -20 }); key.shadow.camera.updateProjectionMatrix();
  scene.add(makeRoad(curve, 3.4));

  const label = tex('assets/biohazard-label.png');
  const builders = [() => stationInfectious(label), stationHazard, stationTraining, stationSanitary, () => stationEquipment(label), stationDocs];
  const U = builders.map((_, i) => 0.08 + i * 0.165);           // where each station sits on the road
  const items = builders.map((make, i) => {
    const f = at(U[i]);
    const g = new THREE.Group();
    g.position.copy(f.p).addScaledVector(f.side, -4.2); g.rotation.y = faceTo(f.side);
    const ped = makePedestal(2.1); g.add(ped);
    const m = make(); m.position.y = 0.36; m.scale.setScalar(1.3); g.add(m);
    const spot = new THREE.SpotLight(0xffffff, 0, 16, 0.55, 0.6); spot.position.set(0, 8, 3); spot.target = m; g.add(spot);
    // short glowing spur from the road to the pedestal
    const spur = new THREE.Mesh(new THREE.PlaneGeometry(0.12, 2.2), new THREE.MeshStandardMaterial({ color: 0xb7f34a, emissive: 0xb7f34a, emissiveIntensity: 0.9 }));
    spur.rotation.x = -Math.PI / 2; spur.position.set(0, 0.04, 2.6); g.add(spur);
    scene.add(g);
    return { g, m, ped, spot, spur };
  });
  for (let i = 0; i < 16; i++) {                                 // trees behind the stations (camera sits on the other side)
    const f = at(0.02 + i * 0.062), t = makeTree(0.8 + (i % 4) * 0.15);
    t.position.copy(f.p).addScaledVector(f.side, -(8.5 + (i % 3) * 1.5)); scene.add(t);
  }

  const truck = makeTruck(tex('assets/itec-logo.png')); truck.scale.setScalar(0.62); scene.add(truck);
  const pulseM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xb7f34a, emissiveIntensity: 1.6 });
  const pulses = Array.from({ length: 18 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 8), pulseM); m.userData.o = i / 18; scene.add(m); return m; });

  S.onResize.push((w, h) => {
    if (isMobile()) camera.setViewOffset(w, h, 0, h * 0.02, w, h);
    else camera.setViewOffset(w, h, w * 0.02, 0, w, h);
  });
  S.onResize.forEach(f => f(canvas.clientWidth, canvas.clientHeight));

  let sel = window.currentService ?? 0, uFrom = U[sel], uTo = U[sel], k = 1;
  addEventListener('service', e => { uFrom = uNow; uTo = U[e.detail]; sel = e.detail; k = 0; });
  let uNow = uTo;
  const look = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);

  S.onFrame((t, dt) => {
    const dist = Math.abs(uTo - uFrom);
    k = Math.min(1, k + dt / (0.8 + dist * 3.5));                  // longer trips take a bit longer
    uNow = uFrom + (uTo - uFrom) * smooth(k);
    const f = at(uNow), dir = Math.sign(uTo - uFrom) || 1;

    // truck drives along the road (just ahead of the camera focus), parks at the chosen station
    // always faces forward along the road; going back to an earlier station it reverses instead of U-turning
    const tf = at(uNow);                                               // parks right in front of the chosen station
    truck.position.copy(tf.p).addScaledVector(tf.side, -0.8);            // left lane
    truck.rotation.y = faceTo(tf.tan) - Math.PI / 2;
    truck.userData.update(t, k < 1 ? 2 * dir : 0);

    // camera: focus drifts from road to the station while arriving
    const st = items[sel].g.position;
    const arrive = smooth(Math.max(0, (k - 0.55) / 0.45));
    look.copy(truck.position).lerp(st, 0.55 * arrive).setY(1.7);      // follow the truck, then frame truck + station together
    const zoom = isMobile() ? 1.35 : 1;
    const off = f.side.clone().multiplyScalar(11.5 * zoom).addScaledVector(up, (4.3 + Math.sin(Math.PI * k) * 2.2) * zoom);
    camera.position.copy(look).add(off).add(new THREE.Vector3(mouse.x * 1.2, -mouse.y * 0.8, 0));
    camera.lookAt(look);

    items.forEach((it, i) => {
      const on = i === sel && k > 0.6;
      it.m.rotation.y = Math.sin(t * 0.45 + i) * 0.35;           // gentle sway, always facing the camera
      it.spot.intensity += ((on ? 35 : 0) - it.spot.intensity) * 0.08;
      it.ped.userData.ring.material.emissiveIntensity = on ? 2.4 + Math.sin(t * 4) * 0.8 : 0.6;
      it.spur.material.emissiveIntensity = on ? 1.8 : 0.5;
      it.m.userData.update?.(t);
    });
    pulses.forEach(m => { const q = (t * 0.035 + m.userData.o) % 1; m.position.copy(curve.getPointAt(q)); m.position.y = 0.1; });
  });
  return S;
}
