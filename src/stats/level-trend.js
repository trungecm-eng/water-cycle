import { config } from '../config.js';

export class LevelTrend {
  constructor() { this.reset(); }

  reset() {
    this.samples = [];
    this.initialLevel = null;
    this.direction = null;
  }

  update(time, count, level) {
    if (this.samples.length && time < this.samples.at(-1).time) this.reset();
    if (this.initialLevel === null) this.initialLevel = level;
    if (!this.samples.length || time > this.samples.at(-1).time) {
      this.samples.push({ time, count });
      const cutoff = time - config.stats.trendWindow;
      while (this.samples.length > 1 && this.samples[1].time <= cutoff) this.samples.shift();
      const delta = count - this.samples[0].count;
      if (Math.abs(delta) >= config.stats.trendEnter) this.direction = delta > 0 ? 'up' : 'down';
      else if (Math.abs(delta) <= config.stats.trendExit) this.direction = null;
    }
    return { level, initialLevel: this.initialLevel, direction: this.direction, dry: count === 0 };
  }
}
