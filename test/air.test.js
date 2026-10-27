import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { environmentTemperature, moveAirParticle } from '../src/sim/air.js';
import { findClusters } from '../src/sim/clusters.js';
import { terrainHeight } from '../src/sim/terrain.js';
import { World } from '../src/sim/world.js';

const droplet = (id, x, y) => ({ id, x, y, vx: 0, vy: 0, temperature: 81, state: 'vapor' });

test('environment cools with altitude and isolated vapor condenses without rising again', () => {
  let previous = Infinity;
  for (let y = 0; y <= config.world.height; y++) {
    const temperature = environmentTemperature(y);
    assert.ok(temperature >= 0 && temperature <= previous);
    previous = temperature;
  }
  const particle = droplet(0, 800, 400);
  const before = particle.temperature;
  moveAirParticle(particle, 0, 1, 0);
  assert.ok(particle.temperature < before);
  assert.ok(particle.temperature > environmentTemperature(400));
  for (let i = 0; i < 600 && particle.state === 'vapor'; i++) moveAirParticle(particle, 0, 1, i / 60);
  assert.equal(particle.state, 'cloud');
  assert.equal(particle.vy, 0);
  const height = particle.y;
  for (let i = 0; i < 600; i++) moveAirParticle(particle, 100, 1, i / 60);
  assert.equal(particle.y, height);
});

test('wind moves only air particles and collisions stop at slope walls and ceiling', () => {
  const still = droplet(0, 800, 300);
  moveAirParticle(still, 0, 1, 0);
  assert.equal(still.x, 800);
  const moving = droplet(0, 800, 300);
  moveAirParticle(moving, 100, 1, 0);
  assert.ok(moving.x < 800);
  for (const [x, y] of [[500, terrainHeight(500)], [0, 500], [800, 600]]) {
    const particle = droplet(0, x, y);
    particle.state = 'cloud';
    for (let i = 0; i < 1000; i++) {
      moveAirParticle(particle, 100, 1, i / 60);
      assert.ok(particle.x >= 0 && particle.x <= 1000);
      assert.ok(particle.y >= terrainHeight(particle.x) && particle.y <= 600);
      assert.equal(particle.y, y);
    }
  }
  const world = new World({ sun: 0 });
  const before = world.particles.map(p => [p.x, p.y]);
  world.wind = 100;
  assert.deepEqual(world.particles.map(p => [p.x, p.y]), before);
  world.step();
  assert.deepEqual(world.particles.map(p => [p.x, p.y]), before);
});

test('cloud components are transitive across hash cells and visibility starts at thirty', () => {
  const particles = Array.from({ length: 29 }, (_, id) => ({ ...droplet(id, id * 39, 400), state: 'cloud' }));
  assert.equal(findClusters(particles)[0].visible, false);
  particles.push({ ...droplet(29, 29 * 39, 400), state: 'cloud' });
  const clusters = findClusters(particles);
  assert.equal(clusters.length, 1);
  assert.equal(clusters[0].size, 30);
  assert.equal(clusters[0].visible, true);
  particles.push({ ...droplet(30, 0, 500), state: 'cloud' });
  assert.equal(findClusters(particles).length, 2);
});

test('cluster snapshot membership cannot mutate simulation data', () => {
  const world = new World({ sun: 0 });
  const particle = world.particles[0];
  world.lake.remove(particle);
  Object.assign(particle, { state: 'cloud', x: 800, y: 400 });
  world.step();
  const snapshot = world.snapshot();
  assert.throws(() => snapshot.clusters[0].ids.push(99), TypeError);
  assert.equal(Object.isFrozen(world.clusters[0].ids), false);
});
