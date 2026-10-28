import { config } from '../config.js';
import { mapData } from '../map-data.js';
import { mulberry32 } from '../sim/rng.js';
import { terrainSample } from './terrain-colors.js';
import { valueNoise } from './noise.js';
import { waterBedHeight } from './water-shapes.js';
import { fieldAt, generateFields } from './fields.js';

export function treeEligible(sample) {
  return ['mountain', 'foothill', 'plain'].includes(sample.region)
    && sample.height < config.art.snowHeight && sample.slope < config.art.treeSlope;
}

// A jittered lattice bounds crowding; coherent noise forms groves without using World RNG.
export function generateTrees(map, count = config.quality.levels.high.trees, data = mapData) {
  const random = mulberry32(data.seed ^ 0x74ee5);
  const fields = generateFields(map, data);
  const candidates = [];
  const spacing = config.art.treeSpacing;
  for (let z = spacing; z < map.size - spacing; z += spacing) {
    for (let x = spacing; x < map.size - spacing; x += spacing) {
      const tx = x + (random() - 0.5) * spacing * 0.8;
      const tz = z + (random() - 0.5) * spacing * 0.8;
      const sample = terrainSample(map, tx, tz);
      const rank = random();
      if (!treeEligible(sample) || fieldAt(fields, tx, tz)) continue;
      const cluster = valueNoise(tx / 65, tz / 65, data.seed ^ 0x9ab4);
      const weight = sample.region === 'plain' ? 0.12 : 1;
      candidates.push({ x: tx, y: waterBedHeight(map, tx, tz, data), z: tz, region: sample.region,
        scale: 0.75 + random() * 0.5, shade: random(), rotation: random() * Math.PI * 2,
        rank: rank / (weight * (0.12 + cluster ** 2)) });
    }
  }
  return candidates.sort((a, b) => a.rank - b.rank).slice(0, count).map(({ rank, ...tree }) => tree);
}
