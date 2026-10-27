import { config } from '../config.js';

import { content } from '../content.js';

export const stateLabels = content.states;
const stages = content.stages;

export function activeStages(counts) {
  return Object.entries(stages).filter(([state]) => counts[state] > 0).map(([, label]) => label);
}

export function createHud(root) {
  const legend = root.querySelector('#legend');
  for (const [state, label] of Object.entries(stateLabels)) {
    const item = root.createElement('li');
    const swatch = root.createElement('span');
    swatch.className = `swatch ${state}`;
    swatch.style.backgroundColor = config.colors[state];
    item.append(swatch, `${label} (${state})`);
    legend.append(item);
  }
  const fields = Object.fromEntries([...root.querySelectorAll('[data-hud]')].map(element => [element.dataset.hud, element]));
  return (world, clock) => {
    const counts = { water: 0, vapor: 0, cloud: 0, rain: 0, runoff: 0 };
    for (const particle of world.particles) counts[particle.state]++;
    const values = {
      time: `${world.time.toFixed(1)} ${content.seconds}`, speed: `×${String(clock.speed).replace('.', ',')}`,
      status: clock.paused ? content.pause : content.running,
      level: `${world.reservoirs.level('lake').toFixed(1)} ${content.units}`, returns: world.returns,
      sun: world.sun, wind: world.wind, ...counts,
      stages: activeStages(counts).join(' · ') || content.idle,
      empty: world.reservoirs.count('pond') === 0 ? content.emptyPond : ''
    };
    for (const [key, element] of Object.entries(fields)) {
      const text = String(values[key]);
      if (element.textContent !== text) element.textContent = text;
    }
  };
}
