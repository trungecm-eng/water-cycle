import { config } from '../config.js';
import { mapData } from '../map-data.js';
import { heightAt } from './heightmap.js';

export class Reservoirs {
  constructor(particles, map, data = mapData) {
    this.map = map;
    this.data = data;
    this.members = Object.fromEntries(Object.keys(data.reservoirs).map(id => [id, new Set()]));
    this.surfaces = Object.fromEntries(Object.keys(this.members).map(id => [id, { area: 0, cells: [] }]));
    for (let index = 0; index < map.reservoirs.length; index++) {
      const id = map.reservoirs[index];
      if (!id) continue;
      const x = index % map.stride * map.spacing;
      const z = Math.floor(index / map.stride) * map.spacing;
      const half = map.spacing / 2;
      const bounds = { left: Math.max(0, x - half), right: Math.min(map.size, x + half),
        near: Math.max(0, z - half), far: Math.min(map.size, z + half), x, z };
      const surface = this.surfaces[id];
      surface.area += (bounds.right - bounds.left) * (bounds.far - bounds.near);
      surface.cells.push({ ...bounds, cumulativeArea: surface.area });
    }
    this.capacities = {};
    const scale = particles.length / config.defaults.n;
    for (const [id, region] of Object.entries(data.reservoirs)) {
      this.capacities[id] = region.capacity === null ? null : Math.round(region.capacity * scale);
    }
    const lakeCount = Math.round(data.reservoirs.lake.initial * scale);
    const pondCount = Math.round(data.reservoirs.pond.initial * scale);
    particles.forEach((particle, index) => this.add(particle,
      index < lakeCount ? 'lake' : index < lakeCount + pondCount ? 'pond' : 'sea'));
  }

  surfacePoint(id, rng) {
    const surface = this.surfaces[id];
    const area = rng() * surface.area;
    let low = 0, high = surface.cells.length - 1;
    while (low < high) {
      const middle = (low + high) >> 1;
      if (surface.cells[middle].cumulativeArea > area) high = middle;
      else low = middle + 1;
    }
    const cell = surface.cells[low];
    const y = this.level(id);
    // Shore vertices can interpolate above the water plane. Keep newborn vapor
    // on the visible water rather than underneath a bank triangle.
    for (let attempt = 0; attempt < config.evaporation.sampleAttempts; attempt++) {
      const x = cell.left + rng() * (cell.right - cell.left);
      const z = cell.near + rng() * (cell.far - cell.near);
      if (heightAt(this.map, x, z) <= y) return { x, y, z };
    }
    return { x: cell.x, y, z: cell.z };
  }

  count(id) { return this.members[id].size; }
  level(id) {
    const region = this.data.reservoirs[id];
    return id === 'sea' ? region.level : region.bottom + this.count(id) * region.levelPerParticle;
  }
  remove(particle) {
    if (!this.members[particle.reservoir]?.delete(particle)) return false;
    particle.reservoir = null;
    return true;
  }
  add(particle, id) {
    if (!this.members[id]) throw new RangeError('Unknown reservoir');
    if (Object.values(this.members).some(members => members.has(particle))) throw new Error('Particle already stored');
    this.members[id].add(particle);
    Object.assign(particle, { state: 'water', reservoir: id, temperature: config.heat.baseline,
      vx: 0, vy: 0, vz: 0, raining: false });
    // Stored water is represented by the surface, never individual coordinates.
    delete particle.x;
    delete particle.y;
    delete particle.z;
    delete particle.cell;
    delete particle.travelCredit;
  }
  overflow() {
    const released = [];
    for (const id of ['lake', 'pond']) {
      while (this.count(id) > this.capacities[id]) {
        const particle = this.members[id].values().next().value;
        this.remove(particle);
        const cell = this.map.outlets[id];
        Object.assign(particle, { state: 'runoff', cell, x: cell % this.map.stride * this.map.spacing,
          z: Math.floor(cell / this.map.stride) * this.map.spacing, y: this.map.heights[cell] });
        released.push(particle);
      }
    }
    return released;
  }
  snapshot() {
    return Object.fromEntries(Object.keys(this.members).map(id => [id, {
      count: this.count(id), capacity: this.capacities[id], level: this.level(id),
      ...(id === 'pond' ? { dry: this.count(id) === 0 } : {})
    }]));
  }
}
