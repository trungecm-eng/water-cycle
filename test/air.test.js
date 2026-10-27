import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { environmentTemperature, moveAirParticle, windFactor } from '../src/sim/air.js';
import { findClusters } from '../src/sim/clusters.js';
import { releaseRain, rainTemperatureFactor } from '../src/sim/precipitation.js';
import { generateDrainage } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';
import { World } from '../src/sim/world.js';
import { mulberry32 } from '../src/sim/rng.js';

const map = generateDrainage();
const droplet = (id, x = 800, y = 400, z = 500) =>
  ({ id, x, y, z, vx: 0, vy: 0, vz: 0, temperature: 81, state: 'vapor' });
const clouds = (n, temperature = 20, raining = false) => Array.from({ length: n }, (_, id) =>
  ({ ...droplet(id), state: 'cloud', temperature, raining }));

test('environment uses sea level and vapor condenses by cooling while clouds stay aloft', () => {
  assert.equal(environmentTemperature(0), config.heat.environmentBase);
  let previous = Infinity;
  for (let y = 0; y <= config.world.height; y++) {
    const temperature = environmentTemperature(y);
    assert.ok(temperature >= 0 && temperature <= previous);
    previous = temperature;
  }
  const particle = droplet(0);
  moveAirParticle(particle, 0, map);
  assert.ok(particle.temperature < 81 && particle.temperature > environmentTemperature(particle.y));
  for (let i = 0; i < 600 && particle.state === 'vapor'; i++) moveAirParticle(particle, 0, map);
  assert.equal(particle.state, 'cloud');
  const height = particle.y;
  for (let i = 0; i < 600; i++) moveAirParticle(particle, 0, map);
  assert.equal(particle.y, height);
  assert.equal(particle.vy, 0);
});

test('wind scales east to west, affects only air and vanishes behind the ridge', () => {
  const distances = [];
  for (const wind of [0, 40, 100]) {
    const particle = droplet(0);
    moveAirParticle(particle, wind, map);
    distances.push(800 - particle.x);
  }
  assert.equal(distances[0], 0);
  assert.ok(distances[1] > 0 && distances[2] > distances[1]);
  for (const state of ['water', 'rain', 'runoff']) {
    const particle = { ...droplet(0), state };
    const before = { ...particle };
    moveAirParticle(particle, 100, map);
    assert.deepEqual(particle, before);
  }
  assert.equal(windFactor(150, 500), 1);
  assert.equal(windFactor(100, 500), 0.5);
  assert.equal(windFactor(50, 500), 0);
  const particle = { ...droplet(0, 300, 400), state: 'cloud' };
  for (let i = 0; i < 18000; i++) moveAirParticle(particle, 100, map);
  assert.ok(particle.x >= 50 && particle.x < 51);
});

test('clouds slide up the windward slope without penetration and cool at the lifted altitude', () => {
  const x = 275, z = 500;
  const start = { ...droplet(0, x, heightAt(map, x, z) + config.motion.airClearance, z),
    state: 'cloud', temperature: environmentTemperature(heightAt(map, x, z)) };
  const still = { ...start };
  for (let i = 0; i < 100; i++) moveAirParticle(still, 0, map);
  assert.equal(still.y, start.y);
  const particle = { ...start };
  for (let i = 0; i < 100; i++) {
    const oldY = particle.y;
    moveAirParticle(particle, 100, map);
    assert.ok(particle.y >= oldY);
    assert.ok(particle.y >= heightAt(map, particle.x, particle.z));
  }
  assert.ok(particle.y > start.y + 10);
  assert.ok(particle.temperature < start.temperature);
});

test('cloud components use transitive 3D distance across hash cells', () => {
  const particles = clouds(29);
  particles.forEach((p, i) => { p.z = i * 39; });
  assert.equal(findClusters(particles)[0].visible, false);
  particles.push({ ...particles.at(-1), id: 29, z: 29 * 39 });
  assert.equal(findClusters(particles)[0].visible, true);
  assert.equal(findClusters(particles)[0].size, 30);
  particles.push({ ...particles[0], id: 30, z: -41 });
  assert.equal(findClusters(particles).length, 2);
  assert.equal(findClusters([{ ...particles[0], id: 0, x: 0, y: 0, z: 0 },
    { ...particles[0], id: 1, x: 25, y: 25, z: 25 }]).length, 2);
});

test('rain inherits hysteresis, releases gradually and cold clouds rain more over ten seconds', () => {
  for (const [n, inherited, expected] of [[79, false, false], [80, false, true], [40, true, true], [29, true, false]]) {
    assert.equal(findClusters(clouds(n, 20, inherited))[0].raining, expected);
  }
  assert.equal(rainTemperatureFactor(config.heat.condenseTemp), 1);
  assert.equal(rainTemperatureFactor(0), 3);
  for (let t = 0; t < 100; t++) assert.ok(rainTemperatureFactor(t) >= rainTemperatureFactor(t + 1));
  const totals = [20, 0].map(temperature => {
    const particles = clouds(1000, temperature, true), rng = mulberry32(1);
    releaseRain(particles, rng);
    assert.ok(particles.filter(p => p.state === 'rain').length < 30);
    for (let i = 1; i < 600; i++) releaseRain(particles, rng);
    return particles.filter(p => p.state === 'rain').length;
  });
  assert.ok(totals[1] > totals[0]);
  const particles = clouds(80), rng = mulberry32(1);
  for (let i = 0; i < 3600; i++) releaseRain(particles, rng);
  const remaining = particles.filter(p => p.state === 'cloud');
  assert.ok(remaining.length < 30);
  assert.equal(findClusters(remaining)[0].raining, false);
});

test('3D world integrates air and exposes immutable cluster membership', () => {
  const world = new World({ sun: 0 });
  const particle = world.particles[0];
  world.reservoirs.remove(particle);
  Object.assign(particle, { ...droplet(particle.id), state: 'cloud' });
  world.step();
  assert.ok(particle.x < 800);
  assert.throws(() => world.snapshot().clusters[0].ids.push(99), TypeError);
  assert.equal(Object.isFrozen(world.clusters[0].ids), false);
});
