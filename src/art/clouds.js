import { config } from '../config.js';
import { heightAt } from '../sim/heightmap.js';
import { cellAt } from '../sim/drainage.js';

export function cloudAppearance(size, quality = 'high') {
  const t = Math.max(0, Math.min(1, (size - config.cloud.cloudMinSize) / (config.art.cloudSaturation - config.cloud.cloudMinSize)));
  const count = 5 + Math.round(7 * t);
  return { count: Math.max(5, Math.min(config.quality.levels[quality].cloudBlocksMax, count)),
    shade: Math.max(0, Math.min(1, (size - config.cloud.cloudMinSize) / (config.cloud.rainStartSize - config.cloud.cloudMinSize))),
    radius: 18 + 12 * Math.sqrt(t) };
}

// Independent visual sampling: never consumes the simulation RNG or mutates particles.
export function cloudVisuals(world, quality = 'high') {
  return world.clusters.filter(cluster => cluster.size >= config.cloud.cloudMinSize).map(cluster => {
    const appearance = cloudAppearance(cluster.size, quality);
    const members = cluster.ids.map(id => world.particles[id]).filter(p => p?.state === 'cloud');
    if (!members.length) return null;
    const center = members.reduce((sum, p) => [sum[0] + p.x / members.length, sum[1] + p.y / members.length, sum[2] + p.z / members.length], [0, 0, 0]);
    const blocks = Array.from({ length: appearance.count }, (_, i) => {
      const angle = i * 2.399963;
      const spread = i === 0 ? 0 : 0.65 + (i % 3) * 0.3;
      return { x: center[0] + Math.cos(angle) * appearance.radius * spread,
        y: center[1] + (i % 3) * appearance.radius * 0.22,
        z: center[2] + Math.sin(angle) * appearance.radius * spread,
        radius: appearance.radius * (1 - (i % 3) * 0.1) };
    });
    const rain = [];
    if (cluster.raining) for (let column = 0; column < config.art.rainColumns; column++) {
      const angle = column * 2.399963;
      const spread = Math.sqrt((column + 0.5) / config.art.rainColumns) * appearance.radius * 1.3;
      const x = Math.max(0, Math.min(world.map.size, center[0] + Math.cos(angle) * spread));
      const z = Math.max(0, Math.min(world.map.size, center[2] + Math.sin(angle) * spread));
      const id = world.map.reservoirs[cellAt(world.map, x, z)];
      const ground = Math.max(heightAt(world.map, x, z), id ? world.reservoirs.level(id) : -Infinity);
      const top = center[1] - appearance.radius * 0.5;
      const spacing = 19;
      const phase = (world.time * 100 + column * 7) % spacing;
      for (let y = top - phase; y > ground; y -= spacing) {
        const bottom = Math.max(ground, y - config.art.rainCurtainLength);
        rain.push({ x, z, top: y, bottom });
      }
    }
    return { ...appearance, center, blocks, rain };
  }).filter(Boolean);
}
