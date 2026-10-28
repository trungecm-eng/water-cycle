import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width:1280, height:800 } });
  const errors = trackErrors(page);
  for (const interrupted of [false,true]) {
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.__sim?.scene.trees > 0);
    assert.equal(await page.evaluate(() => window.__sim.speed),1);
    assert.equal(await page.evaluate(() => window.__sim.quality.level),'high');
    assert.ok(await page.evaluate(() => window.__sim.scene.fields > 0 && window.__sim.scene.windArrow.visible));
    if (interrupted) {
      await page.setViewportSize({width:1440,height:900});
      await page.locator('[data-view="sea"]').click();
      await page.locator('[data-region="lake"]').click({force:true});
      await page.waitForFunction(() => window.__sim.camera.distance === 500);
      assert.deepEqual(await page.evaluate(() => window.__sim.camera.target),[360,45,620]);
    }
    await page.locator('#default-view').click();
    await page.waitForFunction(() => window.__sim.camera.distance === 1500);
    await page.waitForFunction(() => window.__sim.scene.stageLabels.vapor?.opacity > 0.9);
    await page.locator('#pause').click();
    const target = await page.evaluate(() => window.__sim.scene.stageLabels.vapor.position);
    await page.locator('[data-stage="vapor"]').click();
    await page.waitForFunction(() => window.__sim.camera.distance === 500);
    assert.deepEqual(await page.evaluate(() => window.__sim.camera.target),target);
    await page.locator('#pause').click();
    await page.locator('[data-quality="low"]').click();
    await page.locator('#pause').click();
    const time = await page.evaluate(() => window.__sim.time);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => window.__sim.time),time);
    await page.locator('#pause').click();
    await page.waitForFunction(time => window.__sim.time > time,time);
    await page.keyboard.press('n');
    assert.equal(await page.locator('.stage-label:visible').count(),0);
    await page.keyboard.press('n');
    await page.keyboard.press('l');
    assert.equal(await page.locator('.map-label:visible').count(),0);
    await page.keyboard.press('l');
    await page.mouse.move(450,350);
    await page.mouse.down(); await page.mouse.move(500,380); await page.mouse.up();
    await page.mouse.wheel(0,100);
    assert.equal(await page.evaluate(() => window.__sim.view),'free');
    await page.goto(`${baseUrl}/?quality=low&speed=8`);
    await page.waitForFunction(() => window.__sim?.rainLandings.mountain > 0 && window.__sim.scene.rainStreaks > 0, null, {timeout:120000});
    assert.ok(await page.evaluate(() => window.__sim.time <= 120));
    await page.waitForFunction(() => window.__sim.scene.stageLabels.runoff.visible, null, {timeout:120000});
    await page.goto(`${baseUrl}/?quality=low&speed=8&wind=0`);
    await page.waitForFunction(() => window.__sim?.scene.stageLabels.rain?.visible && window.__sim.scene.stageLabels.rain.position[0] > 800, null, {timeout:120000});
    assert.equal(await page.evaluate(() => window.__sim.scene.windArrow.visible),false);
  }
  assert.deepEqual(errors,[]);
  console.log('art-flow passed: default x1, interrupted, mountain rain and calm sea rain');
} finally { await browser.close(); }
