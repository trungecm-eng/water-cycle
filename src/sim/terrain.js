import { config } from '../config.js';

export function terrainHeight(x) {
  const points = config.terrain;
  if (x <= points[0][0]) return points[0][1];
  for (let i = 1; i < points.length; i++) {
    const [rightX, rightY] = points[i];
    if (x <= rightX) {
      const [leftX, leftY] = points[i - 1];
      return leftY + (rightY - leftY) * (x - leftX) / (rightX - leftX);
    }
  }
  return points.at(-1)[1];
}

export function isInsideTerrain(x, y) {
  return x >= 0 && x <= config.world.width && y < terrainHeight(x);
}
