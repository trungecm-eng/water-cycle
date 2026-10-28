import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const directory = 'specs/REQ-005/screenshots';
await mkdir(directory, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?paused=1`);
  await page.waitForFunction(() => window.__sim);
  await page.screenshot({ path: `${directory}/01-panel-open.png` });
  await page.locator('#panel-toggle').click();
  await page.screenshot({ path: `${directory}/02-panel-collapsed.png` });
  await page.locator('#panel-toggle').click();
  let index = 3;
  for (const view of ['overview', 'sea', 'mountain', 'river']) {
    await page.locator(`[data-view="${view}"]`).click();
    await page.waitForTimeout(1200);
    await page.screenshot({ path: `${directory}/0${index++}-${view}.png` });
  }
  const evidence = [];
  for (const wind of [0, 100]) {
    await page.goto(`${baseUrl}/?wind=${wind}`);
    await page.waitForFunction(() => window.__sim);
    if (!await page.evaluate(() => window.__sim.panel.groups.controls)) {
      await page.locator('[data-group="controls"] summary').click();
    }
    await page.waitForFunction(() => window.__sim.time >= 60, null, { timeout: 180000 });
    await page.locator('#pause').click();
    await page.locator('[data-group="controls"] summary').click();
    await page.locator('#rain-tally').scrollIntoViewIfNeeded();
    evidence.push(await page.evaluate(() => ({ wind: window.__sim.wind, time: window.__sim.time, rainTally: window.__sim.rainTally })));
    await page.screenshot({ path: `${directory}/0${index++}-rain-wind-${wind}.png` });
  }
  assert.deepEqual(errors, []);
  await writeFile(`${directory}/evidence.json`, JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({ screenshots: 8, evidence }));
} finally { await browser.close(); }
