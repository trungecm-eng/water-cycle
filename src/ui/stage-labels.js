import * as THREE from '../../vendor/three.module.min.js';
import { content } from '../content.js';
import { stageColors } from '../art/stage-labels.js';

export function createStageLabels(canvas, observer, world) {
  const layer = document.createElement('div');
  layer.className = 'stage-labels';
  canvas.parentElement.append(layer);
  const elements = Object.fromEntries(Object.entries(content.stages).map(([id, name], index) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'stage-label';
    button.dataset.stage = id;
    button.style.setProperty('--stage-color', stageColors[id]);
    const number = document.createElement('span');
    number.textContent = index + 1;
    button.append(number, name);
    button.hidden = true;
    layer.append(button);
    return [id, button];
  }));
  let enabled = true, previous, previousSun = world.sun, controlAnimationUntil = 0;
  const toggle = document.querySelector('#toggle-stage-labels');
  function flip() { enabled = !enabled; toggle.setAttribute('aria-pressed', String(enabled)); }
  toggle.addEventListener('click', flip);
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'n') { event.preventDefault(); flip(); }
  });
  let snapshot = {};
  return {
    update(camera, paused) {
      const now = performance.now() / 1000;
      if (previousSun !== world.sun) controlAnimationUntil = now + 0.5;
      previousSun = world.sun;
      const frozen = paused && now >= controlAnimationUntil;
      snapshot = observer.update(world, previous === undefined || frozen ? 0 : now - previous);
      previous = now;
      const rect = canvas.getBoundingClientRect();
      for (const [id, state] of Object.entries(snapshot)) {
        const element = elements[id];
        if (!state.position) { element.hidden = true; continue; }
        const point = new THREE.Vector3(...state.position).project(camera);
        const visible = enabled && state.opacity > 0 && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1 && Math.abs(point.z) <= 1;
        element.hidden = !visible;
        element.style.opacity = state.opacity;
        element.style.left = `${rect.left + window.scrollX + (point.x + 1) * rect.width / 2}px`;
        element.style.top = `${rect.top + window.scrollY + (1 - point.y) * rect.height / 2}px`;
        element.style.pointerEvents = state.visible ? 'auto' : 'none';
      }
    },
    snapshot: () => ({ stageLabelsEnabled: enabled, stageLabels: structuredClone(snapshot) })
  };
}
