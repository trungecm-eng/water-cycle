import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { mapData } from '../src/map-data.js';

const total = snapshot => Object.values(snapshot.counts).reduce((sum, count) => sum + count, 0);

test('3D worlds distribute all supported particle counts and expose reservoir levels', () => {
  for (const n of [100, 1000, 1500, 2000]) {
    const world = new World({ n });
    const snapshot = world.snapshot();
    const lake = Math.round(n * 0.2), pond = Math.round(n * 0.06);
    assert.equal(snapshot.reservoirs.lake.count, lake);
    assert.equal(snapshot.reservoirs.pond.count, pond);
    assert.equal(snapshot.reservoirs.sea.count, n - lake - pond);
    assert.equal(snapshot.reservoirs.lake.level, 12 + lake * 0.04);
    assert.equal(snapshot.reservoirs.pond.level, 8 + pond * 0.06);
    assert.equal(snapshot.reservoirs.sea.level, 0);
    assert.equal(snapshot.reservoirs.lake.capacity, Math.round(320 * n / 1000));
    assert.equal(total(snapshot), n);
    assert.ok(snapshot.particles.every(p => p.state === 'water' && !('x' in p) && !('z' in p)));
  }
});

test('overflow releases precisely the excess at lake and pond drainage outlets within one step', () => {
  for (const id of ['lake', 'pond']) {
    const world = new World();
    const reservoirs = world.reservoirs;
    const capacity = reservoirs.capacities[id];
    const excess = 3;
    while (reservoirs.count(id) < capacity + excess) {
      const particle = reservoirs.members.sea.values().next().value;
      reservoirs.remove(particle);
      reservoirs.add(particle, id);
    }
    world.step();
    assert.equal(reservoirs.count(id), capacity);
    const released = world.particles.filter(p => p.state === 'runoff');
    assert.equal(released.length, excess);
    for (const particle of released) {
      assert.equal(particle.cell, world.map.outlets[id]);
      assert.equal(particle.y, world.map.heights[particle.cell]);
      assert.equal(particle.reservoir, null);
      assert.ok(world.map.heights[particle.cell] < mapData.reservoirs[id].bottom);
    }
    assert.equal(total(world.snapshot()), 1000);
  }
});

test('pond dry state recovers on return and snapshots cannot modify stored water', () => {
  const world = new World();
  const removed = [...world.reservoirs.members.pond];
  for (const particle of removed) {
    world.reservoirs.remove(particle);
    world.reservoirs.add(particle, 'sea');
  }
  const dry = world.snapshot();
  assert.equal(dry.reservoirs.pond.dry, true);
  assert.equal(dry.reservoirs.pond.level, mapData.reservoirs.pond.bottom);
  const particle = removed[0];
  world.reservoirs.remove(particle);
  world.reservoirs.add(particle, 'pond');
  assert.equal(world.snapshot().reservoirs.pond.dry, false);
  assert.equal(dry.reservoirs.pond.dry, true);
  assert.throws(() => { dry.reservoirs.pond.count = 1; }, TypeError);
  assert.throws(() => world.reservoirs.add(particle, 'lake'), /already/);
  assert.equal(total(world.snapshot()), 1000);
});
