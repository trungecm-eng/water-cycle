import { config } from '../config.js';

export const stageColors = Object.freeze(Object.fromEntries(['vapor', 'cloud', 'rain', 'runoff'].map(id => [id, config.colors[`stage${id[0].toUpperCase()}${id.slice(1)}`]])));

// This observer owns its history and never changes World or consumes its RNG.
export class StageLabels {
  constructor() { this.reset(); }
  reset() { this.history = []; this.labels = {}; this.lastTime = -1; this.particles = null; }
  sample(world) {
    if (this.particles !== world.particles || world.time < this.lastTime) this.reset();
    this.particles = world.particles;
    if (world.time === this.lastTime) return;
    const runoff = {};
    for (const particle of world.particles) if (particle.state === 'runoff') {
      const index = Math.round(particle.z / world.map.spacing) * world.map.stride + Math.round(particle.x / world.map.spacing);
      const channel = world.map.channels.find(channel => channel.path.includes(index));
      if (channel) {
        const entry = runoff[channel.id] ??= { score: 0, position: [0, 0, 0] };
        entry.score++;
        entry.position[0] += particle.x; entry.position[1] += particle.y; entry.position[2] += particle.z;
      }
    }
    for (const entry of Object.values(runoff)) entry.position = entry.position.map(value => value / entry.score);
    const previous = this.history.at(-1);
    const evaporation = Object.fromEntries(Object.entries(world.evaporationsByReservoir).map(([id, count]) => [id, Math.max(0, count - (previous?.totals[id] ?? count))]));
    this.history.push({ time: world.time, totals: { ...world.evaporationsByReservoir }, evaporation, runoff });
    this.lastTime = world.time;
    while (this.history.length && this.history[0].time <= world.time - 10) this.history.shift();
  }
  candidates(world) {
    const vapor = {}, runoff = {};
    for (const frame of this.history) {
      for (const [id, count] of Object.entries(frame.evaporation)) vapor[id] = (vapor[id] ?? 0) + count;
      for (const [id, entry] of Object.entries(frame.runoff)) {
        const total = runoff[id] ??= { id, score: 0, position: [0, 0, 0] };
        total.score += entry.score;
        total.position = total.position.map((value, axis) => value + entry.position[axis] * entry.score);
      }
    }
    const evaporation = Object.entries(vapor).filter(([, score]) => score > 0 && world.sun > 0).map(([id, score]) => {
      const data = world.reservoirs.data.reservoirs[id];
      return { id, score, position: [data.x ?? 880, world.reservoirs.level(id) + 65, data.z ?? 650] };
    });
    const clouds = { cloud: [], rain: [] };
    const particles = new Map(world.particles.map(particle => [particle.id, particle]));
    for (const cluster of world.clusters) {
      if (cluster.size < config.cloud.cloudMinSize) continue;
      const members = cluster.ids.map(id => particles.get(id)).filter(Boolean);
      if (!members.length) continue;
      const position = ['x', 'y', 'z'].map(axis => members.reduce((sum, particle) => sum + particle[axis], 0) / members.length);
      position[1] += cluster.raining ? 25 : 45;
      clouds[cluster.raining ? 'rain' : 'cloud'].push({ id: `cluster-${Math.min(...cluster.ids)}`, ids: cluster.ids, score: cluster.size, position });
    }
    const flows = Object.values(runoff).map(entry => ({ ...entry,
      position: entry.position.map((value, axis) => value / entry.score + (axis === 1 ? 30 : 0)) }));
    return { vapor: evaporation, ...clouds, runoff: flows };
  }
  update(world, seconds) {
    const candidates = this.candidates(world);
    const dt = Math.max(0, Math.min(seconds, 0.1));
    for (const [stage, options] of Object.entries(candidates)) {
      const label = this.labels[stage] ??= { id: null, position: null, opacity: 0, visible: false };
      // Cluster identities follow overlapping membership, even when the first drop rains out.
      let current = options.find(option => option.id === label.id);
      if (!current && label.ids) current = options.find(option => option.ids?.some(id => label.ids.includes(id)));
      const best = [...options].sort((a, b) => b.score - a.score)[0];
      const cloud = stage === 'cloud' || stage === 'rain';
      const chosen = !current || (best && (cloud ? best.score >= current.score * 1.2 : best.score >= current.score + 3)) ? best : current;
      if (!chosen) {
        label.visible = false;
        label.opacity = Math.max(0, label.opacity - dt / 0.4);
        label.id = null; label.ids = null;
        continue;
      }
      label.id = chosen.id; label.ids = chosen.ids;
      if (!label.position) label.position = [...chosen.position];
      else {
        const delta = chosen.position.map((value, axis) => (value - label.position[axis]) * (1 - Math.exp(-dt * 5)));
        const scale = Math.min(1, config.art.labelMaxStep / (Math.hypot(...delta) || 1));
        label.position = label.position.map((value, axis) => value + delta[axis] * scale);
      }
      // Do not show an activity chip traversing empty sky after its cloud
      // disappears or the leading cluster changes to a distant competitor.
      // Keep the bounded movement, but fade in only near the live anchor.
      const distance = Math.hypot(...chosen.position.map((value, axis) => value - label.position[axis]));
      label.visible = distance <= config.art.labelAnchorDistance;
      label.opacity = Math.max(0, Math.min(1, label.opacity + (label.visible ? 1 : -1) * dt / 0.4));
    }
    return this.snapshot();
  }
  snapshot() { return Object.fromEntries(Object.entries(this.labels).map(([id, label]) => [id, { target: label.id, position: label.position && [...label.position], visible: label.visible, opacity: label.opacity }])); }
}
