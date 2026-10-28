import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8&paused=1`);
  await page.waitForFunction(() => window.__sim?.scene.labels.length === 7);
  const initial = await page.evaluate(() => window.__sim.scene);
  for (const name of ['terrain', 'sea', 'lake', 'pond', 'river', 'stream', 'strata', 'sea-waves', 'flow-highlights', 'cloud-masses']) assert.ok(initial.objects.includes(name));
  for (let i = 0; i < initial.labels.length; i++) for (let j = i + 1; j < initial.labels.length; j++) {
    const a = initial.labels[i].box, b = initial.labels[j].box;
    assert.ok(a.x + a.width <= b.x || b.x + b.width <= a.x || a.y + a.height <= b.y || b.y + b.height <= a.y);
  }
  await page.locator('#world').focus();
  await page.keyboard.press('l');
  await page.waitForFunction(() => window.__sim.scene.labels.length === 0);
  await page.keyboard.press('l');
  await page.keyboard.press('ArrowLeft');
  await page.waitForFunction(() => window.__sim.scene.labels.length === 7);
  assert.deepEqual((await page.evaluate(() => window.__sim.scene)).effects, initial.effects);
  await page.locator('#pause').click();
  await page.waitForFunction(() => window.__sim.time > 40);
  await page.locator('#pause').click();
  const stopped = await page.evaluate(() => window.__sim.scene.effects);
  assert.notEqual(stopped.waveOffset, initial.effects.waveOffset);
  assert.notDeepEqual(stopped.flowPositions, initial.effects.flowPositions);
  await page.keyboard.press('ArrowRight');
  await page.waitForFunction(() => window.__sim.scene.effects.time > 40);
  assert.deepEqual(await page.evaluate(() => window.__sim.scene.effects), stopped);
  assert.deepEqual(errors, []);
  console.log('Scenery: named objects, seven separated labels, L toggle, moving and paused effects passed.');
} finally { await browser.close(); }
