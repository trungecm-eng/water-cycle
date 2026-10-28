import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8&paused=1`);
  await page.waitForFunction(() => window.__sim?.scene);
  const initial = await page.evaluate(() => window.__sim);
  assert.equal(initial.scene.trees, 400);
  assert.equal(initial.scene.treeMeshes, 2);
  assert.ok(initial.scene.objects.includes('tree-canopies'));
  assert.ok(initial.scene.objects.includes('tree-trunks'));
  assert.equal(initial.scene.seaCutaway, true);
  assert.ok(initial.scene.objects.includes('base-shadow'));
  assert.ok(initial.scene.objects.includes('strata'));
  await page.locator('[data-quality="high"]').click();
  await page.waitForFunction(() => window.__sim.scene.shadows);
  assert.equal(await page.evaluate(() => window.__sim.scene.trees), 2200);
  assert.deepEqual(await page.evaluate(() => window.__sim.particles), initial.particles);
  await page.locator('[data-quality="low"]').click();
  await page.waitForFunction(() => !window.__sim.scene.shadows);
  assert.equal(await page.evaluate(() => window.__sim.scene.trees), 400);
  assert.deepEqual(await page.evaluate(() => window.__sim.particles), initial.particles);
  assert.deepEqual(errors, []);
  console.log('Art trees: two instanced meshes, 2200/400 trees and unchanged particles passed.');
} finally { await browser.close(); }
