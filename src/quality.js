import { config } from './config.js';

export const qualityLevels = config.quality.levels;

export function parseQuality(search = '') {
  return new URLSearchParams(search).get('quality') === 'low' ? 'low' : 'high';
}

// One complete second is one FPS sample; five consecutive slow samples show the hint.
export class QualityMonitor {
  constructor(level = 'high') { this.level = level; this.dismissed = false; this.reset(); }
  reset() { this.start = undefined; this.previous = undefined; this.frames = 0; this.slowSeconds = 0; this.slowHint = false; }
  select(level) { this.level = level in qualityLevels ? level : 'high'; this.reset(); }
  dismiss() { this.dismissed = true; this.reset(); }
  frame(time, hidden = false) {
    if (hidden || this.level !== 'high' || this.dismissed) { this.reset(); return; }
    if (this.start === undefined) { this.start = time; this.previous = time; return; }
    if (time <= this.previous) return;
    this.previous = time;
    this.frames++;
    const elapsed = time - this.start;
    if (elapsed + 1e-9 < 1) return;
    this.slowSeconds = this.frames / elapsed < config.quality.slowFps - 1e-9 ? this.slowSeconds + elapsed : 0;
    this.slowHint = this.slowSeconds + 1e-9 >= config.quality.slowDuration;
    this.start = time;
    this.frames = 0;
  }
  snapshot() { return Object.freeze({ level: this.level, slowHint: this.slowHint }); }
}
