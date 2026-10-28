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

      let corridorDistance = Infinity;
      for (const stream of data.streams) for (let i = 1; i < stream.points.length; i++) {
        const [ax, az] = stream.points[i - 1], [bx, bz] = stream.points[i];
        const sx = bx - ax, sz = bz - az;
        const t = Math.max(0, Math.min(1, ((x-ax)*sx + (z-az)*sz) / (sx*sx + sz*sz)));
        corridorDistance = Math.min(corridorDistance, Math.hypot(x-ax-sx*t, z-az-sz*t));
      }
      const corridorBlend = Math.max(0, Math.min(1, (corridorDistance - 60) / 30));
      // Join the lower flanks with a folded ridge, while retaining the local
      // summit relief and the stream catchments. The previous max of isolated
      // peak envelopes left deep, evenly spaced notches between the massifs.
      const summitDistance = Math.min(...data.peaks.map(peak => Math.hypot(x - peak.x, z - peak.z)));
      const saddleBlend = Math.max(0, Math.min(1, (summitDistance - 40) / 40));
      const catchmentBlend = Math.max(0, Math.min(1, (corridorDistance - 90) / 30));
      const endBlend = Math.max(0, Math.min(1, (z - 250) / 50));
      // Stretch flank folds along the range so they read as rock ribs rather
      // than isolated bumps. Preserve summit crowns and stream catchments.
      const flankBlend = saddleBlend * saddleBlend * (3 - 2 * saddleBlend)
        * corridorBlend * corridorBlend * (3 - 2 * corridorBlend);
      const flankRidge = ridge + flankBlend
        * (ridgedNoise(x / 18, z / 65, data.seed ^ 0x7321) - ridge);
      const ridgeBlend = saddleBlend * saddleBlend * (3 - 2 * saddleBlend)
        * catchmentBlend * catchmentBlend * (3 - 2 * catchmentBlend)
        * endBlend * endBlend * (3 - 2 * endBlend);
      height = Math.max(height, data.plain.base + mountainEnvelope
        * ((56 + 40 * ridgeBlend) * mountainMass + 24 * ridge));
      for (const peak of data.peaks) {
        const dx = (x - peak.x) / peak.radiusX;
        const dz = (z - peak.z) / peak.radiusZ;
        const angle = Math.atan2(dz, dx);
        // Keep summit relief and stream corridors stable while breaking the
        // rotational outline of the broad flanks into asymmetric rock spurs.
        const summitBlend = Math.max(0, Math.min(1, (Math.hypot(x - peak.x, z - peak.z) - 40) / 35));
        const edgeBlend = Math.max(0, Math.min(1, (data.mountainEdge - x) / 80));
        const spurBlend = edgeBlend * summitBlend * summitBlend * (3 - 2 * summitBlend)
          * corridorBlend * corridorBlend * (3 - 2 * corridorBlend);
        // Outside the protected crown, a skewed diamond footprint creates
        // planar ridges with unequal shoulders instead of a circular cone.
        const radialDistance = Math.hypot(dx, dz);
        const ridgeDistance = (Math.abs(dx + 0.32 * dz) + 0.7 * Math.abs(dz)) / 1.7;
        const easternFlank = Math.max(0, Math.min(1, dx / 0.6));
        const footprintDistance = radialDistance + 0.8 * spurBlend
          * easternFlank * easternFlank * (3 - 2 * easternFlank) * (ridgeDistance - radialDistance);
        const distance = footprintDistance * (1 + (0.18 + 0.22 * spurBlend) * Math.sin(3 * angle + peak.z / 90)
          + (0.1 + 0.12 * spurBlend) * Math.sin(5 * angle + peak.x / 60));
        const shoulder = Math.max(0, 1 - distance);
        // A broad lower flank carries the narrow summit. Using only the
        // summit envelope produces isolated spires with almost vertical feet.
        height = Math.max(height, data.plain.base + peak.height * (0.55 * Math.max(0, 1 - distance / 1.65) ** 1.1
          + 0.45 * shoulder ** 2.5)
          + 80 * flankRidge * Math.sin(Math.PI * Math.min(1, shoulder)));
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
