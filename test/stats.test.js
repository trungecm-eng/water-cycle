import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';
import { waterDistribution, percentages } from '../src/stats/water-distribution.js';
import { RainTally } from '../src/stats/rain-tally.js';
import { LevelTrend } from '../src/stats/level-trend.js';
import { activeStages } from '../src/stats/stages.js';
import { content } from '../src/content.js';
import { movePrecipitation } from '../src/sim/precipitation.js';
import { mapData } from '../src/map-data.js';

test('distribution matches every particle and sums to one hundred throughout three hundred seconds', () => {
  const world = new World();
  const trend = new LevelTrend();
  const initial = world.reservoirs.level('pond');
  for (let step = 0; step <= 300 / config.clock.dt; step++) {
    const result = waterDistribution(world);
    const expected = { sea: 0, lake: 0, pond: 0, airborne: 0, rain: 0, runoff: 0 };
    for (const particle of world.particles) {
      if (particle.state === 'water') expected[particle.reservoir]++;
      else if (particle.state === 'vapor' || particle.state === 'cloud') expected.airborne++;
      else expected[particle.state]++;
    }
    assert.deepEqual(result.counts, expected);
    assert.equal(Object.values(result.counts).reduce((a, b) => a + b), world.particles.length);
    assert.equal(Object.values(result.percentages).reduce((a, b) => a + b), 100);
    for (const id of Object.keys(expected)) {
      assert.ok(Math.abs(result.percentages[id] - expected[id] * 100 / result.total) < 1);
    }
    const level = world.reservoirs.level('pond');
    const reading = trend.update(world.time, world.reservoirs.count('pond'), level);
    assert.equal(reading.level, level);
    assert.equal(reading.initialLevel, initial);
    assert.equal(reading.dry, world.reservoirs.count('pond') === 0);
    if (step < 300 / config.clock.dt) world.step();
  }
});

test('rain tallies count each landing once in the correct region including channels', () => {
  const world = new World({ sun: 0 });
  const tally = new RainTally(world);
  const cases = ['mountain', 'plain', 'sea', 'lake', 'pond', 'stream', 'river'];
  for (const region of cases) {
    const cell = world.map.regions.findIndex((value, index) => value === region &&
      (['sea', 'lake', 'pond'].includes(region) || !world.map.reservoirs[index]));
    assert.ok(cell >= 0, region);
    const particle = world.particles[0];
    if (particle.state === 'water') world.reservoirs.remove(particle);
    Object.assign(particle, { state: 'rain', x: cell % world.map.stride * world.map.spacing,
      z: Math.floor(cell / world.map.stride) * world.map.spacing, y: -100, vy: 0 });
    const before = tally.read(world);
    const destination = world.map.reservoirs[cell] ||
      (particle.x < mapData.mountainEdge ? 'mountain' : 'plain');
    movePrecipitation(particle, world.reservoirs, world);
    const after = tally.read(world);
    assert.equal(after.total, before.total + 1);
    assert.equal(after.counts[destination], before.counts[destination] + 1);
    movePrecipitation(particle, world.reservoirs, world);
    assert.deepEqual(tally.read(world), after);
  }
  const snapshot = world.snapshot();
  tally.clear(world);
  assert.equal(tally.read(world).total, 0);
  assert.deepEqual(world.snapshot(), snapshot);
  world.reset();
  world.step();
  assert.equal(tally.read(world).total, 0);
  // A reset may occur between reads; landings since that reset still count.
  world.reset();
  const particle = world.particles[0];
  world.reservoirs.remove(particle);
  Object.assign(particle, { state: 'rain', x: 900, z: 500, y: -100, vy: 0 });
  movePrecipitation(particle, world.reservoirs, world);
  assert.equal(tally.read(world).counts.sea, 1);
});

test('clearing the tally preserves parallel worlds and stronger wind increases mountain share', () => {
  const shares = [];
  for (const wind of [0, 100]) {
    const world = new World({ wind });
    const tally = new RainTally(world);
    for (let step = 0; step < 300 / config.clock.dt; step++) {
      if (step === 60 / config.clock.dt) tally.clear(world);
      world.step();
    }
    const result = tally.read(world);
    shares.push(result.counts.mountain / result.total);
    const parallel = new World({ wind });
    for (let step = 0; step < world.steps; step++) parallel.step();
    assert.deepEqual(world.snapshot(), parallel.snapshot());
    const detached = tally.read(world);
    detached.counts.mountain = -1;
    assert.ok(tally.read(world).counts.mountain >= 0);
  }
  assert.ok(shares[1] > shares[0], String(shares));
});

test('level trend uses a ten second window with hysteresis and preserves paused readings', () => {
  const trend = new LevelTrend();
  assert.equal(trend.update(0, 10, 5).direction, null);
  assert.equal(trend.update(1, 13, 6).direction, 'up');
  assert.equal(trend.update(2, 12, 6).direction, 'up');
  assert.equal(trend.update(3, 13, 6).direction, 'up');
  assert.equal(trend.update(4, 11, 5).direction, null);
  assert.equal(trend.update(5, 7, 4).direction, 'down');
  assert.equal(trend.update(6, 8, 4).direction, 'down');
  assert.equal(trend.update(16, 8, 4).direction, null);
  assert.deepEqual(trend.update(16, 8, 4), trend.update(16, 8, 4));
  assert.equal(trend.update(17, 0, 2).dry, true);
  assert.equal(trend.update(0, 10, 7).initialLevel, 7);
  trend.reset();
  assert.equal(trend.update(0, 10, 9).initialLevel, 9);
});

test('empty percentages and stage selection remain deterministic', () => {
  assert.deepEqual(percentages({ a: 0, b: 0 }), { a: 0, b: 0 });
  assert.deepEqual(percentages({ a: 1, b: 1, c: 1 }), { a: 34, b: 33, c: 33 });
  assert.deepEqual(activeStages({ vapor: 1, cloud: 0, rain: 2, runoff: 0 }),
    [content.stages.vapor, content.stages.rain]);
});
