// Largest remainders preserve an exact displayed total without biasing small groups.
export function percentages(counts) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);
  const entries = Object.entries(counts).map(([id, count], index) => {
    const exact = total ? count * 100 / total : 0;
    return { id, index, value: Math.floor(exact), remainder: exact % 1 };
  });
  let remaining = total ? 100 - entries.reduce((sum, entry) => sum + entry.value, 0) : 0;
  for (const entry of [...entries].sort((a, b) => b.remainder - a.remainder || a.index - b.index)) {
    if (remaining-- > 0) entry.value++;
  }
  return Object.fromEntries(entries.map(({ id, value }) => [id, value]));
}

export function waterDistribution(world) {
  const counts = { sea: 0, lake: 0, pond: 0, airborne: 0, rain: 0, runoff: 0 };
  for (const particle of world.particles) {
    const id = particle.state === 'water' ? particle.reservoir
      : ['vapor', 'cloud'].includes(particle.state) ? 'airborne' : particle.state;
    counts[id]++;
  }
  return { counts, percentages: percentages(counts), total: world.particles.length };
}
