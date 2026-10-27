import { percentages } from './water-distribution.js';

export class RainTally {
  constructor(world) { this.clear(world); }

  clear(world) {
    this.baseline = { ...world.rainLandings };
    this.particles = world.particles;
  }

  read(world) {
    // reset() replaces the particle array, even if no frame observed time zero.
    if (this.particles !== world.particles) {
      this.particles = world.particles;
      this.baseline = Object.fromEntries(Object.keys(world.rainLandings).map(id => [id, 0]));
    }
    const counts = Object.fromEntries(Object.entries(world.rainLandings)
      .map(([id, count]) => [id, count - this.baseline[id]]));
    return { counts, percentages: percentages(counts),
      total: Object.values(counts).reduce((sum, count) => sum + count, 0) };
  }
}
