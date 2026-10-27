import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { movePrecipitation } from '../src/sim/precipitation.js';
import { generateDrainage, cellAt } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';
import { Reservoirs } from '../src/sim/reservoirs.js';
import { mulberry32 } from '../src/sim/rng.js';
import { World } from '../src/sim/world.js';

const map = generateDrainage();
const reservoirs = new Reservoirs([], map);

function follow(particle) {
  for (let step = 0; step < 3600 && particle.state !== 'water'; step++) {
    const oldY = particle.y;
    movePrecipitation(particle, reservoirs);
    if (particle.state === 'runoff') {
      assert.ok(particle.y <= oldY + 1e-9);
      assert.ok(Math.abs(particle.y - heightAt(map, particle.x, particle.z)) < 1e-9);
    }
  }
  assert.equal(particle.state, 'water');
  const id = particle.reservoir;
  reservoirs.remove(particle);
  return id;
}

test('ten thousand seeded 3D raindrops land vertically on terrain or the correct reservoir', () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 10000; i++) {
    const x = rng() * map.size, z = rng() * map.size;
    const cell = cellAt(map, x, z);
    const particle = { state: 'rain', x, z, y: Math.max(heightAt(map, x, z), 0) + 1 + rng() * 300,
      vx: 100, vz: -100, vy: -rng() * 500 };
    for (let step = 0; step < 1200 && particle.state === 'rain'; step++) {
      movePrecipitation(particle, reservoirs);
      if (particle.state === 'rain') {
        assert.equal(particle.x, x);
        assert.equal(particle.z, z);
        assert.ok(particle.y >= heightAt(map, x, z));
        assert.ok(-particle.vy <= config.motion.rainMaxSpeed);
      }
    }
    if (map.reservoirs[cell]) {
      assert.equal(particle.state, 'water');
      assert.equal(particle.reservoir, map.reservoirs[cell]);
      reservoirs.remove(particle);
    } else {
      assert.equal(particle.state, 'runoff');
      assert.ok(particle.y >= heightAt(map, particle.x, particle.z) - 1e-9);
      assert.equal(follow(particle), map.basins[cell]);
    }
  }
});

test('runoff from every land cell descends on the surface to its basin within sixty seconds', () => {
  for (let cell = 0; cell < map.heights.length; cell++) {
    if (map.reservoirs[cell]) continue;
    const particle = { state: 'runoff', cell, x: cell % map.stride * map.spacing,
      z: Math.floor(cell / map.stride) * map.spacing, y: map.heights[cell] };
    assert.equal(follow(particle), map.basins[cell]);
  }
});

test('world counts rain landings and channel returns independently of wind', () => {
  for (const wind of [0, 40, 100]) {
    const world = new World({ sun: 0, wind });
    const particle = world.particles[0];
    world.reservoirs.remove(particle);
    Object.assign(particle, { state: 'rain', x: 900, z: 500, y: 500, vx: 100, vz: 100, vy: 0 });
    let speed = 0;
    for (let i = 0; i < 1000 && particle.state === 'rain'; i++) {
      world.step();
      if (particle.state === 'rain') {
        assert.equal(particle.x, 900);
        assert.equal(particle.z, 500);
        assert.ok(-particle.vy >= speed);
        speed = -particle.vy;
      }
    }
    assert.equal(particle.reservoir, 'sea');
    assert.equal(world.returns, 1);
    assert.equal(world.snapshot().rainLandings.sea, 1);
    for (const [type, destination, counter] of [['stream', 'lake', 'streamToLake'], ['river', 'sea', 'riverToSea']]) {
      const channel = world.map.channels.find(c => c.type === type && c.destination === destination);
      const cell = channel.path.at(-2);
      world.reservoirs.remove(particle);
      Object.assign(particle, { state: 'runoff', cell, x: cell % map.stride * map.spacing,
        z: Math.floor(cell / map.stride) * map.spacing, y: map.heights[cell] });
      for (let i = 0; i < 1000 && particle.state !== 'water'; i++) world.step();
      assert.equal(particle.reservoir, destination);
      assert.equal(world.snapshot()[counter], 1);
    }
    world.reset();
    assert.equal(world.streamToLake, 0);
    assert.equal(world.riverToSea, 0);
    assert.equal(world.returns, 0);
  }
});

test('lake and pond overflow traverse their outlets to the sea without returning to their source', () => {
  for (const id of ['lake', 'pond']) {
    const particle = { id: 1 };
    reservoirs.add(particle, id);
    const released = reservoirs.overflow();
    assert.deepEqual(released, [particle]);
    assert.equal(particle.cell, map.outlets[id]);
    assert.equal(follow(particle), 'sea');
  }
});
