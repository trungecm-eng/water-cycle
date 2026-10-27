import { config } from '../config.js';
import { findClusters } from './clusters.js';

export function rainTemperatureFactor(temperature) {
  return Math.max(1, Math.min(config.cloud.coldRainFactor,
    1 + (config.cloud.coldRainFactor - 1) * (config.heat.condenseTemp - temperature) / config.heat.condenseTemp));
}

export function releaseRain(particles, rng) {
  const byId = new Map(particles.map(particle => [particle.id, particle]));
  const probability = config.cloud.rainRate * config.clock.dt;
  for (const cluster of findClusters(particles)) {
    if (!cluster.raining) continue;
    for (const id of cluster.ids) {
      if (rng() >= probability * rainTemperatureFactor(byId.get(id).temperature)) continue;
      Object.assign(byId.get(id), { state: 'rain', vx: 0, vy: 0, vz: 0, raining: false });
    }
  }
}
