import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';
import { basinSurface, channelRibbon, lakeConnection, waterBedHeight } from '../src/art/water-shapes.js';
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
  const correction = (x, z) => waterBedHeight(map, x, z) - heightAt(map, x, z);
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
