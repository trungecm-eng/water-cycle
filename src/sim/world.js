import { moveAirParticle } from './air.js';
import { findClusters } from './clusters.js';
import { releaseRain, movePrecipitation } from './precipitation.js';
import { config } from '../config.js';
import { generateDrainage } from './drainage.js';
import { Reservoirs } from './reservoirs.js';
import { mulberry32 } from './rng.js';

function freeze(value) {
  for (const child of Object.values(value)) if (child && typeof child === 'object') freeze(child);
  return Object.freeze(value);
}

export class World {
  constructor(options = {}) {
    this.options = { ...config.defaults, ...options };
    this.sun = this.options.sun;
    this.wind = this.options.wind;
    this.map = generateDrainage();
    this.reset();
  }
  reset() {
    this.rng = mulberry32(this.options.seed);
    this.steps = 0;
    this.evaporations = 0;
    this.returns = 0;
    this.streamToLake = 0;
    this.riverToSea = 0;
    this.rainLandings = { mountain: 0, plain: 0, sea: 0, lake: 0, pond: 0 };
    this.evaporationsByReservoir = { sea: 0, lake: 0, pond: 0 };
    this.rays = [];
    this.clusters = [];
    this.particles = Array.from({ length: this.options.n }, (_, id) => ({ id }));
    this.reservoirs = new Reservoirs(this.particles, this.map);
    // A seeded initial fractional credit keeps counts within one of the exact
    // area integral, without synchronized emissions from all reservoirs.
    this.evaporationCredit = Object.fromEntries(Object.keys(this.reservoirs.members).map(id => [id, this.rng()]));
  }
  get time() { return this.steps * config.clock.dt; }
  step() {
    for (const particle of this.particles) moveAirParticle(particle, this.wind, this.map);
    for (const particle of this.particles) movePrecipitation(particle, this.reservoirs, this);
    releaseRain(this.particles, this.rng);
    this.clusters = findClusters(this.particles);
    this.reservoirs.overflow();
    this.rays = [];
    for (const id of Object.keys(this.reservoirs.members)) {
      if (!this.reservoirs.count(id)) {
        this.evaporationCredit[id] = 0;
        continue;
      }
      if (this.sun === 0) continue;
      this.evaporationCredit[id] += config.evaporation.ratePerArea * this.reservoirs.surfaces[id].area
        * this.sun / config.limits.maxControl * config.clock.dt;
      while (this.evaporationCredit[id] >= 1 && this.reservoirs.count(id)) {
        this.evaporationCredit[id]--;
        const particle = this.reservoirs.members[id].values().next().value;
        const position = this.reservoirs.surfacePoint(id, this.rng);
        this.reservoirs.remove(particle);
        Object.assign(particle, position, { state: 'vapor', sourceReservoir: id,
          temperature: config.evaporation.temperature, vx: 0, vy: 0, vz: 0 });
        this.evaporations++;
        this.evaporationsByReservoir[id]++;
      }
      // Rays are visual samples; sampling consumes no simulation randomness.
      const cells = this.reservoirs.surfaces[id].cells;
      if (!this.reservoirs.count(id)) continue;
      for (let ray = 0; ray < config.sunlight.rayCount; ray++) {
        const cell = cells[(Math.floor(this.time) + ray * Math.floor(cells.length / config.sunlight.rayCount)) % cells.length];
        this.rays.push({ x: cell.x, y: this.reservoirs.level(id), z: cell.z });
      }
    }
    this.steps++;
  }
  snapshot() {
    const counts = { water: 0, vapor: 0, cloud: 0, rain: 0, runoff: 0 };
    for (const particle of this.particles) counts[particle.state]++;
    return freeze({ time: this.time, counts, level: this.reservoirs.level('lake'),
      reservoirs: this.reservoirs.snapshot(), streamToLake: this.streamToLake, riverToSea: this.riverToSea,
      rainLandings: { ...this.rainLandings }, evaporationsByReservoir: { ...this.evaporationsByReservoir }, returns: this.returns, evaporations: this.evaporations,
      sun: this.sun, wind: this.wind, clusters: this.clusters.map(cluster => ({ ...cluster, ids: [...cluster.ids] })),
      particles: this.particles.map(particle => ({ ...particle })) });
  }
}
