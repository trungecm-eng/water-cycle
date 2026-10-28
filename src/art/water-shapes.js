import { heightAt } from '../sim/heightmap.js';
import { mapData } from '../map-data.js';
import { config } from '../config.js';

// Clip terrain triangles at the water plane: every shoreline vertex is an
// intersection with the existing basin, rather than an exposed vertical wall.
export function basinSurface(map, id, level, data = mapData) {
  const region = data.reservoirs[id];
  const bounds = id === 'sea' ? [map.size / 2, map.size, 0, map.size]
    : [region.x - region.radiusX * 1.25 - map.spacing, region.x + region.radiusX * 1.25 + map.spacing,
      region.z - region.radiusZ * 1.25 - map.spacing, region.z + region.radiusZ * 1.25 + map.spacing];
  const positions = [];
  const bedAt = id === 'sea' ? (x, z) => heightAt(map, x, z)
    : (x, z) => reservoirBowl(data.reservoirs[id], x, z, data.seed).height;
  const step = map.spacing / 2;
  function clip(vertices) {
    const result = [];
    for (let i = 0; i < vertices.length; i++) {
      const a = vertices[i], b = vertices[(i + 1) % vertices.length];
      if (a[1] <= level) result.push(a);
      if ((a[1] <= level) !== (b[1] <= level)) {
        let low = 0, high = 1;
        for (let step = 0; step < 30; step++) {
          const t = (low + high) / 2;
          const wet = bedAt(a[0]+t*(b[0]-a[0]),a[2]+t*(b[2]-a[2])) <= level;
          if (wet === (a[1] <= level)) low = t; else high = t;
        }
        const t = a[1] <= level ? low : high;
        result.push([a[0] + t * (b[0] - a[0]), level, a[2] + t * (b[2] - a[2])]);
      }
    }
    for (let i = 1; i + 1 < result.length; i++) {
      for (const p of [result[0], result[i], result[i + 1]]) positions.push(p[0], level, p[2]);
    }
  }
  for (let z = bounds[2]; z < bounds[3]; z += step) for (let x = bounds[0]; x < bounds[1]; x += step) {
    const right = Math.min(x + step, bounds[1]), far = Math.min(z + step, bounds[3]);
    const points = [[x,z], [x,far], [right,z], [right,far]].map(([px,pz]) => [px,bedAt(px,pz),pz]);
    clip([points[0],points[1],points[2]]);
    clip([points[2],points[1],points[3]]);
  }
  return positions;
}

// Clip against the same grid, triangle split and Float32 land vertices that
// render.js uploads. Analytic bowl intersections can hover above the coarser
// land mesh, especially where the outlet has carved through the reservoir rim.
const basinMeshCache = new WeakMap();
export function renderedBasinSurface(map, id, level, cells, data = mapData) {
  let cache = basinMeshCache.get(map);
  if (!cache) basinMeshCache.set(map, cache = new Map());
  const key = `${id}:${cells}`;
  let entry = cache.get(key);
  if (!entry || entry.data !== data) {
    const region = data.reservoirs[id], spacing = map.size / cells;
    const startX = Math.max(0, Math.floor((region.x - region.radiusX * 1.25 - map.spacing) / spacing));
    const endX = Math.min(cells, Math.ceil((region.x + region.radiusX * 1.25 + map.spacing) / spacing));
    const startZ = Math.max(0, Math.floor((region.z - region.radiusZ * 1.25 - map.spacing) / spacing));
    const endZ = Math.min(cells, Math.ceil((region.z + region.radiusZ * 1.25 + map.spacing) / spacing));
    const vertex = (column, row) => {
      const x = column * spacing, z = row * spacing;
      return [Math.fround(x), Math.fround(waterBedHeight(map, x, z, data)), Math.fround(z)];
    };
    const triangles = [];
    for (let row = startZ; row < endZ; row++) for (let column = startX; column < endX; column++) {
      const a = vertex(column, row), b = vertex(column, row + 1);
      const c = vertex(column + 1, row), d = vertex(column + 1, row + 1);
      triangles.push([a, b, c], [c, b, d]);
    }
    cache.set(key, entry = { data, triangles });
  }
  const positions = [];
  for (const triangle of entry.triangles) {
    const polygon = [];
    for (let i = 0; i < 3; i++) {
      const a = triangle[i], b = triangle[(i + 1) % 3];
      if (a[1] <= level) polygon.push([a[0], level, a[2]]);
      if ((a[1] <= level) !== (b[1] <= level)) {
        const t = (level - a[1]) / (b[1] - a[1]);
        polygon.push([a[0] + t * (b[0] - a[0]), level, a[2] + t * (b[2] - a[2])]);
      }
    }
    for (let i = 1; i + 1 < polygon.length; i++) positions.push(...polygon[0], ...polygon[i], ...polygon[i + 1]);
  }
  return positions;
}

// One fixed bowl serves both the land mesh and the moving water plane. Its
// shoreline therefore changes with the reservoir level rather than with a
// separate, level-dependent ellipse. Blend back to the map outside the rim.
function reservoirBowl(region, x, z, seed) {
  const dx = (x - region.x) / region.radiusX, dz = (z - region.z) / region.radiusZ;
  const angle = Math.atan2(dz, dx);
  const rim = 1 + 0.045 * Math.sin(angle * 5 + seed) + 0.035 * Math.cos(angle * 3);
  const radius = Math.hypot(dx, dz) / rim;
  const fullLevel = region.bottom + region.capacity * region.levelPerParticle;
  // Keep only a small freeboard above the maximum water level so the
  // reservoir reads as a recess rather than a raised embankment.
  // Continue at rim height outside the bowl; extrapolating the parabola
  // before blending creates a raised mound around otherwise low terrain.
  // A small flat floor keeps the shallow pond represented on the low grid.
  return { radius, height: region.bottom + (fullLevel + 0.5 - region.bottom) * (Math.max(0, Math.min(radius, 1) - 0.2) / 0.8) ** 2 };
}

export function reservoirBedHeight(map, id, x, z, data = mapData) {
  const bowl = reservoirBowl(data.reservoirs[id], x, z, data.seed);
  const original = heightAt(map, x, z);
  if (bowl.radius >= 1.65) return original;
  const t = Math.max(0, Math.min(1, (bowl.radius - 1.1) / 0.55));
  const blend = t * t * (3 - 2 * t);
  return bowl.height * (1 - blend) + original * blend;
}

const channelCache = new WeakMap();
function channelPoints(map, channel) {
  let cached = channelCache.get(channel);
  if (cached) return cached;
  let points = channel.path.map(index => [index % map.stride * map.spacing,
    map.heights[index] + 0.35, Math.floor(index / map.stride) * map.spacing]);
  // Corner cutting preserves endpoints and rounds grid stair steps.
  for (let pass = 0; pass < 2; pass++) {
    const rounded = [points[0]];
    for (let i=1;i<points.length;i++) {
      for (const t of [0.25,0.75]) rounded.push(points[i-1].map((v,j) => v*(1-t)+points[i][j]*t));
    }
    rounded.push(points.at(-1));
    points = rounded;
  }
  // Corner cutting changes horizontal coordinates. Interpolated endpoint
  // heights can bridge a valley, so cap the rounded centerline at its local
  // terrain before carving the matching visible bed.
  points = points.map(([x, y, z]) => {
    let ceiling = heightAt(map, x, z);
    // Bilinear sampling can sit above a triangle across a steep saddle.
    // Use every supported grid so the route stays identical on quality changes.
    if (channel.type === 'stream') for (const { terrainCells: cells } of Object.values(config.quality.levels)) {
      const spacing = map.size / cells;
      const column = Math.min(cells - 1, Math.floor(x / spacing));
      const row = Math.min(cells - 1, Math.floor(z / spacing));
      const u = x / spacing - column, v = z / spacing - row;
      const h = (dx, dz) => heightAt(map, (column + dx) * spacing, (row + dz) * spacing);
      const ground = u + v <= 1 ? h(0, 0) * (1-u-v) + h(1, 0) * u + h(0, 1) * v
        : h(1, 1) * (u+v-1) + h(0, 1) * (1-u) + h(1, 0) * (1-v);
      ceiling = Math.min(ceiling, ground);
    }
    return [x, Math.min(y, ceiling + 0.35), z];
  });
  // A local cap can introduce a dip; carry it downstream to avoid uphill water.
  for (let i = 1; i < points.length; i++) points[i][1] = Math.min(points[i][1], points[i - 1][1]);
  channelCache.set(channel,points);
  return points;
}

export function channelRibbon(map, channel) {
  const positions = [];
  const path = channelPoints(map,channel);
  let sourceDistance = 0;
  const edges = path.map(([x,y,z], i) => {
    if (i > 0) sourceDistance += Math.hypot(x - path[i - 1][0], z - path[i - 1][2]);
    const a = path[Math.max(0,i-1)], b = path[Math.min(path.length-1,i+1)];
    const length = Math.hypot(b[0]-a[0],b[2]-a[2]) || 1;
    const progress = i / Math.max(1, path.length - 1);
    // A spring begins at a point, then opens over forty world units.
    // Use distance rather than sample count so smoothing density cannot
    // change the physical length of the tapered headwater.
    const sourceTaper = channel.type === 'stream' ? Math.min(1, sourceDistance / 40) : 1;
    const width = ((channel.type === 'river' ? 4 : 2.5) + progress * 2) * sourceTaper;
    return [-1,1].map(side => [x-(b[2]-a[2])/length*width*side,y,z+(b[0]-a[0])/length*width*side]);
  });
  for (let i=1;i<edges.length;i++) for (const p of [edges[i-1][0],edges[i-1][1],edges[i][0],edges[i][0],edges[i-1][1],edges[i][1]]) positions.push(...p);
  return positions;
}

export function lakeConnection(map, level, data = mapData) {
  const lake = data.reservoirs.lake;
  const end = map.outlets.lake;
  const x = end % map.stride * map.spacing, z = Math.floor(end / map.stride) * map.spacing;
  const positions = [];
  for (let i=0;i<24;i++) {
    const pair = [i/24,(i+1)/24].map(t => {
      const px = lake.x + (x-lake.x)*t, pz = lake.z + (z-lake.z)*t;
      const y = level*(1-t) + (map.heights[end]+0.35)*t;
      return [[px,y,pz-3],[px,y,pz+3]];
    });
    for (const p of [pair[0][0],pair[0][1],pair[1][0],pair[1][0],pair[0][1],pair[1][1]]) positions.push(...p);
  }
  return positions;
}

// Blend the carved bed back into the existing terrain with zero slope at both
// ends. A hard distance cutoff leaves a vertical lip along the whole channel.
const bankInnerRadius = 9;
const bankOuterRadius = 34;
function recessedBank(height, bed, distance) {
  if (distance >= bankOuterRadius) return height;
  const t = Math.max(0, (distance - bankInnerRadius) / (bankOuterRadius - bankInnerRadius));
  const blend = t * t * (3 - 2 * t);
  return height + (Math.min(height, bed) - height) * (1 - blend);
}

export function basinTerrainHeight(map, x, z, data = mapData) {
  let height = heightAt(map,x,z);
  for (const id of ['lake', 'pond']) {
    const region = data.reservoirs[id];
    if (Math.hypot((x-region.x)/region.radiusX, (z-region.z)/region.radiusZ) < 1.8) {
      height = reservoirBedHeight(map, id, x, z, data);
    }
  }
  return height;
}

// The connector cuts only the visible bed; World and its drainage stay intact.
export function waterBedHeight(map, x, z, data = mapData) {
  const lake = data.reservoirs.lake, end = map.outlets.lake;
  const ex = end % map.stride * map.spacing, ez = Math.floor(end / map.stride) * map.spacing;
  const dx = ex-lake.x, dz = ez-lake.z;
  const t = Math.max(0,Math.min(1,((x-lake.x)*dx+(z-lake.z)*dz)/(dx*dx+dz*dz)));
  const distance = Math.hypot(x-lake.x-dx*t,z-lake.z-dz*t);
  const originalHeight = basinTerrainHeight(map, x, z, data);
  let height = recessedBank(originalHeight, lake.bottom*(1-t)+map.heights[end]*t-3, distance);
  for (const channel of map.channels.filter(c => ['river','stream'].includes(c.type))) {
    const points = channelPoints(map,channel);
    for (let i=1;i<points.length;i++) {
      const a=points[i-1], b=points[i];
      if (x < Math.min(a[0],b[0])-bankOuterRadius || x > Math.max(a[0],b[0])+bankOuterRadius || z < Math.min(a[2],b[2])-bankOuterRadius || z > Math.max(a[2],b[2])+bankOuterRadius) continue;
      const dx=b[0]-a[0], dz=b[2]-a[2];
      const projection=((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz || 1);
      const t=Math.max(0,Math.min(1,projection));
      const distance=Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);
      // Lowering the route to a coarse terrain triangle can create a steeper
      // bank. Add seven percent of that lowering to the bed clearance locally;
      // a uniform deeper bed would widen gaps along the entire river network.
      const routeLowering = Math.max(0, heightAt(map, a[0], a[2]) + 0.35 - a[1]);
      const depth = channel.type === 'river' ? 1 : 3.7 + 0.07 * routeLowering;
      // Raise the outer stream bank gradually so low downstream segments
      // do not cut a flat trench across the neighboring upstream slope.
      // Keep clearance within nine units for the coarser rendering grid.
      const bankRise = channel.type === 'stream' ? Math.max(0, distance - 9) * 1.5 : 0;
      // Extend the river slope upstream of each segment instead of carving
      // its lower endpoint height into the preceding bank. Streams need a
      // separate coarse-grid treatment before applying the same correction.
      const upstreamRise = channel.type === 'river' ? Math.max(0, -projection) * (a[1] - b[1]) : 0;
      height = Math.min(height, recessedBank(originalHeight, a[1]*(1-t)+b[1]*t-depth+bankRise+upstreamRise, distance));
    }
  }
  return height;
}
