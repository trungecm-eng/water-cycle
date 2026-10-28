function deepFreeze(value) {
  for (const child of Object.values(value)) {
    if (child && typeof child === 'object') deepFreeze(child);
  }
  return Object.freeze(value);
}

export const mapData = deepFreeze({
  seed: 404,
  size: 1000,
  cells: 96,
  seaLevel: 0,
  mountainEdge: 300,
  coast: { x: 750, amplitude: 28, wavelength: 170, beachWidth: 22, depthSlope: 0.18 },
  plain: { base: 5, slope: 0.045 },
  noise: { amplitude: 1.2 },
  drainage: { minimumRise: 0.001, channelRise: 0.25, channelDepth: 2, pondOverflow: [[585, 280], [680, 280], [800, 280]] },
  peaks: [
    { x: 94, z: 156, height: 275, radiusX: 65, radiusZ: 100 },
    { x: 208, z: 292, height: 280, radiusX: 70, radiusZ: 95 },
    { x: 94, z: 448, height: 290, radiusX: 68, radiusZ: 105 },
    { x: 208, z: 584, height: 285, radiusX: 70, radiusZ: 100 },
    { x: 94, z: 740, height: 280, radiusX: 68, radiusZ: 100 },
    { x: 208, z: 876, height: 275, radiusX: 70, radiusZ: 95 }
  ],
  windShelterDistance: 80,
  ridge: [[0, 115], [210, 115], [500, 150], [800, 145], [1000, 145]],
  streams: [
    { id: 'north', destination: 'lake', points: [[180, 760], [240, 710], [300, 655], [360, 620]] },
    { id: 'central', destination: 'lake', points: [[190, 510], [245, 550], [300, 590], [360, 620]] },
    { id: 'south', destination: 'river', points: [[170, 240], [260, 340], [350, 440], [460, 550]] }
  ],
  river: { points: [[400, 610], [460, 550], [535, 580], [600, 505], [680, 550], [790, 520]] },
  reservoirs: {
    sea: { initial: 740, capacity: null, level: 0 },
    lake: { x: 360, z: 620, radiusX: 48, radiusZ: 43, bottom: 12, levelPerParticle: 0.04, initial: 200, capacity: 320, outlet: [400, 610] },
    pond: { x: 560, z: 280, radiusX: 25, radiusZ: 21, bottom: 8, levelPerParticle: 0.06, initial: 60, capacity: 120, outlet: [585, 280] }
  },
  views: {
    overview: { target: [500, 40, 500], azimuth: 2.35, elevation: 38, distance: 1500 },
    sea: { target: [420, 90, 500], azimuth: Math.PI / 2, elevation: 22, distance: 1200 },
    mountain: { target: [240, 110, 550], azimuth: 2.1, elevation: 42, distance: 650 },
    river: { target: [560, 35, 550], azimuth: Math.PI / 2, elevation: 28, distance: 720 }
  },
  labels: [
    { id: 'mountain', position: [150, 320, 500] },
    { id: 'plain', position: [540, 40, 750] },
    { id: 'stream', position: [240, 125, 710] },
    { id: 'river', position: [600, 35, 505] },
    { id: 'lake', position: [360, 45, 620] },
    { id: 'pond', position: [560, 30, 280] },
    { id: 'sea', position: [880, 25, 650] }
  ]
});
