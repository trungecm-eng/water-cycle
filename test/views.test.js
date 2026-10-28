import test from 'node:test';
import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { Camera } from '../src/sim/camera.js';
import { ViewTransition, parseView } from '../src/sim/views.js';
import { mapData } from '../src/map-data.js';
import { config } from '../src/config.js';
import { heightAt } from '../src/sim/heightmap.js';
import { cellAt } from '../src/sim/drainage.js';

test('all preset paths are safe, bounded and reach their exact destination in one second', () => {
  const world = new World();
  for (const source of Object.keys(mapData.views)) for (const destination of Object.keys(mapData.views)) {
    const camera = new Camera(world.map, world.reservoirs);
    const views = new ViewTransition(camera, source);
    views.select(destination, 10);
    for (let i = 0; i <= 1000; i++) {
      views.update(10 + i / 1000);
      const pose = camera.snapshot();
      assert.ok(pose.elevation >= config.camera.minElevation && pose.elevation <= config.camera.maxElevation);
      assert.ok(pose.distance >= config.camera.minDistance && pose.distance <= config.camera.maxDistance);
      const p = pose.position;
      if (p.x >= 0 && p.x <= world.map.size && p.z >= 0 && p.z <= world.map.size) {
        const id = world.map.reservoirs[cellAt(world.map, p.x, p.z)];
        assert.ok(p.y >= heightAt(world.map, p.x, p.z) + config.camera.clearance - 1e-9);
        if (id) assert.ok(p.y >= world.reservoirs.level(id) + config.camera.clearance - 1e-9);
      }
      if (i < 1000) assert.ok(views.transition);
    }
    assert.equal(views.transition, null);
    for (const key of ['target', 'azimuth', 'elevation', 'distance']) assert.deepEqual(camera.snapshot()[key], mapData.views[destination][key]);
  }
});

test('interruption and repeated selections preserve the current pose and shortest angular path', () => {
  const world = new World();
  const camera = new Camera(world.map, world.reservoirs);
  const views = new ViewTransition(camera);
  camera.azimuth = 2 * Math.PI - 0.01;
  views.select('sea', 0);
  views.update(0.4);
  assert.ok(camera.azimuth > 2 * Math.PI - 0.01);
  const pose = camera.snapshot();
  views.select('river', 0.4);
  assert.deepEqual(camera.snapshot(), pose);
  views.interrupt();
  views.update(10);
  assert.deepEqual(camera.snapshot(), pose);
  assert.equal(views.name, 'free');
  camera.rotate(0.1);
  views.update(20);
  assert.notDeepEqual(camera.snapshot(), pose);
});

test('view URL accepts presets and falls back silently for invalid values', () => {
  for (const name of Object.keys(mapData.views)) assert.equal(parseView(`?view=${name}`), name);
  for (const search of ['', '?view=moon', '?view=toString', '?view=']) assert.equal(parseView(search), 'overview');
});
