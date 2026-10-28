import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  await page.waitForFunction(() => window.__sim?.scene.sunbeams > 0);
  await page.waitForFunction(() => {
    if (!(window.__sim?.scene.rainingClusters > 0)) return false;
    if (!window.__sim.paused) document.querySelector('#pause').click();
    return true;
  }, null, { timeout: 120000 });
  const state = await page.evaluate(() => window.__sim);
  assert.ok(state.scene.cloudBlocks >= 5);
  assert.ok(state.scene.rainStreaks > 0);
  assert.ok(state.scene.sunbeams <= 30);
  for (const name of ['sun', 'sun-halo', 'rain-curtains', 'cloud-masses', 'sunbeams']) assert.ok(state.scene.objects.includes(name));
  await page.waitForFunction(() => window.__sim.paused);
  const paused = await page.evaluate(() => window.__sim);
  await page.locator('[data-quality="high"]').click();
  await page.waitForFunction(() => window.__sim.scene.shadows);
  assert.ok(await page.evaluate(() => window.__sim.scene.cloudBlocks) >= paused.scene.cloudBlocks);
  assert.deepEqual(await page.evaluate(() => window.__sim.particles), paused.particles);
  await page.screenshot({ path: '/tmp/req006-rain-curtain.png' });
  await page.locator('[data-quality="low"]').click();
  await page.waitForFunction(() => !window.__sim.scene.shadows);
  assert.equal(await page.evaluate(() => window.__sim.scene.cloudBlocks), paused.scene.cloudBlocks);
  const halo = state.scene.sun.haloOpacity;
  await page.locator('#sun').fill('0');
  await page.locator('#sun').dispatchEvent('input');
  await page.waitForFunction(() => window.__sim.scene.sunbeams === 0);
  assert.ok(await page.evaluate(() => window.__sim.scene.sun.haloOpacity) < halo);
  assert.deepEqual(errors, []);
  console.log('Art atmosphere: instanced clouds, rain curtains, sun and evaporation beams passed.');
} finally { await browser.close(); }
