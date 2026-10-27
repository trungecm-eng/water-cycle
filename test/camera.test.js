import test from 'node:test';
import assert from 'node:assert/strict';
import { Camera } from '../src/sim/camera.js';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';
import { heightAt } from '../src/sim/heightmap.js';
import { cellAt } from '../src/sim/drainage.js';

test('camera clamps elevation and distance and defaults to southeast', () => {
  const world = new World();
  const camera = new Camera(world.map, world.reservoirs);
  const initial = camera.snapshot();
  assert.throws(() => { initial.position.y = 0; }, TypeError);
  assert.ok(initial.position.x > 500 && initial.position.z < 500);
  camera.rotate(1000, 1000);
  camera.zoom(1000);
  assert.equal(camera.elevation, 85);
  assert.equal(camera.distance, config.camera.maxDistance);
  camera.rotate(-2000, -2000);
  camera.zoom(0.0001);
  assert.equal(camera.elevation, 10);
  assert.equal(camera.distance, config.camera.minDistance);
  assert.ok(camera.azimuth >= 0 && camera.azimuth < 2 * Math.PI);
});

test('dense orbit samples stay above terrain and every water surface without changing simulation', () => {
  const world = new World();
  const initial = world.snapshot();
  const camera = new Camera(world.map, world.reservoirs);
  for (let degrees = 0; degrees < 360; degrees += 5) {
    camera.azimuth = degrees * Math.PI / 180;
    for (let elevation = 10; elevation <= 85; elevation += 5) {
      camera.elevation = elevation;
      for (let distance = config.camera.minDistance; distance <= config.camera.maxDistance; distance += 40) {
        camera.distance = distance;
        const { position: p } = camera.snapshot();
        assert.ok(Object.values(p).every(Number.isFinite));
        if (p.x < 0 || p.x > 1000 || p.z < 0 || p.z > 1000) continue;
        const id = world.map.reservoirs[cellAt(world.map, p.x, p.z)];
        assert.ok(p.y >= heightAt(world.map, p.x, p.z) + config.camera.clearance - 1e-9);
        if (id) assert.ok(p.y >= world.reservoirs.level(id) + config.camera.clearance - 1e-9);
      }
    }
  }
  assert.deepEqual(world.snapshot(), initial);
});
