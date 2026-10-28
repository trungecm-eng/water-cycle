import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  const errors = trackErrors(page);
  for (const [width, height] of [[1280,800], [1920,1080]]) {
    await page.setViewportSize({ width, height });
    await page.goto(`${baseUrl}/?quality=low&speed=8`);
    await page.waitForFunction(() => window.__sim?.scene.stageLabels.vapor?.visible);
    await page.waitForFunction(() => window.__sim.time >= 65);
    await page.waitForTimeout(500);
    const boxes = await page.locator('.map-label:visible, .stage-label:visible').evaluateAll(elements => elements.map(e => {
      const b = e.getBoundingClientRect(); return { left:b.left, right:b.right, top:b.top, bottom:b.bottom, text:e.textContent };
    }));
    for (let i=0;i<boxes.length;i++) for (let j=i+1;j<boxes.length;j++) {
      const a=boxes[i], b=boxes[j];
      assert.ok(!(a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top), `${a.text} overlaps ${b.text}`);
    }
    assert.ok(await page.evaluate(() => window.__sim.scene.windArrow.visible));
    await page.keyboard.press('n');
    assert.equal(await page.locator('.stage-label:visible').count(),0);
    assert.ok(await page.locator('.map-label:visible').count());
    await page.keyboard.press('n');
    await page.keyboard.press('l');
    assert.equal(await page.locator('.map-label:visible').count(),0);
    await page.keyboard.press('l');
    await page.locator('[data-region="lake"]').click();
    await page.waitForFunction(() => window.__sim.camera.distance === 500);
    assert.deepEqual(await page.evaluate(() => window.__sim.camera.target), [360,45,620]);
    assert.equal(await page.evaluate(() => window.__sim.view), 'free');
    await page.locator('#default-view').click();
    await page.waitForFunction(() => window.__sim.camera.distance === 1500);
    await page.locator('#pause').click();
    const label = page.locator('.stage-label:visible').first();
    const id = await label.getAttribute('data-stage');
    const target = await page.evaluate(id => window.__sim.scene.stageLabels[id].position, id);
    await label.click();
    await page.waitForFunction(() => window.__sim.camera.distance === 500);
    assert.equal(await page.evaluate(() => window.__sim.view), 'free');
    assert.deepEqual(await page.evaluate(() => window.__sim.camera.target), target);
    await page.locator('#wind').fill('0');
    await page.locator('#wind').dispatchEvent('input');
    await page.waitForFunction(() => !window.__sim.scene.windArrow.visible);
    await page.locator('#default-view').click();
    await page.waitForFunction(() => window.__sim.camera.distance === 1500);
    await page.locator('[data-region="lake"]').click();
    await page.mouse.move(500,400);
    await page.mouse.down();
    await page.mouse.up();
    const stopped = await page.evaluate(() => window.__sim.camera);
    await page.waitForTimeout(1100);
    assert.deepEqual(await page.evaluate(() => window.__sim.camera), stopped);
  }
  assert.deepEqual(errors, []);
  console.log('art-labels passed');
} finally { await browser.close(); }
