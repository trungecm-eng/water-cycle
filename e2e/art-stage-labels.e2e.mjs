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
  await page.waitForFunction(() => {
    if (!window.__sim.scene.stageLabels.rain.visible) return false;
    document.querySelector('#pause').click();
    return true;
  }, null, { timeout: 120000 });
  const anchors = await page.evaluate(() => {
    const state = window.__sim;
    return ['cloud', 'rain'].flatMap(stage => {
      const label = state.scene.stageLabels[stage];
      if (!label.visible) return [];
      const cluster = state.clusters.find(c => `cluster-${Math.min(...c.ids)}` === label.target);
      if (!cluster) return [{ stage, distance: Infinity }];
      const members = state.particles.filter(p => cluster.ids.includes(p.id));
      const center = ['x', 'y', 'z'].map(axis => members.reduce((sum, p) => sum + p[axis], 0) / members.length);
      center[1] += stage === 'rain' ? 25 : 45;
      return [{ stage, distance: Math.hypot(...center.map((v, axis) => v - label.position[axis])) }];
    });
  });
  assert.ok(anchors.some(anchor => anchor.stage === 'rain'));
  for (const anchor of anchors) assert.ok(anchor.distance <= 60, `${anchor.stage} label is far from its live cloud: ${anchor.distance}`);
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
