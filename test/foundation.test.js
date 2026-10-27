import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { mulberry32 } from '../src/sim/rng.js';

test('configuration is readable and deeply frozen', () => {
  assert.equal(config.world.width, 1000);
  assert.equal(config.world.height, 600);
  assert.equal(config.clock.dt, 1 / 60);
  assert.ok(Object.isFrozen(config));
  assert.ok(Object.isFrozen(config.colors));
  assert.throws(() => { config.camera.minElevation = 0; }, TypeError);
});

test('mulberry32 has reproducible bounded output and distinct seeds', () => {
  const sample = seed => { const random = mulberry32(seed); return Array.from({ length: 1000 }, random); };
  const values = sample(1);
  assert.deepEqual(values, sample(1));
  assert.notDeepEqual(values, sample(2));
  assert.equal(values[0], 0.6270739405881613);
  assert.ok(values.every(value => value >= 0 && value < 1));
});
