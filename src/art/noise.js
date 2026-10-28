// Coordinate hashing keeps decoration independent of the simulation RNG.
function hash(x, z, seed) {
  let value = Math.imul(x, 374761393) ^ Math.imul(z, 668265263) ^ seed;
  value = Math.imul(value ^ (value >>> 13), 1274126177);
  return ((value ^ (value >>> 16)) >>> 0) / 4294967295;
}

export function valueNoise(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const smooth = t => t * t * (3 - 2 * t);
  const u = smooth(x - ix), v = smooth(z - iz);
  const mix = (a, b, t) => a + (b - a) * t;
  return mix(mix(hash(ix, iz, seed), hash(ix + 1, iz, seed), u),
    mix(hash(ix, iz + 1, seed), hash(ix + 1, iz + 1, seed), u), v);
}

export function ridgedNoise(x, z, seed) {
  return 1 - Math.abs(2 * valueNoise(x, z, seed) - 1);
}
