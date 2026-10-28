import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  await page.waitForFunction(() => Object.values(window.__sim?.scene.stageLabels ?? {}).length === 4 && Object.values(window.__sim.scene.stageLabels).every(s => s.visible), null, { timeout: 120000 });
  await page.locator('#pause').click();
  const particles = await page.evaluate(() => window.__sim.particles);
  for (const [quality, calls, triangles] of [['high',150,400000], ['low',80,150000]]) {
    await page.locator(`[data-quality="${quality}"]`).click();
    await page.waitForTimeout(1500);
    const state = await page.evaluate(() => window.__sim);
    assert.ok(state.scene.renderInfo.calls > 0 && state.scene.renderInfo.calls <= calls, JSON.stringify(state.scene.renderInfo));
    assert.ok(state.scene.renderInfo.triangles > 0 && state.scene.renderInfo.triangles <= triangles, JSON.stringify(state.scene.renderInfo));
    assert.deepEqual(state.particles, particles);
    console.log(JSON.stringify({quality, time:state.time, ...state.scene.renderInfo}));
    for (const view of ['overview','sea','mountain','river']) {
      await page.locator(`[data-view="${view}"]`).click();
      await page.waitForTimeout(1400);
      const scene = await page.evaluate(() => window.__sim.scene);
      assert.ok(scene.sunScreen.every(value => Math.abs(value) < 1), `${quality}/${view}: ${scene.sunScreen}`);
      assert.ok(scene.objects.includes('base-shadow'));
    }
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
