import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage } from '../src/sim/drainage.js';
import { generateStrata } from '../src/art/strata.js';
import { waterBedHeight } from '../src/art/water-shapes.js';
import { config } from '../src/config.js';
const map = generateDrainage();

test('four cutaway edges have four contiguous positive layers following the terrain', () => {
  const original = Array.from(map.heights);
  const edges = generateStrata(map);
  assert.equal(edges.length, 4);
  assert.deepEqual(edges, generateStrata(map));
  for (const [index, edge] of edges.entries()) {
    assert.equal(edge.layers.length, 4);
    assert.equal(new Set(edge.layers.map(layer => layer.color)).size, 4);
    for (const column of edge.columns) {
      assert.equal(column.heights[0], config.scenery.base);
      assert.equal(column.heights.at(-1), waterBedHeight(map, column.x, column.z));
      for (let i = 1; i < column.heights.length; i++) assert.ok(column.heights[i] > column.heights[i-1]);
    }
    assert.deepEqual(edge.columns.at(-1), edges[(index+1)%4].columns[0]);
    for (let layer = 0; layer < edge.layers.length - 1; layer++) {
      const lower = edge.layers[layer].positions, upper = edge.layers[layer+1].positions;
      for (let i = 0; i < lower.length; i += 18) {
        assert.deepEqual(lower.slice(i+6,i+9), upper.slice(i,i+3));
        assert.deepEqual(lower.slice(i+15,i+18), upper.slice(i+3,i+6));
      }
    }
    for (const layer of edge.layers) {
      const heights = layer.positions.filter((_, i) => i % 3 === 1);
      assert.ok(new Set(heights).size > 10);
    }
  }
  assert.deepEqual(Array.from(map.heights), original);
});

test('sea cutaway meets the seabed and exposes water only below sea level', () => {
  const edges = generateStrata(map);
  assert.ok(edges[1].water.length > 0);
  assert.equal(edges[3].water.length, 0);
  for (const edge of edges) for (let i = 0; i < edge.water.length; i += 3) {
    const [x,y,z] = edge.water.slice(i,i+3);
    assert.ok(y <= config.world.seaLevel);
    const bed = waterBedHeight(map,x,z);
    assert.ok(Math.abs(y - bed) < 1e-6 || y === config.world.seaLevel);
    assert.ok(bed <= config.world.seaLevel + 1e-6);
  }
});
