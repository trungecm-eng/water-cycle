import test from 'node:test';
import assert from 'node:assert/strict';
import { QualityMonitor, parseQuality, qualityLevels } from '../src/quality.js';
import { World } from '../src/sim/world.js';

test('quality URL uses supported values and safe defaults', () => {
  for (const [query, expected] of [['', 'high'], ['?quality=low', 'low'], ['?quality=high', 'high'], ['?quality=ultra', 'high']]) assert.equal(parseQuality(query), expected);
  assert.equal(qualityLevels.low.terrainStep, 2);
  assert.equal(qualityLevels.low.waves, false);
});
function feed(monitor, start, seconds, fps) {
  for (let i = 0; i <= seconds * fps; i++) monitor.frame(start + i / fps);
}
test('slow hint requires five continuous slow seconds at high quality', () => {
  const monitor = new QualityMonitor();
  feed(monitor, 0, 4, 20);
  assert.equal(monitor.slowHint, false);
  feed(monitor, 4, 1, 20);
  assert.equal(monitor.slowHint, true);
  assert.equal(monitor.level, 'high');
  monitor.select('high');
  feed(monitor, 6, 10, 30);
  assert.equal(monitor.slowHint, false);
  monitor.select('low');
  feed(monitor, 10, 8, 20);
  assert.equal(monitor.slowHint, false);
  monitor.select('high');
  feed(monitor, 20, 4, 20);
  feed(monitor, 24, 2, 60);
  feed(monitor, 26, 4, 20);
  assert.equal(monitor.slowHint, false);
});
test('hidden tabs and level changes reset samples; dismissed hint stays closed', () => {
  const monitor = new QualityMonitor();
  feed(monitor, 0, 4, 20);
  monitor.frame(100, true);
  feed(monitor, 110, 4, 20);
  assert.equal(monitor.slowHint, false);
  feed(monitor, 114, 1, 20);
  assert.equal(monitor.slowHint, true);
  monitor.dismiss();
  monitor.select('low');
  monitor.select('high');
  feed(monitor, 120, 10, 20);
  assert.deepEqual(monitor.snapshot(), { level: 'high', slowHint: false });
});
test('quality selections leave deterministic worlds unchanged', () => {
  const first = new World({ n: 100, seed: 13 });
  const second = new World({ n: 100, seed: 13 });
  const monitor = new QualityMonitor();
  for (let i = 0; i < 180; i++) {
    first.step(); second.step();
    monitor.select(i % 2 ? 'high' : 'low');
  }
  assert.deepEqual(first.snapshot(), second.snapshot());
  assert.deepEqual(first.particles, second.particles);
});
