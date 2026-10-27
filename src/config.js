function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') deepFreeze(child);
  }
  return Object.freeze(value);
}

export const config = deepFreeze({
  world: { width: 1000, height: 600 },
  terrain: [[0, 340], [100, 340], [250, 250], [420, 150], [560, 85], [640, 60], [1000, 60]],
  lake: { left: 640, bottom: 60, cellSize: 6, columns: 60, rows: 20, levelPerParticle: 0.1 },
  defaults: { n: 600, sun: 50, wind: 40, seed: 1, speed: 1, paused: false },
  limits: { minParticles: 100, maxParticles: 1200, minControl: 0, maxControl: 100, minSpeed: 0.5, maxSpeed: 8 },
  clock: { dt: 1 / 60, maxFrame: 0.25, speeds: [0.5, 1, 2, 4] },
  heat: { baseline: 20, evaporationTemp: 80, condenseTemp: 20, environmentBase: 30, lapseRate: 0.09, cooling: 2, vaporCooling: 0.6, rayHeat: 35, raysPerSecond: 30, raySpeed: 700 },
  motion: { buoyancy: 18, vaporMaxSpeed: 35, windSpeed: 30, gravity: 80, rainMaxSpeed: 150, runoffSpeed: 24 },
  cloud: { clusterRadius: 40, cloudMinSize: 30, rainStartSize: 80, rainRate: 0.15 },
  sun: { x: 840, y: 510, radius: 34 },
  visual: { particleRadius: 2, vaporOpacity: 0.14, cloudOpacity: 0.12, shakeAmplitude: 1.5 },
  colors: { sky: '#cdeefa', terrain: '#708756', lake: '#85c9ec', water: '#197bc2', vapor: '#ffffff', cloud: '#ffffff', rain: '#145b98', runoff: '#145b98', sun: '#ffcf50', ray: '#f4b942', text: '#16364c' }
});
