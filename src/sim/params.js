import { config } from '../config.js';

export function parseParams(search = '') {
  const params = new URLSearchParams(search);
  const result = { ...config.defaults };
  const rules = {
    n: [config.limits.minParticles, config.limits.maxParticles, true],
    sun: [0, 100], wind: [0, 100],
    seed: [-Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, true],
    speed: [config.limits.minSpeed, config.limits.maxSpeed]
  };
  for (const [key, [min, max, integer]] of Object.entries(rules)) {
    const raw = params.get(key);
    if (raw === null || raw.trim() === '') continue;
    const value = Number(raw);
    if (Number.isFinite(value) && value >= min && value <= max && (!integer || Number.isInteger(value))) result[key] = value;
  }
  result.paused = params.get('paused') === '1';
  return result;
}
