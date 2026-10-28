import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8&paused=1`);
  await page.waitForFunction(() => window.__sim?.scene);
  const initial = await page.evaluate(() => window.__sim);
  assert.equal(initial.scene.strataLayers, 4);
  assert.equal(initial.scene.seaCutaway, true);
  assert.ok(initial.scene.objects.includes('base-shadow'));
  assert.ok(initial.scene.objects.includes('strata'));
  await page.locator('[data-quality="high"]').click();
  await page.waitForFunction(() => window.__sim.scene.shadows);
  assert.equal(await page.evaluate(() => window.__sim.scene.strataLayers), 4);
  assert.deepEqual(await page.evaluate(() => window.__sim.particles), initial.particles);
  await page.locator('[data-quality="low"]').click();
  await page.waitForFunction(() => !window.__sim.scene.shadows);
  assert.ok(await page.evaluate(() => window.__sim.scene.objects.includes('base-shadow')));
  assert.deepEqual(errors, []);
  console.log('Art strata: four layers, sea cutaway, permanent base shadow and quality switching passed.');
} finally { await browser.close(); }
