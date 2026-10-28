import { channelRibbon, waterBedHeight } from './water-shapes.js';

// Sutherland–Hodgman clipping. Each boundary is linear on a land triangle,
// so the resulting water triangles cannot cross dry land between vertices.
function clip(polygon, distance) {
  const result = [];
  for (let i = 0; i < polygon.length; i++) {
    const a = polygon[i], b = polygon[(i + 1) % polygon.length];
    const da = distance(a), db = distance(b);
    if (da >= 0) result.push(a);
    if ((da >= 0) !== (db >= 0)) {
      const t = da / (da - db);
      result.push(a.map((value, axis) => value + t * (b[axis] - value)));
    }
  }
  return result;
}

// Shared footprint for water and decoration, independent of render quality.
function expandedCorners(ribbon, i) {
  const a = ribbon.slice(i, i + 3), b = ribbon.slice(i + 3, i + 6);
  const c = ribbon.slice(i + 6, i + 9), d = ribbon.slice(i + 15, i + 18);
  const expand = (p, opposite) => p.map((value, axis) => axis === 1 ? value : 2 * value - opposite[axis]);
  return [expand(a, b), expand(b, a), expand(d, c), expand(c, d)];
}

const footprintCache = new WeakMap();
export function riverBankContains(map, x, z) {
  let triangles = footprintCache.get(map);
  if (!triangles) {
    triangles = [];
    for (const channel of map.channels.filter(channel => channel.type === 'river')) {
      const ribbon = channelRibbon(map, channel);
      for (let i = 0; i < ribbon.length; i += 18) {
        const corners = expandedCorners(ribbon, i);
        for (const indices of [[0, 1, 3], [3, 1, 2]]) {
          const points = indices.map(index => corners[index]);
          triangles.push({ points, minX: Math.min(...points.map(p => p[0])), maxX: Math.max(...points.map(p => p[0])),
            minZ: Math.min(...points.map(p => p[2])), maxZ: Math.max(...points.map(p => p[2])) });
        }
      }
    }
    footprintCache.set(map, triangles);
  }
  return triangles.some(({ points: triangle, minX, maxX, minZ, maxZ }) => {
    if (x < minX || x > maxX || z < minZ || z > maxZ) return false;
    const sides = triangle.map((p, i) => {
      const q = triangle[(i + 1) % 3];
      return (q[0] - p[0]) * (z - p[2]) - (q[2] - p[2]) * (x - p[0]);
    });
    return sides.every(side => side >= -1e-9) || sides.every(side => side <= 1e-9);
  });
}

const terrainCache = new WeakMap();
function terrainGrid(map, cells) {
  let cache = terrainCache.get(map);
  if (!cache) terrainCache.set(map, cache = new Map());
  if (!cache.has(cells)) {
    const spacing = map.size / cells;
    cache.set(cells, Array.from({ length: (cells + 1) ** 2 }, (_, index) => {
      const x = index % (cells + 1) * spacing, z = Math.floor(index / (cells + 1)) * spacing;
      return [Math.fround(x), Math.fround(waterBedHeight(map, x, z)), Math.fround(z)];
    }));
  }
  return cache.get(cells);
}

// The river's original ribbon leaves a dry strip in its wider carved bed.
// Extend across that strip, then intersect with the actual uploaded land mesh.
// Keep headwater streams on their existing geometry until their steep banks
// have been reviewed separately. This function never changes the drainage map.
export function renderedRiverSurface(map, channel, cells) {
  const ribbon = channelRibbon(map, channel);
  const grid = terrainGrid(map, cells), stride = cells + 1, spacing = map.size / cells;
  const result = [];
  for (let i = 0; i < ribbon.length; i += 18) {
    const corners = expandedCorners(ribbon, i);
    // Orientation may change at a tight bend; reject degenerate triangles.
    for (const indices of [[0, 1, 3], [3, 1, 2]]) {
      const triangle = indices.map(index => corners[index]);
      const [p, q, r] = triangle;
      const cross = (a, b, c) => (b[0] - a[0]) * (c[2] - a[2]) - (b[2] - a[2]) * (c[0] - a[0]);
      const sign = Math.sign(cross(p, q, r));
      if (!sign) continue;
      const determinant = cross(p, q, r);
      const slopeX = ((q[1] - p[1]) * (r[2] - p[2]) - (r[1] - p[1]) * (q[2] - p[2])) / determinant;
      const slopeZ = ((q[0] - p[0]) * (r[1] - p[1]) - (r[0] - p[0]) * (q[1] - p[1])) / determinant;
      const waterHeight = vertex => p[1] + slopeX * (vertex[0] - p[0]) + slopeZ * (vertex[2] - p[2]);
      const minColumn = Math.max(0, Math.floor(Math.min(...triangle.map(p => p[0])) / spacing));
      const maxColumn = Math.min(cells - 1, Math.floor(Math.max(...triangle.map(p => p[0])) / spacing));
      const minRow = Math.max(0, Math.floor(Math.min(...triangle.map(p => p[2])) / spacing));
      const maxRow = Math.min(cells - 1, Math.floor(Math.max(...triangle.map(p => p[2])) / spacing));
      for (let row = minRow; row <= maxRow; row++) for (let column = minColumn; column <= maxColumn; column++) {
        const index = row * stride + column;
        for (const land of [[grid[index], grid[index + stride], grid[index + 1]],
          [grid[index + 1], grid[index + stride], grid[index + stride + 1]]]) {
          let polygon = land;
          for (let edge = 0; edge < 3; edge++) polygon = clip(polygon,
            vertex => sign * cross(triangle[edge], triangle[(edge + 1) % 3], vertex));
          polygon = clip(polygon, vertex => waterHeight(vertex) - vertex[1]);
          for (let j = 1; j + 1 < polygon.length; j++) {
            if (Math.abs(cross(polygon[0], polygon[j], polygon[j + 1])) < 1e-10) continue;
            for (const vertex of [polygon[0], polygon[j], polygon[j + 1]]) result.push(vertex[0], waterHeight(vertex), vertex[2]);
          }
        }
      }
    }
  }
  return result;
}
