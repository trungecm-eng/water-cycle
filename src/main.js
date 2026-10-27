import { parseParams } from './sim/params.js';
import { World } from './sim/world.js';
import { Clock } from './sim/clock.js';
import { render } from './ui/render.js';
import { bindControls } from './ui/controls.js';
import { createHud } from './ui/hud.js';

const options = parseParams(window.location.search);
const world = new World(options);
const clock = new Clock(() => world.step(), options);
const canvas = document.querySelector('#world');
Object.defineProperty(window, '__sim', {
  get: () => Object.freeze({ ...world.snapshot(), speed: clock.speed, paused: clock.paused })
});
let previous;
bindControls(document, world, clock, () => { previous = undefined; });
const updateHud = createHud(document);
function frame(timestamp) {
  if (previous !== undefined) clock.advance((timestamp - previous) / 1000);
  previous = timestamp;
  render(canvas, world);
  updateHud(world, clock);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { previous = undefined; });
requestAnimationFrame(frame);
