// Shared scene assertions also exercise frozen effects and label toggling.
import './scenery.e2e.mjs';
import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  for (const [query, n] of [['n=1500', 1500], ...['n=50', 'n=3000', 'n=abc', 'sun=-5', 'wind=200', 'speed=0'].map(q => [q, 1000])]) {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    await page.goto(`${baseUrl}/?${query}&paused=1`);
    await page.waitForFunction(() => window.__sim?.webgl2);
    const sim = await page.evaluate(() => window.__sim);
    assert.equal(sim.particles.length, n);
    assert.equal(sim.sun, 50);
    assert.equal(sim.wind, 40);
    assert.equal(sim.speed, 1);
    assert.deepEqual(errors, []);
    await page.close();
  }
  const page = await browser.newPage();
  const errors = trackErrors(page);
  await page.addInitScript(() => {
    const original = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type, ...args) {
      return ['webgl', 'webgl2'].includes(type) ? null : original.call(this, type, ...args);
    };
  });
  await page.goto(baseUrl);
  await page.getByRole('alert').waitFor();
  assert.match(await page.getByRole('alert').textContent(), /Không thể khởi tạo WebGL2/);
  assert.equal(await page.evaluate(() => window.__sim.webgl2), false);
  assert.deepEqual(errors, []);
  console.log('Scene WebGL2, URL defaults and WebGL fallback passed.');
} finally { await browser.close(); }
