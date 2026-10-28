import { qualityLevels } from '../quality.js';
import { content } from '../content.js';
import * as THREE from '../../vendor/three.module.min.js';
import { decorateScene } from './scenery.js';
import { config } from '../config.js';

function terrainGeometry(map, step = 1) {
  const positions = [];
  const colors = [];
  const point = index => [index % map.stride * map.spacing, map.heights[index], Math.floor(index / map.stride) * map.spacing];
  for (let row = 0; row < map.cells; row += step) for (let column = 0; column < map.cells; column += step) {
    const a = row * map.stride + column;
    for (const triangle of [[a, a + map.stride * step, a + step], [a + step, a + map.stride * step, a + map.stride * step + step]]) {
      for (const index of triangle) {
        positions.push(...point(index));
        const region = map.regions[index];
        const color = region === 'mountain'
          ? map.heights[index] > 210 ? config.colors.summit : map.heights[index] > 85 ? config.colors.slope : config.colors.foothill
          : region === 'pond' ? config.colors.mud : config.colors[region] ?? config.colors.plain;
        colors.push(...new THREE.Color(color).toArray());
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

// Water follows the same nearest-grid footprints used by reservoir collision.
function waterGeometry(map, indices, channel = false) {
  const positions = [];
  const half = map.spacing / 2;
  for (const index of indices) {
    const x = index % map.stride * map.spacing;
    const z = Math.floor(index / map.stride) * map.spacing;
    const left = Math.max(0, x - half), right = Math.min(map.size, x + half);
    const near = Math.max(0, z - half), far = Math.min(map.size, z + half);
    const y = channel ? map.heights[index] + config.rendering.waterOffset : 0;
    positions.push(left, y, near, left, y, far, right, y, near,
      right, y, near, left, y, far, right, y, far);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.computeVertexNormals();
  return geometry;
}

export function createRenderer(canvas, world, orbit) {
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
  sunlight.shadow.bias = config.quality.shadowBias;
  sunlight.target.position.set(world.map.size / 2, 0, world.map.size / 2);
  scene.add(sunlight.target);
  scene.add(sunlight);
  const terrain = new THREE.Mesh(terrainGeometry(world.map),
    new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  terrain.name = 'terrain';
  scene.add(terrain);
  const surfaces = {};
  for (const id of ['sea', 'lake', 'pond', 'river', 'stream']) {
    const indices = world.map.regions.flatMap((region, index) => region === id ? [index] : []);
    const mesh = new THREE.Mesh(waterGeometry(world.map, indices, id === 'river' || id === 'stream'),
      new THREE.MeshStandardMaterial({ color: config.colors[id], transparent: true,
        opacity: config.rendering.waterOpacity, roughness: 0.25, side: THREE.DoubleSide }));
    if (id === 'sea') {
      const positions = mesh.geometry.attributes.position;
      const colors = [];
      for (let i = 0; i < positions.count; i++) {
        const blend = Math.max(0, Math.min(1, (positions.getX(i) - config.scenery.waveStart) / (world.map.size - config.scenery.waveStart)));
        colors.push(...new THREE.Color(config.colors.sea).lerp(new THREE.Color(config.colors.seaDeep), blend).toArray());
      }
      mesh.geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
      mesh.material.color.set(config.colors.cloud);
      mesh.material.vertexColors = true;
    }
    mesh.name = id;
    surfaces[id] = mesh;
    scene.add(mesh);
  }
  const scenery = decorateScene(scene, canvas, world);
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
  const rayGeometry = new THREE.BufferGeometry();
  rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * config.sunlight.rayCount * 6), 3));
  const rays = new THREE.LineSegments(rayGeometry,
    new THREE.LineBasicMaterial({ color: config.colors.ray, transparent: true, opacity: config.sunlight.rayOpacity }));
  scene.add(rays);
  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, config.camera.near, config.camera.far);
  return {
    webgl2: true,
    snapshot: () => Object.freeze({ ...scenery.snapshot(), terrainTriangles: terrain.geometry.attributes.position.count / 3, shadows: renderer.shadowMap.enabled, pixelRatio: renderer.getPixelRatio() }),
    setQuality(level) {
      const settings = qualityLevels[level];
      terrain.geometry.dispose();
      terrain.geometry = terrainGeometry(world.map, settings.terrainStep);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, settings.pixelRatio));
      renderer.shadowMap.enabled = settings.shadows;
      sunlight.castShadow = settings.shadows;
      terrain.castShadow = settings.shadows;
      terrain.receiveShadow = settings.shadows;
      scenery.setQuality(settings);
      scene.traverse(object => { if (object.material) object.material.needsUpdate = true; });
    },
    render() {
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
      for (const id of ['sea', 'lake', 'pond']) {
        surfaces[id].position.y = world.reservoirs.level(id);
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
      for (let index = 0; index < world.rays.length; index++) {
        const ray = world.rays[index];
        rayGeometry.attributes.position.setXYZ(index * 2, ...config.sunlight.position);
        rayGeometry.attributes.position.setXYZ(index * 2 + 1, ray.x, ray.y, ray.z);
      }
      rayGeometry.setDrawRange(0, world.rays.length * 2);
      rayGeometry.attributes.position.needsUpdate = true;
      rays.visible = world.sun > 0;
      camera.updateMatrixWorld();
      scenery.update(camera);
      renderer.render(scene, camera);
    }
  };
}
