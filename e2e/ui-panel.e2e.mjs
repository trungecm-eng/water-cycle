import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const browser = await launchBrowser();
try {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const errors = trackErrors(page);
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  await page.waitForFunction(() => window.__sim);
  for (const width of [1024, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    const bounds = await page.evaluate(() => ({ panel: document.querySelector('.simulation-panel').getBoundingClientRect().width,
      canvas: document.querySelector('#world').getBoundingClientRect().toJSON() }));
    assert.ok(bounds.panel <= width * .3);
    assert.equal(bounds.canvas.x, 0);
    assert.equal(bounds.canvas.width, width);
    assert.equal(bounds.canvas.height, 900);
  }
  // Observe each rendered frame: panel operations cannot pause or jump the clock.
  await page.evaluate(() => {
    window.panelSamples = [];
    let previous = performance.now();
    function sample(now) {
      window.panelSamples.push({ time: window.__sim.time, elapsed: (now - previous) / 1000 });
      previous = now;
      if (window.panelSamples.length < 300) requestAnimationFrame(sample);
    }
    requestAnimationFrame(sample);
  });
  for (let i = 0; i < 4; i++) {
    await page.locator('#panel-toggle').click();
    await page.waitForTimeout(200);
  }
  const samples = await page.evaluate(() => window.panelSamples);
  assert.ok(samples.at(-1).time > samples[0].time);
  for (let i = 1; i < samples.length; i++) {
    const delta = samples[i].time - samples[i - 1].time;
    assert.ok(delta >= 0 && delta <= Math.min(.25, samples[i].elapsed) * 8 + 1 / 60 + .001);
  }
  await page.locator('#pause').click();
  // Every visible native control must be reachable through the browser's Tab order.
  const expected = await page.locator('.simulation-panel button:visible, .simulation-panel summary:visible, .simulation-panel input:visible').evaluateAll(nodes => nodes.map(node => {
    node.dataset.tabTest = String([...document.querySelectorAll('button, summary, input')].indexOf(node));
    return node.dataset.tabTest;
  }));
  const reached = new Set();
  await page.locator('#world').focus();
  const tabStops = await page.locator('button:visible, summary:visible, input:visible, [tabindex="0"]:visible').count();
  for (let i = 0; i < tabStops + 2; i++) {
    await page.keyboard.press('Tab');
    reached.add(await page.evaluate(() => document.activeElement.dataset.tabTest));
  }
  for (const id of expected) assert.ok(reached.has(id), `Unreachable control ${id}`);
  for (const name of ['controls', 'statistics', 'legend']) {
    const summary = page.locator(`[data-group="${name}"] summary`);
    await summary.focus();
    await page.keyboard.press('Enter');
    await page.waitForFunction(name => !window.__sim.panel.groups[name], name);
    await page.keyboard.press('Space');
    await page.waitForFunction(name => window.__sim.panel.groups[name], name);
  }
  const contrast = await page.evaluate(() => {
    const rgba = value => value.match(/[\d.]+/g).map(Number);
    const blend = (top, bottom) => top.slice(0, 3).map((v, i) => v * (top[3] ?? 1) + bottom[i] * (1 - (top[3] ?? 1)));
    const luminance = color => color.map(v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; })
      .reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
    const sky = rgba(getComputedStyle(document.documentElement).backgroundColor);
    const failures = [];
    let count = 0;
    for (const node of document.querySelectorAll('.simulation-panel *')) {
      if (!node.getClientRects().length || ![...node.childNodes].some(child => child.nodeType === Node.TEXT_NODE && child.textContent.trim())) continue;
      const parents = [];
      for (let current = node; current && current !== document.body; current = current.parentElement) parents.unshift(current);
      let background = sky;
      for (const parent of parents) background = blend(rgba(getComputedStyle(parent).backgroundColor), background);
      const foreground = blend(rgba(getComputedStyle(node).color), background);
      const a = luminance(foreground), b = luminance(background);
      const ratio = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
      count++;
      if (ratio < 4.5) failures.push({ text: node.textContent, ratio });
    }
    return { count, failures };
  });
  assert.ok(contrast.count > 50);
  assert.deepEqual(contrast.failures, []);
  assert.deepEqual(errors, []);
  console.log(JSON.stringify({ test: 'ui-panel', contrast }));
} finally { await browser.close(); }
