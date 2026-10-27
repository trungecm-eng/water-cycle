import { config } from '../config.js';

export const stateLabels = {
  water: 'Nước trong vùng chứa', vapor: 'Hơi nước', cloud: 'Giọt mây', rain: 'Giọt mưa', runoff: 'Nước chảy trên đất'
};
const stages = {
  vapor: 'Bốc hơi', cloud: 'Ngưng tụ thành mây', rain: 'Mưa rơi', runoff: 'Chảy về vùng chứa'
};

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
      time: `${world.time.toFixed(1)} giây`, speed: `×${String(clock.speed).replace('.', ',')}`,
      status: clock.paused ? 'Tạm dừng' : 'Đang chạy',
      level: `${world.reservoirs.level('lake').toFixed(1)} đơn vị`, returns: world.returns,
      sun: world.sun, wind: world.wind, ...counts,
      stages: activeStages(counts).join(' · ') || 'Nước đang ở trong các vùng chứa',
      empty: world.reservoirs.count('pond') === 0 ? 'Ao (đã cạn)' : ''
    };
    for (const [key, element] of Object.entries(fields)) {
      const text = String(values[key]);
      if (element.textContent !== text) element.textContent = text;
    }
  };
}
