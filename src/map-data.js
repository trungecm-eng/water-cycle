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
    { x: 150, z: 500, height: 280, radiusX: 135, radiusZ: 230 },
    { x: 115, z: 210, height: 205, radiusX: 120, radiusZ: 145 },
    { x: 145, z: 800, height: 220, radiusX: 130, radiusZ: 165 }
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
  labels: [
    { id: 'mountain', text: 'Núi', position: [150, 320, 500] },
    { id: 'plain', text: 'Đồng bằng', position: [540, 40, 750] },
    { id: 'stream', text: 'Suối', position: [240, 125, 710] },
    { id: 'river', text: 'Sông', position: [600, 35, 505] },
    { id: 'lake', text: 'Hồ', position: [360, 45, 620] },
    { id: 'pond', text: 'Ao', position: [560, 30, 280] },
    { id: 'sea', text: 'Biển', position: [880, 25, 650] }
  ]
});
