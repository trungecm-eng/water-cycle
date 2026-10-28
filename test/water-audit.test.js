import test from 'node:test';
import assert from 'node:assert/strict';
import { renderedTriangleHeight, measureSurfaceClearance, auditChannelBanks } from '../src/art/water-audit.js';
import { generateDrainage } from '../src/sim/drainage.js';

test('rendered height follows both terrain triangles rather than bilinear interpolation', () => {
  const heights = Float32Array.from([0, 0, 0, 8]);
  assert.equal(renderedTriangleHeight(heights, 1, 10, 2, 3), 0);
  assert.equal(renderedTriangleHeight(heights, 1, 10, 8, 7), 4);
  assert.equal(renderedTriangleHeight(heights, 1, 10, 10, 10), 8);
});

test('clearance audit distinguishes floating covered and touching vertices', () => {
  assert.deepEqual(measureSurfaceClearance([0, 4, 0, 1, -2, 1, 2, 0.01, 2], () => 0), {
    vertices: 3, floatingVertices: 1, coveredVertices: 1, minimumGap: -2, maximumGap: 4
  });
  assert.deepEqual(measureSurfaceClearance([], () => 0), {
    vertices: 0, floatingVertices: 0, coveredVertices: 0, minimumGap: null, maximumGap: null
  });
});

test('channel audit is reproducible at both resolutions and leaves the simulation map unchanged', () => {
  const map = generateDrainage();
  const original = Array.from(map.heights);
  for (const cells of [80, 160]) {
    const audit = auditChannelBanks(map, cells);
    assert.deepEqual(audit, auditChannelBanks(map, cells));
    assert.equal(audit.channels.length, 4);
    for (const channel of audit.channels) {
      assert.ok(channel.rendered.vertices > 0);
      assert.equal(channel.rendered.vertices, channel.analytic.vertices);
      for (const surface of [channel.rendered, channel.analytic]) {
        assert.ok(Number.isFinite(surface.minimumGap));
        assert.ok(Number.isFinite(surface.maximumGap));
        assert.ok(surface.minimumGap <= surface.maximumGap);
        assert.ok(surface.floatingVertices + surface.coveredVertices <= surface.vertices);
      }
    }
  }
  assert.deepEqual(Array.from(map.heights), original);
});
