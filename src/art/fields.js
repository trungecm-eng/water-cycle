import { mapData } from '../map-data.js';
import { config } from '../config.js';
import { mulberry32 } from '../sim/rng.js';
import { terrainSample } from './terrain-colors.js';

export function fieldAt(fields, x, z) {
  return fields.find(field => x >= field.x && x <= field.x + field.width
    && z >= field.z && z <= field.z + field.depth)?.color ?? null;
}

export function generateFields(map, data = mapData) {
  const random = mulberry32(data.seed ^ 0x786ec5);
  const fields = [];
  for (let attempt = 0; attempt < config.art.fieldAttempts && fields.length < config.art.fieldCount; attempt++) {
    const field = { x: 320 + random() * 360, z: 50 + random() * 850,
      width: 24 + random() * 24, depth: 20 + random() * 24,
      color: config.colors[['fieldGold', 'fieldSage', 'fieldMint'][Math.floor(random() * 3)]] };
    // Test the entire rectangle plus a bank clearance, not just its center.
    let eligible = true;
    const margin = config.art.bankClearance;
    for (let z = field.z - margin; z <= field.z + field.depth + margin; z += map.spacing / 3) {
      for (let x = field.x - margin; x <= field.x + field.width + margin; x += map.spacing / 3) {
        const sample = terrainSample(map, x, z);
        if (sample.region !== 'plain' || sample.slope > config.art.fieldSlope) eligible = false;
      }
    }
    if (!eligible || fields.some(other => field.x < other.x + other.width + margin && field.x + field.width + margin > other.x
      && field.z < other.z + other.depth + margin && field.z + field.depth + margin > other.z)) continue;
    fields.push(field);
  }
  return fields;
}
