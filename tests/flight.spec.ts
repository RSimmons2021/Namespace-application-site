import { Quaternion, Vector3 } from 'three';
import { test, expect } from '@playwright/test';
import { FlightSimulation, neutralInput, planets } from '../src/world/flight';

test('ship translation, steering, roll, boost and brake change player physics', () => {
  const ship = new FlightSimulation(); const start = ship.position.clone(); ship.launch();
  for (let i = 0; i < 60; i++) ship.update(1 / 60, neutralInput);
  expect(ship.position.distanceTo(start)).toBeGreaterThan(20);
  const beforeTurn = ship.orientation.clone();
  for (let i = 0; i < 30; i++) ship.update(1 / 60, { ...neutralInput, yaw: 1 });
  expect(ship.orientation.angleTo(beforeTurn)).toBeGreaterThan(.7);
  const beforeRoll = ship.orientation.clone();
  for (let i = 0; i < 30; i++) ship.update(1 / 60, { ...neutralInput, roll: 1 });
  expect(ship.orientation.angleTo(beforeRoll)).toBeGreaterThan(.8);
  for (let i = 0; i < 120; i++) ship.update(1 / 60, { ...neutralInput, boost: true });
  expect(ship.velocity.length()).toBeGreaterThan(100);
  for (let i = 0; i < 120; i++) ship.update(1 / 60, { ...neutralInput, brake: true });
  expect(ship.velocity.length()).toBeLessThan(5);
});

test('autopilot physically reaches every planet and manual steering interrupts it', () => {
  for (const planet of planets) {
    const ship = new FlightSimulation(); ship.course(planet.id); let arrived = null;
    for (let i = 0; i < 1500 && !arrived; i++) arrived = ship.update(.05, neutralInput);
    expect(arrived, `arrival at ${planet.id}`).toBe(planet.id);
    expect(ship.position.distanceTo(planet.center) - planet.radius).toBeLessThan(30);
    expect(ship.position.distanceTo(planet.center)).toBeGreaterThan(planet.radius + 5);
    expect(ship.mode).toBe('docked');
    const arrivalPosition = ship.position.clone(), arrivalHeading = ship.orientation.clone();
    ship.undock();
    for (let i = 0; i < 60; i++) ship.update(1 / 60, neutralInput);
    expect(ship.mode).toBe('holding');
    expect(ship.position.distanceTo(arrivalPosition)).toBe(0);
    expect(ship.orientation.angleTo(arrivalHeading)).toBeLessThan(1e-7);
    ship.course(planet.id); ship.update(.05, { ...neutralInput, pitch: .5 });
    expect(ship.mode).toBe('pilot'); expect(ship.destinationId).toBeNull();
  }
});

test('planet collisions keep ship outside the surface, and distant ships return to system', () => {
  const ship = new FlightSimulation(); ship.launch();
  ship.position.copy(planets[1].center); ship.velocity.set(0, 0, -115);
  ship.update(.05, neutralInput);
  expect(ship.position.distanceTo(planets[1].center)).toBeGreaterThanOrEqual(planets[1].radius + 5 - 1e-8);
  expect(ship.hull).toBeLessThan(100);
  ship.position.set(1600, 0, 0); ship.update(.05, neutralInput);
  expect(ship.position.length()).toBeCloseTo(1400, 5); expect(ship.destinationId).toBe('forge');
});

test('closing a planet chapter preserves the arrival heading and roll', () => {
  for (const planet of planets) {
    const ship = new FlightSimulation(); ship.course(planet.id);
    for (let i = 0; i < 1500 && ship.mode !== 'docked'; i++) ship.update(.05, neutralInput);
    expect(ship.mode).toBe('docked');
    const position = ship.position.clone(), heading = ship.orientation.clone();
    ship.undock();
    expect(ship.orientation.angleTo(heading), `heading changed when leaving ${planet.id}`).toBeLessThan(1e-7);
    expect(ship.position.distanceTo(position)).toBe(0);

    ship.visit(planet.id);
    ship.orientation.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), .8));
    const bookmarkedHeading = ship.orientation.clone();
    ship.undock();
    expect(ship.orientation.angleTo(bookmarkedHeading), `roll changed when leaving bookmarked ${planet.id}`).toBeLessThan(1e-7);
  }
});


test('manual docking preserves a rolled heading and waits for deliberate input before departure', () => {
  const ship = new FlightSimulation(); ship.visit('forge'); ship.launch();
  ship.orientation.multiply(new Quaternion().setFromAxisAngle(new Vector3(0, 0, 1), 1.2));
  const heading = ship.orientation.clone(), position = ship.position.clone();
  expect(ship.dock()).toBe('forge'); ship.undock();
  for (let i = 0; i < 120; i++) ship.update(.05, neutralInput);
  expect(ship.orientation.angleTo(heading)).toBeLessThan(1e-7);
  expect(ship.position.distanceTo(position)).toBe(0);
  expect(ship.hull).toBe(100); expect(ship.velocity.length()).toBe(0);
  ship.update(.05, { ...neutralInput, yaw: 1 });
  expect(ship.mode).toBe('pilot'); expect(ship.velocity.length()).toBeGreaterThan(0);

  ship.visit('nexus'); ship.undock(); ship.update(.05, { ...neutralInput, boost: true });
  expect(ship.mode).toBe('pilot'); expect(ship.boosted).toBe(true);
  ship.visit('signal'); ship.undock(); ship.launch(); ship.update(.05, neutralInput);
  expect(ship.mode).toBe('pilot'); expect(ship.velocity.length()).toBeGreaterThan(0);
});
