import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage } from '../src/sim/drainage.js';
import { renderedRiverSurface } from '../src/art/channel-surface.js';
import { channelRibbon, waterBedHeight } from '../src/art/water-shapes.js';
import { renderedTriangleHeight, sampleSurfaceTriangles } from '../src/art/water-audit.js';

const map = generateDrainage();
const river = map.channels.find(channel => channel.type === 'river');

test('river water fills its banks against actual land triangles at both qualities', () => {
  const before = Array.from(map.heights);
  for (const cells of [80, 160]) {
    const spacing = map.size / cells, stride = cells + 1;
    const heights = Float32Array.from({ length: stride ** 2 }, (_, index) =>
      waterBedHeight(map, index % stride * spacing, Math.floor(index / stride) * spacing));
    const ground = (x, z) => renderedTriangleHeight(heights, cells, map.size, x, z);
    const surface = renderedRiverSurface(map, river, cells);
    assert.deepEqual(surface, renderedRiverSurface(map, river, cells));
    let touching = 0;
    for (let i = 0; i < surface.length; i += 3) {
      if (Math.abs(surface[i + 1] - ground(surface[i], surface[i + 2])) < 1e-5) touching++;
    }
    assert.ok(touching > 100, `${cells}: missing bank intersections`);
    const samples = sampleSurfaceTriangles(surface);
    for (let i = 0; i < samples.length; i += 3) {
      assert.ok(samples[i + 1] >= ground(samples[i], samples[i + 2]) - 1e-5,
        `${cells}: water crosses dry land`);
    }
    const area = positions => {
      let total = 0;
      for (let i = 0; i < positions.length; i += 9) total += Math.abs(
        (positions[i + 3] - positions[i]) * (positions[i + 8] - positions[i + 2])
        - (positions[i + 6] - positions[i]) * (positions[i + 5] - positions[i + 2])) / 2;
      return total;
    };
    assert.ok(area(surface) > area(channelRibbon(map, river)), 'water must fill beyond the original narrow ribbon');
    assert.ok(surface.length / 9 < 30000, 'river geometry must stay within its rendering budget');
  }
  assert.deepEqual(Array.from(map.heights), before);
});

test('trees and fields leave the expanded river footprint clear at both qualities', async () => {
  const { generateTrees } = await import('../src/art/trees.js');
  const { generateFields } = await import('../src/art/fields.js');
  const { riverBankContains } = await import('../src/art/channel-surface.js');
  const trees = generateTrees(map);
  assert.equal(trees.length, 2200);
  for (const tree of trees) assert.equal(riverBankContains(map, tree.x, tree.z), false);
  const fields = generateFields(map);
  assert.equal(fields.length, 36);
  for (const field of fields) for (let z = field.z; z <= field.z + field.depth; z += 1) {
    for (let x = field.x; x <= field.x + field.width; x += 1) assert.equal(riverBankContains(map, x, z), false);
  }
});
