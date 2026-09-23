// One continuous story driven by scroll progress p (0..3):
// clinic → cute waste hops into the cheeky bin → bin loaded onto truck → truck drives the road
// → waste jumps into the incinerator → E-Manifest hologram rises.
import { createStage, THREE, tex, smooth, makeFloor, makeBin, makeTruck, makeIncinerator, makeHolo, makeDust,
  makeRoad, makeClinic, makeTree, makeCuteWaste, isMobile } from '../kit.js';

const clamp01 = v => Math.max(0, Math.min(1, v));
const seg = (p, a, b) => smooth(clamp01((p - a) / (b - a)));

export default function process(canvas) {
  const S = createStage(canvas, { cam: [0, 5, 14], bloom: 0.5, fogNear: 22, fogFar: 75 });
  if (!S) return null;
  const { scene, camera, mouse, key } = S;

  const curve = new THREE.CatmullRomCurve3([[-8, 2], [4, 2.5], [14, 0], [24, -6], [36, -9], [48, -6], [58, -1], [68, 1]]
    .map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'catmullrom', 0.5);
  const U0 = 0.12, U1 = 0.86;                         // truck parking spots: clinic, incinerator dock
  const at = u => ({ p: curve.getPointAt(u), tan: curve.getTangentAt(u), side: new THREE.Vector3().crossVectors(curve.getTangentAt(u), new THREE.Vector3(0, 1, 0)).normalize() });
  const faceTo = v => Math.atan2(v.x, v.z);           // rotation.y that points local +z along v

  const floor = makeFloor(220); floor.position.set(30, 0, -3); scene.add(floor);
  const dust = makeDust(1500, 120); dust.position.x = 30; scene.add(dust);
  key.position.set(30, 18, 14); key.target.position.set(30, 0, -3);
  Object.assign(key.shadow.camera, { left: -48, right: 48, top: 28, bottom: -28 }); key.shadow.camera.updateProjectionMatrix();

  scene.add(makeRoad(curve));
  for (let i = 0; i < 26; i++) {                     // trees along both sides, clear of the two stations
    const u = 0.04 + (i / 26) * 0.92;
    if (Math.abs(u - U0) < 0.07 || Math.abs(u - U1) < 0.08) continue;
    const f = at(u), sd = i % 2 ? 1 : -1, tree = makeTree(0.8 + ((i * 37) % 10) / 20);
    tree.position.copy(f.p).addScaledVector(f.side, sd * (4.2 + (i % 3))); scene.add(tree);
  }

  const label = tex('assets/biohazard-label.png'), logo = tex('assets/itec-logo.png');
  // station 1: clinic + cheeky bin
  const A = at(U0);
  const clinic = makeClinic(); clinic.position.copy(A.p).addScaledVector(A.side, -6.5).addScaledVector(A.tan, -6.5); clinic.rotation.y = faceTo(A.side); scene.add(clinic);
  const binHome = A.p.clone().addScaledVector(A.side, -2.6).addScaledVector(A.tan, -2.4);
  const bin = makeBin(label); bin.position.copy(binHome); bin.rotation.y = faceTo(A.side); scene.add(bin);
  clinic.updateMatrixWorld(true);                    // world matrix must be current before localToWorld
  const door = clinic.localToWorld(new THREE.Vector3(1.4, 0.5, 2.0));

  // truck
  const truck = makeTruck(logo); scene.add(truck);
  // station 2: incinerator facing the road + hologram next to it
  const B = at(U1);
  const inc = makeIncinerator(); inc.position.copy(B.p).addScaledVector(B.side, -6.8); inc.rotation.y = faceTo(B.side); scene.add(inc);
  inc.updateMatrixWorld(true);
  const mouthW = inc.localToWorld(new THREE.Vector3(-0.7, 1.05, 1.9));
  const holo = makeHolo(); holo.position.copy(B.p).addScaledVector(B.side, -2).addScaledVector(B.tan, 8); holo.rotation.y = faceTo(B.side); scene.add(holo);

  // cute waste: one crew hops into the bin, another jumps from the truck into the furnace
  const crewA = makeCuteWaste().slice(0, 6), crewB = makeCuteWaste().slice(6);
  [...crewA, ...crewB].forEach(o => { o.visible = false; scene.add(o); });
  const arc = (o, from, to, u, h, s) => {
    o.position.lerpVectors(from, to, u); o.position.y += Math.sin(Math.PI * u) * h;
    const pop = Math.min(1, u * 8, (1 - u) * 6);
    o.scale.setScalar(s * pop);
  };

  // light pulses running along the road
  const pulseM = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xb7f34a, emissiveIntensity: 1.6 });
  const pulses = Array.from({ length: 22 }, (_, i) => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 8), pulseM); m.userData.o = i / 22; scene.add(m); return m; });

  S.onResize.push((w, h) => {
    if (isMobile()) camera.setViewOffset(w, h, 0, h * 0.07, w, h);   // full-screen backdrop behind the glass cards
    else camera.setViewOffset(w, h, -w * 0.18, 0, w, h);
  });
  S.onResize.forEach(f => f(canvas.clientWidth, canvas.clientHeight));

  const progress = () => (window.processProgress ? window.processProgress() : 0);
  let prog = progress(), lastU = U0;
  const look = new THREE.Vector3(), pos = new THREE.Vector3(), tmpL = new THREE.Vector3(), tmpP = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);

  S.onFrame((t, dt) => {
    prog += (progress() - prog) * (1 - Math.exp(-dt * 2.6));   // eased: arrow jumps glide instead of snapping
    const p = prog, zoom = isMobile() ? 1.9 : 1;

    // truck along the road
    const u = U0 + (U1 - U0) * seg(p, 0.6, 1.9);
    const T = at(u);
    truck.position.copy(T.p).addScaledVector(T.side, -0.95);   // drive on the left (Thailand)
    truck.rotation.y = faceTo(T.tan) - Math.PI / 2;
    const moving = Math.abs(u - lastU) > 1e-5; lastU = u;
    truck.userData.update(t, moving ? 1.8 : 0);
    truck.updateMatrixWorld(true);
    const truckBack = truck.localToWorld(new THREE.Vector3(-2.4, 1.6, 0));

    // bin: sits at the clinic, then gets loaded into the truck (reversible with scroll)
    const load = seg(p, 0.3, 0.58);
    bin.visible = load < 0.98;
    bin.position.lerpVectors(binHome, truckBack, load); bin.position.y += Math.sin(Math.PI * load) * 2.2;
    bin.scale.setScalar(1 - load * 0.7);
    bin.rotation.y = faceTo(A.side) + load * Math.PI * 2;
    bin.userData.lid.rotation.x = -(p < 0.3 ? (Math.sin(t * 3) * 0.5 + 0.6) : 0);

    // crew A: clinic door → hop onto the truck (before it leaves)
    crewA.forEach((o, i) => {
      const k = (t * 0.42 + i / crewA.length) % 1;
      o.visible = p < 0.55;
      if (!o.visible) return;
      arc(o, door, truckBack, k, 2.6, 0.9);
      o.rotation.set(0, faceTo(A.side), Math.sin(k * Math.PI * 2) * 0.6);
    });
    // crew B: truck → furnace (once the truck has arrived)
    crewB.forEach((o, i) => {
      const k = (t * 0.42 + i / crewB.length) % 1;
      o.visible = p > 1.88;
      if (!o.visible) return;
      arc(o, truckBack, mouthW, k, 3, 0.9);
      o.rotation.set(0, faceTo(B.side), -k * Math.PI * 2);
    });

    inc.userData.update(t);
    const hk = seg(p, 2.25, 2.85);
    holo.visible = hk > 0.01; holo.scale.setScalar(Math.max(0.01, hk)); holo.userData.update(t);
    pulses.forEach(m => { const k = (t * 0.03 + m.userData.o) % 1; m.position.copy(curve.getPointAt(k)); m.position.y = 0.12; });

    // camera: blend between four shots; the middle one chases the truck so the story never cuts
    const shots = [
      { l: tmpL.copy(binHome).addScaledVector(A.tan, -1).setY(1.8).clone(), o: A.side.clone().multiplyScalar(15).addScaledVector(A.tan, 5).addScaledVector(up, 6.5) },
      { l: truck.position.clone().setY(1.3), o: T.side.clone().multiplyScalar(8).addScaledVector(T.tan, -7).addScaledVector(up, 4.2) },
      { l: inc.position.clone().lerp(B.p, 0.3).setY(2.8), o: B.side.clone().multiplyScalar(14).addScaledVector(B.tan, 5).addScaledVector(up, 5) },
      { l: holo.position.clone().setY(3.1), o: B.side.clone().multiplyScalar(9).addScaledVector(B.tan, 1).addScaledVector(up, 1.8) }
    ];
    const keys = [0, 1.25, 2.05, 3];
    let i = 0; while (i < 2 && p > keys[i + 1]) i++;
    const f = seg(p, keys[i], keys[i + 1]);
    look.lerpVectors(shots[i].l, shots[i + 1].l, f);
    tmpP.lerpVectors(shots[i].o, shots[i + 1].o, f).multiplyScalar(zoom);
    pos.copy(look).add(tmpP);
    camera.position.set(pos.x + mouse.x * 1.2, pos.y - mouse.y * 0.8, pos.z);
    camera.lookAt(look);
  });
  return S;
}
