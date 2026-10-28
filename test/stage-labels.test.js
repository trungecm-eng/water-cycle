import test from 'node:test';
import assert from 'node:assert/strict';
import { StageLabels, stageColors } from '../src/art/stage-labels.js';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';
import { content } from '../src/content.js';

function fixture() {
  return { time: 0, sun: 50, particles: [], clusters: [], evaporationsByReservoir: { sea: 0, lake: 0, pond: 0 }, map: { spacing: 10, stride: 101, channels: [{ id: 'river', path: [1010] }] }, reservoirs: { data: { reservoirs: { sea: {}, lake: { x: 360, z: 620 }, pond: { x: 560, z: 280 } } }, level: () => 20 } };
}
function cloud(world, start, size, x, raining = false) {
  const ids = Array.from({ length: size }, (_, index) => start + index);
  world.particles.push(...ids.map(id => ({ id, state: 'cloud', x, y: 350, z: 500 })));
  world.clusters.push({ ids, size, raining });
}

test('stage labels use shared names and distinct stage colors', () => {
  assert.deepEqual(Object.values(content.stages), ['Bốc hơi', 'Ngưng tụ', 'Mưa', 'Dòng chảy']);
  assert.equal(new Set(Object.values(stageColors)).size, 4);
});

test('stage labels expire ten-second histories and hide missing activity', () => {
  const world = fixture(), labels = new StageLabels();
  labels.sample(world);
  world.time = 1; world.evaporationsByReservoir.lake = 5;
  world.particles.push({ id: 1, state: 'runoff', x: 0, y: 10, z: 100 });
  labels.sample(world);
  let state = labels.update(world, 0.1);
  assert.equal(state.vapor.target, 'lake');
  assert.equal(state.runoff.target, 'river');
  assert.deepEqual(state.runoff.position, [0, 40, 100]);
  world.time = 11; world.particles[0].state = 'water'; labels.sample(world);
  state = labels.update(world, 0.1);
  assert.equal(state.vapor.visible, false);
  assert.equal(state.runoff.visible, false);
  world.time = 0; labels.sample(world);
  assert.equal(labels.update(world, 0.1).vapor.opacity, 0);
});

test('cloud labels select separate raining and non-raining groups and follow sea rain', () => {
  const world = fixture(), labels = new StageLabels();
  world.wind = 0;
  cloud(world, 0, 40, 200);
  cloud(world, 100, 90, 880, true);
  labels.sample(world);
  const state = labels.update(world, 0.1);
  assert.equal(state.cloud.target, 'cluster-0');
  assert.equal(state.rain.target, 'cluster-100');
  assert.equal(state.rain.position[0], 880);
  world.sun = 0;
  assert.equal(labels.update(world, 0.1).vapor.visible, false);
  const calm = new World({ wind: 0, seed: 1 }), observed = new StageLabels();
  observed.sample(calm);
  while (!calm.clusters.some(cluster => cluster.raining) && calm.time < 100) {
    calm.step(); observed.sample(calm);
  }
  assert.ok(calm.time < 100);
  assert.ok(observed.update(calm, 0.1).rain.position[0] > 750);
});

test('cloud labels keep close competitors with hysteresis and bound movement and fades', () => {
  const world = fixture(), labels = new StageLabels();
  cloud(world, 0, 40, 100); cloud(world, 100, 39, 900);
  labels.sample(world);
  let state = labels.update(world, 0.1);
  assert.equal(state.cloud.target, 'cluster-0');
  world.clusters[1].size = 45;
  assert.equal(labels.update(world, 0.1).cloud.target, 'cluster-0');
  world.clusters[1].size = 50;
  const previous = state.cloud.position;
  state = labels.update(world, 0.1);
  assert.equal(state.cloud.target, 'cluster-100');
  assert.ok(Math.hypot(...state.cloud.position.map((value, axis) => value - previous[axis])) <= config.art.labelMaxStep);
  assert.equal(state.cloud.opacity, 0.75);
  world.clusters = [];
  state = labels.update(world, 0.1);
  assert.equal(state.cloud.visible, false);
  assert.equal(state.cloud.opacity, 0.5);
});

test('stage observer leaves simulation particles counters and RNG unchanged', () => {
  const world = new World(), labels = new StageLabels();
  for (let step = 0; step < 100; step++) { world.step(); labels.sample(world); }
  const before = world.snapshot();
  labels.update(world, 0.1); labels.update(world, 0.1);
  assert.deepEqual(world.snapshot(), before);
  const control = new World();
  for (let step = 0; step < 100; step++) control.step();
  assert.equal(world.rng(), control.rng());
});
