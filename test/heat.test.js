import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';
import { cellAt } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';

function run(world, seconds) {
  for (let step = 0; step < Math.round(seconds / config.clock.dt); step++) world.step();
}

test('evaporation integrates surface area for 300 seconds when supplies are replenished', () => {
  const world = new World({ seed: 7 });
  const initialCredit = { ...world.evaporationCredit };
  for (let step = 0; step < 300 / config.clock.dt; step++) {
    world.step();
    // Isolate the source law from transport and rainfall, tested separately.
    for (const particle of world.particles) {
      if (particle.state === 'vapor') world.reservoirs.add(particle, particle.sourceReservoir);
    }
  }
  const counts = world.evaporationsByReservoir;
  for (const id of ['sea', 'lake', 'pond']) {
    const expected = config.evaporation.ratePerArea * world.reservoirs.surfaces[id].area * 0.5 * 300;
    assert.ok(Math.abs(counts[id] - expected) < 1, `${id}: ${counts[id]} vs ${expected}`);
    assert.equal(counts[id], Math.floor(expected + initialCredit[id] + 1e-9));
    if (counts[id] >= 50) assert.ok(Math.abs(counts[id] / expected - 1) <= 0.15);
  }
  assert.ok(counts.sea > counts.lake && counts.sea > counts.pond);
});

test('new vapor starts hot on the correct 3D water surface without penetrating banks', () => {
  const world = new World({ sun: 100, seed: 7 });
  const seen = new Set();
  const sourceIds = new Set();
  for (let step = 0; step < 30 / config.clock.dt; step++) {
    const levels = Object.fromEntries(['sea', 'lake', 'pond'].map(id => [id, world.reservoirs.level(id)]));
    world.step();
    for (const particle of world.particles) {
      if (particle.state !== 'vapor' || seen.has(particle.id)) continue;
      const id = particle.sourceReservoir;
      sourceIds.add(id);
      seen.add(particle.id);
      assert.equal(world.map.reservoirs[cellAt(world.map, particle.x, particle.z)], id);
      assert.equal(particle.y, levels[id]);
      assert.ok(particle.y >= heightAt(world.map, particle.x, particle.z));
      assert.ok(particle.temperature > 80);
      assert.equal(particle.reservoir, null);
    }
  }
  assert.deepEqual([...sourceIds].sort(), ['lake', 'pond', 'sea']);
  assert.equal(seen.size, world.evaporations);
});

test('sun zero prevents evaporation and immediately clears rays after a step', () => {
  const world = new World({ sun: 0 });
  run(world, 120);
  assert.equal(world.evaporations, 0);
  assert.equal(world.rays.length, 0);
  world.sun = 100;
  run(world, 10);
  assert.ok(world.evaporations > 0);
  assert.ok(world.rays.length > 0);
  world.sun = 0;
  const before = world.evaporations;
  run(world, 10);
  assert.equal(world.evaporations, before);
  assert.equal(world.rays.length, 0);
});

test('empty reservoirs stop evaporating without accumulating debt and pond can refill', () => {
  const world = new World({ sun: 100, n: 100 });
  run(world, 180);
  assert.ok(Object.values(world.reservoirs.snapshot()).every(region => region.count === 0));
  assert.equal(world.snapshot().reservoirs.pond.dry, true);
  const before = world.evaporations;
  run(world, 10);
  assert.equal(world.evaporations, before);
  assert.equal(world.rays.length, 0);
  world.reservoirs.add(world.particles[0], 'pond');
  assert.equal(world.snapshot().reservoirs.pond.dry, false);
  world.step();
  assert.equal(world.reservoirs.count('pond'), 1);
  run(world, 20);
  assert.equal(world.evaporations, before + 1);
});

test('3D evaporation is seeded, scales with sunlight and resets its fractional credits', () => {
  const first = new World();
  const second = new World();
  const other = new World({ seed: 2 });
  const bright = new World({ sun: 100 });
  const initial = first.snapshot();
  for (const world of [first, second, other, bright]) run(world, 10);
  assert.deepEqual(first.snapshot(), second.snapshot());
  assert.notDeepEqual(first.snapshot(), other.snapshot());
  assert.ok(bright.evaporations >= first.evaporations * 1.8);
  first.reset();
  assert.deepEqual(first.snapshot(), initial);
  run(first, 10);
  assert.deepEqual(first.snapshot(), second.snapshot());
});
