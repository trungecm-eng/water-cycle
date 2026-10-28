import test from 'node:test';
import assert from 'node:assert/strict';
import { config } from '../src/config.js';
import { World } from '../src/sim/world.js';
import { heightAt } from '../src/sim/heightmap.js';
import { cloudAppearance, cloudVisuals } from '../src/art/clouds.js';
import { sunAppearance, sunbeams } from '../src/art/sunbeams.js';

test('cloud blocks and darkness grow monotonically at both quality levels', () => {
  for (const quality of ['high', 'low']) {
    let last = { count: 0, shade: 0, radius: 0 };
    for (let size = 30; size <= 1000; size++) {
      const next = cloudAppearance(size, quality);
      assert.ok(next.count >= 5 && next.count <= 12);
      for (const key of ['count', 'shade', 'radius']) assert.ok(next[key] >= last[key]);
      assert.ok(next.count <= cloudAppearance(size, 'high').count);
      last = next;
    }
  }
  assert.ok(cloudAppearance(180, 'low').count < cloudAppearance(180, 'high').count);
});

test('rain curtains span cloud base to the surface only for raining clusters', () => {
  const world = new World({ n: 100 });
  for (const particle of world.particles) Object.assign(particle, { state: 'cloud', x: 900, y: 240, z: 500 });
  world.clusters = [{ size: 100, ids: world.particles.map(p => p.id), raining: true }];
  const cloud = cloudVisuals(world)[0];
  assert.ok(cloud.rain.length > 100);
  assert.equal(cloud.blocks.length, cloudAppearance(100).count);
  assert.ok(Math.max(...cloud.rain.map(p => p.top)) <= 240 - cloud.radius * 0.5 + 1e-9);
  assert.ok(Math.min(...cloud.rain.map(p => p.bottom)) < 19);
  for (const streak of cloud.rain) {
    assert.ok(streak.bottom >= 0);
    assert.ok(streak.top > streak.bottom);
    assert.ok(streak.top - streak.bottom <= config.art.rainCurtainLength + 1e-10);
  }
  world.clusters[0].raining = false;
  assert.equal(cloudVisuals(world)[0].rain.length, 0);
  world.clusters[0].size = 29;
  assert.equal(cloudVisuals(world).length, 0);
});

test('sunbeams terminate on live water and cannot cross the terrain', () => {
  const world = new World({ n: 1000 });
  world.step();
  const beams = sunbeams(world);
  assert.ok(beams.length > 0 && beams.length <= 30);
  assert.ok(beams.length < world.rays.length);
  for (const beam of beams) {
    assert.ok(Math.hypot(...beam.start.map((v, i) => v - beam.end[i])) <= config.world.height / 3);
    assert.ok(world.rays.some(ray => ray.x === beam.end[0] && ray.y === beam.end[1] && ray.z === beam.end[2]));
    for (let t = 0; t <= 1; t += 0.05) {
      const [x, y, z] = beam.start.map((v, i) => v * (1 - t) + beam.end[i] * t);
      assert.ok(y >= heightAt(world.map, x, z));
    }
  }
  world.rays = [{ x: 200, y: 0, z: 200 }];
  assert.deepEqual(sunbeams(world), []);
  world.sun = 0;
  assert.deepEqual(sunbeams(world), []);
  assert.ok(sunAppearance(0).haloOpacity < sunAppearance(50).haloOpacity);
});

test('atmosphere sampling and quality changes preserve particles snapshot and random sequence', () => {
  const world = new World({ n: 100 });
  for (let i = 0; i < 60; i++) world.step();
  const twin = new World({ n: 100 });
  for (let i = 0; i < 60; i++) twin.step();
  for (const candidate of [world, twin]) {
    for (const particle of candidate.particles) Object.assign(particle, { state: 'cloud', x: 900, y: 240, z: 500 });
    candidate.clusters = [{ size: 100, ids: candidate.particles.map(p => p.id), raining: true }];
  }
  const before = world.snapshot();
  for (const quality of ['high', 'low']) {
    assert.ok(cloudVisuals(world, quality)[0].rain.length > 0); sunbeams(world); sunAppearance(world.sun);
  }
  assert.deepEqual(world.snapshot(), before);
  assert.equal(world.rng(), twin.rng());
});
