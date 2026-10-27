import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?n=2000&paused=1`);
  await page.waitForFunction(() => window.__sim?.webgl2);
  const layout = await page.evaluate(() => {
    const panel = document.querySelector('.simulation-panel').getBoundingClientRect();
    const canvas = document.querySelector('#world').getBoundingClientRect();
    return { panelWidth: panel.width, canvasLeft: canvas.left, canvasWidth: canvas.width,
      canvasHeight: canvas.height, width: innerWidth, height: innerHeight };
  });
  assert.ok(layout.panelWidth <= layout.width * 0.3, 'panel covers at most 30%');
  assert.equal(layout.canvasLeft, 0);
  assert.equal(layout.canvasWidth, layout.width);
  assert.ok(layout.canvasWidth >= layout.width * 0.7, 'scene occupies most of the window');
  assert.equal(layout.canvasHeight, layout.height);
  await page.getByText('Chú giải', { exact: true }).click();
  assert.equal(await page.locator('#legend li').count(), 5);
  await page.getByText('Chú giải', { exact: true }).click();
  const initial = await page.evaluate(() => window.__sim);
  assert.equal(initial.counts.water, 2000);
  assert.equal(initial.reservoirs.sea.count, 1480);
  assert.equal(initial.reservoirs.lake.count, 400);
  assert.equal(initial.reservoirs.pond.count, 120);
  await page.locator('#world').focus();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('+');
  const rotated = await page.evaluate(() => window.__sim);
  assert.notEqual(rotated.camera.azimuth, initial.camera.azimuth);
  assert.ok(rotated.camera.distance < initial.camera.distance);
  assert.equal(rotated.time, 0);
  await page.locator('#world').scrollIntoViewIfNeeded();
  const box = await page.locator('#world').boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 60, box.y + box.height / 2 + 20);
  await page.mouse.up();
  await page.mouse.wheel(0, 150);
  await page.waitForFunction(previous => window.__sim.camera.distance > previous, rotated.camera.distance);
  const dragged = await page.evaluate(() => window.__sim);
  assert.notEqual(dragged.camera.azimuth, rotated.camera.azimuth);
  assert.equal(dragged.time, 0);
  await page.setViewportSize({ width: 1000, height: 800 });
  await page.waitForFunction(() => {
    const rect = document.querySelector('#world').getBoundingClientRect();
    return rect.height === innerHeight && rect.right === innerWidth;
  });
  await page.locator('#reset').click();
  const reset = await page.evaluate(() => window.__sim);
  assert.deepEqual(reset.camera, dragged.camera);
  assert.equal(Object.values(reset.counts).reduce((sum, count) => sum + count, 0), 2000);
  await page.locator('#sun').focus();
  await page.keyboard.press('Home');
  await page.waitForFunction(() => window.__sim.sun === 0);
  const unheated = await page.evaluate(() => window.__sim.evaporations);
  const startTime = await page.evaluate(() => window.__sim.time);
  await page.waitForFunction(time => window.__sim.time >= time + 1, startTime);
  assert.equal(await page.evaluate(() => window.__sim.evaporations), unheated);
  await page.keyboard.press('End');
  await page.waitForFunction(count => window.__sim.sun === 100 && window.__sim.evaporations > count, unheated);
  await page.locator('#pause').click();
  const paused = await page.evaluate(() => window.__sim);
  await page.keyboard.press('ArrowLeft');
  const still = await page.evaluate(() => window.__sim);
  assert.equal(still.time, paused.time);
  assert.deepEqual(still.particles, paused.particles);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function (type, ...args) {
      if (type === 'webgl2' || type === 'webgl') return null;
      return original.call(this, type, ...args);
    };
  });
  await page.reload();
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').textContent(), /Không thể khởi tạo WebGL2/);
  assert.equal(await page.evaluate(() => window.__sim.webgl2), false);
  assert.deepEqual(errors, []);
  console.log('3D core: WebGL2, 2000 particles, paused orbit/zoom, resize, reset, sunlight, evaporation pause, and fallback passed.');
} finally {
  await browser.close();
}
