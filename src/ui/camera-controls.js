import { config } from '../config.js';

export function bindCameraControls(canvas, camera, root = document) {
  let drag;
  canvas.style.touchAction = 'none';
  canvas.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    canvas.focus();
    drag = { x: event.clientX, y: event.clientY };
    canvas.setPointerCapture(event.pointerId);
  });
  canvas.addEventListener('pointermove', event => {
    if (!drag) return;
    camera.rotate(-(event.clientX - drag.x) * config.camera.rotateSpeed,
      (event.clientY - drag.y) * config.camera.rotateSpeed * 180 / Math.PI);
    drag = { x: event.clientX, y: event.clientY };
  });
  for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(type, () => { drag = null; });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    camera.zoom(Math.exp(Math.max(-1, Math.min(1, event.deltaY * config.camera.zoomSpeed))));
  }, { passive: false });
  root.addEventListener('keydown', event => {
    if (event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    const turns = { ArrowLeft: [-config.camera.keyRotate, 0], ArrowRight: [config.camera.keyRotate, 0],
      ArrowUp: [0, config.camera.keyRotate * 180 / Math.PI], ArrowDown: [0, -config.camera.keyRotate * 180 / Math.PI] };
    if (turns[event.key]) camera.rotate(...turns[event.key]);
    else if (event.key === '+' || event.key === '=') camera.zoom(Math.exp(-config.camera.keyZoom));
    else if (event.key === '-') camera.zoom(Math.exp(config.camera.keyZoom));
    else return;
    event.preventDefault();
  });
}
