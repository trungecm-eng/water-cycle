import * as THREE from '../../vendor/three.module.min.js';
import { config } from '../config.js';
import { cloudVisuals } from '../art/clouds.js';
import { sunAppearance, sunbeams } from '../art/sunbeams.js';

export function createAtmosphere(scene, world) {
  const capacity = Math.ceil(world.options.n / config.cloud.cloudMinSize);
  const clouds = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 1),
    new THREE.MeshStandardMaterial({ flatShading: true, roughness: 1 }), capacity * 12);
  clouds.name = 'cloud-masses';
  const rain = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ color: config.colors.rain, side: THREE.DoubleSide, transparent: true, opacity: 0.52, depthWrite: false }),
    capacity * config.art.rainColumns * Math.ceil(config.world.height / 19));
  rain.name = 'rain-curtains';
  clouds.frustumCulled = rain.frustumCulled = false;
  const rayGeometry = new THREE.BufferGeometry();
  const positions = new Float32Array(config.art.maxSunbeams * 2 * 3);
  const colors = new Float32Array(positions.length);
  rayGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  rayGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const rays = new THREE.LineSegments(rayGeometry, new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
    vertexShader: 'attribute vec3 color; varying float fade; void main(){fade=color.r;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader: 'varying float fade; void main(){gl_FragColor=vec4(1.0,0.83,0.48,fade*0.48);}' }));
  rays.name = 'sunbeams';
  const sun = new THREE.Mesh(new THREE.SphereGeometry(config.sun.radius, 20, 12), new THREE.MeshBasicMaterial({ color: config.colors.sun, fog: false }));
  sun.name = 'sun';
  const halo = new THREE.Mesh(new THREE.PlaneGeometry(config.sun.radius * 5, config.sun.radius * 5),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { opacity: { value: 0 } },
      vertexShader: 'varying vec2 coord;void main(){coord=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform float opacity;varying vec2 coord;void main(){float a=1.0-smoothstep(0.1,1.0,length(coord));gl_FragColor=vec4(1.0,0.86,0.52,a*a*opacity);}' }));
  halo.name = 'sun-halo';
  scene.add(clouds, rain, rays, sun, halo);
  const transform = new THREE.Object3D();
  let quality = 'high', beamCount = 0, rainingClusters = 0;
  return {
    setQuality(settings) { quality = settings.cloudBlocksMax === config.quality.levels.high.cloudBlocksMax ? 'high' : 'low'; },
    update(camera) {
      let blockCount = 0, rainCount = 0;
      const visuals = cloudVisuals(world, quality);
      rainingClusters = visuals.filter(cloud => cloud.rain.length).length;
      for (const cloud of visuals) {
        for (const block of cloud.blocks) {
          transform.position.set(block.x, block.y, block.z);
          transform.rotation.set(0, 0, 0);
          transform.scale.set(block.radius, block.radius * 0.72, block.radius);
          transform.updateMatrix();
          clouds.setMatrixAt(blockCount, transform.matrix);
          clouds.setColorAt(blockCount++, new THREE.Color(config.colors.cloud).lerp(new THREE.Color(config.colors.cloudDark), cloud.shade));
        }
        for (const streak of cloud.rain) {
          if (rainCount >= rain.instanceMatrix.count) break;
          transform.position.set(streak.x, (streak.top + streak.bottom) / 2, streak.z);
          transform.rotation.set(0, Math.atan2(camera.position.x - streak.x, camera.position.z - streak.z), 0);
          transform.scale.set(1.2, streak.top - streak.bottom, 1);
          transform.updateMatrix();
          rain.setMatrixAt(rainCount++, transform.matrix);
        }
      }
      clouds.count = blockCount; rain.count = rainCount;
      clouds.instanceMatrix.needsUpdate = rain.instanceMatrix.needsUpdate = true;
      if (clouds.instanceColor) clouds.instanceColor.needsUpdate = true;
      const beams = sunbeams(world);
      beamCount = beams.length;
      beams.forEach((beam, index) => {
        rayGeometry.attributes.position.setXYZ(index * 2, ...beam.start);
        rayGeometry.attributes.position.setXYZ(index * 2 + 1, ...beam.end);
        rayGeometry.attributes.color.setXYZ(index * 2, 0, 0, 0);
        rayGeometry.attributes.color.setXYZ(index * 2 + 1, 1, 1, 1);
      });
      rayGeometry.setDrawRange(0, beams.length * 2);
      rayGeometry.attributes.position.needsUpdate = rayGeometry.attributes.color.needsUpdate = true;
      rays.frustumCulled = false;
      // A distant sky disc stays visible as pupils orbit the diorama.
      const direction = new THREE.Vector3(-0.72, 0.72, 0.5).unproject(camera).sub(camera.position).normalize();
      sun.position.copy(camera.position).addScaledVector(direction, 1700);
      halo.position.copy(sun.position); halo.quaternion.copy(camera.quaternion);
      halo.material.uniforms.opacity.value = sunAppearance(world.sun).haloOpacity;
    },
    snapshot() { return { cloudBlocks: clouds.count, rainStreaks: rain.count, rainingClusters, sunbeams: beamCount,
      sun: { position: sun.position.toArray(), haloOpacity: halo.material.uniforms.opacity.value } }; }
  };
}
