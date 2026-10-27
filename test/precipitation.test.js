import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { findClusters } from '../src/sim/legacy-clusters.js';
import { releaseRain, movePrecipitation } from '../src/sim/legacy-precipitation.js';
import { terrainHeight } from '../src/sim/terrain.js';
import { Lake } from '../src/sim/lake.js';
import { mulberry32 } from '../src/sim/rng.js';
import { World } from '../src/sim/legacy-world.js';

const clouds = (n, raining = false) => Array.from({ length: n }, (_, id) => ({
  id, state: 'cloud', x: 800, y: 400, vx: 0, vy: 0, temperature: 20, raining
}));

test('legacy 2D: rain thresholds inherit hysteresis and release droplets gradually', () => {
  for (const [n, inherited, expected] of [[79, false, false], [80, false, true], [40, true, true], [29, true, false]]) {
    assert.equal(findClusters(clouds(n, inherited))[0].raining, expected);
  }
  const particles = clouds(80);
  const rng = mulberry32(1);
  releaseRain(particles, rng);
  assert.ok(particles.filter(p => p.state === 'rain').length < 16);
  for (let i = 1; i < 3600; i++) releaseRain(particles, rng);
  const remaining = particles.filter(p => p.state === 'cloud');
  assert.ok(remaining.length < 30);
  assert.equal(findClusters(remaining)[0].raining, false);
});

test('legacy 2D: ten thousand seeded rain particles hit terrain or lake without penetration', () => {
  const rng = mulberry32(7);
  for (let i = 0; i < 10000; i++) {
    const lake = new Lake();
    const x = rng() * config.world.width;
    const ground = terrainHeight(x);
    const particle = { state: 'rain', x, y: ground + rng() * (600 - ground), vx: rng() * 200 - 100, vy: -rng() * 500 };
    for (let step = 0; step < 1200 && particle.state === 'rain'; step++) {
      movePrecipitation(particle, lake);
      if (particle.state !== 'water') assert.equal(particle.x, x);
      assert.ok(particle.y >= terrainHeight(particle.x));
      assert.ok(Math.abs(particle.vy) <= config.motion.rainMaxSpeed);
    }
    assert.ok(['water', 'runoff'].includes(particle.state));
  }
});

test('legacy 2D: runoff from every terrain abscissa stays on descending surface and returns within forty seconds', () => {
  for (let x = 0; x < config.lake.left; x++) {
    const lake = new Lake();
    const particle = { state: 'runoff', x, y: terrainHeight(x) };
    for (let i = 0; i < 2400 && particle.state !== 'water'; i++) {
      const oldY = particle.y;
      movePrecipitation(particle, lake);
      if (particle.state === 'runoff') {
        assert.equal(particle.y, terrainHeight(particle.x));
        assert.ok(particle.y <= oldY);
      }
    }
    assert.equal(particle.state, 'water');
    assert.equal(lake.count, 1);
    assert.equal(particle.temperature, config.heat.baseline);
  }
});

test('legacy 2D: rain accelerates vertically regardless of wind and world counts returns', () => {
  for (const wind of [0, 40, 100]) {
    const world = new World({ sun: 0, wind });
    const particle = world.particles[0];
    world.lake.remove(particle);
    Object.assign(particle, { state: 'rain', x: 800, y: 600, vx: 100, vy: 0 });
    let speed = 0;
    for (let i = 0; i < 1000 && particle.state === 'rain'; i++) {
      world.step();
      if (particle.state === 'rain') {
        assert.equal(particle.x, 800);
        assert.ok(-particle.vy >= speed);
        speed = -particle.vy;
        assert.ok(speed <= config.motion.rainMaxSpeed);
      }
    }
    assert.equal(particle.state, 'water');
    assert.equal(world.returns, 1);
    assert.equal(world.lake.count, config.defaults.n);
  }
});
