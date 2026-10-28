import * as THREE from '../../vendor/three.module.min.js';
import { windArrow } from '../art/wind-arrow.js';

export function createWindArrow(canvas, world) {
  const namespace = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(namespace, 'svg');
  svg.classList.add('wind-arrow');
  const path = document.createElementNS(namespace, 'path');
  const head = document.createElementNS(namespace, 'path');
  const text = document.createElementNS(namespace, 'text');
  text.textContent = 'Gió đưa mây vào đất liền';
  svg.append(path, head, text);
  canvas.parentElement.append(svg);
  let state;
  return {
    update(camera, enabled) {
      state = windArrow(world.wind);
      svg.hidden = !enabled || !state.visible;
      svg.style.display = svg.hidden ? 'none' : '';
      svg.style.opacity = state.opacity;
      const rect = canvas.getBoundingClientRect();
      svg.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`);
      const points = state.points.map(p => {
        const v = new THREE.Vector3(...p).project(camera);
        return [(v.x + 1) * rect.width / 2, (1 - v.y) * rect.height / 2];
      });
      path.setAttribute('d', points.map(([x,y], i) => `${i ? 'L' : 'M'}${x},${y}`).join(' '));
      const [x,y] = points.at(-1), [px,py] = points.at(-2);
      const a = Math.atan2(y-py,x-px);
      head.setAttribute('d', `M${x-12*Math.cos(a-0.5)},${y-12*Math.sin(a-0.5)} L${x},${y} L${x-12*Math.cos(a+0.5)},${y-12*Math.sin(a+0.5)}`);
      text.setAttribute('x', points[12][0]);
      text.setAttribute('y', points[12][1] - 12);
    },
    snapshot: () => ({ windArrow: state ? { ...state, visible: state.visible && !svg.hidden } : null })
  };
}
