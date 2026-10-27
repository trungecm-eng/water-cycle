import assert from 'node:assert/strict';
import { World } from '../src/sim/world.js';
import { config } from '../src/config.js';
import { heightAt } from '../src/sim/heightmap.js';

export function runCycle(options = {}, seconds = 300) {
  const world = new World(options);
  const milestones = {};
  const landed = new Set();
  let before;
  let rain;
  let minimumLake = world.reservoirs.count('lake');
  for (let step = 1; step <= seconds * 60; step++) {
    const falling = new Set(world.particles.filter(p => p.state === 'rain').map(p => p.id));
    world.step();
    const counts = { water: 0, vapor: 0, cloud: 0, rain: 0, runoff: 0 };
    let stored = 0;
    let clouds = 0;
    let westClouds = 0;
    for (const particle of world.particles) {
      assert.ok(Object.hasOwn(counts, particle.state));
      counts[particle.state]++;
      assert.ok([particle.temperature, particle.vx, particle.vy, particle.vz].every(Number.isFinite));
      if (particle.state === 'water') {
        assert.ok(world.reservoirs.members[particle.reservoir].has(particle));
        stored++;
        if (landed.has(particle.id)) milestones.landReturn ??= world.time;
        continue;
      }
      if (particle.state === 'runoff' && falling.has(particle.id)) landed.add(particle.id);
      const { x, y, z } = particle;
      assert.ok([x, y, z].every(Number.isFinite));
      assert.ok(x >= 0 && x <= world.map.size && z >= 0 && z <= world.map.size);
      assert.ok(y >= heightAt(world.map, x, z) - 1e-8 && y <= config.world.height);
      if (particle.state === 'cloud') {
        clouds++;
        if (x < 20) westClouds++;
      }
    }
    assert.equal(Object.values(counts).reduce((sum, count) => sum + count, 0), world.options.n);
    assert.equal(stored, Object.values(world.reservoirs.members).reduce((sum, members) => sum + members.size, 0));
    assert.equal(stored + counts.vapor + counts.cloud + counts.rain + counts.runoff, world.options.n);
    assert.ok(westClouds <= clouds * 0.05, `Clouds at west edge: ${westClouds}/${clouds}`);
    minimumLake = Math.min(minimumLake, world.reservoirs.count('lake'));
    if (world.evaporations) milestones.evaporation ??= world.time;
    if (world.clusters.some(cluster => cluster.visible)) milestones.cloud ??= world.time;
    if (counts.rain) milestones.rain ??= world.time;
    if (step === 60 * 60) before = { ...world.rainLandings };
    if (step === 300 * 60) rain = Object.fromEntries(Object.entries(world.rainLandings).map(([id, count]) => [id, count - before[id]]));
  }
  assert.equal(new Set(world.particles.map(p => p.id)).size, world.options.n);
  return { world, milestones, minimumLake, rain };
}

export function mountainFraction(rain) {
  return rain.mountain / Object.values(rain).reduce((sum, count) => sum + count, 0);
}
