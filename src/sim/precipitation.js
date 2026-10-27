import { config } from '../config.js';
import { mapData } from '../map-data.js';
import { cellAt } from './drainage.js';
import { heightAt } from './heightmap.js';
import { findClusters } from './clusters.js';

export function rainTemperatureFactor(temperature) {
  return Math.max(1, Math.min(config.cloud.coldRainFactor,
    1 + (config.cloud.coldRainFactor - 1) * (config.heat.condenseTemp - temperature) / config.heat.condenseTemp));
}

export function releaseRain(particles, rng) {
  const byId = new Map(particles.map(particle => [particle.id, particle]));
  const probability = config.cloud.rainRate * config.clock.dt;
  for (const cluster of findClusters(particles)) {
    if (!cluster.raining) continue;
    for (const id of cluster.ids) {
      if (rng() >= probability * rainTemperatureFactor(byId.get(id).temperature)) continue;
      Object.assign(byId.get(id), { state: 'rain', vx: 0, vy: 0, vz: 0, raining: false });
    }
  }
}

// Runoff advances between drainage vertices. Time credit preserves the travel
// time even when several short edges are crossed in one fixed simulation step.
export function movePrecipitation(particle, reservoirs, events) {
  const map = reservoirs.map;
  const dt = config.clock.dt;
  if (particle.state === 'rain') {
    const cell = cellAt(map, particle.x, particle.z);
    const id = map.reservoirs[cell];
    const ground = heightAt(map, particle.x, particle.z);
    const surface = id ? Math.max(ground, reservoirs.level(id)) : ground;
    particle.vx = particle.vz = 0;
    particle.vy = Math.max(-config.motion.rainMaxSpeed,
      particle.vy - config.motion.gravity * dt);
    particle.y = Math.max(surface, particle.y + particle.vy * dt);
    if (particle.y > surface) return;
    if (events) {
      const region = id || (cell % map.stride * map.spacing < mapData.mountainEdge ? 'mountain' : 'plain');
      events.rainLandings[region]++;
    }
    if (id) {
      reservoirs.add(particle, id);
      if (events) events.returns++;
    } else {
      Object.assign(particle, { state: 'runoff', cell, travelCredit: 0, vy: 0,
        x: cell % map.stride * map.spacing, z: Math.floor(cell / map.stride) * map.spacing,
        y: map.heights[cell] });
    }
    return;
  }
  if (particle.state !== 'runoff') return;
  particle.travelCredit = (particle.travelCredit || 0) + dt;
  while (particle.state === 'runoff') {
    const cell = particle.cell;
    const next = map.directions[cell];
    if (map.reservoirs[cell]) {
      reservoirs.add(particle, map.reservoirs[cell]);
      if (events) events.returns++;
      break;
    }
    const distance = map.spacing * Math.hypot(next % map.stride - cell % map.stride,
      Math.floor(next / map.stride) - Math.floor(cell / map.stride));
    const slope = (map.heights[cell] - map.heights[next]) / distance;
    const duration = distance / Math.max(config.motion.runoffMinSpeed, config.motion.runoffSlopeSpeed * slope);
    if (particle.travelCredit < duration) break;
    particle.travelCredit -= duration;
    const id = map.reservoirs[next];
    if (id) {
      if (events) {
        if (id === 'lake' && map.regions[cell] === 'stream') events.streamToLake++;
        if (id === 'sea' && map.regions[cell] === 'river') events.riverToSea++;
        events.returns++;
      }
      reservoirs.add(particle, id);
    } else {
      Object.assign(particle, { cell: next, x: next % map.stride * map.spacing,
        z: Math.floor(next / map.stride) * map.spacing, y: map.heights[next], vx: 0, vy: 0, vz: 0 });
    }
  }
}
