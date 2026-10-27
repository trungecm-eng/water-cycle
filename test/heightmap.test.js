import test from 'node:test';
import assert from 'node:assert/strict';
import { mapData } from '../src/map-data.js';
import { generateHeightmap, heightAt } from '../src/sim/heightmap.js';
import { parseParams } from '../src/sim/params.js';

test('map generation is deterministic and independent of simulation seed', () => {
  const first = generateHeightmap();
  parseParams('?seed=999');
  assert.deepEqual(first, generateHeightmap());
  assert.equal(first.heights.length, 97 * 97);
  assert.ok(Object.isFrozen(mapData.peaks[0]));
  assert.notDeepEqual(first.heights, generateHeightmap({ ...mapData, seed: 405 }).heights);
});

test('sea is below zero and mountain peaks dominate gentle plains', () => {
  const map = generateHeightmap();
  let maximum = 0;
  const slopes = { plain: [], mountain: [] };
  for (let i = 0; i < map.heights.length; i++) {
    if (map.heights[i] > map.heights[maximum]) maximum = i;
    if (map.regions[i] === 'sea') assert.ok(map.heights[i] < 0);
    const region = map.regions[i];
    if (slopes[region] && i % map.stride < map.cells && Math.floor(i / map.stride) < map.cells) {
      slopes[region].push(Math.hypot(map.heights[i + 1] - map.heights[i], map.heights[i + map.stride] - map.heights[i]) / map.spacing);
    }
  }
  assert.equal(map.regions[maximum], 'mountain');
  assert.ok(map.heights[maximum] > 270 && map.heights[maximum] < 310);
  const average = values => values.reduce((a, b) => a + b, 0) / values.length;
  assert.ok(average(slopes.plain) <= average(slopes.mountain) / 3);
});

test('height sampling interpolates vertices and clamps map boundaries', () => {
  const map = generateHeightmap();
  assert.equal(heightAt(map, 0, 0), map.heights[0]);
  assert.equal(heightAt(map, -100, -100), map.heights[0]);
  assert.equal(heightAt(map, 1100, 1100), map.heights.at(-1));
  assert.equal(heightAt(map, map.spacing / 2, 0), (map.heights[0] + map.heights[1]) / 2);
});

test('particle URL bounds support the new 3D population', () => {
  assert.equal(parseParams('?n=1500').n, 1500);
  assert.equal(parseParams('?n=2000').n, 2000);
  for (const value of ['50', '3000', 'abc']) assert.equal(parseParams(`?n=${value}`).n, 1000);
});
