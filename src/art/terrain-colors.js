import { config } from '../config.js';
import { heightAt } from '../sim/heightmap.js';
import { cellAt } from '../sim/drainage.js';
import { valueNoise } from './noise.js';
import { mapData } from '../map-data.js';

export function terrainSample(map, x, z) {
  const step = map.spacing / 2;
  const left = Math.max(0, x - step), right = Math.min(map.size, x + step);
  const near = Math.max(0, z - step), far = Math.min(map.size, z + step);
  return {
    height: heightAt(map, x, z), region: map.regions[cellAt(map, x, z)],
    slope: Math.hypot((heightAt(map, right, z) - heightAt(map, left, z)) / (right - left),
      (heightAt(map, x, far) - heightAt(map, x, near)) / (far - near))
  };
}

// Explicit region precedence prevents steep underwater banks from becoming grass.
export function terrainColor({ height, slope, region, noise = 0.5, field = null }) {
  const colors = config.colors;
  if (['sea', 'lake', 'pond', 'river', 'stream'].includes(region)) return colors.mud;
  if (region === 'beach') return colors.beach;
  if (height >= config.art.snowHeight) return colors.snow;
  if (slope >= config.art.slopeThreshold) return colors.slope;
  if (field) return field;
  if (height >= config.art.foothillHeight) return noise < 0.5 ? colors.foothill : colors.foothillLight;
  return noise < 0.5 ? colors.plain : colors.plainLight;
}

export function colorAt(map, x, z, field = null, data = mapData) {
  return terrainColor({ ...terrainSample(map, x, z),
    noise: valueNoise(x / config.art.colorNoiseScale, z / config.art.colorNoiseScale, data.seed ^ 0x46a3), field });
}

export function coastlineSamples(map) {
  const points = [];
  for (let i = 0; i <= config.art.foamSegments; i++) {
    const z = map.size * i / config.art.foamSegments;
    let left = map.size / 2, right = map.size;
    for (let step = 0; step < 24; step++) {
      const x = (left + right) / 2;
      if (heightAt(map, x, z) > mapData.seaLevel) left = x;
      else right = x;
    }
    points.push([right, mapData.seaLevel + 0.2, z]);
  }
  return points;
}
