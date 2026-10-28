import test from 'node:test';
import assert from 'node:assert/strict';
import { windArrow } from '../src/art/wind-arrow.js';
import { World } from '../src/sim/world.js';

test('wind arrow points inland and grows strictly with wind without changing World', () => {
  const world = new World();
  const before = world.snapshot();
  let previous;
  for (let wind = 0; wind <= 100; wind++) {
    const arrow = windArrow(wind);
    assert.equal(arrow.visible, wind > 0);
    assert.ok(arrow.points.at(-1)[0] < arrow.points[0][0]);
    if (previous) {
      assert.ok(arrow.length > previous.length);
      assert.ok(arrow.opacity >= previous.opacity);
    }
    previous = arrow;
  }
  assert.deepEqual(world.snapshot(), before);
});
