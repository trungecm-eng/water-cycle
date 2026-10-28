import { stageColors } from '../art/stage-labels.js';
import { config } from '../config.js';
import { content } from '../content.js';
import { RainTally } from '../stats/rain-tally.js';
import { LevelTrend } from '../stats/level-trend.js';
import { waterDistribution } from '../stats/water-distribution.js';

const number = value => value.toLocaleString('vi-VN', { maximumFractionDigits: 1 });

export function createStatistics(root, world) {
  const tally = new RainTally(world);
  const trends = { lake: new LevelTrend(), pond: new LevelTrend() };
  let particles = world.particles;
  let levels;
  function sample() {
    if (particles !== world.particles) {
      particles = world.particles;
      for (const trend of Object.values(trends)) trend.reset();
    }
    levels = Object.fromEntries(Object.entries(trends).map(([id, trend]) => [id,
      trend.update(world.time, world.reservoirs.count(id), world.reservoirs.level(id))]));
  }
  const colors = { ...config.colors, airborne: config.colors.cloudDark };
  const rows = (selector, labels) => Object.fromEntries(Object.entries(labels).map(([id, label]) => {
    const row = root.createElement('div');
    const term = root.createElement('dt');
    const value = root.createElement('dd');
    const swatch = root.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = colors[id] ?? config.colors.summit;
    term.append(swatch, label);
    row.append(term, value);
    root.querySelector(selector).append(row);
    return [id, value];
  }));
  const distributionRows = rows('#water-distribution', content.distribution);
  const rainRows = rows('#rain-tally', Object.fromEntries(['mountain', 'plain', 'sea', 'lake', 'pond'].map(id => [id, content.regions[id]])));
  const bars = Object.fromEntries(Object.keys(content.distribution).map(id => {
    const bar = root.createElement('span');
    bar.style.backgroundColor = colors[id];
    root.querySelector('#water-bar').append(bar);
    return [id, bar];
  }));
  const gauges = Object.fromEntries(['lake', 'pond'].map(id => {
    const row = root.createElement('div');
    row.className = 'reservoir-row';
    const gauge = root.createElement('div');
    gauge.className = 'level-gauge';
    const fill = root.createElement('span');
    const marker = root.createElement('i');
    marker.title = content.initialLevel;
    gauge.append(fill, marker);
    const text = root.createElement('span');
    row.append(gauge, text);
    root.querySelector('#reservoir-levels').append(row);
    return [id, { fill, marker, text }];
  }));
  const stages = Object.fromEntries(Object.entries(content.stages).map(([id, label]) => {
    const item = root.createElement('li');
    const swatch = root.createElement('span');
    swatch.className = 'swatch';
    swatch.style.backgroundColor = stageColors[id];
    item.append(swatch, label);
    root.querySelector('#active-stages').append(item);
    return [id, item];
  }));
  root.querySelector('#clear-rain').addEventListener('click', () => { tally.clear(world); render(); });
  function snapshot() {
    const freeze = value => Object.freeze({ ...value, counts: Object.freeze(value.counts), percentages: Object.freeze(value.percentages) });
    return { rainTally: freeze(tally.read(world)), waterDistribution: freeze(waterDistribution(world)) };
  }
  function render() {
    sample();
    const data = snapshot();
    for (const [id, element] of Object.entries(distributionRows)) {
      element.textContent = `${data.waterDistribution.counts[id]} · ${data.waterDistribution.percentages[id]}%`;
      bars[id].style.width = `${data.waterDistribution.percentages[id]}%`;
    }
    for (const [id, element] of Object.entries(rainRows)) element.textContent = `${data.rainTally.counts[id]} · ${data.rainTally.percentages[id]}%`;
    for (const [id, gauge] of Object.entries(gauges)) {
      const value = levels[id];
      const region = world.reservoirs.data.reservoirs[id];
      const maximum = region.capacity * world.particles.length / config.defaults.n * region.levelPerParticle;
      const percent = level => Math.max(0, Math.min(100, (level - region.bottom) / maximum * 100));
      gauge.fill.style.height = `${percent(value.level)}%`;
      gauge.marker.style.bottom = `${percent(value.initialLevel)}%`;
      gauge.text.textContent = `${content.regions[id]}: ${number(value.level)} ${content.units} ${value.direction === 'up' ? '↑' : value.direction === 'down' ? '↓' : ''} · ${content.initialLevel}: ${number(value.initialLevel)}${id === 'pond' && value.dry ? ` · ${content.emptyPond}` : ''}`;
    }
    for (const [id, element] of Object.entries(stages)) element.classList.toggle('active', world.particles.some(particle => particle.state === id));
  }
  sample();
  return { sample, render, snapshot };
}
