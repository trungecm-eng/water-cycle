// QA end-to-end journey for AC-1: sea -> wind -> mountain rain -> stream/river -> lake/sea, with a mid-run setback.
import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from '../../e2e/browser.mjs';

const browser = await launchBrowser();
const results = [];
for (const setback of [false, true]) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?speed=8`);
  await page.waitForFunction(() => window.__sim);
  const lake0 = await page.evaluate(() => window.__sim.reservoirs.lake.level);
  if (setback) {
    await page.waitForFunction(() => window.__sim.time > 20);
    await page.locator('#reset').click(); // setback: reset in the middle
    const s = await page.evaluate(() => window.__sim);
    assert.equal(Object.values(s.counts).reduce((a, b) => a + b, 0), 1000); assert.ok(s.time < 5);
    await page.locator('#world').focus();
    await page.keyboard.press('ArrowLeft');
    await page.setViewportSize({ width: 1000, height: 700 });
  }
  const t0 = await page.evaluate(() => window.__sim.time);
  await page.waitForFunction(t0 => window.__sim.time > t0 + 150, t0, { timeout: 200000 });
  const s = await page.evaluate(() => window.__sim);
  const sum = Object.values(s.counts).reduce((a, b) => a + b, 0);
  assert.equal(sum, 1000);
  assert.ok(s.evaporationsByReservoir.sea > s.evaporationsByReservoir.lake + s.evaporationsByReservoir.pond);
  assert.ok(s.rainLandings.mountain > 0, 'rain on mountain');
  assert.ok(s.returns > 0);
  assert.notEqual(s.reservoirs.lake.level, lake0);
  assert.equal(s.scene.labels.length, 7);
  results.push({ setback, time: s.time, rain: s.rainLandings, lake: s.reservoirs.lake, returns: s.returns,
    keys: Object.keys(s).filter(k => /event|transfer|flow|stream|river/i.test(k)) });
  assert.deepEqual(errors, []);
  await page.close();
}
console.log(JSON.stringify(results));
await browser.close();
