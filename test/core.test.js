import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { Clock } from '../src/sim/clock.js';
import { parseParams } from '../src/sim/params.js';
import { config } from '../src/config.js';

test('URL parameters accept supported values and reject invalid values', () => {
  assert.deepEqual(parseParams('?n=300&sun=80&wind=0&seed=7&speed=8&paused=1'),
    { n: 300, sun: 80, wind: 0, seed: 7, speed: 8, paused: true });
  for (const query of ['n=50', 'n=5000', 'n=abc', 'n=300.5', 'sun=-5', 'wind=200', 'speed=0', 'seed=NaN', 'sun=', 'wind=Infinity']) {
    assert.deepEqual(parseParams(`?${query}`), config.defaults);
  }
});

test('clock pauses without catch up and caps elapsed time at every speed', () => {
  for (const speed of [0.5, 1, 2, 4, 8]) {
    let steps = 0;
    const clock = new Clock(() => steps++, { speed });
    assert.equal(clock.advance(10), Math.floor(0.25 * speed / config.clock.dt));
    const before = steps;
    clock.setPaused(true);
    assert.equal(clock.advance(10), 0);
    assert.equal(steps, before);
    clock.setPaused(false);
    clock.advance(config.clock.dt / speed);
    assert.equal(steps, before + 1);
  }
});

test('equal step counts produce equal snapshots across pause and speed changes', () => {
  const first = new World();
  const second = new World();
  const clock = new Clock(() => second.step());
  for (let i = 0; i < 120; i++) first.step();
  clock.advance(0.25);
  clock.setPaused(true);
  clock.advance(10);
  clock.setPaused(false);
  clock.speed = 7;
  clock.advance(0.25);
  assert.deepEqual(first.snapshot(), second.snapshot());
});

test('snapshots are detached and deeply frozen and reset preserves controls', () => {
  const world = new World({ n: 100, seed: 7 });
  const initial = world.snapshot();
  assert.throws(() => { initial.particles[0].x = 0; }, TypeError);
  assert.throws(() => { initial.counts.water = 0; }, TypeError);
  world.step();
  assert.equal(initial.time, 0);
  world.sun = 80;
  world.wind = 0;
  world.reset();
  assert.deepEqual(world.snapshot(), { ...initial, sun: 80, wind: 0 });
  const clock = new Clock(() => world.step(), { paused: true, speed: 8 });
  clock.reset();
  assert.equal(clock.speed, 1);
  assert.equal(clock.paused, false);
  assert.equal(clock.accumulator, 0);
});
