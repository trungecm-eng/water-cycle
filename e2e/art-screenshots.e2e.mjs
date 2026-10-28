import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { launchBrowser, baseUrl, trackErrors } from './browser.mjs';
const directory = 'specs/REQ-006/screenshots';
await mkdir(directory,{recursive:true});
const browser = await launchBrowser();
try {
  const page = await browser.newPage({viewport:{width:1920,height:1080}});
  const errors = trackErrors(page), evidence = [];
  async function capture(name) {
    await page.waitForTimeout(1000);
    const state = await page.evaluate(() => window.__sim);
    await page.screenshot({path:`${directory}/${name}.png`});
    evidence.push({name,time:state.time,wind:state.wind,quality:state.quality.level,camera:state.camera,scene:state.scene});
  }
  await page.goto(`${baseUrl}/?quality=low&speed=8`);
  await page.waitForFunction(() => {
    const labels = Object.values(window.__sim?.scene.stageLabels ?? {});
    if (labels.length !== 4 || !labels.every(s=>s.visible && s.opacity >= 0.95)) return false;
    document.querySelector('#pause').click();
    return true;
  },null,{timeout:120000});
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
    await page.goto(`${baseUrl}/?quality=low&speed=8&wind=${wind}`);
    await page.waitForFunction(wind => {
      const s=window.__sim, label=s?.scene.stageLabels.rain;
      if (!(label?.visible && label.opacity >= 0.25 && s.scene.rainStreaks > 0)) return false;
      const particles = new Map(s.particles.map(p => [p.id,p]));
      const inRegion = s.clusters.filter(c=>c.raining).some(c=>{
        const x=c.ids.reduce((sum,id)=>sum+particles.get(id).x,0)/c.ids.length;
        return wind === 0 ? x>800 && label.position[0]>800 : x<400;
      });
      if (!inRegion) return false;
      document.querySelector('#pause').click();
      return true;
    },wind,{timeout:120000});
    await page.locator('[data-quality="high"]').click();
    await capture(name);
  }
  assert.deepEqual(errors,[]);
  await writeFile(`${directory}/evidence.json`,JSON.stringify({browser:browser.version(),viewport:'1920x1080',errors,evidence},null,2)+'\n');
  console.log('art-screenshots: nine images captured');
} finally { await browser.close(); }
