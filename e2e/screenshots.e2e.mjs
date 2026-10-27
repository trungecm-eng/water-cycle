import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const output = 'specs/REQ-004/screenshots';
await mkdir(output, { recursive: true });
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?paused=1&speed=8`);
  await page.waitForFunction(() => window.__sim?.scene.labels.length === 7);
  async function capture(name) {
    await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
    await page.screenshot({ path: `${output}/${name}.png` });
  }
  await capture('01-default');
  await page.locator('#world').focus();
  for (let i = 0; i < 10; i++) await page.keyboard.press('ArrowLeft');
  await capture('02-sea-to-mountains');
  // Orbit and zoom through public controls; the simulation remains untouched.
  for (let i = 0; i < 5; i++) await page.keyboard.press('+');
  await capture('03-mountains-streams-lake');
  await page.locator('#pause').click();
  await page.waitForFunction(() => window.__sim.counts.rain > 10 && window.__sim.rainLandings.mountain > 0,
    null, { timeout: 125000 });
  await page.locator('#pause').click();
  await capture('04-mountain-rain');
  assert.deepEqual(errors, []);
  console.log(`Four screenshots saved to ${output}`);
} finally { await browser.close(); }
