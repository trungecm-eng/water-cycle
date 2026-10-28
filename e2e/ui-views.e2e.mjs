import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
import { mapData } from '../src/map-data.js';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8&paused=1&view=river`);
  await page.waitForFunction(() => window.__sim?.view === 'river');
  for (const name of Object.keys(mapData.views)) {
    await page.locator(`[data-view="${name}"]`).click();
    await page.waitForFunction(({ name, views }) => {
      const pose = window.__sim.camera;
      return window.__sim.view === name && pose.distance === views[name].distance && pose.azimuth === views[name].azimuth;
    }, { name, views: mapData.views });
    assert.deepEqual(await page.evaluate(() => window.__sim.camera.target), mapData.views[name].target);
  }
  await page.locator('[data-view="mountain"]').click();
  await page.waitForTimeout(200);
  await page.mouse.move(400, 400);
  await page.mouse.down();
  const stopped = await page.evaluate(() => window.__sim.camera);
  assert.equal(await page.evaluate(() => window.__sim.view), 'free');
  await page.waitForTimeout(1100);
  assert.deepEqual(await page.evaluate(() => window.__sim.camera), stopped);
  await page.mouse.move(450, 420);
  await page.mouse.up();
  assert.notDeepEqual(await page.evaluate(() => window.__sim.camera), stopped);
  await page.locator('#default-view').click();
  await page.waitForFunction(() => window.__sim.camera.distance === 1500);
  await page.locator('#default-view').press('ArrowLeft');
  assert.equal(await page.evaluate(() => window.__sim.view), 'free');
  for (const [query, expected] of [['sea', 'sea'], ['moon', 'overview']]) {
    await page.goto(`${baseUrl}/?quality=low&speed=8&view=${query}&paused=1`);
    await page.waitForFunction(name => window.__sim?.view === name, expected);
  }
  assert.deepEqual(errors, []);
  console.log('ui-views passed');
} finally { await browser.close(); }
