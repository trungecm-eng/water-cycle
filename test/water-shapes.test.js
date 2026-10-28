import test from 'node:test';
import assert from 'node:assert/strict';
import { generateDrainage } from '../src/sim/drainage.js';
import { heightAt } from '../src/sim/heightmap.js';
import { basinSurface, channelRibbon, lakeConnection, waterBedHeight } from '../src/art/water-shapes.js';
const map = generateDrainage();

test('basin surfaces follow terrain intersections and reservoir levels', () => {
  for (const [id,level] of [['lake',20],['pond',11.6],['sea',0]]) {
    const surface = basinSurface(map,id,level);
    assert.ok(surface.length > 0);
    assert.deepEqual(surface,basinSurface(map,id,level));
    for (let i=0;i<surface.length;i+=3) {
      assert.equal(surface[i+1],level);
      assert.ok(heightAt(map,surface[i],surface[i+2]) <= level+0.001);
    }
  }
  assert.notDeepEqual(basinSurface(map,'lake',16),basinSurface(map,'lake',24));
});

test('channel ribbons widen downstream and follow their carved beds', () => {
  for (const channel of map.channels.filter(c => ['river','stream'].includes(c.type))) {
    const surface = channelRibbon(map,channel);
    assert.ok(surface.length>(channel.path.length-1)*18);
    for (let i=0;i<surface.length;i+=3) assert.ok(waterBedHeight(map,surface[i],surface[i+2])<surface[i+1]);
    const width = i => Math.hypot(surface[i]-surface[i+3],surface[i+2]-surface[i+5]);
    assert.ok(width(surface.length-18)>width(0));
  }
});

test('lake connector reaches the river and its visible bed is recessed', () => {
  const original = Array.from(map.heights);
  const surface = lakeConnection(map,20);
  const end = map.outlets.lake;
  assert.equal(surface[0],360);
  assert.equal(surface[1],20);
  assert.equal(surface.at(-3),end%map.stride*map.spacing);
  for (let i=0;i<surface.length;i+=3) assert.ok(waterBedHeight(map,surface[i],surface[i+2])<surface[i+1]);
  assert.deepEqual(Array.from(map.heights),original);
});
