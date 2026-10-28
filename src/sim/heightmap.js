import { mapData } from '../map-data.js';
import { mulberry32 } from './rng.js';
import { valueNoise, ridgedNoise } from '../art/noise.js';

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
      // Broad rolling plains and sharp, asymmetric ridges share the drainage mesh.
      height += 10 * (valueNoise(x / 85, z / 85, data.seed ^ 0x41ad) - 0.5);
      const ridge = ridgedNoise(x / 24, z / 24, data.seed ^ 0x7321);
      // A continuous, folded mountain mass joins the individual summits.
      // The envelope fades before the plain and leaves the sharp summit relief intact.
      let mountainMass = 0;
      for (const peak of data.peaks) {
        mountainMass += Math.exp(-0.5 * (((x - peak.x) / 85) ** 2
          + ((z - peak.z) / 150) ** 2));
      }
      const mountainEnvelope = Math.max(0, Math.min(1, (data.mountainEdge - x) / 80));
      height = Math.max(height, data.plain.base + mountainEnvelope
        * (56 * mountainMass + 24 * ridge));
      for (const peak of data.peaks) {
        const dx = (x - peak.x) / peak.radiusX;
        const dz = (z - peak.z) / peak.radiusZ;
        const angle = Math.atan2(dz, dx);
        const distance = Math.hypot(dx, dz) * (1 + 0.18 * Math.sin(3 * angle + peak.z / 90)
          + 0.1 * Math.sin(5 * angle + peak.x / 60));
        const shoulder = Math.max(0, 1 - distance);
        // A broad lower flank carries the narrow summit. Using only the
        // summit envelope produces isolated spires with almost vertical feet.
        height = Math.max(height, data.plain.base + peak.height * (0.55 * Math.max(0, 1 - distance / 1.65) ** 1.1
          + 0.45 * shoulder ** 2.5)
          + 80 * ridge * Math.sin(Math.PI * Math.min(1, shoulder)));
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
