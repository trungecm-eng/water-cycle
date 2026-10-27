import assert from 'node:assert/strict';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';

const browser = await launchBrowser();

async function setSlider(page, name, value) {
  await page.locator(`#${name}`).fill(String(value));
  assert.equal(await page.evaluate(name => window.__sim[name], name), value);
  assert.equal(await page.locator(`#${name}-value`).textContent(), String(value));
}

async function pauseAndCheck(page) {
  if (!await page.evaluate(() => window.__sim.paused)) await page.locator('#pause').click();
  const before = await page.evaluate(() => window.__sim);
  await page.waitForTimeout(150);
  assert.deepEqual(await page.evaluate(() => window.__sim), before);
}

async function runFlow(interrupted) {
  const page = await browser.newPage({ viewport: { width: 1024, height: 900 } });
  const errors = trackErrors(page);
  try {
    await page.addInitScript(() => {
      window.cycleEvidence = { states: {}, milestones: {}, heated: false, cloud: false };
      function observe() {
        const sim = window.__sim;
        if (sim) {
          const evidence = window.cycleEvidence;
          for (const [state, count] of Object.entries(sim.counts)) if (count) evidence.states[state] = true;
          evidence.heated ||= sim.particles.some(particle => particle.state === 'water' && particle.temperature > 20);
          evidence.cloud ||= sim.clusters.some(cluster => cluster.visible);
          for (const [name, happened] of Object.entries({ evaporation: sim.evaporations > 0,
            cloud: evidence.cloud, rain: sim.counts.rain > 0, return: sim.returns > 0 })) {
            if (happened) evidence.milestones[name] ??= sim.time;
          }
        }
        requestAnimationFrame(observe);
      }
      requestAnimationFrame(observe);
    });
    await page.goto(`${baseUrl}/${interrupted ? '?speed=8' : ''}`);
    await page.waitForFunction(() => window.__sim);
    assert.equal(await page.evaluate(() => document.body.scrollWidth <= innerWidth), true);
    assert.equal(await page.locator('#legend li').count(), 5);
    if (interrupted) {
      await page.waitForFunction(() => window.__sim.evaporations > 0);
      for (let i = 0; i < 3; i++) {
        await pauseAndCheck(page);
        await page.setViewportSize({ width: i % 2 ? 1280 : 1050, height: 800 + i * 20 });
        await page.locator('#pause').click();
      }
    }
    await page.waitForFunction(() => window.cycleEvidence.milestones.return !== undefined && window.cycleEvidence.cloud
      && window.cycleEvidence.states.rain, null, { timeout: 125000 });
    const evidence = await page.evaluate(() => window.cycleEvidence);
    for (const [name, deadline] of Object.entries({ evaporation: 10, cloud: 45, rain: 75, return: 120 })) {
      // Browser observation can lag one frame behind the actual fixed-step event.
      assert.ok(evidence.milestones[name] <= deadline, `${name}: ${JSON.stringify(evidence)}`);
    }
    assert.ok(evidence.heated && evidence.states.vapor && evidence.states.cloud);
    await pauseAndCheck(page);
    const stageNames = { vapor: 'Bốc hơi', cloud: 'Ngưng tụ thành mây', rain: 'Mưa rơi', runoff: 'Chảy về hồ' };
    const pausedCounts = await page.evaluate(() => window.__sim.counts);
    assert.equal(await page.locator('[data-hud="stages"]').textContent(),
      Object.entries(stageNames).filter(([state]) => pausedCounts[state] > 0).map(([, name]) => name).join(' · '));
    for (const [state, count] of Object.entries(pausedCounts)) {
      assert.equal(await page.locator(`[data-hud="${state}"]`).textContent(), String(count));
    }
    const beforeSliders = await page.evaluate(() => window.__sim.particles);
    await setSlider(page, 'sun', 0);
    await setSlider(page, 'wind', 0);
    assert.deepEqual(await page.evaluate(() => window.__sim.particles), beforeSliders);
    const evaporations = await page.evaluate(() => window.__sim.evaporations);
    await page.locator('#pause').click();
    const time = await page.evaluate(() => window.__sim.time);
    await page.waitForFunction(time => window.__sim.time >= time + 1, time);
    assert.equal(await page.evaluate(() => window.__sim.evaporations), evaporations);
    await setSlider(page, 'sun', 100);
    await setSlider(page, 'wind', 100);
    await page.locator('[data-speed="2"]').click();
    assert.equal(await page.evaluate(() => window.__sim.speed), 2);
    await page.locator('h1').click();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.__sim.paused), true);
    for (const [key, speed] of [['1', 0.5], ['2', 1], ['3', 2], ['4', 4]]) {
      await page.keyboard.press(key);
      assert.equal(await page.evaluate(() => window.__sim.speed), speed);
    }
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.__sim.paused), false);
    await page.keyboard.press('r');
    const reset = await page.evaluate(() => window.__sim);
    assert.equal(reset.counts.water, 600);
    assert.equal(reset.returns, 0);
    assert.equal(reset.evaporations, 0);
    assert.equal(reset.speed, 1);
    assert.equal(reset.paused, false);
    assert.equal(reset.sun, 100);
    assert.equal(reset.wind, 100);
    await page.locator('#reset').click();
    assert.equal(await page.evaluate(() => window.__sim.returns), 0);
    // Mutating any returned snapshot must leave the next snapshot unchanged.
    assert.equal(await page.evaluate(() => {
      const sim = window.__sim;
      try { sim.particles[0].x = -100; } catch {}
      try { sim.counts.water = -1; } catch {}
      return Object.isFrozen(sim) && Object.isFrozen(sim.particles[0])
        && window.__sim.particles[0].x >= 0 && window.__sim.counts.water === 600;
    }), true);
    assert.deepEqual(errors, []);
    console.log(JSON.stringify({ flow: interrupted ? 'interrupted' : 'default x1', evidence }));
  } finally {
    await page.close();
  }
}

async function checkUrls() {
  const cases = [
    ['?n=300&sun=80&wind=0&seed=7&speed=8&paused=1', { n: 300, sun: 80, wind: 0, speed: 8, paused: true }],
    ...['n=50', 'n=5000', 'n=abc', 'sun=-5', 'wind=200', 'speed=0'].map(query =>
      [`?${query}&paused=1`, { n: 600, sun: 50, wind: 40, speed: 1, paused: true }])
  ];
  for (const [query, expected] of cases) {
    const page = await browser.newPage();
    const errors = trackErrors(page);
    try {
      await page.goto(`${baseUrl}/${query}`);
      await page.waitForFunction(() => window.__sim);
      assert.deepEqual(await page.evaluate(() => {
        const sim = window.__sim;
        return { n: sim.particles.length, sun: sim.sun, wind: sim.wind, speed: sim.speed, paused: sim.paused };
      }), expected);
      if (query.includes('seed=7')) {
        await page.locator('#pause').click();
        await page.waitForFunction(() => window.__sim.time >= 2);
        await page.locator('#pause').click();
        assert.equal(await page.evaluate(async () => {
          const { World } = await import('/src/sim/world.js');
          const sim = window.__sim;
          const expected = new World({ n: 300, sun: 80, wind: 0, seed: 7 });
          for (let step = 0; step < Math.round(sim.time * 60); step++) expected.step();
          const snapshot = expected.snapshot();
          return Object.keys(snapshot).every(key => JSON.stringify(snapshot[key]) === JSON.stringify(sim[key]));
        }), true);
      }
      assert.deepEqual(errors, []);
    } finally {
      await page.close();
    }
  }
  console.log('URL cases passed');
}

try {
  await runFlow(false);
  await runFlow(true);
  await checkUrls();
} finally {
  await browser.close();
}
