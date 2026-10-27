import { config } from '../config.js';

// Connected components found through a spatial hash; membership is transitive.
export function findClusters(particles) {
  const radius = config.cloud.clusterRadius;
  const cells = new Map();
  const clouds = particles.filter(particle => particle.state === 'cloud');
  const key = (x, y, z) => `${x},${y},${z}`;
  for (const particle of clouds) {
    const cell = key(Math.floor(particle.x / radius), Math.floor(particle.y / radius), Math.floor(particle.z / radius));
    if (!cells.has(cell)) cells.set(cell, []);
    cells.get(cell).push(particle);
  }
  const seen = new Set();
  const clusters = [];
  for (const start of clouds) {
    if (seen.has(start)) continue;
    const members = [start];
    seen.add(start);
    for (let index = 0; index < members.length; index++) {
      const particle = members[index];
      const cx = Math.floor(particle.x / radius);
      const cy = Math.floor(particle.y / radius);
      const cz = Math.floor(particle.z / radius);
      for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) {
        for (const neighbor of cells.get(key(cx + dx, cy + dy, cz + dz)) ?? []) {
          if (!seen.has(neighbor) && Math.hypot(particle.x - neighbor.x, particle.y - neighbor.y, particle.z - neighbor.z) <= radius) {
            seen.add(neighbor);
            members.push(neighbor);
          }
        }
      }
    }
    const raining = members.length >= config.cloud.rainStartSize
      || (members.length >= config.cloud.cloudMinSize && members.some(particle => particle.raining));
    for (const particle of members) particle.raining = raining;
    clusters.push({ ids: members.map(particle => particle.id), size: members.length,
      visible: members.length >= config.cloud.cloudMinSize, raining });
  }
  return clusters;
}
