import { StageLabels } from './art/stage-labels.js';
import { QualityMonitor, parseQuality } from './quality.js';
import { content } from './content.js';
import { createPanel } from './ui/panel.js';
import { parseParams } from './sim/params.js';
import { World } from './sim/world.js';
import { Clock } from './sim/clock.js';
import { createRenderer } from './ui/render.js';
import { ViewTransition, parseView } from './sim/views.js';
import { Camera } from './sim/camera.js';
import { bindCameraControls } from './ui/camera-controls.js';
import { bindControls } from './ui/controls.js';
import { createStatistics } from './ui/statistics.js';
import { createHud } from './ui/hud.js';

const panel = createPanel(document);
document.title = content.title;
const options = parseParams(window.location.search);
const world = new World(options);
const stageLabels = new StageLabels();
stageLabels.sample(world);
const statistics = createStatistics(document, world);
const clock = new Clock(() => { world.step(); statistics.sample(); stageLabels.sample(world); }, options);
const canvas = document.querySelector('#world');
const camera = new Camera(world.map, world.reservoirs);
const views = new ViewTransition(camera, parseView(window.location.search));
const viewButtons = [...document.querySelectorAll('[data-view]')];
function updateViews() {
  for (const button of viewButtons) button.setAttribute('aria-pressed', String(button.dataset.view === views.name));
  document.querySelector('#view-name').textContent = content.views[views.name];
}
for (const button of [...viewButtons, document.querySelector('#default-view')]) {
  button.addEventListener('click', () => { views.select(button.dataset.view || 'overview', performance.now() / 1000); updateViews(); });
}
updateViews();
const quality = new QualityMonitor(parseQuality(window.location.search));
const renderer = createRenderer(canvas, world, camera, stageLabels, position => { views.focus(position, performance.now() / 1000); updateViews(); });
function updateQuality() {
  for (const button of document.querySelectorAll('[data-quality]')) button.setAttribute('aria-pressed', String(button.dataset.quality === quality.level));
  document.querySelector('#quality-hint').hidden = !quality.slowHint;
}
function selectQuality(level) { quality.select(level); renderer.setQuality?.(quality.level); updateQuality(); }
for (const button of document.querySelectorAll('[data-quality]')) button.addEventListener('click', () => selectQuality(button.dataset.quality));
document.querySelector('#quality-lower').addEventListener('click', () => selectQuality('low'));
document.querySelector('#quality-dismiss').addEventListener('click', () => { quality.dismiss(); updateQuality(); });
selectQuality(quality.level);
bindCameraControls(canvas, camera, document, () => { views.interrupt(); updateViews(); });
Object.defineProperty(window, '__sim', {
  get: () => {
    camera.reservoirs = world.reservoirs;
    return Object.freeze({ ...world.snapshot(), speed: clock.speed, paused: clock.paused,
      ...statistics.snapshot(), panel: panel.snapshot(), quality: quality.snapshot(), view: views.name, camera: camera.snapshot(), webgl2: renderer.webgl2, scene: renderer.snapshot?.() ?? Object.freeze({ objects: Object.freeze([]), labels: Object.freeze([]) }) });
  }
});
let previous;
bindControls(document, world, clock, () => { previous = undefined; statistics.sample(); stageLabels.sample(world); });
const updateHud = createHud(document);
function frame(timestamp) {
  if (previous !== undefined) clock.advance((timestamp - previous) / 1000);
  previous = timestamp;
  camera.reservoirs = world.reservoirs;
  views.update(timestamp / 1000);
  quality.frame(timestamp / 1000, document.hidden);
  updateQuality();
  renderer.render(clock.paused);
  updateHud(world, clock);
  statistics.render();
  requestAnimationFrame(frame);
}
document.addEventListener('visibilitychange', () => { previous = undefined; quality.reset(); updateQuality(); statistics.sample(); });
requestAnimationFrame(frame);
