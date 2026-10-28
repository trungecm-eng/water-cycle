import test from 'node:test';
import assert from 'node:assert/strict';
import { generateTrees, treeEligible } from '../src/art/trees.js';
import { terrainSample } from '../src/art/terrain-colors.js';
import { generateDrainage } from '../src/sim/drainage.js';
import { config } from '../src/config.js';
import { mapData } from '../src/map-data.js';
import { World } from '../src/sim/world.js';

const map = generateDrainage();

test('forests are seeded clustered bounded and avoid forbidden terrain', () => {
  const trees = generateTrees(map);
  assert.ok(trees.length >= 1500 && trees.length <= 3000);
  assert.deepEqual(trees, generateTrees(map));
  assert.notDeepEqual(trees, generateTrees(map, 2200, { ...mapData, seed: 405 }));
  const low = generateTrees(map, config.quality.levels.low.trees);
  assert.ok(low.length > 0 && low.length <= 500);
  assert.deepEqual(low, trees.slice(0, low.length));
  for (const tree of trees) {
    const sample = terrainSample(map, tree.x, tree.z);
    assert.ok(treeEligible(sample));
    assert.ok(!['sea', 'lake', 'pond', 'river', 'stream', 'beach'].includes(sample.region));
    assert.ok(sample.slope < config.art.treeSlope);
    assert.ok(sample.height < config.art.snowHeight);
    assert.equal(tree.y, sample.height);
  }
  for (const region of ['sea', 'lake', 'pond', 'river', 'stream', 'beach']) {
    assert.equal(treeEligible({ region, slope: 0, height: 0 }), false);
  }
  assert.equal(treeEligible({ region: 'mountain', slope: 0, height: config.art.snowHeight }), false);
  assert.equal(treeEligible({ region: 'plain', slope: config.art.treeSlope, height: 20 }), false);
  // Foothills are mountain land below the white peaks; normalize by all land cells,
  // including steep slopes, so exclusion cannot artificially inflate the density.
  const cells = { mountain: 0, plain: 0 };
  map.regions.forEach((region, i) => {
    if (region in cells && map.heights[i] < config.art.snowHeight) cells[region]++;
  });
  for (const forest of [trees, low]) {
    const density = region => forest.filter(tree => tree.region === region).length / cells[region];
    assert.ok(density('mountain') >= 2 * density('plain'));
  }
  assert.ok(new Set(trees.map(tree => tree.scale)).size > 100);
  assert.ok(new Set(trees.map(tree => tree.shade)).size > 100);
});

test('forest generation and quality toggles do not affect World or its random stream', () => {
  const decorated = new World({ n: 100, seed: 12 });
  const bare = new World({ n: 100, seed: 12 });
  for (const count of [2200, 400, 0, 2200]) {
    generateTrees(decorated.map, count);
    for (let i = 0; i < 120; i++) { decorated.step(); bare.step(); }
  }
  assert.deepEqual(decorated.snapshot(), bare.snapshot());
  assert.deepEqual(decorated.particles, bare.particles);
  assert.equal(decorated.rng(), bare.rng());
});
