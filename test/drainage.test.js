import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage, cellAt } from '../src/sim/drainage.js';
import { mapData } from '../src/map-data.js';

const map = generateDrainage();

test('every land cell drains downhill to its declared basin without cycles', () => {
  const count = map.heights.length;
  for (let start = 0; start < count; start++) {
    let index = start;
    let steps = 0;
    while (!map.reservoirs[index]) {
      const next = map.directions[index];
      assert.ok(next >= 0 && next < count);
      assert.ok(map.heights[next] < map.heights[index], `uphill edge at ${index}`);
      const dx = Math.abs(index % map.stride - next % map.stride);
      const dz = Math.abs(Math.floor(index / map.stride) - Math.floor(next / map.stride));
      assert.ok(dx <= 1 && dz <= 1 && dx + dz > 0);
      index = next;
      assert.ok(++steps <= count);
    }
    assert.equal(map.basins[start], map.reservoirs[index]);
  }
  for (const id of ['sea', 'lake', 'pond']) assert.ok(map.basins.includes(id));
});

test('three mountain streams feed the lake and river, and the river reaches sea', () => {
  const streams = map.channels.filter(channel => channel.type === 'stream');
  assert.ok(streams.length >= 3);
  for (const stream of streams) {
    assert.ok(stream.path[0] % map.stride * map.spacing < mapData.mountainEdge);
    const end = stream.path.at(-1);
    if (stream.destination === 'lake') assert.equal(map.reservoirs[end], 'lake');
    else assert.equal(map.regions[end], 'river');
    for (let step = 0; step < stream.path.length - 1; step++) {
      assert.equal(map.directions[stream.path[step]], stream.path[step + 1]);
      assert.equal(map.regions[stream.path[step]], 'stream');
    }
  }
  assert.ok(streams.some(stream => stream.destination === 'lake'));
  assert.ok(streams.some(stream => stream.destination === 'river'));
  const river = map.channels.find(channel => channel.id === 'river');
  assert.equal(map.reservoirs[river.path.at(-1)], 'sea');
  assert.equal(map.outlets.lake, river.path[0]);
  assert.ok(map.heights[map.outlets.lake] < mapData.reservoirs.lake.bottom);
  for (const channel of map.channels) for (const index of channel.path) {
    assert.notEqual(map.reservoirs[index], 'pond');
    assert.notEqual(map.basins[index], 'pond');
  }
});

test('reservoir beds and overflow receivers match map data', () => {
  for (const id of ['lake', 'pond']) {
    const region = mapData.reservoirs[id];
    const center = cellAt(map, region.x, region.z);
    assert.equal(map.reservoirs[center], id);
    assert.equal(map.heights[center], region.bottom);
    assert.notEqual(map.basins[map.outlets[id]], id);
    assert.ok(map.heights[map.outlets[id]] < region.bottom);
  }
  for (let index = 0; index < map.heights.length; index++) {
    if (map.reservoirs[index] === 'sea') assert.ok(map.heights[index] < 0);
  }
});

test('carving and depression filling are deterministic', () => {
  const other = generateDrainage();
  assert.deepEqual(other.heights, map.heights);
  assert.deepEqual(other.directions, map.directions);
  assert.deepEqual(other.basins, map.basins);
});
