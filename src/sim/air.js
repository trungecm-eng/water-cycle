import { config } from '../config.js';
import { terrainHeight } from './terrain.js';

export function environmentTemperature(y) {
  return Math.max(0, config.heat.environmentBase - config.heat.lapseRate * (y - config.lake.bottom));
}

export function moveAirParticle(particle, wind, seed, time) {
  const dt = config.clock.dt;
  if (particle.state === 'vapor') {
    particle.temperature += (environmentTemperature(particle.y) - particle.temperature)
      * (1 - Math.exp(-config.heat.vaporCooling * dt));
    if (particle.temperature <= config.heat.condenseTemp) {
      particle.state = 'cloud';
      particle.vy = 0;
    } else {
      particle.vy = Math.min(config.motion.vaporMaxSpeed, particle.vy + config.motion.buoyancy * dt);
    }
  }
  const drift = particle.state === 'cloud'
    ? config.motion.cloudDrift * Math.sin(time + particle.id + seed) : 0;
  particle.vx = -config.motion.windSpeed * wind / config.limits.maxControl + drift;
  const nextY = Math.max(terrainHeight(particle.x), Math.min(config.world.height, particle.y + particle.vy * dt));
  if (nextY === config.world.height) particle.vy = 0;
  const targetX = Math.max(0, Math.min(config.world.width, particle.x + particle.vx * dt));
  let nextX = targetX;
  if (terrainHeight(targetX) > nextY) {
    let safe = particle.x;
    let blocked = targetX;
    for (let i = 0; i < config.motion.collisionIterations; i++) {
      const middle = (safe + blocked) / 2;
      if (terrainHeight(middle) > nextY) blocked = middle;
      else safe = middle;
    }
    nextX = safe;
    particle.vx = 0;
  }
  if (nextX === 0 || nextX === config.world.width) particle.vx = 0;
  particle.x = nextX;
  particle.y = nextY;
}
