import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { mulberry32 } from '../src/sim/rng.js';
import { terrainHeight, isInsideTerrain } from '../src/sim/terrain.js';

test('configuration is readable and deeply frozen', () => {
  assert.equal(config.world.width, 1000);
  assert.equal(config.world.height, 600);
  assert.equal(config.clock.dt, 1 / 60);
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.terrain[0]));
  assert.throws(() => { config.lake.bottom = 0; }, TypeError);
});

test('terrain is monotone and interpolates all segments', () => {
  for (let i = 1; i < config.terrain.length; i++) {
    const [x0, y0] = config.terrain[i - 1];
    const [x1, y1] = config.terrain[i];
    assert.ok(x1 > x0);
    assert.ok(y1 <= y0);
    assert.equal(terrainHeight((x0 + x1) / 2), (y0 + y1) / 2);
    assert.equal(terrainHeight(x1), y1);
  }
  assert.equal(terrainHeight(-1), 340);
  assert.equal(terrainHeight(1001), 60);
  assert.equal(isInsideTerrain(175, 294), true);
  assert.equal(isInsideTerrain(175, 295), false);
  assert.equal(isInsideTerrain(-1, 0), false);
});

test('mulberry32 has reproducible bounded output and distinct seeds', () => {
  const sample = seed => { const random = mulberry32(seed); return Array.from({ length: 1000 }, random); };
  const values = sample(1);
  assert.deepEqual(values, sample(1));
  assert.notDeepEqual(values, sample(2));
  assert.equal(values[0], 0.6270739405881613);
  assert.ok(values.every(value => value >= 0 && value < 1));
});
