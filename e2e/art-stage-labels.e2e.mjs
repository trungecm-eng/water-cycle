import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  await page.waitForFunction(() => window.__sim?.scene.stageLabels?.vapor?.visible);
  assert.deepEqual(await page.locator('.stage-label').allTextContents(), ['1Bốc hơi', '2Ngưng tụ', '3Mưa', '4Dòng chảy']);
  await page.waitForFunction(() => window.__sim.scene.stageLabels.cloud.visible, null, { timeout: 120000 });
  await page.waitForFunction(() => window.__sim.scene.stageLabels.rain.visible, null, { timeout: 120000 });
  await page.locator('#pause').click();
  await page.locator('#world').focus();
  await page.keyboard.press('n');
  assert.equal(await page.evaluate(() => window.__sim.scene.stageLabelsEnabled), false);
  assert.ok(await page.locator('.map-label:visible').count() > 0);
  await page.keyboard.press('l');
  await page.waitForTimeout(300);
  assert.equal(await page.locator('.map-label:visible').count(), 0);
  await page.locator('#toggle-stage-labels').click();
  await page.waitForFunction(() => window.__sim.scene.stageLabelsEnabled);
  assert.ok(await page.locator('.stage-label:visible').count() > 0);
  await page.locator('#sun').fill('0');
  await page.locator('#sun').dispatchEvent('input');
  await page.waitForFunction(() => !window.__sim.scene.stageLabels.vapor.visible && window.__sim.scene.stageLabels.vapor.opacity === 0);
  await page.locator('#reset').click();
  await page.waitForFunction(() => window.__sim.time < 1);
  await page.waitForTimeout(200);
  assert.equal(await page.locator('.stage-label:visible').count(), 0);
  assert.deepEqual(errors, []);
  console.log('Art stage labels: names, activity, independent toggles and sun-zero hiding passed.');
} finally { await browser.close(); }
