import test from 'node:test';
import assert from 'node:assert/strict';
import { runCycle } from '../test-support/stability.js';

test('3D sun 0 conserves bounded finite particles at all three winds for 300 seconds', () => {
  for (const wind of [0, 40, 100]) {
    const { world } = runCycle({ sun: 0, wind });
    assert.equal(world.particles.length, world.options.n);
    if (0 === 0) assert.equal(world.evaporations, 0);
  }
});
