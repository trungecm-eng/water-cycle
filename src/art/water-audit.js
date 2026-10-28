import { channelRibbon, waterBedHeight } from './water-shapes.js';

// Interpolate the exact triangle split and Float32 vertices used by render.js.
export function renderedTriangleHeight(heights, cells, size, x, z) {
  const spacing = size / cells, stride = cells + 1;
  x = Math.max(0, Math.min(size, x));
  z = Math.max(0, Math.min(size, z));
  const column = Math.min(cells - 1, Math.floor(x / spacing));
  const row = Math.min(cells - 1, Math.floor(z / spacing));
  const u = x / spacing - column, v = z / spacing - row, a = row * stride + column;
  return u + v <= 1
    ? heights[a] * (1-u-v) + heights[a+1] * u + heights[a+stride] * v
    : heights[a+stride+1] * (u+v-1) + heights[a+stride] * (1-u) + heights[a+1] * (1-v);
}

export function measureSurfaceClearance(positions, terrainHeight, tolerance = 0.05) {
  const gaps = [];
  for (let i = 0; i < positions.length; i += 3) {
    gaps.push(positions[i+1] - terrainHeight(positions[i], positions[i+2]));
  }
  return {
    vertices: gaps.length,
    floatingVertices: gaps.filter(gap => gap > tolerance).length,
    coveredVertices: gaps.filter(gap => gap < -tolerance).length,
    minimumGap: gaps.length ? Math.min(...gaps) : null,
    maximumGap: gaps.length ? Math.max(...gaps) : null
  };
}

// Keep the location of extrema as well as aggregate counts so the next bank
// correction can target a specific slope instead of changing global constants.
export function locateClearanceExtrema(positions, terrainHeight) {
  let minimum = null, maximum = null;
  for (let i = 0; i < positions.length; i += 3) {
    const position = Array.from(positions.slice(i, i + 3));
    const groundHeight = terrainHeight(position[0], position[2]);
    const sample = { vertex: i / 3, position, groundHeight, gap: position[1] - groundHeight };
    if (minimum === null || sample.gap < minimum.gap) minimum = sample;
    if (maximum === null || sample.gap > maximum.gap) maximum = sample;
  }
  return { minimum, maximum };
}

// This is a diagnostic, not an acceptance verdict: ribbon endpoint edges may
// meet another water surface instead of dry land. Report every occurrence,
// including duplicates, to keep counts comparable with renderer triangles.
export function auditChannelBanks(map, cells) {
  const stride = cells + 1, spacing = map.size / cells;
  const heights = Float32Array.from({ length: stride * stride }, (_, i) =>
    waterBedHeight(map, i % stride * spacing, Math.floor(i / stride) * spacing));
  const renderedHeight = (x, z) => renderedTriangleHeight(heights, cells, map.size, x, z);
  return {
    cells,
    tolerance: 0.05,
    channels: map.channels.filter(channel => ['river', 'stream'].includes(channel.type)).map(channel => {
      const positions = Float32Array.from(channelRibbon(map, channel));
      return {
        type: channel.type,
        source: channel.path[0],
        analytic: measureSurfaceClearance(positions, (x, z) => waterBedHeight(map, x, z)),
        rendered: measureSurfaceClearance(positions, renderedHeight),
        extrema: {
          analytic: locateClearanceExtrema(positions, (x, z) => waterBedHeight(map, x, z)),
          rendered: locateClearanceExtrema(positions, renderedHeight)
        }
      };
    })
  };
}
