import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

async function measureRain(page, wind) {
  await page.locator('#wind').fill(String(wind));
  await page.locator('#clear-rain').click();
  const start = await page.evaluate(() => window.__sim.time);
  await page.waitForFunction(start => window.__sim.time >= start + 60, start, { timeout: 180000 });
  await page.locator('#pause').click();
  const tally = await page.evaluate(() => window.__sim.rainTally);
  assert.ok(tally.total > 0);
  return tally;
}

const browser = await launchBrowser();
try {
  for (const interrupted of [false, true]) {
    const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
    const errors = trackErrors(page);
    await page.goto(baseUrl);
    await page.waitForFunction(() => window.__sim);
    assert.equal(await page.evaluate(() => window.__sim.speed), 1);
    await page.locator('#panel-toggle').click();
    await page.locator('#panel-toggle').click();
    for (const name of ['controls', 'statistics', 'legend']) {
      const summary = page.locator(`[data-group="${name}"] summary`);
      await summary.click();
      await page.waitForFunction(name => !window.__sim.panel.groups[name], name);
      await summary.click();
      await page.waitForFunction(name => window.__sim.panel.groups[name], name);
    }
    for (const view of ['sea', 'mountain', 'river', 'overview']) {
      await page.locator(`[data-view="${view}"]`).click();
      if (!interrupted) await page.waitForTimeout(1100);
    }
    if (interrupted) {
      await page.setViewportSize({ width: 1024, height: 800 });
      await page.locator('#panel-toggle').click();
      await page.waitForTimeout(1100);
      assert.equal(await page.evaluate(() => window.__sim.view), 'overview');
      await page.locator('#panel-toggle').click();
    }
    await page.locator('[data-view="mountain"]').click();
    await page.waitForTimeout(200);
    await page.mouse.move(350, 350);
    await page.mouse.down();
    await page.mouse.move(400, 370);
    await page.mouse.up();
    assert.equal(await page.evaluate(() => window.__sim.view), 'free');
    const initial = await page.evaluate(() => window.__sim.waterDistribution);
    const calm = await measureRain(page, 0);
    assert.ok(calm.percentages.sea > 50, JSON.stringify(calm));
    await page.locator('#wind').fill('100');
    await page.locator('#pause').click();
    const windy = await measureRain(page, 100);
    assert.ok(windy.percentages.mountain > calm.percentages.mountain + 5, JSON.stringify({ calm, windy }));
    assert.notDeepEqual(await page.evaluate(() => window.__sim.waterDistribution), initial);
    assert.notEqual(await page.evaluate(() => window.__sim.reservoirs.lake.count), 200);
    await page.locator('#default-controls').click();
    assert.deepEqual(await page.evaluate(() => [window.__sim.sun, window.__sim.wind]), [50, 40]);
    for (const quality of ['low', 'high']) {
      await page.locator(`[data-quality="${quality}"]`).click();
      assert.equal(await page.evaluate(() => window.__sim.quality.level), quality);
    }
    const reset = await page.evaluate(() => {
      document.querySelector('#reset').click();
      document.querySelector('#pause').click();
      return window.__sim;
    });
    assert.equal(reset.time, 0);
    assert.equal(reset.rainTally.total, 0);
    assert.equal(reset.counts.water, 1000);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ flow: interrupted ? 'interrupted' : 'default x1', calm, windy }));
    await page.close();
  }
} finally { await browser.close(); }
