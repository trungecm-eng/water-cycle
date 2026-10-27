import { config } from '../config.js';
import { findClusters } from './legacy-clusters.js';
import { terrainHeight } from './terrain.js';

export function releaseRain(particles, rng) {
  const byId = new Map(particles.map(particle => [particle.id, particle]));
  const probability = 1 - Math.exp(-config.cloud.rainRate * config.clock.dt);
  for (const cluster of findClusters(particles)) {
    if (!cluster.raining) continue;
    for (const id of cluster.ids) {
      if (rng() >= probability) continue;
      Object.assign(byId.get(id), { state: 'rain', vx: 0, vy: 0, raining: false });
    }
  }
}

// Returns true only when this step places a particle back in the lake.
export function movePrecipitation(particle, lake) {
  const dt = config.clock.dt;
  if (particle.state === 'rain') {
    particle.vx = 0;
    particle.vy = Math.max(-config.motion.rainMaxSpeed, particle.vy - config.motion.gravity * dt);
    const nextY = particle.y + particle.vy * dt;
    if (particle.x >= config.lake.left && nextY <= lake.level) {
      lake.add(particle);
      return true;
    }
    const ground = terrainHeight(particle.x);
    particle.y = Math.max(ground, nextY);
    if (nextY <= ground) Object.assign(particle, { state: 'runoff', vx: 0, vy: 0 });
  } else if (particle.state === 'runoff') {
    particle.x = Math.min(config.lake.left, particle.x + config.motion.runoffSpeed * dt);
    particle.y = terrainHeight(particle.x);
    particle.vx = config.motion.runoffSpeed;
    particle.vy = 0;
    if (particle.x >= config.lake.left) {
      lake.add(particle);
      return true;
    }
  }
  return false;
}
