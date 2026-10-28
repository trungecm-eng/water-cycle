import { createStageLabels } from './stage-labels.js';
import { qualityLevels } from '../quality.js';
import { content } from '../content.js';
import * as THREE from '../../vendor/three.module.min.js';
import { decorateScene } from './scenery.js';
import { config } from '../config.js';
import { colorAt, coastlineSamples } from '../art/terrain-colors.js';
import { basinSurface, renderedBasinSurface, lakeConnection, waterBedHeight } from '../art/water-shapes.js';
import { renderedRiverSurface } from '../art/channel-surface.js';
import { generateFields, fieldAt } from '../art/fields.js';

function terrainGeometry(map, cells, fields) {
  const positions = [];
  const colors = [];
  const spacing = map.size / cells;
  const samples = [];
  for (let row = 0; row <= cells; row++) for (let column = 0; column <= cells; column++) {
    const x = column * spacing, z = row * spacing;
    samples.push({ point: [x, waterBedHeight(map, x, z), z],
      color: new THREE.Color(colorAt(map, x, z, fieldAt(fields, x, z))).toArray() });
  }
  const stride = cells + 1;
  for (let row = 0; row < cells; row++) for (let column = 0; column < cells; column++) {
    const a = row * stride + column;
    for (const index of [a, a + stride, a + 1, a + 1, a + stride, a + stride + 1]) {
      positions.push(...samples[index].point);
      colors.push(...samples[index].color);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function waterGeometry(positions, levelNormals = false) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  if (levelNormals) {
    const normals = new Float32Array(positions.length);
    for (let i = 1; i < normals.length; i += 3) normals[i] = 1;
    geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
  } else geometry.computeVertexNormals();
  return geometry;
}

export function createRenderer(canvas, world, orbit, stageObserver, focus) {
  // Probe first: three.js logs an error when it has to discover this failure itself.
  let context;
  try { context = canvas.getContext('webgl2', { antialias: true, alpha: false }); } catch { /* Show the fallback below. */ }
  if (!context) {
    const message = document.createElement('p');
    message.setAttribute('role', 'alert');
    message.textContent = content.webglError;
    canvas.replaceWith(message);
    return { webgl2: false, render() {} };
  }
  const renderer = new THREE.WebGLRenderer({ canvas, context, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, config.rendering.maxPixelRatio));
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(config.colors.sky);
  scene.add(new THREE.AmbientLight(0xffffff, config.rendering.ambientLight));
  const sunlight = new THREE.DirectionalLight(0xffffff, config.rendering.sunlight);
  sunlight.position.set(...config.sunlight.position);
  sunlight.shadow.mapSize.set(config.quality.shadowMapSize, config.quality.shadowMapSize);
  Object.assign(sunlight.shadow.camera, { left: -config.quality.shadowExtent, right: config.quality.shadowExtent, top: config.quality.shadowExtent, bottom: -config.quality.shadowExtent, near: config.quality.shadowNear, far: config.quality.shadowFar });
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  sunlight.shadow.radius = config.quality.shadowRadius;
  sunlight.shadow.bias = config.quality.shadowBias;
  sunlight.target.position.set(world.map.size / 2, 0, world.map.size / 2);
  scene.add(sunlight.target);
  scene.add(sunlight);
  const fields = generateFields(world.map);
  const terrain = new THREE.Mesh(terrainGeometry(world.map, qualityLevels.high.terrainCells, fields),
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  terrain.name = 'terrain';
  scene.add(terrain);
  const coast = coastlineSamples(world.map);
  const shorelineX = z => coast[Math.min(coast.length - 1, Math.round(z / world.map.size * (coast.length - 1)))][0];
  let terrainCells = qualityLevels.high.terrainCells;
  const surfaces = {};
  for (const id of ['sea', 'lake', 'pond', 'river', 'stream']) {
    const positions = ['river', 'stream'].includes(id)
      ? world.map.channels.filter(channel => channel.type === id).flatMap(channel => renderedRiverSurface(world.map, channel, terrainCells))
      : id === 'sea' ? basinSurface(world.map, id, world.reservoirs.level(id))
        : renderedBasinSurface(world.map, id, world.reservoirs.level(id), terrainCells);
    const mesh = new THREE.Mesh(waterGeometry(positions, ['river', 'stream'].includes(id)),
      new THREE.MeshStandardMaterial({ color: config.colors[id], transparent: !['river', 'stream'].includes(id),
        opacity: ['river', 'stream'].includes(id) ? 1 : config.rendering.waterOpacity, roughness: 0.25, side: THREE.DoubleSide }));
    if (id === 'sea') {
      const positions = mesh.geometry.attributes.position;
      const colors = [];
      for (let i = 0; i < positions.count; i++) {
        const blend = Math.max(0, Math.min(1, (positions.getX(i) - shorelineX(positions.getZ(i))) / (world.map.size - shorelineX(positions.getZ(i)))));
        colors.push(...new THREE.Color(config.colors.sea).lerp(new THREE.Color(config.colors.seaDeep), blend).toArray());
      }
      mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      mesh.material.color.set(config.colors.cloud);
      mesh.material.vertexColors = true;
    }
    mesh.name = id;
    mesh.userData.level = world.reservoirs.level(id === 'river' || id === 'stream' ? 'sea' : id);
    surfaces[id] = mesh;
    scene.add(mesh);
  }
  const connector = new THREE.Mesh(waterGeometry(lakeConnection(world.map, world.reservoirs.level('lake'))), surfaces.lake.material);
  connector.name = 'lake-outlet';
  scene.add(connector);
  const shoreline = coastlineSamples(world.map);
  const foamPositions = [];
  for (let i = 1; i < shoreline.length; i++) {
    const a = shoreline[i - 1], b = shoreline[i];
    const width = config.art.foamWidth;
    foamPositions.push(...a, ...b, b[0] + width, b[1], b[2],
      ...a, b[0] + width, b[1], b[2], a[0] + width, a[1], a[2]);
  }
  const foamGeometry = new THREE.BufferGeometry();
  foamGeometry.setAttribute('position', new THREE.Float32BufferAttribute(foamPositions, 3));
  const foam = new THREE.Mesh(foamGeometry, new THREE.MeshBasicMaterial({ color: config.colors.foam,
    side: THREE.DoubleSide, transparent: true, opacity: 0.75, depthWrite: false }));
  foam.name = 'shore-foam';
  scene.add(foam);
  const scenery = decorateScene(scene, canvas, world, focus);
  const stages = createStageLabels(canvas, stageObserver, world, focus);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 3), 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 3), 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: config.rendering.particleSize, vertexColors: true }));
  scene.add(points);
  const vaporGeometry = new THREE.BufferGeometry();
  vaporGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 3), 3));
  const vapor = new THREE.Points(vaporGeometry, new THREE.PointsMaterial({ color: config.colors.vapor, size: config.rendering.particleSize, transparent: true, opacity: config.visual.vaporOpacity, depthWrite: false }));
  scene.add(vapor);
  const rainGeometry = new THREE.BufferGeometry();
  rainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 6), 3));
  scene.add(new THREE.LineSegments(rainGeometry, new THREE.LineBasicMaterial({ color: config.colors.rain })));
  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, config.camera.near, config.camera.far);
  return {
    webgl2: true,
    snapshot() {
      const decoration = scenery.snapshot();
      return Object.freeze({ ...decoration, ...stages.snapshot(),
        renderInfo: { calls: renderer.info.render.calls, triangles: renderer.info.render.triangles },
        sunScreen: new THREE.Vector3(...decoration.sun.position).project(camera).toArray(),
        fields: fields.length, terrainTriangles: terrain.geometry.attributes.position.count / 3,
        shadows: renderer.shadowMap.enabled, pixelRatio: renderer.getPixelRatio() });
    },
    setQuality(level) {
      const settings = qualityLevels[level];
      terrainCells = settings.terrainCells;
      for (const id of ['lake', 'pond']) surfaces[id].userData.level = NaN;
      for (const id of ['river', 'stream']) {
        surfaces[id].geometry.dispose();
        surfaces[id].geometry = waterGeometry(world.map.channels.filter(channel => channel.type === id)
          .flatMap(channel => renderedRiverSurface(world.map, channel, terrainCells)), true);
      }
      terrain.geometry.dispose();
      terrain.geometry = terrainGeometry(world.map, settings.terrainCells, fields);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatio));
      renderer.shadowMap.enabled = settings.shadows;
      sunlight.castShadow = settings.shadows;
      terrain.castShadow = settings.shadows;
      terrain.receiveShadow = settings.shadows;
      scenery.setQuality(settings);
      scene.traverse(object => { if (object.material) object.material.needsUpdate = true; });
    },
    render(paused = false) {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      // Preserve the full overview when a tall window narrows the scene.
      camera.fov = 2 * Math.atan(Math.tan(config.camera.fov * Math.PI / 360)
        * Math.max(1, config.camera.referenceAspect / camera.aspect)) * 180 / Math.PI;
      camera.updateProjectionMatrix();
      const view = orbit.snapshot();
      camera.position.set(view.position.x, view.position.y, view.position.z);
      camera.lookAt(...view.target);
      for (const id of ['lake', 'pond']) {
        const level = world.reservoirs.level(id);
        if (surfaces[id].userData.level !== level) {
          surfaces[id].geometry.dispose();
          surfaces[id].geometry = waterGeometry(renderedBasinSurface(world.map, id, level, terrainCells));
          surfaces[id].userData.level = level;
          if (id === 'lake') {
            connector.geometry.dispose();
            connector.geometry = waterGeometry(lakeConnection(world.map, level));
            connector.visible = world.reservoirs.count(id) > 0;
          }
        }
        surfaces[id].visible = world.reservoirs.count(id) > 0;
      }
      sunlight.intensity = config.rendering.sunlight * (0.7 + world.sun / 100 * 0.3);
      let count = 0, vaporCount = 0, rainCount = 0;
      const clustered = new Set(world.clusters.filter(cluster => cluster.visible).flatMap(cluster => cluster.ids));
      for (const particle of world.particles) {
        if (particle.state === 'water' || (particle.state === 'cloud' && clustered.has(particle.id))) continue;
        if (particle.state === 'vapor') {
          vaporGeometry.attributes.position.setXYZ(vaporCount++, particle.x, particle.y, particle.z);
          continue;
        }
        if (particle.state === 'rain') {
          rainGeometry.attributes.position.setXYZ(rainCount * 2, particle.x, particle.y, particle.z);
          rainGeometry.attributes.position.setXYZ(rainCount * 2 + 1, particle.x, particle.y + config.scenery.rainLength, particle.z);
          rainCount++;
          continue;
        }
        geometry.attributes.position.setXYZ(count, particle.x, particle.y, particle.z);
        const color = new THREE.Color(config.colors[particle.state]);
        geometry.attributes.color.setXYZ(count, color.r, color.g, color.b);
        count++;
      }
      vaporGeometry.setDrawRange(0, vaporCount);
      vaporGeometry.attributes.position.needsUpdate = true;
      rainGeometry.setDrawRange(0, rainCount * 2);
      rainGeometry.attributes.position.needsUpdate = true;
      geometry.setDrawRange(0, count);
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
      camera.updateMatrixWorld();
      scenery.update(camera);
      stages.update(camera, paused);
      renderer.render(scene, camera);
    }
  };
}
