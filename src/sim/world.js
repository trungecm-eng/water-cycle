import { config } from '../config.js';
import { Lake } from './lake.js';
import { mulberry32 } from './rng.js';
import { moveAirParticle } from './air.js';
import { movePrecipitation, releaseRain } from './precipitation.js';
import { findClusters } from './clusters.js';

function freeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
  return Object.freeze(value);
}

export class World {
  constructor(options = {}) {
    this.options = { ...config.defaults, ...options };
    this.sun = this.options.sun;
    this.wind = this.options.wind;
    this.reset();
  }

  reset() {
    this.rng = mulberry32(this.options.seed);
    this.steps = 0;
    this.evaporations = 0;
    this.returns = 0;
    this.rays = [];
    this.rayAccumulator = 0;
    this.clusters = [];
    this.particles = Array.from({ length: this.options.n }, (_, id) => ({ id }));
    this.lake = new Lake(this.particles);
  }

  get time() { return this.steps * config.clock.dt; }
  step() {
    const dt = config.clock.dt;
    for (const particle of this.particles) {
      if (particle.state === 'water') {
        particle.temperature = Math.max(config.heat.baseline, particle.temperature - config.heat.cooling * dt);
      } else if (particle.state === 'vapor' || particle.state === 'cloud') {
        moveAirParticle(particle, this.wind, this.options.seed, this.time);
      } else if (particle.state === 'rain' || particle.state === 'runoff') {
        if (movePrecipitation(particle, this.lake)) this.returns++;
      }
    }
    if (this.sun === 0) {
      this.rays = [];
      this.rayAccumulator = 0;
    } else {
      this.rayAccumulator += config.heat.raysPerSecond * this.sun / config.limits.maxControl * dt;
      while (this.rayAccumulator >= 1) {
        this.rayAccumulator--;
        this.rays.push({ column: Math.floor(this.rng() * config.lake.columns), x: config.sun.x, y: config.sun.y });
      }
      this.rays = this.rays.filter(ray => {
        const surface = this.lake.surface(ray.column);
        const targetX = this.lake.columnX(ray.column);
        const targetY = surface?.y ?? config.lake.bottom;
        const dx = targetX - ray.x;
        const dy = targetY - ray.y;
        const distance = Math.hypot(dx, dy);
        const travel = config.heat.raySpeed * dt;
        if (distance > travel) {
          ray.x += dx / distance * travel;
          ray.y += dy / distance * travel;
          return true;
        }
        if (surface) surface.temperature = Math.min(100, surface.temperature + config.heat.rayHeat);
        return false;
      });
      for (let column = 0; column < config.lake.columns; column++) {
        const particle = this.lake.surface(column);
        if (!particle || particle.temperature <= config.heat.evaporationTemp) continue;
        this.lake.remove(particle);
        particle.state = 'vapor';
        particle.vy = config.motion.buoyancy * dt;
        particle.y = Math.max(particle.y, this.lake.level);
        this.evaporations++;
      }
    }
    releaseRain(this.particles, this.rng);
    this.clusters = findClusters(this.particles);
    this.steps++;
  }

  snapshot() {
    const counts = { water: 0, vapor: 0, cloud: 0, rain: 0, runoff: 0 };
    for (const particle of this.particles) counts[particle.state]++;
    return freeze({ time: this.time, counts, level: this.lake.level,
      returns: this.returns, evaporations: this.evaporations,
      sun: this.sun, wind: this.wind, clusters: this.clusters.map(cluster => ({ ...cluster, ids: [...cluster.ids] })),
      particles: this.particles.map(particle => ({ ...particle })) });
  }
}
