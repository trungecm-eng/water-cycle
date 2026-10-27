import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1000 } });
  const errors = trackErrors(page);
  const measurements = [];
  for (const quality of ['high', 'low']) {
    await page.goto(`${baseUrl}/?quality=${quality}`);
    await page.waitForFunction(() => {
      const sim = window.__sim;
      return sim && Object.values(sim.counts).every(count => count > 0);
    }, null, { timeout: 125000 });
    const start = await page.evaluate(() => ({ time: window.__sim.time, counts: window.__sim.counts, speed: window.__sim.speed }));
    const result = await page.evaluate(() => new Promise(resolve => {
      let first;
      let frames = 0;
      function frame(now) {
        first ??= now;
        if (now - first >= 10000) {
          const elapsed = (now - first) / 1000;
          resolve({ frames, seconds: elapsed, fps: frames / elapsed });
        } else {
          frames++;
          requestAnimationFrame(frame);
        }
      }
      requestAnimationFrame(frame);
    }));
    assert.equal(start.speed, 1);
    assert.equal(await page.evaluate(() => window.__sim.panel.collapsed), false);
    assert.equal(await page.evaluate(() => window.__sim.particles.length), 1000);
    assert.deepEqual(errors, []);
    measurements.push({ quality, panel: await page.evaluate(() => window.__sim.panel), browser: browser.version(), viewport: '1280x1000', particles: 1000,
      start, ...result, errors });
    assert.ok(result.frames > 0); // Software WebGL measurement is informational.
  }
  console.log(JSON.stringify(measurements, null, 2));
} finally {
  await browser.close();
}
