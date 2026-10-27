import { config } from '../config.js';
import { mapData } from '../map-data.js';
import { heightAt } from './heightmap.js';

export function environmentTemperature(y) {
  return Math.max(0, config.heat.environmentBase - config.heat.lapseRate * (y - config.world.seaLevel));
}

export function windFactor(x, z, data = mapData) {
  const ridge = data.ridge;
  let ridgeX = ridge.at(-1)[1];
  for (let i = 1; i < ridge.length; i++) {
    if (z > ridge[i][0]) continue;
    const [z0, x0] = ridge[i - 1];
    const [z1, x1] = ridge[i];
    ridgeX = x0 + (x1 - x0) * Math.max(0, (z - z0) / (z1 - z0));
    break;
  }
  return Math.max(0, Math.min(1, 1 + (x - ridgeX) / data.windShelterDistance));
}

export function moveAirParticle(particle, wind, map) {
  if (particle.state !== 'vapor' && particle.state !== 'cloud') return;
  const dt = config.clock.dt;
  particle.vx = -config.motion.windSpeed * wind / config.limits.maxControl
    * windFactor(particle.x, particle.z);
  particle.vz = 0;
  particle.x = Math.max(0, Math.min(map.size, particle.x + particle.vx * dt));
  particle.z = Math.max(0, Math.min(map.size, particle.z));
  if (particle.state === 'vapor') {
    particle.vy = Math.min(config.motion.vaporMaxSpeed, particle.vy + config.motion.buoyancy * dt);
  } else particle.vy = 0;
  // Terrain lifts air along the windward slope. Cooling samples the new altitude.
  particle.y = Math.min(config.world.height, Math.max(
    heightAt(map, particle.x, particle.z) + config.motion.airClearance,
    config.world.seaLevel + config.motion.airClearance, particle.y + particle.vy * dt));
  if (particle.y === config.world.height) particle.vy = 0;
  particle.temperature += (environmentTemperature(particle.y) - particle.temperature)
    * (1 - Math.exp(-config.heat.vaporCooling * dt));
  if (particle.state === 'vapor' && particle.temperature <= config.heat.condenseTemp) {
    particle.state = 'cloud';
    particle.vy = 0;
  }
}
