import { content } from './content.js';
import { createPanel } from './ui/panel.js';
import { parseParams } from './sim/params.js';
import { World } from './sim/world.js';
import { Clock } from './sim/clock.js';
import { createRenderer } from './ui/render.js';
import { Camera } from './sim/camera.js';
import { bindCameraControls } from './ui/camera-controls.js';
import { bindControls } from './ui/controls.js';
import { createHud } from './ui/hud.js';

const panel = createPanel(document);
document.title = content.title;
const options = parseParams(window.location.search);
const world = new World(options);
const clock = new Clock(() => world.step(), options);
const canvas = document.querySelector('#world');
const camera = new Camera(world.map, world.reservoirs);
const renderer = createRenderer(canvas, world, camera);
bindCameraControls(canvas, camera);
Object.defineProperty(window, '__sim', {
  get: () => {
    camera.reservoirs = world.reservoirs;
    return Object.freeze({ ...world.snapshot(), speed: clock.speed, paused: clock.paused,
      panel: panel.snapshot(), camera: camera.snapshot(), webgl2: renderer.webgl2, scene: renderer.snapshot?.() ?? Object.freeze({ objects: Object.freeze([]), labels: Object.freeze([]) }) });
  }
});
let previous;
bindControls(document, world, clock, () => { previous = undefined; });
const updateHud = createHud(document);
function frame(timestamp) {
  if (previous !== undefined) clock.advance((timestamp - previous) / 1000);
  previous = timestamp;
  camera.reservoirs = world.reservoirs;
  renderer.render();
  updateHud(world, clock);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { previous = undefined; });
requestAnimationFrame(frame);
