import * as T from 'three';
import { destinations, type DestinationId } from '../content';
import { makeAsteroid, makeRing, makeShip, makeSphere } from './geometry';
import { atmosphereFragment, planetFragment, planetVertex, ringFragment, ringVertex } from './shaders';
import { makeOutlineMaterial, makeToonMaterial } from './comicMaterials';
import { FlightSimulation, type FlightAction, type FlightTelemetry } from './flight';

type Options = {
  labelElements: Map<DestinationId, HTMLElement>;
  onReady: () => void; onFailure: () => void; onLaunch: () => void;
  onDockUnavailable: (id: DestinationId, distance: number) => void;
  onDock: (id: DestinationId) => void; onTelemetry: (value: FlightTelemetry) => void;
};
export type WorldController = { command: (action: FlightAction) => void; setPaused: (paused: boolean) => void; dispose: () => void };

export function createWorld(canvas: HTMLCanvasElement, options: Options): WorldController {
  const renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  const gl = renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
  const software = debug && /swiftshader|llvmpipe/i.test(String(gl.getParameter(debug.UNMASKED_RENDERER_WEBGL)));
  renderer.setPixelRatio(software ? .75 : Math.min(window.devicePixelRatio, 1.6));
  renderer.toneMapping = T.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.35;
  const scene = new T.Scene(), camera = new T.PerspectiveCamera(64, 1, .1, 5000);
  const sim = new FlightSimulation();
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = false, disposed = false, dirty = true, lastTime = 0, lastHud = 0, lastShot = -1, time = 0;
  let boost = false, brake = false, dragging = false;
  const keys = new Set<string>(), stick = new T.Vector2(), pointer = new T.Vector2();
  const vec = new T.Vector3(), chase = new T.Vector3(), aim = new T.Vector3(), cameraUp = new T.Vector3();
  const rotation = new T.Quaternion(), matrix = new T.Matrix4();
  let seed = 73;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  const bodies: T.Mesh[] = [], planetMeshes: T.Mesh[] = [];
  const sphere = makeSphere();
  const outlineViewport = new T.Vector2();
  const outlineMaterial = makeOutlineMaterial(outlineViewport, renderer.getPixelRatio());
  const addOutline = (mesh: T.Mesh, parent: T.Object3D) => {
    const outline = new T.Mesh(mesh.geometry, outlineMaterial);
    outline.position.copy(mesh.position); outline.quaternion.copy(mesh.quaternion); outline.scale.copy(mesh.scale);
    parent.add(outline);
  };
  for (const d of destinations) {
    const group = new T.Group(); group.position.fromArray(d.position);
    const body = new T.Mesh(sphere, new T.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: planetFragment, uniforms: { uColor: { value: new T.Color(d.color) }, uKind: { value: d.kind }, uPixelRatio: { value: renderer.getPixelRatio() } } }));
    body.scale.setScalar(d.radius); body.userData.id = d.id; group.add(body); addOutline(body, group); bodies.push(body); planetMeshes.push(body);
    const aura = new T.Mesh(sphere, new T.ShaderMaterial({ vertexShader: planetVertex, fragmentShader: atmosphereFragment, uniforms: { uColor: { value: new T.Color(d.kind === 1 ? '#ff4b89' : d.color) } }, transparent: true, depthWrite: false, blending: T.AdditiveBlending, side: T.BackSide }));
    aura.scale.setScalar(d.radius * 1.035); group.add(aura);
    if (d.kind === 1 || d.kind === 2) {
      const ring = new T.Mesh(makeRing(1.35, 2.25), new T.ShaderMaterial({ vertexShader: ringVertex, fragmentShader: ringFragment, uniforms: { uColor: { value: new T.Color(d.kind === 1 ? '#ff518b' : '#ad8cff') } }, transparent: true, depthWrite: false, side: T.DoubleSide, blending: T.AdditiveBlending }));
      ring.scale.setScalar(d.radius); ring.rotation.set(1.05, .2, -.42); group.add(ring);
    }
    scene.add(group);
  }
  const positions = new Float32Array(2600 * 3), colors = new Float32Array(positions.length), color = new T.Color();
  for (let i = 0; i < 2600; i++) {
    vec.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1).normalize().multiplyScalar(1500 + random() * 800);
    vec.toArray(positions, i * 3); color.setHSL(.5 + random() * .3, .35, .45 + random() * .4).toArray(colors, i * 3);
  }
  const starsGeometry = new T.BufferGeometry().setAttribute('position', new T.BufferAttribute(positions, 3)).setAttribute('color', new T.BufferAttribute(colors, 3));
  scene.add(new T.Points(starsGeometry, new T.PointsMaterial({ size: 2.2, vertexColors: true, sizeAttenuation: false, transparent: true, opacity: .8 })));

  // NullGraph Comic Space's procedural interceptor, with a toon hull and neon engine trails.
  const ship = new T.Group(), model = new T.Group(); model.rotation.y = Math.PI; ship.add(model); scene.add(ship);
  const shipGeometry = makeShip(); shipGeometry.scale(.5, .5, .5);
  const hull = new T.Mesh(shipGeometry, makeToonMaterial('#69b6e5', renderer.getPixelRatio(), true)); model.add(hull); addOutline(hull, model);
  model.add(new T.LineSegments(new T.EdgesGeometry(shipGeometry, 24), new T.LineBasicMaterial({ color: '#060b19' })));
  const cockpit = new T.Mesh(new T.SphereGeometry(.55, 16, 8), makeToonMaterial('#25dcea', renderer.getPixelRatio()));
  cockpit.position.set(0, .45, .3); cockpit.scale.set(.75, .35, 1.6); model.add(cockpit); addOutline(cockpit, model);
  const flames: T.Mesh[] = [];
  for (const x of [-.65, .65]) {
    const nozzle = new T.Mesh(new T.CylinderGeometry(.22, .28, .5, 12), makeToonMaterial('#233c6b', renderer.getPixelRatio())); nozzle.rotation.x = Math.PI / 2; nozzle.position.set(x, -.05, -1.55); model.add(nozzle); addOutline(nozzle, model);
    const flame = new T.Mesh(new T.ConeGeometry(.2, 2.7, 12), new T.MeshBasicMaterial({ color: '#57f4ff', transparent: true, opacity: .85, blending: T.AdditiveBlending, depthWrite: false }));
    flame.rotation.x = -Math.PI / 2; flame.position.set(x, -.05, -2.9); model.add(flame); flames.push(flame);
    const stripe = new T.Mesh(new T.BoxGeometry(.8, .05, .18), new T.MeshBasicMaterial({ color: '#ff3896' })); stripe.position.set(x * 2.5, 0, -.85); stripe.rotation.y = x * .5; model.add(stripe);
  }
  const streaks = new T.InstancedMesh(new T.BoxGeometry(.014, .014, 1), new T.MeshBasicMaterial({ color: '#7beeff', transparent: true, opacity: .5 }), 70);
  for (let i = 0; i < 70; i++) {
    vec.set((random() - .5) * 100, (random() - .5) * 80, -random() * 130);
    if (Math.abs(vec.x) < 6 && Math.abs(vec.y) < 6) vec.x += 12;
    matrix.compose(vec, rotation.identity(), chase.set(1, 1, 5 + random() * 13)); streaks.setMatrixAt(i, matrix);
  }
  streaks.visible = false; ship.add(streaks);
  const asteroidGeometry = makeAsteroid(), asteroidMaterial = makeToonMaterial('#7885ad', renderer.getPixelRatio());
  const asteroids = new T.InstancedMesh(asteroidGeometry, asteroidMaterial, 180);
  const asteroidData: { position: T.Vector3; radius: number; alive: boolean }[] = [];
  for (let i = 0; i < 180; i++) {
    const a = random() * Math.PI * 2, r = 88 + random() * 40, size = .8 + random() * 3;
    const position = new T.Vector3(65 + Math.cos(a) * r, 35 + Math.sin(a) * r * .25 + random() * 8, -160 + Math.sin(a) * r * .8);
    rotation.setFromEuler(new T.Euler(random() * 6, random() * 6, random() * 6)); matrix.compose(position, rotation, vec.setScalar(size)); asteroids.setMatrixAt(i, matrix);
    asteroidData.push({ position, radius: size, alive: true });
  }
  scene.add(asteroids);
  const asteroidOutline = new T.InstancedMesh(asteroidGeometry, outlineMaterial, asteroids.count);
  asteroidOutline.instanceMatrix = asteroids.instanceMatrix;
  asteroidOutline.frustumCulled = false; scene.add(asteroidOutline);
  const fleet = new T.InstancedMesh(shipGeometry, makeToonMaterial('#d172bb', renderer.getPixelRatio(), true), 28); scene.add(fleet);
  const fleetOutline = new T.InstancedMesh(shipGeometry, outlineMaterial, fleet.count);
  fleetOutline.instanceMatrix = fleet.instanceMatrix;
  fleetOutline.frustumCulled = false; scene.add(fleetOutline);
  const fleetPosition = new T.Vector3(), fleetScale = new T.Vector3();
  function updateFleet() {
    for (let i = 0; i < 28; i++) {
      const a = i * 2.39 + time * (.025 + i * .0006), r = 140 + i * 3;
      fleetPosition.set(65 + Math.cos(a) * r, 55 + Math.sin(a * 2) * 32, -160 + Math.sin(a) * r);
      rotation.setFromAxisAngle(cameraUp.set(0, 1, 0), -a + Math.PI / 2); fleetScale.setScalar(i % 6 === 0 ? .9 : .3);
      matrix.compose(fleetPosition, rotation, fleetScale); fleet.setMatrixAt(i, matrix);
    }
    fleet.instanceMatrix.needsUpdate = true;
  }
  updateFleet();
  const laserGeometry = new T.CylinderGeometry(.09, .09, 5, 6); laserGeometry.rotateX(Math.PI / 2);
  const laserMaterial = new T.MeshBasicMaterial({ color: '#7ffbff', blending: T.AdditiveBlending });
  const lasers = Array.from({ length: 36 }, () => {
    const mesh = new T.Mesh(laserGeometry, laserMaterial); mesh.visible = false; scene.add(mesh);
    return { mesh, velocity: new T.Vector3(), life: 0 };
  });
  let nextLaser = 0;
  function launch() { sim.launch(); options.onLaunch(); canvas.focus({ preventScroll: true }); dirty = true; }
  function fire() {
    if (paused || sim.mode === 'docked' || time - lastShot < .14) return;
    if (sim.mode === 'standby') launch(); lastShot = time; sim.shots += 2;
    for (const x of [-1.5, 1.5]) {
      const laser = lasers[nextLaser++ % lasers.length]; laser.life = 2.5; laser.mesh.visible = true;
      laser.mesh.position.set(x, -.1, -2.3).applyQuaternion(sim.orientation).add(sim.position); laser.mesh.quaternion.copy(sim.orientation);
      laser.velocity.set(0, 0, -280).applyQuaternion(sim.orientation).add(sim.velocity);
    }
    dirty = true;
  }
  function clearInput() { keys.clear(); stick.set(0, 0); dragging = false; boost = false; brake = false; }
  function command(action: FlightAction) {
    if (['launch', 'reset', 'course', 'visit', 'dock', 'undock'].includes(action.type)) clearInput();
    switch (action.type) {
      case 'launch': launch(); break;
      case 'reset': sim.reset(); for (const l of lasers) { l.life = 0; l.mesh.visible = false; } break;
      case 'course': sim.course(action.destination); options.onLaunch(); canvas.focus({ preventScroll: true }); break;
      case 'visit': sim.visit(action.destination); initializedCamera = false; break;
      case 'dock': {
        const id = sim.dock();
        if (id) options.onDock(id);
        else { const { planet, distance } = sim.nearest(); options.onDockUnavailable(planet.id, distance); }
        break;
      }
      case 'undock': sim.undock(); options.onLaunch(); canvas.focus({ preventScroll: true }); break;
      case 'fire': fire(); break;
      case 'boost-on': boost = true; if (sim.mode === 'standby' || sim.mode === 'holding') launch(); break;
      case 'boost-off': boost = false; break;
      case 'brake-on': brake = true; break;
      case 'brake-off': brake = false; break;
    }
    dirty = true; options.onTelemetry(sim.telemetry());
  }
  function resize() {
    const { width, height } = canvas.getBoundingClientRect(); renderer.setSize(width, height, false); renderer.getDrawingBufferSize(outlineViewport);
    camera.aspect = width / Math.max(1, height); camera.updateProjectionMatrix(); dirty = true;
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  function keyDown(e: KeyboardEvent) {
    if (document.activeElement !== canvas || paused || sim.mode === 'docked') return;
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyQ', 'KeyE', 'ShiftLeft', 'ShiftRight', 'KeyB', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault(); keys.add(e.code);
      if (sim.mode === 'standby' || (sim.mode === 'holding' && e.code !== 'Space' && e.code !== 'KeyB')) launch();
      if (e.code === 'Space' && !e.repeat) fire();
    }
    if ((e.code === 'KeyF' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); command({ type: 'dock' }); }
  }
  function keyUp(e: KeyboardEvent) { keys.delete(e.code); }
  function pointerDown(e: PointerEvent) {
    if (paused || sim.mode === 'docked') return;
    if (sim.mode === 'standby' || sim.mode === 'holding') launch(); canvas.focus({ preventScroll: true }); canvas.setPointerCapture(e.pointerId);
    dragging = true; pointer.set(e.clientX, e.clientY);
  }
  function pointerMove(e: PointerEvent) {
    if (!dragging) return;
    stick.x = T.MathUtils.clamp(stick.x + (e.clientX - pointer.x) * .008, -1, 1);
    stick.y = T.MathUtils.clamp(stick.y + (e.clientY - pointer.y) * .008, -1, 1);
    pointer.set(e.clientX, e.clientY);
  }
  function pointerUp() { dragging = false; stick.set(0, 0); }
  function doubleClick(e: MouseEvent) {
    if (paused || sim.mode === 'docked') return;
    const box = canvas.getBoundingClientRect(), ray = new T.Raycaster();
    ray.setFromCamera(new T.Vector2((e.clientX - box.left) / box.width * 2 - 1, -(e.clientY - box.top) / box.height * 2 + 1), camera);
    const hit = ray.intersectObjects(bodies)[0]; if (hit) command({ type: 'course', destination: hit.object.userData.id });
  }
  function visibility() { clearInput(); lastTime = 0; }
  window.addEventListener('keydown', keyDown); window.addEventListener('keyup', keyUp); window.addEventListener('blur', clearInput);
  document.addEventListener('visibilitychange', visibility); canvas.addEventListener('blur', clearInput);
  canvas.addEventListener('pointerdown', pointerDown); canvas.addEventListener('pointermove', pointerMove);
  canvas.addEventListener('pointerup', pointerUp); canvas.addEventListener('pointercancel', pointerUp); canvas.addEventListener('dblclick', doubleClick);
  canvas.addEventListener('webglcontextlost', contextLost);
  function contextLost(e: Event) { e.preventDefault(); paused = true; clearInput(); options.onFailure(); }
  const chaseOffset = new T.Vector3(), forward = new T.Vector3(), laserOffset = new T.Vector3();
  let initializedCamera = false;
  function animate(now: number) {
    if (disposed) return;
    if (document.hidden) return;
    if (lastTime && now - lastTime < (software ? 45 : 12)) return;
    const dt = lastTime ? Math.min(.05, (now - lastTime) / 1000) : 0; lastTime = now;
    const flying = !paused && (sim.mode === 'pilot' || sim.mode === 'autopilot');
    if (!paused) time += dt;
    const input = { pitch: Number(keys.has('KeyW') || keys.has('ArrowUp')) - Number(keys.has('KeyS') || keys.has('ArrowDown')) - stick.y, yaw: Number(keys.has('KeyD') || keys.has('ArrowRight')) - Number(keys.has('KeyA') || keys.has('ArrowLeft')) + stick.x, roll: Number(keys.has('KeyQ')) - Number(keys.has('KeyE')), boost: boost || keys.has('ShiftLeft') || keys.has('ShiftRight'), brake: brake || keys.has('KeyB') };
    if (flying) { const arrived = sim.update(dt, input); if (arrived) { clearInput(); options.onDock(arrived); dirty = true; lastHud = 0; } if (keys.has('Space')) fire(); }
    if (!dirty && !flying && (paused || (reduced.matches && !lasers.some(l => l.life > 0)))) return;
    ship.position.copy(sim.position); ship.quaternion.copy(sim.orientation);
    model.rotation.z = T.MathUtils.lerp(model.rotation.z, -input.yaw * .2, 1 - Math.exp(-dt * 8));
    chaseOffset.set(0, camera.aspect < .8 ? 2 : 3.6, sim.boosted ? 17 : 13).applyQuaternion(sim.orientation);
    chase.copy(sim.position).add(chaseOffset); forward.set(0, 0, -35).applyQuaternion(sim.orientation); aim.copy(sim.position).add(forward);
    cameraUp.set(0, 1, 0).applyQuaternion(sim.orientation);
    if (!initializedCamera || (dirty && sim.mode === 'standby')) { camera.position.copy(chase); camera.up.copy(cameraUp); initializedCamera = true; }
    else { camera.position.lerp(chase, 1 - Math.exp(-dt * 6)); camera.up.lerp(cameraUp, 1 - Math.exp(-dt * 6)); }
    camera.lookAt(aim); const fov = (camera.aspect < .8 ? 76 : 64) + (sim.boosted && !reduced.matches ? 12 : 0);
    if (Math.abs(camera.fov - fov) > .1) { camera.fov = flying ? T.MathUtils.lerp(camera.fov, fov, 1 - Math.exp(-dt * 7)) : fov; camera.updateProjectionMatrix(); }
    const thrust = sim.mode === 'standby' || sim.mode === 'holding' || sim.mode === 'docked' ? .35 : sim.boosted ? 2.2 : 1;
    streaks.visible = flying && sim.boosted && !reduced.matches;
    flames.forEach((f, i) => { f.scale.y = thrust * (reduced.matches ? 1 : 1 + Math.sin(time * 28 + i) * .1); f.position.z = -1.8 - 1.35 * f.scale.y; });
    if (!paused && !reduced.matches) { planetMeshes.forEach((p, i) => { p.rotation.y += dt * (.018 + i * .003); }); updateFleet(); }
    for (const laser of lasers) {
      if (laser.life <= 0 || paused) continue;
      laser.life -= dt; laser.mesh.position.addScaledVector(laser.velocity, dt);
      for (let i = 0; i < asteroidData.length; i++) {
        const a = asteroidData[i]; if (!a.alive || laser.mesh.position.distanceToSquared(a.position) > (a.radius + 2.5) ** 2) continue;
        a.alive = false; matrix.makeScale(0, 0, 0); asteroids.setMatrixAt(i, matrix); asteroids.instanceMatrix.needsUpdate = true; laser.life = 0; break;
      }
      laser.mesh.visible = laser.life > 0;
    }
    renderer.render(scene, camera); dirty = false;
    if (now - lastHud > 120) {
      lastHud = now; options.onTelemetry(sim.telemetry());
      for (const d of destinations) {
        const element = options.labelElements.get(d.id); if (!element) continue;
        laserOffset.fromArray(d.position); const range = Math.max(0, laserOffset.distanceTo(sim.position) - d.radius);
        laserOffset.y += d.radius * 1.35; laserOffset.project(camera);
        const overShip = camera.aspect < .8 && Math.abs(laserOffset.x) < .3 && laserOffset.y < -.02 && laserOffset.y > -.33;
        const visible = !overShip && sim.mode !== 'docked' && laserOffset.z < 1 && Math.abs(laserOffset.x) < .85 && Math.abs(laserOffset.y) < .75;
        element.style.visibility = visible ? 'visible' : 'hidden';
        element.style.left = `${(laserOffset.x * .5 + .5) * 100}%`; element.style.top = `${(-laserOffset.y * .5 + .5) * 100}%`;
        const label = element.querySelector('[data-range]'); if (label) label.textContent = `${Math.round(range)} m`;
      }
    }
  }
  renderer.setAnimationLoop(animate); options.onReady(); options.onTelemetry(sim.telemetry());
  return {
    command,
    setPaused(value) { paused = value; clearInput(); dirty = true; lastTime = 0; options.onTelemetry(sim.telemetry()); },
    dispose() {
      disposed = true; renderer.setAnimationLoop(null); observer.disconnect(); clearInput();
      window.removeEventListener('keydown', keyDown); window.removeEventListener('keyup', keyUp); window.removeEventListener('blur', clearInput);
      document.removeEventListener('visibilitychange', visibility); canvas.removeEventListener('blur', clearInput);
      canvas.removeEventListener('pointerdown', pointerDown); canvas.removeEventListener('pointermove', pointerMove); canvas.removeEventListener('pointerup', pointerUp); canvas.removeEventListener('pointercancel', pointerUp); canvas.removeEventListener('dblclick', doubleClick); canvas.removeEventListener('webglcontextlost', contextLost);
      const geometries = new Set<T.BufferGeometry>(), materials = new Set<T.Material>();
      scene.traverse(object => { if (object instanceof T.Mesh || object instanceof T.Points || object instanceof T.LineSegments) { geometries.add(object.geometry); (Array.isArray(object.material) ? object.material : [object.material]).forEach(m => materials.add(m)); } if (object instanceof T.InstancedMesh) object.dispose(); });
      geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose()); renderer.dispose();
    },
  };
}
