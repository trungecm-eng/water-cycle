import test from 'node:test';
import assert from 'node:assert/strict';
import { runCycle, mountainFraction } from '../test-support/stability.js';

test('default 3D cycle meets milestones and conserves finite particles for 600 seconds', t => {
  const { world, milestones, minimumLake, rain } = runCycle({}, 600);
  t.diagnostic(JSON.stringify({ milestones, minimumLake, streamToLake: world.streamToLake, riverToSea: world.riverToSea, rain }));
  for (const [name, deadline] of Object.entries({ evaporation: 10, cloud: 45, rain: 75, landReturn: 120 })) {
    assert.ok(milestones[name] <= deadline, `${name}: ${milestones[name]} > ${deadline}`);
  }
  assert.ok(minimumLake > 0);
  assert.ok(world.streamToLake > 0);
  assert.ok(world.riverToSea > 0);
  assert.ok(mountainFraction(rain) >= 0.25);
});

test('strong sunlight raises evaporation and switching it off preserves the airborne 3D cycle', async () => {
  const { World } = await import('../src/sim/world.js');
  const normal = new World();
  const hot = new World({ sun: 100 });
  for (let step = 0; step < 60 * 60; step++) { normal.step(); hot.step(); }
  assert.ok(hot.evaporations >= normal.evaporations * 1.5);
  assert.ok(normal.particles.some(p => p.state === 'vapor'));
  const positions = normal.particles.map(({ x, y, z }) => [x, y, z]);
  normal.sun = 0;
  normal.wind = 100;
  assert.deepEqual(normal.particles.map(({ x, y, z }) => [x, y, z]), positions);
  const evaporations = normal.evaporations;
  const returns = normal.returns;
  const initialClouds = new Set(normal.particles.filter(p => p.state === 'cloud').map(p => p.id));
  let condensed = false;
  let rained = false;
  for (let step = 0; step < 120 * 60; step++) {
    normal.step();
    condensed ||= normal.particles.some(p => p.state === 'cloud' && !initialClouds.has(p.id));
    rained ||= normal.particles.some(p => p.state === 'rain');
  }
  assert.equal(normal.evaporations, evaporations);
  assert.ok(condensed && rained);
  assert.ok(normal.returns > returns);
});
