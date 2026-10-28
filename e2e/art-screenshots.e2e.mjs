import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const directory = 'specs/REQ-006/screenshots';
await mkdir(directory,{recursive:true});
const browser = await launchBrowser();
try {
  const page = await browser.newPage({viewport:{width:1280,height:800}});
  const errors = trackErrors(page), evidence = [];
  async function capture(name) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => window.__sim);
    await page.screenshot({path:`${directory}/${name}.png`});
    console.log(`art-screenshots: captured ${name}`);
    evidence.push({name,time:state.time,wind:state.wind,quality:state.quality.level,camera:state.camera,reservoirs:state.reservoirs,scene:state.scene});
  }
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  // Reach the cycle quickly, then let real-time label smoothing catch up at ×1.
  // At ×8 a cloud can change before the 0.4 s fade finishes; requiring four
  // opaque labels at that speed can miss every otherwise valid cycle.
  await page.waitForFunction(() => {
    const labels = Object.values(window.__sim?.scene.stageLabels ?? {});
    if (labels.length !== 4 || !labels.every(label => label.target)) return false;
    document.querySelector('[data-speed="1"]').click();
    return true;
  }, null, { timeout: 120000 });
  console.log('art-screenshots: cycle targets found, waiting at x1');
  await page.waitForFunction(() => {
    const labels = Object.values(window.__sim?.scene.stageLabels ?? {});
    if (labels.length !== 4 || !labels.every(s=>s.visible && s.opacity >= 0.95)) return false;
    document.querySelector('#pause').click();
    return true;
  },null,{timeout:120000});
  await page.setViewportSize({width:1920,height:1080});
  await page.locator('[data-quality="high"]').click();
  for (const [index,view] of ['overview','sea','mountain','river'].entries()) {
    await page.locator(`[data-view="${view}"]`).click();
    await page.waitForTimeout(1400);
    await capture(`0${index+1}-${view}`);
  }
  await page.locator('[data-view="overview"]').click();
  await page.waitForTimeout(1400);
  assert.equal(await page.locator('.stage-label:visible').count(),4);
  await capture('09-four-stages');
  await page.locator('[data-region="plain"]').click();
  await page.waitForTimeout(1400);
  await capture('07-forest-fields');
  await page.locator('[data-view="overview"]').click();
  await page.waitForTimeout(1400);
  await page.locator('#world').focus();
  for (let i=0;i<4;i++) await page.keyboard.press('ArrowDown');
  await capture('08-cutaway');
  for (const [wind,name] of [[40,'05-mountain-rain'],[0,'06-sea-rain']]) {
    await page.setViewportSize({width:1280,height:800});
    await page.goto(`${baseUrl}/?quality=low&speed=8&wind=${wind}`);
    // Follow the actual label target, rather than any rainy cloud elsewhere.
    await page.waitForFunction(wind => {
      const s = window.__sim, label = s?.scene.stageLabels.rain;
      if (!label?.target) return false;
      const cluster = s.clusters.find(c => c.raining && `cluster-${Math.min(...c.ids)}` === label.target);
      if (!cluster) return false;
      const particles = new Map(s.particles.map(p => [p.id, p]));
      const x = cluster.ids.reduce((sum, id) => sum + particles.get(id).x, 0) / cluster.ids.length;
      if (!(wind === 0 ? x > 800 : x < 400)) return false;
      document.querySelector('[data-speed="1"]').click();
      return true;
    }, wind, { timeout: 120000 });
    await page.waitForFunction(wind => {
      const s = window.__sim, label = s?.scene.stageLabels.rain;
      if (!(label?.visible && label.opacity >= 0.95 && s.scene.rainStreaks > 0)) return false;
      const cluster = s.clusters.find(c => c.raining && `cluster-${Math.min(...c.ids)}` === label.target);
      if (!cluster) return false;
      const particles = new Map(s.particles.map(p => [p.id, p]));
      const center = ['x', 'y', 'z'].map(axis => cluster.ids.reduce((sum, id) => sum + particles.get(id)[axis], 0) / cluster.ids.length);
      center[1] += 25;
      if (Math.hypot(...center.map((value, axis) => value - label.position[axis])) > 60) return false;
      if (!(wind === 0 ? center[0] > 800 && label.position[0] > 800 : center[0] < 400 && label.position[0] < 400)) return false;
      document.querySelector('#pause').click();
      return true;
    }, wind, { timeout: 120000 });
    await page.setViewportSize({width:1920,height:1080});
    await page.locator('[data-quality="high"]').click();
    await capture(name);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${directory}/evidence.json`,JSON.stringify({browser:browser.version(),viewport:'1920x1080',errors,evidence},null,2)+'\n');
  console.log('art-screenshots: nine images captured');
} finally { await browser.close(); }
