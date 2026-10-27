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
    this.rays = [];
    this.clusters = [];
    this.particles = Array.from({ length: this.options.n }, (_, id) => ({ id }));
    this.reservoirs = new Reservoirs(this.particles, this.map);
  }
  get time() { return this.steps * config.clock.dt; }
  step() {
    this.reservoirs.overflow();
    this.steps++;
  }
  snapshot() {
    const counts = { water: 0, vapor: 0, cloud: 0, rain: 0, runoff: 0 };
    for (const particle of this.particles) counts[particle.state]++;
    return freeze({ time: this.time, counts, level: this.reservoirs.level('lake'),
      reservoirs: this.reservoirs.snapshot(), returns: this.returns, evaporations: this.evaporations,
      sun: this.sun, wind: this.wind, clusters: this.clusters.map(cluster => ({ ...cluster, ids: [...cluster.ids] })),
      particles: this.particles.map(particle => ({ ...particle })) });
  }
}
