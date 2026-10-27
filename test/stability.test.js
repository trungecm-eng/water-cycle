import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/legacy-world.js';
import { config } from '../src/config.js';
import { terrainHeight } from '../src/sim/terrain.js';

const stepsPerSecond = Math.round(1 / config.clock.dt);

test('legacy 2D: default cycle meets milestones and stays active in every rolling minute', () => {
  const world = new World();
  const milestones = {};
  const history = [];
  let minimumWater = world.lake.count;
  for (let step = 1; step <= 600 * stepsPerSecond; step++) {
    world.step();
    minimumWater = Math.min(minimumWater, world.lake.count);
    if (world.evaporations) milestones.evaporation ??= world.time;
    if (world.clusters.some(cluster => cluster.visible)) milestones.cloud ??= world.time;
    if (world.particles.some(particle => particle.state === 'rain')) milestones.rain ??= world.time;
    if (world.returns) milestones.return ??= world.time;
    history.push([world.evaporations, world.returns]);
    // Every fixed-step-aligned 60-second window starting at or after t=120.
    if (step >= 180 * stepsPerSecond) {
      const before = history[step - 60 * stepsPerSecond - 1];
      assert.ok(world.evaporations > before[0], `No evaporation in minute ending at ${world.time}`);
      assert.ok(world.returns > before[1], `No return in minute ending at ${world.time}`);
    }
  }
  for (const [name, deadline] of Object.entries({ evaporation: 10, cloud: 45, rain: 75, return: 120 })) {
    assert.ok(milestones[name] <= deadline, `${name}: ${milestones[name]} > ${deadline}`);
  }
  assert.ok(minimumWater >= config.defaults.n * 0.2, `Minimum water: ${minimumWater}`);
});

test('legacy 2D: all sunlight and wind combinations conserve bounded finite particles for 600 seconds', () => {
  const states = new Set(['water', 'vapor', 'cloud', 'rain', 'runoff']);
  for (const sun of [0, 50, 100]) for (const wind of [0, 40, 100]) {
    const world = new World({ sun, wind });
    for (let step = 0; step < 600 * stepsPerSecond; step++) {
      world.step();
      let water = 0;
      let valid = world.particles.length === config.defaults.n;
      for (const particle of world.particles) {
        valid &&= states.has(particle.state)
          && Number.isFinite(particle.x) && Number.isFinite(particle.y)
          && Number.isFinite(particle.vx) && Number.isFinite(particle.vy)
          && Number.isFinite(particle.temperature)
          && particle.temperature >= 0 && particle.temperature <= 100
          && particle.x >= 0 && particle.x <= config.world.width
          && particle.y >= terrainHeight(particle.x) - 1e-9 && particle.y <= config.world.height;
        if (particle.state === 'water') water++;
      }
      assert.ok(valid, `Invalid particle: sun=${sun}, wind=${wind}, step=${step}`);
      assert.equal(water, world.lake.count);
    }
    assert.equal(new Set(world.particles.map(particle => particle.id)).size, config.defaults.n);
  }
});

test('legacy 2D: full sunlight increases evaporation and switching it off preserves the airborne cycle', () => {
  const normal = new World();
  const hot = new World({ sun: 100 });
  for (let step = 0; step < 60 * stepsPerSecond; step++) {
    normal.step();
    hot.step();
  }
  assert.ok(hot.evaporations >= 1.5 * normal.evaporations);
  assert.ok(normal.particles.some(particle => particle.state === 'vapor'));
  const positions = normal.particles.map(({ x, y }) => [x, y]);
  normal.sun = 0;
  normal.wind = 100;
  assert.deepEqual(normal.particles.map(({ x, y }) => [x, y]), positions);
  const evaporations = normal.evaporations;
  const returns = normal.returns;
  const initialCloudIds = new Set(normal.particles.filter(particle => particle.state === 'cloud').map(particle => particle.id));
  let condensed = false;
  let rained = false;
  for (let step = 0; step < 120 * stepsPerSecond; step++) {
    normal.step();
    condensed ||= normal.particles.some(particle => particle.state === 'cloud' && !initialCloudIds.has(particle.id));
    rained ||= normal.particles.some(particle => particle.state === 'rain');
  }
  assert.equal(normal.evaporations, evaporations);
  assert.ok(condensed);
  assert.ok(rained);
  assert.ok(normal.returns > returns);
});
