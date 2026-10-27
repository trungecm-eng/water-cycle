import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage();
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?paused=1`);
  await page.waitForFunction(() => window.__sim?.panel);
  for (const width of [1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const layout = await page.evaluate(() => ({
      panel: document.querySelector('.simulation-panel').getBoundingClientRect().width,
      canvas: document.querySelector('#world').getBoundingClientRect().width
    }));
    assert.ok(layout.panel <= width * 0.3);
    assert.equal(layout.canvas, width);
  }
  for (const name of ['controls', 'statistics', 'legend']) {
    await page.locator(`[data-group="${name}"] summary`).click();
    await page.waitForFunction(name => window.__sim.panel.groups[name] === false, name);
    await page.locator(`[data-group="${name}"] summary`).click();
    await page.waitForFunction(name => window.__sim.panel.groups[name] === true, name);
  }
  await page.locator('[data-group="legend"] summary').click();
  await page.locator('#panel-toggle').click();
  assert.equal(await page.evaluate(() => window.__sim.panel.collapsed), true);
  await page.reload();
  await page.waitForFunction(() => window.__sim?.panel.collapsed);
  assert.equal(await page.evaluate(() => window.__sim.panel.groups.legend), false);
  await page.locator('#world').focus();
  await page.keyboard.press('b');
  assert.equal(await page.evaluate(() => window.__sim.panel.collapsed), false);
  await page.locator('#sun').focus();
  await page.keyboard.press('b');
  assert.equal(await page.evaluate(() => window.__sim.panel.collapsed), false);
  const before = await page.evaluate(() => window.__sim);
  await page.locator('#panel-toggle').click();
  const after = await page.evaluate(() => window.__sim);
  assert.equal(after.time, before.time);
  assert.deepEqual(after.particles, before.particles);
  assert.deepEqual(errors, []);
  console.log('Panel foundation: dimensions, disclosure, session state, keyboard and simulation independence passed.');
} finally { await browser.close(); }
