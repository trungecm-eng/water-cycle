import * as THREE from '../../vendor/three.module.min.js';
import { config } from '../config.js';

function terrainGeometry(map) {
  const positions = [];
  const colors = [];
  const point = index => [index % map.stride * map.spacing, map.heights[index], Math.floor(index / map.stride) * map.spacing];
  for (let row = 0; row < map.cells; row++) for (let column = 0; column < map.cells; column++) {
    const a = row * map.stride + column;
    for (const triangle of [[a, a + map.stride, a + 1], [a + 1, a + map.stride, a + map.stride + 1]]) {
      for (const index of triangle) {
        positions.push(...point(index));
        const region = map.regions[index];
        const color = region === 'mountain'
          ? map.heights[index] > 210 ? config.colors.summit : map.heights[index] > 85 ? config.colors.slope : config.colors.foothill
          : config.colors[region] ?? config.colors.plain;
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
    message.textContent = 'Không thể khởi tạo WebGL2. Hãy bật tăng tốc đồ họa hoặc mở bằng trình duyệt hỗ trợ WebGL2.';
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
    mesh.name = id;
    surfaces[id] = mesh;
    scene.add(mesh);
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 3), 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(new Float32Array(world.options.n * 3), 3));
  const points = new THREE.Points(geometry, new THREE.PointsMaterial({ size: config.rendering.particleSize, vertexColors: true }));
  scene.add(points);
  const rayGeometry = new THREE.BufferGeometry();
  rayGeometry.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(3 * config.sunlight.rayCount * 6), 3));
  const rays = new THREE.LineSegments(rayGeometry,
    new THREE.LineBasicMaterial({ color: config.colors.ray, transparent: true, opacity: config.sunlight.rayOpacity }));
  scene.add(rays);
  const camera = new THREE.PerspectiveCamera(config.camera.fov, 1, config.camera.near, config.camera.far);
  return {
    webgl2: true,
    render() {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      const view = orbit.snapshot();
      camera.position.set(view.position.x, view.position.y, view.position.z);
      camera.lookAt(...view.target);
      for (const id of ['sea', 'lake', 'pond']) {
        surfaces[id].position.y = world.reservoirs.level(id);
        surfaces[id].visible = world.reservoirs.count(id) > 0;
      }
      let count = 0;
      for (const particle of world.particles) {
        if (particle.state === 'water') continue;
        geometry.attributes.position.setXYZ(count, particle.x, particle.y, particle.z);
        const color = new THREE.Color(config.colors[particle.state]);
        geometry.attributes.color.setXYZ(count, color.r, color.g, color.b);
        count++;
      }
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
      renderer.render(scene, camera);
    }
  };
}
