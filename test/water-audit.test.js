import test from 'node:test';
import assert from 'node:assert/strict';
import { renderedTriangleHeight, sampleSurfaceTriangles, measureSurfaceClearance, locateClearanceExtrema, auditChannelBanks } from '../src/art/water-audit.js';
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
      for (const kind of ['analytic', 'rendered']) {
        const extrema = channel.extrema[kind];
        assert.equal(extrema.minimum.gap, channel[kind].minimumGap);
        assert.equal(extrema.maximum.gap, channel[kind].maximumGap);
        for (const sample of [extrema.minimum, extrema.maximum]) {
          assert.equal(sample.position[1] - sample.groundHeight, sample.gap);
          assert.ok(sample.vertex >= 0 && sample.vertex < channel[kind].vertices);
        }
      }
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


test('shallow river carving limits exposed edge clearance without burying water', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const river = auditChannelBanks(map, cells).channels.find(channel => channel.type === 'river');
    assert.equal(river.rendered.coveredVertices, 0);
    assert.ok(river.rendered.minimumGap > 0);
    // Includes the outlet and nearby stream junction, where the gap is largest.
    // The former four-unit river carving exceeded this bound at both qualities.
    assert.ok(river.rendered.maximumGap < 4.1);
  }
});


test('stream outer banks limit downstream excavation while keeping coarse-grid water visible', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const streams = auditChannelBanks(map, cells).channels.filter(channel => channel.type === 'stream');
    for (const stream of streams) assert.equal(stream.rendered.coveredVertices, 0);
    // This stream previously had gaps above 26.7 at low and 27.2 at high.
    assert.ok(streams[0].rendered.maximumGap < 26);
    assert.ok(streams[0].analytic.maximumGap < 26);
  }
});


test('steeper outer stream banks reduce upstream gaps without hiding water', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const streams = auditChannelBanks(map, cells).channels.filter(channel => channel.type === 'stream');
    for (const stream of streams) assert.equal(stream.rendered.coveredVertices, 0);
    assert.ok(streams[0].rendered.maximumGap < 24);
    assert.ok(streams[1].rendered.maximumGap < (cells === 80 ? 53 : 37));
  }
});


test('shallower stream beds reduce edge gaps and retain positive mesh clearance', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const streams = auditChannelBanks(map, cells).channels.filter(channel => channel.type === 'stream');
    for (const stream of streams) {
      assert.equal(stream.rendered.coveredVertices, 0);
      assert.ok(stream.rendered.minimumGap > 0.05);
      assert.ok(stream.analytic.minimumGap < 3.75);
    }
    assert.ok(streams[0].rendered.maximumGap < (cells === 80 ? 20.4 : 22.8));
  }
});

test('river banks extend segment slopes upstream without burying ribbon edges', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const river = auditChannelBanks(map, cells).channels.find(channel => channel.type === 'river');
    assert.equal(river.rendered.coveredVertices, 0);
    assert.ok(river.rendered.minimumGap > 0.05);
    // Constant endpoint excavation produced gaps of 3.77 / 4.04 units.
    assert.ok(river.rendered.maximumGap < (cells === 80 ? 3.3 : 3.6));
  }
});


test('clearance extrema retain exact positions and choose the first tied vertex', () => {
  assert.deepEqual(locateClearanceExtrema([], () => 0), { minimum: null, maximum: null });
  const positions = Float32Array.from([1, 4, 2, 3, -2, 4, 5, 4, 6]);
  const before = Array.from(positions);
  assert.deepEqual(locateClearanceExtrema(positions, () => 1), {
    minimum: { vertex: 1, position: [3, -2, 4], groundHeight: 1, gap: -3 },
    maximum: { vertex: 0, position: [1, 4, 2], groundHeight: 1, gap: 3 }
  });
  assert.deepEqual(Array.from(positions), before);
});


test('tapered headwaters reduce the third stream source overhang at both qualities', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const streams = auditChannelBanks(map, cells).channels.filter(channel => channel.type === 'stream');
    // Previously 69.22 / 55.63: this is a regression bound, not shoreline acceptance.
    assert.ok(streams[2].rendered.maximumGap < (cells === 80 ? 67 : 52));
    for (const stream of streams) {
      assert.equal(stream.rendered.coveredVertices, 0);
      assert.ok(stream.rendered.minimumGap > 0.05);
    }
  }
});


test('triangle-aware stream routes reduce headwater overhang below thirty-three units', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) {
    const streams = auditChannelBanks(map, cells).channels.filter(channel => channel.type === 'stream');
    // Before triangle-aware routing: 66.77 / 51.83 units at the third spring.
    assert.ok(streams[2].rendered.maximumGap < 33);
    assert.ok(streams[1].rendered.maximumGap < 38);
    for (const stream of streams) {
      assert.equal(stream.rendered.coveredVertices, 0);
      assert.ok(stream.rendered.minimumGap > 0.05);
    }
  }
});


test('surface sampling finds terrain crossing between clear triangle corners', () => {
  const triangle = Float32Array.from([0, 1, 0, 6, 1, 0, 0, 1, 6]);
  const original = Array.from(triangle);
  const terrain = (x, z) => x === 2 && z === 2 ? 3 : 0;
  assert.equal(measureSurfaceClearance(triangle, terrain).coveredVertices, 0);
  const samples = sampleSurfaceTriangles(triangle);
  assert.equal(samples.length, 21);
  assert.deepEqual(samples.slice(-3), [2, 1, 2]);
  assert.equal(measureSurfaceClearance(samples, terrain).coveredVertices, 1);
  assert.deepEqual(locateClearanceExtrema(samples, terrain).minimum.position, [2, 1, 2]);
  assert.deepEqual(Array.from(triangle), original);
  assert.deepEqual(sampleSurfaceTriangles([]), []);
  assert.throws(() => sampleSurfaceTriangles([0, 1, 0]), RangeError);
});

test('channel interior audit includes seven samples per rendered triangle', () => {
  const map = generateDrainage();
  for (const cells of [80, 160]) for (const channel of auditChannelBanks(map, cells).channels) {
    assert.equal(channel.interior.samplesPerTriangle, 7);
    assert.equal(channel.interior.rendered.vertices, channel.rendered.vertices / 3 * 7);
    assert.equal(channel.interior.extrema.minimum.gap, channel.interior.rendered.minimumGap);
    assert.equal(channel.interior.extrema.maximum.gap, channel.interior.rendered.maximumGap);
    assert.ok(channel.interior.rendered.minimumGap <= channel.rendered.minimumGap + 1e-10);
    assert.ok(channel.interior.rendered.maximumGap >= channel.rendered.maximumGap - 1e-10);
  }
});
