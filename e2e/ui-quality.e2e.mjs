import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?paused=1&quality=high`);
  await page.waitForFunction(() => window.__sim?.scene.terrainTriangles > 0);
  const high = await page.evaluate(() => window.__sim);
  assert.equal(high.scene.terrainTriangles, 160 * 160 * 2);
  assert.ok(high.scene.fields >= 20);
  assert.ok(high.scene.objects.includes('shore-foam'));
  await page.locator('[data-quality="low"]').click();
  const low = await page.evaluate(() => window.__sim);
  assert.equal(low.quality.level, 'low');
  assert.equal(low.scene.terrainTriangles, 80 * 80 * 2);
  assert.equal(low.scene.fields, high.scene.fields);
  assert.equal(low.scene.terrainTriangles * 4, high.scene.terrainTriangles);
  assert.equal(low.scene.effects.wavesVisible, false);
  assert.equal(low.scene.shadows, false);
  assert.ok(low.scene.pixelRatio <= 1);
  assert.deepEqual(low.camera, high.camera);
  assert.equal(low.time, high.time);
  assert.deepEqual(low.particles, high.particles);
  assert.deepEqual(low.waterDistribution, high.waterDistribution);
  await page.locator('[data-quality="high"]').click();
  assert.equal(await page.evaluate(() => window.__sim.scene.shadows), true);
  assert.equal(await page.evaluate(() => window.__sim.scene.effects.wavesVisible), true);
  for (const [query, expected] of [['low', 'low'], ['ultra', 'high']]) {
    await page.goto(`${baseUrl}/?paused=1&quality=${query}`);
    await page.waitForFunction(level => window.__sim?.quality.level === level, expected);
  }
  assert.deepEqual(errors, []);
  console.log('ui-quality passed');
} finally { await browser.close(); }
