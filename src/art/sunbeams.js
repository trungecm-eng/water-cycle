import { config } from '../config.js';
import { heightAt } from '../sim/heightmap.js';
import { cellAt } from '../sim/drainage.js';

export function sunAppearance(sun) {
  return { haloOpacity: 0.08 + 0.3 * Math.max(0, Math.min(1, sun / 100)) };
}

export function sunbeams(world) {
  if (world.sun <= 0) return [];
  const beams = [];
  // Thin out the existing evaporation samples rather than inventing emission events.
  for (let i = 0; i < world.rays.length && beams.length < config.art.maxSunbeams; i += 3) {
    const ray = world.rays[i];
    const id = world.map.reservoirs[cellAt(world.map, ray.x, ray.z)];
    if (!id || world.reservoirs.count(id) === 0) continue;
    const end = [ray.x, world.reservoirs.level(id), ray.z];
    const start = [ray.x, end[1] + config.art.sunbeamLength, ray.z];
    if (heightAt(world.map, ray.x, ray.z) > end[1]) continue;
    beams.push({ start, end });
  }
  return beams;
}
