import { heightAt } from '../sim/heightmap.js';
import { mapData } from '../map-data.js';

// Clip terrain triangles at the water plane: every shoreline vertex is an
// intersection with the existing basin, rather than an exposed vertical wall.
export function basinSurface(map, id, level, data = mapData) {
  const region = data.reservoirs[id];
  const bounds = id === 'sea' ? [map.size / 2, map.size, 0, map.size]
    : [region.x - region.radiusX - map.spacing, region.x + region.radiusX + map.spacing,
      region.z - region.radiusZ - map.spacing, region.z + region.radiusZ + map.spacing];
  const positions = [];
  function bedAt(x,z) {
    const bed = heightAt(map,x,z);
    if (id === 'sea') return bed;
    const dx=(x-region.x)/region.radiusX, dz=(z-region.z)/region.radiusZ;
    const angle=Math.atan2(dz,dx);
    const rim=1+0.045*Math.sin(angle*5+data.seed)+0.035*Math.cos(angle*3);
    return Math.max(bed,level+(Math.hypot(dx,dz)-rim)*20);
  }
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
  channelCache.set(channel,points);
  return points;
}

export function channelRibbon(map, channel) {
  const positions = [];
  const path = channelPoints(map,channel);
  const edges = path.map(([x,y,z], i) => {
    const a = path[Math.max(0,i-1)], b = path[Math.min(path.length-1,i+1)];
    const length = Math.hypot(b[0]-a[0],b[2]-a[2]) || 1;
    const width = (channel.type === 'river' ? 4 : 2.5) + i / Math.max(1,path.length-1) * 2;
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

// The connector cuts only the visible bed; World and its drainage stay intact.
export function waterBedHeight(map, x, z, data = mapData) {
  const lake = data.reservoirs.lake, end = map.outlets.lake;
  const ex = end % map.stride * map.spacing, ez = Math.floor(end / map.stride) * map.spacing;
  const dx = ex-lake.x, dz = ez-lake.z;
  const t = Math.max(0,Math.min(1,((x-lake.x)*dx+(z-lake.z)*dz)/(dx*dx+dz*dz)));
  const distance = Math.hypot(x-lake.x-dx*t,z-lake.z-dz*t);
  let height = heightAt(map,x,z);
  if (distance < 14) height = Math.min(height,lake.bottom*(1-t)+map.heights[end]*t-3);
  for (const channel of map.channels.filter(c => ['river','stream'].includes(c.type))) {
    const points = channelPoints(map,channel);
    for (let i=1;i<points.length;i++) {
      const a=points[i-1], b=points[i];
      if (x < Math.min(a[0],b[0])-18 || x > Math.max(a[0],b[0])+18 || z < Math.min(a[2],b[2])-18 || z > Math.max(a[2],b[2])+18) continue;
      const dx=b[0]-a[0], dz=b[2]-a[2];
      const t=Math.max(0,Math.min(1,((x-a[0])*dx+(z-a[2])*dz)/(dx*dx+dz*dz || 1)));
      const distance=Math.hypot(x-a[0]-dx*t,z-a[2]-dz*t);
      if(distance < 18) height=Math.min(height,a[1]*(1-t)+b[1]*t-4+Math.max(0,distance-9)*0.6);
    }
  }
  return height;
}
