import { config } from '../config.js';

export class Lake {
  constructor(particles = []) {
    this.cells = Array.from({ length: config.lake.rows }, () => Array(config.lake.columns).fill(null));
    this.locations = new Map();
    if (particles.length > this.capacity) throw new RangeError('Lake capacity exceeded');
    for (const particle of particles) this.add(particle, config.lake.left);
  }

  get capacity() { return config.lake.rows * config.lake.columns; }
  get count() { return this.locations.size; }
  get level() { return config.lake.bottom + this.count * config.lake.levelPerParticle; }

  columnX(column) {
    return config.lake.left + (column + 0.5) * config.lake.cellSize;
  }

  surface(column) {
    for (let row = config.lake.rows - 1; row >= 0; row--) {
      if (this.cells[row][column]) return this.cells[row][column];
    }
    return null;
  }

  remove(particle) {
    const location = this.locations.get(particle);
    if (!location) return false;
    this.cells[location.row][location.column] = null;
    this.locations.delete(particle);
    return true;
  }

  add(particle, x = particle.x) {
    if (this.locations.has(particle)) throw new Error('Particle already in lake');
    for (let row = 0; row < config.lake.rows; row++) {
      let column = -1;
      let distance = Infinity;
      for (let candidate = 0; candidate < config.lake.columns; candidate++) {
        const nextDistance = Math.abs(this.columnX(candidate) - x);
        if (this.cells[row][candidate] === null && nextDistance < distance) {
          column = candidate;
          distance = nextDistance;
        }
      }
      if (column < 0) continue;
      this.cells[row][column] = particle;
      this.locations.set(particle, { row, column });
      Object.assign(particle, {
        x: this.columnX(column),
        y: config.lake.bottom + (row + 0.5) * config.lake.cellSize,
        vx: 0, vy: 0, temperature: config.heat.baseline, state: 'water'
      });
      return { row, column };
    }
    throw new RangeError('Lake capacity exceeded');
  }
}
