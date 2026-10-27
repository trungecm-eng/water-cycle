import { mapData } from '../map-data.js';
import { generateHeightmap } from './heightmap.js';

// All indices refer to the heightmap vertices, including the board boundary.
export function cellAt(map, x, z) {
  const column = Math.max(0, Math.min(map.cells, Math.round(x / map.spacing)));
  const row = Math.max(0, Math.min(map.cells, Math.round(z / map.spacing)));
  return row * map.stride + column;
}

function neighbors(map, index) {
  const row = Math.floor(index / map.stride);
  const column = index % map.stride;
  const result = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if ((!dx && !dz) || row + dz < 0 || row + dz > map.cells || column + dx < 0 || column + dx > map.cells) continue;
    result.push(index + dz * map.stride + dx);
  }
  return result;
}

function rasterize(map, points) {
  const path = [];
  for (let segment = 1; segment < points.length; segment++) {
    const [x0, z0] = points[segment - 1];
    const [x1, z1] = points[segment];
    const steps = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(z1 - z0)) / map.spacing * 2);
    for (let step = 0; step <= steps; step++) {
      const index = cellAt(map, x0 + (x1 - x0) * step / steps, z0 + (z1 - z0) * step / steps);
      if (path.at(-1) !== index) path.push(index);
    }
  }
  return path;
}

class MinHeap {
  items = [];
  push(entry) {
    let index = this.items.length;
    this.items.push(entry);
    while (index > 0) {
      const parent = (index - 1) >> 1;
      if (this.items[parent][0] <= entry[0]) break;
      this.items[index] = this.items[parent];
      index = parent;
    }
    this.items[index] = entry;
  }
  pop() {
    const first = this.items[0];
    const last = this.items.pop();
    if (this.items.length) {
      let index = 0;
      while (index * 2 + 1 < this.items.length) {
        let child = index * 2 + 1;
        if (child + 1 < this.items.length && this.items[child + 1][0] < this.items[child][0]) child++;
        if (last[0] <= this.items[child][0]) break;
        this.items[index] = this.items[child];
        index = child;
      }
      this.items[index] = last;
    }
    return first;
  }
}

export function generateDrainage(data = mapData) {
  const map = generateHeightmap(data);
  const count = map.heights.length;
  const directions = new Int32Array(count).fill(-1);
  const reservoirs = new Array(count).fill(null);
  const basins = new Array(count).fill(null);
  const fixed = new Uint8Array(count);
  const channels = [];
  const outlets = {};

  for (let index = 0; index < count; index++) {
    const x = index % map.stride * map.spacing;
    const z = Math.floor(index / map.stride) * map.spacing;
    let reservoir = map.regions[index] === 'sea' ? 'sea' : null;
    for (const id of ['lake', 'pond']) {
      const region = data.reservoirs[id];
      if (((x - region.x) / region.radiusX) ** 2 + ((z - region.z) / region.radiusZ) ** 2 <= 1) reservoir = id;
    }
    if (reservoir) {
      reservoirs[index] = basins[index] = reservoir;
      map.regions[index] = reservoir;
      if (reservoir !== 'sea') map.heights[index] = data.reservoirs[reservoir].bottom;
      fixed[index] = 1;
    }
  }

  // Carve downstream first. Upstream beds are always above their receiver.
  function carve(id, type, points, destination) {
    const raw = rasterize(map, points);
    const start = raw.findIndex(index => !reservoirs[index]);
    const path = [];
    for (const index of raw.slice(start)) {
      path.push(index);
      if (reservoirs[index] || fixed[index]) break;
    }
    const end = path.at(-1);
    if (!fixed[end]) throw new Error(`Channel ${id} has no receiving water`);
    for (let step = path.length - 2; step >= 0; step--) {
      const index = path[step];
      const next = path[step + 1];
      directions[index] = next;
      map.heights[index] = type === 'stream'
        ? map.heights[index] - data.drainage.channelDepth
        : Math.min(map.heights[index], map.heights[next] + data.drainage.channelRise);
      // A low downstream bed can never force a channel to climb.
      map.heights[index] = Math.max(map.heights[index], map.heights[next] + data.drainage.minimumRise);
      map.regions[index] = type;
      fixed[index] = 1;
    }
    channels.push({ id, type, destination, path });
    return path;
  }
  const river = carve('river', 'river', data.river.points, 'sea');
  outlets.lake = river[0];
  outlets.pond = carve('pond-overflow', 'plain', data.drainage.pondOverflow, 'sea')[0];
  for (const stream of data.streams) carve(stream.id, 'stream', stream.points, stream.destination);

  // Priority-flood starts at every receiver and carved channel. A newly visited
  // cell gets a strictly lower parent, even where the original terrain had pits.
  const heap = new MinHeap();
  for (let index = 0; index < count; index++) if (fixed[index]) heap.push([map.heights[index], index]);
  while (heap.items.length) {
    const [, index] = heap.pop();
    for (const adjacent of neighbors(map, index)) {
      if (fixed[adjacent]) continue;
      fixed[adjacent] = 1;
      map.heights[adjacent] = Math.max(map.heights[adjacent], map.heights[index] + data.drainage.minimumRise);
      directions[adjacent] = index;
      heap.push([map.heights[adjacent], adjacent]);
    }
  }

  for (let index = 0; index < count; index++) {
    const trail = [];
    let cursor = index;
    while (!basins[cursor]) {
      trail.push(cursor);
      cursor = directions[cursor];
      if (cursor < 0 || trail.length > count) throw new Error('Invalid drainage graph');
    }
    for (const cell of trail) basins[cell] = basins[cursor];
  }
  return { ...map, directions, reservoirs, basins, channels, outlets };
}
