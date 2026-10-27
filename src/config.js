function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') deepFreeze(child);
  }
  return Object.freeze(value);
}

export const config = deepFreeze({
  world: { width: 1000, height: 600, depth: 1000, seaLevel: 0, gridCells: 96 },
  camera: { target: [500, 40, 500], azimuth: 2.35, elevation: 38, distance: 1500,
    minElevation: 10, maxElevation: 85, minDistance: 220, maxDistance: 2400,
    clearance: 20, rotateSpeed: 0.006, keyRotate: 0.08, zoomSpeed: 0.001, keyZoom: 0.1,
    fov: 45, near: 1, far: 6000 },
  rendering: { maxPixelRatio: 2, ambientLight: 1.6, sunlight: 2.2, waterOpacity: 0.72,
    particleSize: 4, waterOffset: 0.15 },
  terrain: [[0, 340], [100, 340], [250, 250], [420, 150], [560, 85], [640, 60], [1000, 60]],
  lake: { left: 640, bottom: 60, cellSize: 6, columns: 60, rows: 20, levelPerParticle: 0.1 },
  defaults: { n: 1000, sun: 50, wind: 40, seed: 1, speed: 1, paused: false },
  limits: { minParticles: 100, maxParticles: 2000, minControl: 0, maxControl: 100, minSpeed: 0.5, maxSpeed: 8 },
  clock: { dt: 1 / 60, maxFrame: 0.25, epsilon: 1e-12, speeds: [0.5, 1, 2, 4] },
  evaporation: { ratePerArea: 0.00008, temperature: 90, sampleAttempts: 32 },
  sunlight: { position: [800, 650, 200], rayCount: 8, rayOpacity: 0.4 },
  heat: { baseline: 20, evaporationTemp: 80, condenseTemp: 20, environmentBase: 30, lapseRate: 0.09, cooling: 2, vaporCooling: 0.6, rayHeat: 35, raysPerSecond: 30, raySpeed: 700 },
  motion: { airClearance: 0.2, cloudDrift: 0.3, collisionIterations: 40, buoyancy: 18, vaporMaxSpeed: 35, windSpeed: 30, gravity: 80, rainMaxSpeed: 150, runoffSpeed: 24 },
  cloud: { clusterRadius: 40, cloudMinSize: 30, rainStartSize: 80, rainRate: 0.15, coldRainFactor: 3 },
  sun: { x: 840, y: 510, radius: 34 },
  visual: { particleRadius: 2, vaporOpacity: 0.14, cloudOpacity: 0.12, shakeAmplitude: 1.5, shakeFrequency: 24, rayRadius: 2.5 },
  colors: { sky: '#cdeefa', sea: '#63bdbf', beach: '#efdda4', plain: '#91bd79', foothill: '#618765', slope: '#ac947f', summit: '#969aa0', soil: '#997356', rock: '#777d87', mud: '#8a755d', stream: '#72c6e8', pond: '#72c6e8', terrain: '#708756', lake: '#85c9ec', water: '#197bc2', vapor: '#ffffff', cloud: '#ffffff', rain: '#145b98', runoff: '#145b98', sun: '#ffcf50', ray: '#f4b942', text: '#16364c' }
});
