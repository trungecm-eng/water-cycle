import test from 'node:test';
import assert from 'node:assert/strict';
import { generateHeightmap, heightAt } from '../src/sim/heightmap.js';
import { generateDrainage } from '../src/sim/drainage.js';
import { waterBedHeight } from '../src/art/water-shapes.js';
import { valueNoise, ridgedNoise } from '../src/art/noise.js';

// Measured on REQ-004 generateHeightmap, default seed, forward differences.
const LEGACY_MOUNTAIN_SLOPE_STD = 0.7658187580460225;
function measuredMap(surface) {
  const map = generateDrainage();
  if (surface === 'rendered') {
    // Sample from the unmodified map first: the carved bed reads its neighbors.
    const heights = Float64Array.from(map.heights, (_, index) => waterBedHeight(map,
      index % map.stride * map.spacing, Math.floor(index / map.stride) * map.spacing));
    map.heights = heights;
  }
  return map;
}

const deviation = values => {
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return Math.sqrt(values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length);
};

test('seeded value and ridged noise are bounded and reproducible', () => {
  for (let x = -4; x < 4; x += 0.13) {
    for (const noise of [valueNoise, ridgedNoise]) {
      const value = noise(x, x / 3, 404);
      assert.ok(value >= 0 && value <= 1);
      assert.equal(value, noise(x, x / 3, 404));
    }
  }
  assert.notEqual(valueNoise(0.2, 0.7, 404), valueNoise(0.2, 0.7, 405));
});

for (const surface of ['simulation', 'rendered']) test(`${surface} terrain has six prominent summits and twice the legacy slope variation`, t => {
  const map = measuredMap(surface);
  const slopes = [];
  let summits = 0;
  for (let row = 1; row < map.cells; row++) for (let column = 1; column < map.cells; column++) {
    const index = row * map.stride + column;
    if (map.regions[index] !== 'mountain') continue;
    slopes.push(Math.hypot(map.heights[index + 1] - map.heights[index],
      map.heights[index + map.stride] - map.heights[index]) / map.spacing);
    let prominent = true;
    const radius = Math.ceil(40 / map.spacing);
    for (let dz = -radius; dz <= radius; dz++) for (let dx = -radius; dx <= radius; dx++) {
      if ((!dx && !dz) || Math.hypot(dx, dz) * map.spacing > 40) continue;
      if (row + dz < 0 || row + dz > map.cells || column + dx < 0 || column + dx > map.cells) continue;
      if (map.heights[index] - map.heights[index + dz * map.stride + dx] < 15) prominent = false;
    }
    if (prominent) summits++;
  }
  t.diagnostic(JSON.stringify({ summits, mountainSlopeStd: deviation(slopes), maximum: Math.max(...map.heights) }));
  assert.ok(summits >= 6, `summits: ${summits}`);
  assert.ok(deviation(slopes) >= 2 * LEGACY_MOUNTAIN_SLOPE_STD);
  assert.ok(Math.max(...map.heights) >= 280 && Math.max(...map.heights) <= 300);
});

for (const surface of ['simulation', 'rendered']) test(`${surface} plain relief after removing its fitted plane stays between one and six units`, t => {
  const map = measuredMap(surface);
  const points = [];
  for (let row = 1; row < map.cells; row++) for (let column = 1; column < map.cells; column++) {
    const i = row * map.stride + column;
    // Exclude banks and channels, including the pond overflow corridor.
    let interior = true;
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      if (map.regions[i + dz * map.stride + dx] !== 'plain') interior = false;
    }
    if (interior) points.push([column * map.spacing, row * map.spacing, map.heights[i]]);
  }
  const matrix = Array.from({ length: 3 }, () => [0, 0, 0, 0]);
  for (const [x, z, height] of points) {
    const row = [1, x, z];
    for (let i = 0; i < 3; i++) {
      for (let j = 0; j < 3; j++) matrix[i][j] += row[i] * row[j];
      matrix[i][3] += row[i] * height;
    }
  }
  for (let i = 0; i < 3; i++) {
    const divisor = matrix[i][i];
    for (let j = i; j < 4; j++) matrix[i][j] /= divisor;
    for (let k = 0; k < 3; k++) if (k !== i) {
      const factor = matrix[k][i];
      for (let j = i; j < 4; j++) matrix[k][j] -= factor * matrix[i][j];
    }
  }
  const residual = deviation(points.map(([x, z, h]) => h - matrix[0][3] - matrix[1][3] * x - matrix[2][3] * z));
  t.diagnostic(JSON.stringify({ plainResidualStd: residual, samples: points.length }));
  assert.ok(residual >= 1 && residual <= 6, `plain residual: ${residual}`);
});

test('mountain shoulders form a continuous elevated range between summits', () => {
  const map = generateHeightmap();
  // This transect crosses the old flat gaps between the isolated peak envelopes.
  for (let z = 300; z <= 800; z += 10) {
    assert.ok(heightAt(map, 150, z) > 85, `disconnected shoulder at z=${z}`);
  }
});
