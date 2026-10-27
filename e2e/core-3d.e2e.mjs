import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?n=2000&paused=1`);
  await page.waitForFunction(() => window.__sim?.webgl2);
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
  await page.locator('#reset').click();
  const reset = await page.evaluate(() => window.__sim);
  assert.deepEqual(reset.camera, dragged.camera);
  assert.equal(reset.counts.water, 2000);
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
  console.log('3D core: WebGL2, 2000 particles, paused orbit/zoom, resize, reset, and fallback passed.');
} finally {
  await browser.close();
}
