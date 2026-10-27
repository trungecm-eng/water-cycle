import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';

function run(world, seconds) {
  for (let step = 0; step < seconds / config.clock.dt; step++) world.step();
}

test('a heat ray heats only the surface of its target column', () => {
  const world = new World();
  const surface = world.lake.surface(4);
  world.rays.push({ column: 4, x: surface.x, y: surface.y });
  world.step();
  assert.equal(surface.temperature, config.heat.baseline + config.heat.rayHeat);
  for (const particle of world.particles) {
    if (particle !== surface) assert.equal(particle.temperature, config.heat.baseline);
  }
});

test('water cools to baseline and only hot surface particles evaporate', () => {
  const world = new World();
  const surface = world.lake.surface(0);
  const buried = world.lake.cells[0][0];
  surface.temperature = 80;
  buried.temperature = 100;
  world.step();
  assert.equal(surface.state, 'water');
  assert.equal(buried.state, 'water');
  surface.temperature = 81;
  const level = world.lake.level;
  world.step();
  assert.equal(surface.state, 'vapor');
  assert.ok(surface.vy > 0);
  assert.equal(world.evaporations, 1);
  assert.ok(Math.abs(world.lake.level - level + config.lake.levelPerParticle) < 1e-10);
  const height = surface.y;
  world.step();
  assert.ok(surface.y > height);
  const cold = world.lake.surface(1);
  cold.temperature = config.heat.baseline + 0.001;
  world.step();
  assert.equal(cold.temperature, config.heat.baseline);
});

test('sun zero prevents evaporation and removes rays already in flight', () => {
  const world = new World({ sun: 0 });
  run(world, 120);
  assert.equal(world.evaporations, 0);
  assert.equal(world.rays.length, 0);
  world.sun = 100;
  run(world, 10);
  assert.ok(world.evaporations > 0);
  world.sun = 0;
  const before = world.evaporations;
  run(world, 10);
  assert.equal(world.evaporations, before);
  assert.equal(world.rays.length, 0);
});

test('heat emission is seeded and proportional to sunlight', () => {
  const first = new World();
  const second = new World();
  const other = new World({ seed: 2 });
  run(first, 10);
  run(second, 10);
  run(other, 10);
  assert.deepEqual(first.snapshot(), second.snapshot());
  assert.notDeepEqual(first.snapshot(), other.snapshot());
  assert.ok(first.evaporations > 0);
  const dim = new World({ sun: 25 });
  const bright = new World({ sun: 50 });
  run(dim, 0.5);
  run(bright, 0.5);
  assert.equal(bright.rays.length, dim.rays.length * 2 + 1);
});
