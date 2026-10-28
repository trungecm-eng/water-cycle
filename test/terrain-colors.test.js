import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { mapData } from '../src/map-data.js';
import { generateDrainage } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';
import { terrainColor, colorAt, terrainSample, coastlineSamples } from '../src/art/terrain-colors.js';
import { generateFields, fieldAt } from '../src/art/fields.js';
import { World } from '../src/sim/world.js';

const map = generateDrainage();

test('terrain palette respects water sand snow slope and seeded grass variation', () => {
  const sample = { region: 'plain', height: 20, slope: 0.1, noise: 0.3 };
  assert.equal(terrainColor({ ...sample, height: 250 }), config.colors.snow);
  assert.equal(terrainColor({ ...sample, slope: 2 }), config.colors.slope);
  assert.notEqual(terrainColor(sample), terrainColor({ ...sample, noise: 0.7 }));
  for (const region of ['sea', 'lake', 'pond', 'stream', 'river']) {
    assert.equal(terrainColor({ ...sample, region, height: 250, slope: 2, field: config.colors.fieldGold }), config.colors.mud);
  }
  assert.equal(terrainColor({ ...sample, region: 'beach', slope: 2 }), config.colors.beach);
  const colors = new Set();
  const repeated = generateDrainage();
  for (let z = 50; z < 950; z += 20) {
    colors.add(colorAt(map, 650, z));
    assert.equal(colorAt(map, 650, z), colorAt(repeated, 650, z));
  }
  assert.ok(colors.has(config.colors.plain) && colors.has(config.colors.plainLight));
});

test('fields are deterministic separated rectangles entirely on gentle inland plain', () => {
  const fields = generateFields(map);
  assert.ok(fields.length >= 20);
  assert.deepEqual(fields, generateFields(map));
  assert.notDeepEqual(fields, generateFields(map, { ...mapData, seed: 405 }));
  for (const field of fields) {
    assert.equal(fieldAt(fields, field.x + field.width / 2, field.z + field.depth / 2), field.color);
    for (let z = field.z; z <= field.z + field.depth; z += 1) for (let x = field.x; x <= field.x + field.width; x += 1) {
      const sample = terrainSample(map, x, z);
      assert.equal(sample.region, 'plain');
      assert.ok(sample.slope <= config.art.fieldSlope);
    }
  }
  assert.equal(fieldAt(fields, 950, 500), null);
});

test('foam follows the actual waterline and stays above the coastal ground', () => {
  const points = coastlineSamples(map);
  assert.deepEqual(points, coastlineSamples(map));
  for (const [x, y, z] of points) {
    assert.ok(Math.abs(heightAt(map, x, z)) < 0.0001);
    assert.ok(heightAt(map, x, z) < y);
  }
});

test('terrain colors and fields at both quality resolutions leave World unchanged', () => {
  const first = new World({ n: 100, seed: 19 });
  const second = new World({ n: 100, seed: 19 });
  for (const quality of Object.values(config.quality.levels)) {
    const fields = generateFields(first.map);
    for (let row = 0; row <= quality.terrainCells; row++) {
      const x = first.map.size * row / quality.terrainCells;
      colorAt(first.map, x, 500, fieldAt(fields, x, 500));
    }
    for (let i = 0; i < 120; i++) { first.step(); second.step(); }
  }
  assert.deepEqual(first.snapshot(), second.snapshot());
  assert.deepEqual(first.particles, second.particles);
  assert.equal(first.rng(), second.rng());
});
