import { parseParams } from './sim/params.js';
import { World } from './sim/world.js';
import { Clock } from './sim/clock.js';
import { render } from './ui/render.js';

const options = parseParams(window.location.search);
const world = new World(options);
const clock = new Clock(() => world.step(), options);
const canvas = document.querySelector('#world');
Object.defineProperty(window, '__sim', {
  get: () => Object.freeze({ ...world.snapshot(), speed: clock.speed, paused: clock.paused })
});
let previous;
function frame(timestamp) {
  if (previous !== undefined) clock.advance((timestamp - previous) / 1000);
  previous = timestamp;
  render(canvas, world);
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { previous = undefined; });
requestAnimationFrame(frame);
