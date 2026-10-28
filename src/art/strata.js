import { config } from '../config.js';
import { mapData } from '../map-data.js';
import { valueNoise } from './noise.js';
import { waterBedHeight } from './water-shapes.js';

// Shared boundary samples keep all four corners and adjacent layers watertight.
export function generateStrata(map, seed = mapData.seed) {
  const { base } = config.scenery;
  const edges = [
    Array.from({ length: map.stride }, (_, i) => [i * map.spacing, 0]),
    Array.from({ length: map.stride }, (_, i) => [map.size, i * map.spacing]),
    Array.from({ length: map.stride }, (_, i) => [map.size - i * map.spacing, map.size]),
    Array.from({ length: map.stride }, (_, i) => [0, map.size - i * map.spacing])
  ];
  const colors = ['rock', 'soil', 'soilLight', 'grassEdge'];
  return edges.map(points => {
    const columns = points.map(([x, z]) => {
      const top = waterBedHeight(map, x, z);
      const depth = top - base;
      const ripple = (valueNoise(x / 90, z / 90, seed ^ 0x531a) - 0.5) * 0.08;
      return { x, z, heights: [base, base + depth * (0.30 + ripple),
        base + depth * (0.66 + ripple), top - Math.min(3, depth * 0.04), top] };
    });
    const layers = colors.map((color, layer) => {
      const positions = [];
      for (let i = 1; i < columns.length; i++) {
        const a = columns[i - 1], b = columns[i];
        positions.push(a.x,a.heights[layer],a.z, b.x,b.heights[layer],b.z, a.x,a.heights[layer+1],a.z,
          a.x,a.heights[layer+1],a.z, b.x,b.heights[layer],b.z, b.x,b.heights[layer+1],b.z);
      }
      return { color, positions };
    });
    // Clip each edge segment at sea level; no water wall extends into dry land.
    const water = [];
    for (let i = 1; i < columns.length; i++) {
      let a = columns[i - 1], b = columns[i];
      const level = config.world.seaLevel;
      const top = p => p.heights.at(-1);
      if (top(a) >= level && top(b) >= level) continue;
      if (top(a) > level || top(b) > level) {
        const t = (level - top(a)) / (top(b) - top(a));
        const shore = { x: a.x + (b.x-a.x)*t, z: a.z + (b.z-a.z)*t, heights: [level] };
        if (top(a) > level) a = shore; else b = shore;
      }
      water.push(a.x,top(a),a.z, b.x,top(b),b.z, a.x,level,a.z,
        a.x,level,a.z, b.x,top(b),b.z, b.x,level,b.z);
    }
    return { columns, layers, water };
  });
}
