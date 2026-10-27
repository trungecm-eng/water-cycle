import { config } from '../config.js';

export class Clock {
  constructor(step, { speed = 1, paused = false } = {}) {
    this.step = step;
    this.speed = speed;
    this.paused = paused;
    this.accumulator = 0;
  }

  advance(elapsed) {
    if (this.paused || !Number.isFinite(elapsed) || elapsed <= 0) return 0;
    this.accumulator += Math.min(elapsed, config.clock.maxFrame) * this.speed;
    let steps = 0;
    while (this.accumulator + config.clock.epsilon >= config.clock.dt) {
      this.step(config.clock.dt);
      this.accumulator = Math.max(0, this.accumulator - config.clock.dt);
      steps++;
    }
    return steps;
  }

  setPaused(paused) { this.paused = paused; }
  reset() { this.accumulator = 0; this.speed = 1; this.paused = false; }
}
