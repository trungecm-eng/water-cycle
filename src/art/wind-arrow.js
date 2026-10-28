// Read-only decorative geometry, in world coordinates (east to west).
export function windArrow(wind) {
  const strength = Math.max(0, Math.min(100, wind)) / 100;
  const length = 160 + 340 * strength;
  return { visible: strength > 0, length, opacity: 0.25 + 0.6 * strength,
    points: Array.from({ length: 25 }, (_, i) => {
      const t = i / 24;
      return [900 - length * t, 330 + 65 * Math.sin(Math.PI * t), 850];
    }) };
}
