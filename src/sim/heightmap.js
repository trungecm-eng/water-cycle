import { mapData } from '../map-data.js';
import { mulberry32 } from './rng.js';

export function coastX(z, data = mapData) {
  return data.coast.x + data.coast.amplitude * Math.sin(z / data.coast.wavelength);
}

export function generateHeightmap(data = mapData) {
  const cells = data.cells;
  const stride = cells + 1;
  const spacing = data.size / cells;
  const heights = new Float64Array(stride * stride);
  const regions = new Array(heights.length);
  const random = mulberry32(data.seed);
  for (let row = 0; row <= cells; row++) for (let column = 0; column <= cells; column++) {
    const x = column * spacing;
    const z = row * spacing;
    const index = row * stride + column;
    const shore = coastX(z, data);
    const noise = (random() - 0.5) * data.noise.amplitude;
    if (x >= shore) {
      heights[index] = data.seaLevel - Math.max(0.01, (x - shore) * data.coast.depthSlope);
      regions[index] = 'sea';
    } else {
      let height = data.plain.base + (shore - x) * data.plain.slope;
      for (const peak of data.peaks) {
        const distance = Math.hypot((x - peak.x) / peak.radiusX, (z - peak.z) / peak.radiusZ);
        height = Math.max(height, data.plain.base + peak.height * Math.max(0, 1 - distance));
      }
      heights[index] = height + noise;
      regions[index] = x < data.mountainEdge ? 'mountain' : x > shore - data.coast.beachWidth ? 'beach' : 'plain';
    }
  }
  return { cells, stride, spacing, size: data.size, heights, regions };
}

// Bilinear sampling clamps boundary queries to the edge of the board.
export function heightAt(map, x, z) {
  const gx = Math.max(0, Math.min(map.cells, x / map.spacing));
  const gz = Math.max(0, Math.min(map.cells, z / map.spacing));
  const column = Math.min(map.cells - 1, Math.floor(gx));
  const row = Math.min(map.cells - 1, Math.floor(gz));
  const tx = gx - column;
  const tz = gz - row;
  const index = row * map.stride + column;
  const lower = map.heights[index] * (1 - tx) + map.heights[index + 1] * tx;
  const upper = map.heights[index + map.stride] * (1 - tx) + map.heights[index + map.stride + 1] * tx;
  return lower * (1 - tz) + upper * tz;
}
