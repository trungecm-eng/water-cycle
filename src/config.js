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
    transitionDuration: 1, clearance: 20, rotateSpeed: 0.006, keyRotate: 0.08, zoomSpeed: 0.001, keyZoom: 0.1,
    fov: 45, referenceAspect: 5 / 3, near: 1, far: 6000 },
  stats: { trendWindow: 10, trendEnter: 3, trendExit: 1 },
  quality: { slowFps: 30, slowDuration: 5, levels: {
    high: { trees: 2200, terrainCells: 160, waves: true, shadows: true, cloudBlocksMax: 12, pixelRatio: 2 },
    low: { trees: 400, terrainCells: 80, waves: false, shadows: false, cloudBlocksMax: 7, pixelRatio: 1 }
  }, shadowMapSize: 1024, shadowExtent: 900, shadowNear: 1, shadowFar: 2500, shadowBias: -0.001, shadowRadius: 3 },
  rendering: { maxPixelRatio: 2, ambientLight: 1.6, sunlight: 2.2, waterOpacity: 0.72,
    particleSize: 4, waterOffset: 0.15 },
  art: { cloudSaturation: 180, rainColumns: 24, maxSunbeams: 30, sunbeamLength: 105, treeSlope: 1.1, treeSpacing: 8, snowHeight: 230, slopeThreshold: 1.1, foothillHeight: 65, colorNoiseScale: 65,
    fieldSlope: 0.25, fieldCount: 36, fieldAttempts: 600, bankClearance: 12,
    foamSegments: 220, foamWidth: 4 },
  scenery: { base: -95, seaFaceOpacity: 0.55,
    fogNear: 2000, fogFar: 4800, skyRadius: 2900, waveSpacing: 60, waveStart: 810,
    waveLength: 28, waveHeight: 0.7, waveOpacity: 0.32, waveSpeed: 0.45, waveTravel: 8,
    flowRadius: 2.5, flowOpacity: 0.8, flowsPerChannel: 8, flowSpeed: 1.8, flowHeight: 1,
    rainLength: 7 },
  defaults: { n: 1000, sun: 50, wind: 40, seed: 1, speed: 1, paused: false },
  limits: { minParticles: 100, maxParticles: 2000, minControl: 0, maxControl: 100, minSpeed: 0.5, maxSpeed: 8 },
  clock: { dt: 1 / 60, maxFrame: 0.25, epsilon: 1e-12, speeds: [0.5, 1, 2, 4] },
  evaporation: { ratePerArea: 0.00008, temperature: 90, sampleAttempts: 32 },
  sunlight: { position: [800, 650, 200], rayCount: 8 },
  heat: { baseline: 20, evaporationTemp: 80, condenseTemp: 20, environmentBase: 30, lapseRate: 0.09, cooling: 2, vaporCooling: 0.6, rayHeat: 35, raysPerSecond: 30, raySpeed: 700 },
  motion: { airClearance: 0.2, cloudDrift: 0.3, collisionIterations: 40, buoyancy: 18, vaporMaxSpeed: 35, windSpeed: 30, gravity: 80, rainMaxSpeed: 150, runoffSpeed: 24, runoffMinSpeed: 40, runoffSlopeSpeed: 100 },
  cloud: { clusterRadius: 40, cloudMinSize: 30, rainStartSize: 80, rainRate: 0.15, coldRainFactor: 3 },
  sun: { x: 840, y: 510, radius: 34 },
  visual: { particleRadius: 2, vaporOpacity: 0.14, cloudOpacity: 0.12, shakeAmplitude: 1.5, shakeFrequency: 24, rayRadius: 2.5 },
  colors: { treeDark: '#376d61', treeLight: '#78a17c', trunk: '#94745e', sky: '#f7ebd6', skyHigh: '#78b8de', seaDeep: '#338d9f', foam: '#d4f5f5', cloudDark: '#7e8c9e', sea: '#63bdbf', beach: '#efdda4', plain: '#91bd79', plainLight: '#b2ce92', foothillLight: '#769774', snow: '#fff5e1', fieldGold: '#dfd8a2', fieldSage: '#b7c88f', fieldMint: '#c5d8a8', foothill: '#618765', slope: '#ac947f', summit: '#969aa0', grassEdge: '#789766', soilLight: '#c7aa83', groundShadow: '#4d5260', soil: '#997356', rock: '#777d87', mud: '#8a755d', river: '#72c6e8', stream: '#72c6e8', pond: '#72c6e8', terrain: '#708756', lake: '#85c9ec', water: '#197bc2', vapor: '#ffffff', cloud: '#ffffff', rain: '#145b98', runoff: '#145b98', sun: '#ffcf50', ray: '#f4b942', text: '#16364c' }
});
