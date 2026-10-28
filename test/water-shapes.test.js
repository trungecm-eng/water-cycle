import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage } from '../src/sim/drainage.js';
import { mapData } from '../src/map-data.js';
import { heightAt } from '../src/sim/heightmap.js';
import { basinSurface, channelRibbon, lakeConnection, waterBedHeight, reservoirBedHeight, basinTerrainHeight } from '../src/art/water-shapes.js';
const map = generateDrainage();

test('basin surfaces follow terrain intersections and reservoir levels', () => {
  for (const [id,level] of [['lake',20],['pond',11.6],['sea',0]]) {
    const surface = basinSurface(map,id,level);
    assert.ok(surface.length > 0);
    assert.deepEqual(surface,basinSurface(map,id,level));
    for (let i=0;i<surface.length;i+=3) {
      assert.equal(surface[i+1],level);
      assert.ok(heightAt(map,surface[i],surface[i+2]) <= level+0.001);
    }
  }
  assert.notDeepEqual(basinSurface(map,'lake',16),basinSurface(map,'lake',24));
});

test('channel ribbons widen downstream and follow their carved beds', () => {
  for (const channel of map.channels.filter(c => ['river','stream'].includes(c.type))) {
    const surface = channelRibbon(map,channel);
    assert.ok(surface.length>(channel.path.length-1)*18);
    for (let i=0;i<surface.length;i+=3) assert.ok(waterBedHeight(map,surface[i],surface[i+2])<surface[i+1]);
    const width = i => Math.hypot(surface[i]-surface[i+3],surface[i+2]-surface[i+5]);
    assert.ok(width(surface.length-18)>width(0));
  }
});

test('rounded channel centerlines stay below local terrain and never flow uphill', () => {
  for (const channel of map.channels.filter(c => ['river', 'stream'].includes(c.type))) {
    const surface = channelRibbon(map, channel);
    let previous = Infinity;
    for (let i = 0; i < surface.length; i += 18) {
      for (const offset of [0, 6]) {
        const opposite = offset === 0 ? 3 : 15;
        const x = (surface[i + offset] + surface[i + opposite]) / 2;
        const z = (surface[i + offset + 2] + surface[i + opposite + 2]) / 2;
        const y = surface[i + offset + 1];
        assert.ok(y <= heightAt(map, x, z) + 0.350001, `suspended centerline at ${x},${z}`);
        assert.ok(y <= previous + 1e-9, `uphill channel at ${x},${z}`);
        previous = y;
      }
    }
  }
});

test('lake connector reaches the river and its visible bed is recessed', () => {
  const original = Array.from(map.heights);
  const surface = lakeConnection(map,20);
  const end = map.outlets.lake;
  assert.equal(surface[0],360);
  assert.equal(surface[1],20);
  assert.equal(surface.at(-3),end%map.stride*map.spacing);
  for (let i=0;i<surface.length;i+=3) assert.ok(waterBedHeight(map,surface[i],surface[i+2])<surface[i+1]);
  assert.deepEqual(Array.from(map.heights),original);
});

test('carved banks join the terrain continuously across their influence boundary', () => {
  const correction = (x, z) => waterBedHeight(map, x, z) - basinTerrainHeight(map, x, z);
  const paths = map.channels.filter(channel => ['river', 'stream'].includes(channel.type))
    .map(channel => channel.path.map(index => [index % map.stride * map.spacing,
      Math.floor(index / map.stride) * map.spacing]));
  const end = map.outlets.lake;
  paths.push([[360, 620], [end % map.stride * map.spacing, Math.floor(end / map.stride) * map.spacing]]);
  let samples = 0;
  for (const path of paths) for (let i = 1; i < path.length; i++) {
    const [ax, az] = path[i - 1], [bx, bz] = path[i];
    const length = Math.hypot(bx - ax, bz - az);
    if (!length) continue;
    const nx = -(bz - az) / length, nz = (bx - ax) / length;
    // Include the former hard cutoffs as well as the new outer bank edge.
    for (const radius of [9, 14, 18, 34]) for (const side of [-1, 1]) {
      const x = (ax + bx) / 2 + side * radius * nx;
      const z = (az + bz) / 2 + side * radius * nz;
      if (x < 0 || z < 0 || x > map.size || z > map.size) continue;
      const before = correction(x - 0.001 * nx, z - 0.001 * nz);
      const after = correction(x + 0.001 * nx, z + 0.001 * nz);
      assert.ok(Math.abs(after - before) < 0.1, `bank discontinuity at ${x},${z}: ${before} -> ${after}`);
      assert.ok(before <= 0 && after <= 0);
      samples++;
    }
  }
  assert.ok(samples > 500);
});

test('terrain triangles leave channel water exposed at both rendering resolutions', () => {
  for (const cells of [80, 160]) {
    const spacing = map.size / cells;
    const renderedHeight = (x, z) => {
      const column = Math.min(cells - 1, Math.floor(x / spacing));
      const row = Math.min(cells - 1, Math.floor(z / spacing));
      const u = x / spacing - column, v = z / spacing - row;
      const h = (dx, dz) => waterBedHeight(map, (column + dx) * spacing, (row + dz) * spacing);
      return u + v <= 1 ? h(0, 0) * (1 - u - v) + h(1, 0) * u + h(0, 1) * v
        : h(1, 1) * (u + v - 1) + h(0, 1) * (1 - u) + h(1, 0) * (1 - v);
    };
    for (const channel of map.channels.filter(channel => ['river', 'stream'].includes(channel.type))) {
      const surface = channelRibbon(map, channel);
      for (let i = 0; i < surface.length; i += 3) {
        assert.ok(renderedHeight(surface[i], surface[i + 2]) < surface[i + 1], `${cells}: covered water vertex ${i}`);
      }
    }
  }
});


test('reservoir shoreline edges meet the same fixed bowl used by the land mesh', () => {
  const original = Array.from(map.heights);
  for (const [id, levels] of [['lake', [12.5, 20, 24.8]], ['pond', [8.5, 11.6, 15.2]]]) {
    const areas = [];
    for (const level of levels) {
      const surface = basinSurface(map, id, level);
      const edges = new Map();
      let area = 0;
      for (let i = 0; i < surface.length; i += 9) {
        const vertices = [0, 3, 6].map(offset => surface.slice(i + offset, i + offset + 3));
        area += Math.abs((vertices[1][0]-vertices[0][0])*(vertices[2][2]-vertices[0][2])
          -(vertices[2][0]-vertices[0][0])*(vertices[1][2]-vertices[0][2])) / 2;
        for (let j = 0; j < 3; j++) {
          const a = vertices[j], b = vertices[(j+1)%3];
          const key = [a.join(','), b.join(',')].sort().join('|');
          const edge = edges.get(key) ?? { count: 0, a, b };
          edge.count++;
          edges.set(key, edge);
        }
      }
      const boundary = [...edges.values()].filter(edge => edge.count === 1);
      assert.ok(boundary.length >= 3);
      for (const edge of boundary) for (const [x,,z] of [edge.a, edge.b]) {
        assert.ok(Math.abs(reservoirBedHeight(map, id, x, z) - level) < 0.00001,
          `${id}: floating shoreline at ${x},${z}`);
      }
      areas.push(area);
    }
    assert.ok(areas[0] < areas[1] && areas[1] < areas[2], `${id}: shoreline must grow with level`);
  }
  assert.deepEqual(Array.from(map.heights), original);
});


test('outer reservoir banks never overshoot the rim or original terrain', () => {
  for (const id of ['lake', 'pond']) {
    const region = mapData.reservoirs[id];
    const rimHeight = region.bottom + region.capacity * region.levelPerParticle + 0.5;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.1) {
      const rim = 1 + 0.045 * Math.sin(angle * 5 + mapData.seed) + 0.035 * Math.cos(angle * 3);
      for (let radius = 1; radius <= 1.8; radius += 0.025) {
        const x = region.x + Math.cos(angle) * region.radiusX * rim * radius;
        const z = region.z + Math.sin(angle) * region.radiusZ * rim * radius;
        const original = heightAt(map, x, z);
        const height = reservoirBedHeight(map, id, x, z);
        assert.ok(height <= Math.max(rimHeight, original) + 1e-9, `${id}: raised outer bank at ${x},${z}`);
        assert.ok(height >= Math.min(rimHeight, original) - 1e-9);
      }
    }
  }
});


test('reservoir rims stay within half a unit of full water without spilling', () => {
  for (const id of ['lake', 'pond']) {
    const region = mapData.reservoirs[id];
    const fullLevel = region.bottom + region.capacity * region.levelPerParticle;
    for (let angle = 0; angle < Math.PI * 2; angle += 0.05) {
      const rim = 1 + 0.045 * Math.sin(angle * 5 + mapData.seed) + 0.035 * Math.cos(angle * 3);
      const x = region.x + Math.cos(angle) * region.radiusX * rim;
      const z = region.z + Math.sin(angle) * region.radiusZ * rim;
      const height = reservoirBedHeight(map, id, x, z);
      assert.ok(height > fullLevel, `${id}: full water spills over the rim`);
      assert.ok(height <= fullLevel + 0.5 + 1e-9, `${id}: excessive freeboard`);
    }
  }
});

test('rendered reservoir water intersects the uploaded terrain at both qualities and all levels', async () => {
  const { renderedBasinSurface } = await import('../src/art/water-shapes.js');
  const { renderedTriangleHeight } = await import('../src/art/water-audit.js');
  const original = Array.from(map.heights);
  for (const cells of [80, 160]) {
    const stride = cells + 1, spacing = map.size / cells;
    const heights = Float32Array.from({ length: stride * stride }, (_, i) =>
      waterBedHeight(map, i % stride * spacing, Math.floor(i / stride) * spacing));
    for (const id of ['lake', 'pond']) {
      const region = mapData.reservoirs[id];
      const levels = [...new Set([region.bottom + region.levelPerParticle,
        ...(id === 'lake' ? [12.5, 20, 24.8] : [8.5, 11.6, 15.2]),
        region.bottom + region.capacity * region.levelPerParticle])].sort((a, b) => a - b);
      let previousArea = 0;
      assert.ok(renderedBasinSurface(map, id, region.bottom + region.levelPerParticle, cells).length > 0,
        `${id}/${cells}: a single remaining particle must still have a water surface`);
      for (const level of levels) {
        const surface = renderedBasinSurface(map, id, level, cells);
        assert.ok(surface.length > 0);
        assert.deepEqual(surface, renderedBasinSurface(map, id, level, cells));
        let intersections = 0;
        for (let i = 0; i < surface.length; i += 3) {
          assert.equal(surface[i + 1], level);
          const ground = renderedTriangleHeight(heights, cells, map.size, surface[i], surface[i + 2]);
          assert.ok(ground <= level + 0.00001, `${id}/${cells}: buried water`);
          if (Math.abs(ground - level) < 0.00001) intersections++;
          else {
            // Interior vertices coincide with the land grid. Every newly
            // introduced shoreline vertex must touch the actual land mesh.
            assert.ok(Math.abs(surface[i] / spacing - Math.round(surface[i] / spacing)) < 1e-9);
            assert.ok(Math.abs(surface[i + 2] / spacing - Math.round(surface[i + 2] / spacing)) < 1e-9);
          }
        }
        assert.ok(intersections > (level < region.bottom + 0.5 ? 0 : 20),
          `${id}/${cells}: missing shoreline intersections`);
        let area = 0;
        for (let i = 0; i < surface.length; i += 9) {
          const x = (surface[i] + surface[i + 3] + surface[i + 6]) / 3;
          const z = (surface[i + 2] + surface[i + 5] + surface[i + 8]) / 3;
          assert.ok(renderedTriangleHeight(heights, cells, map.size, x, z) <= level + 0.00001,
            `${id}/${cells}: triangle crosses dry terrain`);
          area += Math.abs((surface[i + 3] - surface[i]) * (surface[i + 8] - surface[i + 2])
            - (surface[i + 6] - surface[i]) * (surface[i + 5] - surface[i + 2])) / 2;
        }
        assert.ok(area > previousArea, `${id}/${cells}: water area must grow with the level`);
        previousArea = area;
      }
    }
  }
  assert.deepEqual(Array.from(map.heights), original);
});


test('spring ribbons begin at a point and open gradually without changing their route', () => {
  for (const channel of map.channels.filter(channel => channel.type === 'stream')) {
    const before = Array.from(map.heights);
    const surface = channelRibbon(map, channel);
    assert.deepEqual(surface.slice(0, 3), surface.slice(3, 6));
    const source = channel.path[0];
    assert.equal(surface[0], source % map.stride * map.spacing);
    assert.equal(surface[2], Math.floor(source / map.stride) * map.spacing);
    let lastWidth = 0;
    for (let i = 0; i < surface.length; i += 18) {
      const width = Math.hypot(surface[i] - surface[i + 3], surface[i + 2] - surface[i + 5]);
      assert.ok(width >= lastWidth - 1e-9);
      lastWidth = width;
    }
    assert.ok(lastWidth > 8, 'downstream water retains its full width');
    assert.deepEqual(Array.from(map.heights), before);
  }
});


test('spring sources sit below the uncarved terrain triangles at every quality', async () => {
  const { renderedTriangleHeight } = await import('../src/art/water-audit.js');
  for (const cells of [80, 160]) {
    const stride = cells + 1, spacing = map.size / cells;
    const heights = Float32Array.from({ length: stride * stride }, (_, i) =>
      heightAt(map, i % stride * spacing, Math.floor(i / stride) * spacing));
    for (const channel of map.channels.filter(channel => channel.type === 'stream')) {
      const [x, y, z] = channelRibbon(map, channel);
      assert.ok(y <= renderedTriangleHeight(heights, cells, map.size, x, z) + 0.35001,
        `${cells}: spring source bridges the rendered mountain slope`);
    }
  }
});


test('river rounds a right-angle drainage bend into turns below fifteen degrees', () => {
  const flatMap = { cells: 4, stride: 5, spacing: 10, size: 40,
    heights: new Float64Array(25).fill(10) };
  const channel = { type: 'river', path: [0, 1, 2, 7, 12] };
  const surface = channelRibbon(flatMap, channel);
  const centers = [];
  for (let i = 0; i < surface.length; i += 18) {
    centers.push([(surface[i] + surface[i + 3]) / 2,
      (surface[i + 2] + surface[i + 5]) / 2]);
  }
  centers.push([(surface.at(-12) + surface.at(-3)) / 2,
    (surface.at(-10) + surface.at(-1)) / 2]);
  assert.deepEqual(centers[0], [0, 0]);
  assert.deepEqual(centers.at(-1), [20, 20]);
  for (let i = 1; i + 1 < centers.length; i++) {
    const a = centers[i].map((v, axis) => v - centers[i - 1][axis]);
    const b = centers[i + 1].map((v, axis) => v - centers[i][axis]);
    const cosine = (a[0] * b[0] + a[1] * b[1]) / (Math.hypot(...a) * Math.hypot(...b));
    const angle = Math.acos(Math.max(-1, Math.min(1, cosine))) * 180 / Math.PI;
    // Two passes left 26.565-degree turns on this bend.
    assert.ok(angle < 15, `sharp river bend: ${angle}`);
  }
});
