import { config } from '../config.js';

export function bindControls(root, world, clock, resetFrameTime) {
  const pause = root.querySelector('#pause');
  const speedButtons = [...root.querySelectorAll('[data-speed]')];
  function update() {
    pause.textContent = clock.paused ? 'Tiếp tục' : 'Tạm dừng';
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
  for (const name of ['sun', 'wind']) {
    const slider = root.querySelector(`#${name}`);
    const output = root.querySelector(`#${name}-value`);
    slider.min = config.limits.minControl;
    slider.max = config.limits.maxControl;
    slider.value = world[name];
    output.value = String(world[name]);
    slider.addEventListener('input', () => {
      world[name] = Number(slider.value);
      output.value = slider.value;
    });
  }
  pause.addEventListener('click', togglePause);
  root.querySelector('#reset').addEventListener('click', reset);
  for (const button of speedButtons) {
    button.addEventListener('click', () => setSpeed(Number(button.dataset.speed)));
  }
  root.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;
    if (event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    // Space on a focused button keeps the browser's native single activation.
    if (event.code === 'Space' && event.target.closest('button')) return;
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
