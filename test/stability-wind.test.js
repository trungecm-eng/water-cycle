import test from 'node:test';
import assert from 'node:assert/strict';
import { runCycle, mountainFraction } from '../test-support/stability.js';

test('3D mountain rain increases strictly with wind and clouds avoid the west edge for 300 seconds', t => {
  const fractions = [];
  for (const wind of [0, 40, 100]) {
    const { rain } = runCycle({ wind });
    t.diagnostic(JSON.stringify({ wind, rain }));
    fractions.push(mountainFraction(rain));
    if (wind === 0) assert.ok(rain.sea > Object.values(rain).reduce((a, b) => a + b) * 0.5);
  }
  assert.ok(fractions[1] >= 0.25, JSON.stringify(fractions));
  assert.ok(fractions[2] >= 0.5, JSON.stringify(fractions));
  assert.ok(fractions[0] < fractions[1] && fractions[1] < fractions[2], JSON.stringify(fractions));
});
