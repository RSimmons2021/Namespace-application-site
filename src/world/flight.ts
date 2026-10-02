import { Euler, Matrix4, Quaternion, Vector3 } from 'three';
import { destinations, type DestinationId } from '../content';

export type FlightInput = { pitch: number; yaw: number; roll: number; boost: boolean; brake: boolean };
export type FlightMode = 'standby' | 'holding' | 'pilot' | 'autopilot' | 'docked';
export type FlightTelemetry = { speed: number; position: number[]; orientation: number[]; mode: FlightMode; boost: boolean; nearestId: DestinationId; distance: number; dockableId: DestinationId | null; destinationId: DestinationId | null; shots: number; hull: number; courseStartDistance: number; destinationDistance: number | null };
export type FlightAction = { type: 'launch' | 'reset' | 'dock' | 'undock' | 'fire' | 'boost-on' | 'boost-off' | 'brake-on' | 'brake-off' } | { type: 'course' | 'visit'; destination: DestinationId };
export type FlightCommand = FlightAction & { sequence: number };
export const neutralInput: FlightInput = { pitch: 0, yaw: 0, roll: 0, boost: false, brake: false };
export const planets = destinations.map(d => ({ ...d, center: new Vector3(...d.position) }));
const up = new Vector3(0, 1, 0);

/** The player owns position, orientation and momentum. The camera only follows. */
export class FlightSimulation {
  position = new Vector3();
  orientation = new Quaternion();
  velocity = new Vector3();
  mode: FlightMode = 'standby';
  destinationId: DestinationId | null = null;
  courseStartDistance = 0;
  shots = 0;
  hull = 100;
  boosted = false;
  private direction = new Vector3();
  private desiredVelocity = new Vector3();
  private targetRotation = new Quaternion();
  private rotation = new Quaternion();
  private euler = new Euler(0, 0, 0, 'YXZ');
  private matrix = new Matrix4();
  private normal = new Vector3();
  private cooldown = 0;
  constructor() { this.reset(); }
  reset() {
    this.position.set(0, 0, 95);
    this.orientation.setFromUnitVectors(new Vector3(0, 0, -1), new Vector3(.12, .04, -1).normalize());
    this.velocity.set(0, 0, 0); this.mode = 'standby'; this.destinationId = null;
    this.courseStartDistance = 0; this.shots = 0; this.hull = 100; this.boosted = false;
  }
  launch() { this.mode = 'pilot'; this.destinationId = null; }
  course(id: DestinationId) {
    this.mode = 'autopilot'; this.destinationId = id;
    const planet = planets.find(p => p.id === id)!;
    this.courseStartDistance = this.position.distanceTo(planet.center) - planet.radius;
  }
  nearest() {
    let result = planets[0], distance = Infinity;
    for (const planet of planets) {
      const surface = this.position.distanceTo(planet.center) - planet.radius;
      if (surface < distance) { result = planet; distance = surface; }
    }
    return { planet: result, distance };
  }
  dock() {
    const { planet, distance } = this.nearest();
    if (distance > 50) return null;
    this.mode = 'docked'; this.velocity.set(0, 0, 0); this.boosted = false; this.destinationId = planet.id;
    return planet.id;
  }
  visit(id: DestinationId) {
    const planet = planets.find(p => p.id === id)!;
    this.position.copy(planet.center).add(this.normal.set(0, planet.radius * .12, planet.radius + 28));
    this.orientation.setFromRotationMatrix(this.matrix.lookAt(this.position, planet.center, up));
    this.velocity.set(0, 0, 0); this.mode = 'docked'; this.destinationId = id; this.boosted = false;
  }
  undock() {
    if (this.mode !== 'docked') return;
    // Closing a chapter preserves the view. Resume only on deliberate flight input.
    this.mode = 'holding'; this.destinationId = null; this.courseStartDistance = 0;
    this.velocity.set(0, 0, 0); this.boosted = false;
  }
  update(delta: number, input: FlightInput): DestinationId | null {
    const dt = Math.min(.05, Math.max(0, delta));
    if (this.mode === 'holding' && (Math.abs(input.pitch) + Math.abs(input.yaw) + Math.abs(input.roll) > .025 || input.boost)) this.launch();
    if (this.mode === 'standby' || this.mode === 'holding' || this.mode === 'docked') return null;
    this.cooldown = Math.max(0, this.cooldown - dt);
    if (Math.abs(input.pitch) + Math.abs(input.yaw) + Math.abs(input.roll) > .025 && this.mode === 'autopilot') this.launch();
    this.boosted = input.boost && !input.brake;
    let speed = input.brake ? 3 : input.boost ? 115 : 34;
    if (this.mode === 'autopilot' && this.destinationId) {
      const planet = planets.find(p => p.id === this.destinationId)!;
      const distance = this.position.distanceTo(planet.center) - planet.radius;
      if (distance < 29) { this.mode = 'docked'; this.velocity.set(0, 0, 0); this.boosted = false; return planet.id; }
      this.targetRotation.setFromRotationMatrix(this.matrix.lookAt(this.position, planet.center, up));
      this.orientation.rotateTowards(this.targetRotation, dt * 1.8);
      speed = Math.min(input.boost ? 150 : 100, Math.max(14, (distance - 24) * 1.4));
    } else {
      this.euler.set(input.pitch * dt * 1.35, -input.yaw * dt * 1.55, input.roll * dt * 1.9, 'YXZ');
      this.orientation.multiply(this.rotation.setFromEuler(this.euler)).normalize();
    }
    this.direction.set(0, 0, -1).applyQuaternion(this.orientation);
    this.desiredVelocity.copy(this.direction).multiplyScalar(speed);
    this.velocity.lerp(this.desiredVelocity, 1 - Math.exp(-dt * (input.brake ? 5 : 2.6)));
    this.position.addScaledVector(this.velocity, dt);
    for (const planet of planets) {
      const distance = this.position.distanceTo(planet.center), safe = planet.radius + 5;
      if (distance < safe) {
        this.normal.subVectors(this.position, planet.center);
        if (distance < .001) this.normal.set(0, 0, 1); else this.normal.divideScalar(distance);
        this.position.copy(planet.center).addScaledVector(this.normal, safe);
        this.velocity.reflect(this.normal).multiplyScalar(.2);
        if (!this.cooldown) { this.hull = Math.max(20, this.hull - 8); this.cooldown = 1.5; }
      }
    }
    if (this.position.length() > 1400) { this.position.setLength(1400); this.course('forge'); }
    return null;
  }
  telemetry(): FlightTelemetry {
    const { planet, distance } = this.nearest();
    const target = planets.find(p => p.id === this.destinationId);
    return { courseStartDistance: this.courseStartDistance, destinationDistance: target ? this.position.distanceTo(target.center) - target.radius : null, speed: this.velocity.length(), position: this.position.toArray(), orientation: this.orientation.toArray(), mode: this.mode, boost: this.boosted, nearestId: planet.id, distance, dockableId: distance <= 50 ? planet.id : null, destinationId: this.destinationId, shots: this.shots, hull: this.hull };
  }
}
