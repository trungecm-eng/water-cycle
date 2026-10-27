import test from 'node:test';
import assert from 'node:assert/strict';
import { Lake } from '../src/sim/lake.js';
import { config } from '../src/config.js';

const particles = n => Array.from({ length: n }, (_, id) => ({ id }));
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-10);

test('initial fill uses distinct cells bottom first and fits 1200 particles', () => {
  for (const n of [100, 600, 1200]) {
    const items = particles(n);
    const lake = new Lake(items);
    assert.equal(lake.count, n);
    assert.equal(new Set(items.map(p => `${p.x},${p.y}`)).size, n);
    close(lake.level, config.lake.bottom + n * config.lake.levelPerParticle);
    for (let i = 0; i < n; i++) {
      assert.equal(items[i].y, config.lake.bottom + (Math.floor(i / 60) + 0.5) * 6);
      assert.equal(items[i].state, 'water');
      assert.equal(items[i].temperature, config.heat.baseline);
    }
  }
  assert.throws(() => new Lake(particles(1201)), RangeError);
});

test('surface selects highest occupied particle independently per column', () => {
  const items = particles(121);
  const lake = new Lake(items);
  assert.equal(lake.surface(0), items[120]);
  assert.equal(lake.surface(1), items[61]);
  assert.equal(lake.remove(items[120]), true);
  assert.equal(lake.surface(0), items[60]);
  assert.equal(lake.remove(items[120]), false);
  assert.equal(new Lake().surface(0), null);
});

test('return fills lowest vacancy then nearest column with left tie break', () => {
  const items = particles(120);
  const lake = new Lake(items);
  const initialLevel = lake.level;
  lake.remove(items[10]);
  close(lake.level, initialLevel - config.lake.levelPerParticle);
  const returned = { x: 999, vx: 20, vy: -50, temperature: 90, state: 'rain' };
  assert.deepEqual(lake.add(returned), { row: 0, column: 10 });
  close(lake.level, initialLevel);
  assert.equal(returned.vx, 0);
  assert.equal(returned.vy, 0);
  assert.equal(returned.temperature, config.heat.baseline);
  lake.remove(items[60]);
  lake.remove(items[61]);
  assert.deepEqual(lake.add({}, 646), { row: 1, column: 0 });
  assert.deepEqual(lake.add({}, 650), { row: 1, column: 1 });
  assert.throws(() => lake.add(returned), /already/);
});

test('full lake rejects extra particles without changing occupancy', () => {
  const lake = new Lake(particles(1200));
  assert.throws(() => lake.add({}, 700), RangeError);
  assert.equal(lake.count, 1200);
});
