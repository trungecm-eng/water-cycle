import { content } from '../content.js';
import { config } from '../config.js';

export function bindControls(root, world, clock, resetFrameTime) {
  const pause = root.querySelector('#pause');
  const speedButtons = [...root.querySelectorAll('[data-speed]')];
  function update() {
    pause.textContent = clock.paused ? content.resume : content.pause;
    pause.setAttribute('aria-pressed', String(clock.paused));
    for (const button of speedButtons) {
      button.setAttribute('aria-pressed', String(Number(button.dataset.speed) === clock.speed));
    }
  }
  function togglePause() {
    resetFrameTime();
    clock.setPaused(!clock.paused);
    update();
  }
  function setSpeed(speed) {
    resetFrameTime();
    clock.speed = speed;
    update();
  }
  function reset() {
    world.reset();
    clock.reset();
    resetFrameTime();
    update();
  }
  const syncSliders = [];
  for (const name of ['sun', 'wind']) {
    const slider = root.querySelector(`#${name}`);
    const output = root.querySelector(`#${name}-value`);
    slider.min = config.limits.minControl;
    slider.max = config.limits.maxControl;
    const sync = () => {
      slider.value = world[name];
      output.value = String(world[name]);
    };
    syncSliders.push(sync);
    sync();
    slider.addEventListener('input', () => {
      world[name] = Number(slider.value);
      output.value = slider.value;
    });
  }
  root.querySelector('#default-controls').addEventListener('click', () => {
    world.sun = config.defaults.sun;
    world.wind = config.defaults.wind;
    for (const sync of syncSliders) sync();
  });
  pause.addEventListener('click', togglePause);
  root.querySelector('#reset').addEventListener('click', reset);
  for (const button of speedButtons) {
    button.addEventListener('click', () => setSpeed(Number(button.dataset.speed)));
  }
  root.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    // Keep native disclosure activation on Space; buttons/canvas use the pause shortcut.
    if (event.code === 'Space' && event.target.closest('summary')) return;
    if (event.code === 'Space') {
      event.preventDefault();
      togglePause();
    } else if (event.key.toLowerCase() === 'r') {
      event.preventDefault();
      reset();
    } else if (/^[1-4]$/.test(event.key)) {
      event.preventDefault();
      setSpeed(config.clock.speeds[Number(event.key) - 1]);
    }
  });
  update();
}
