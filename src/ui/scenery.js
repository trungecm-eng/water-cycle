import { qualityLevels } from '../quality.js';
import { content } from '../content.js';
import * as THREE from '../../vendor/three.module.min.js';
import { config } from '../config.js';
import { heightAt } from '../sim/heightmap.js';
import { generateStrata } from '../art/strata.js';
import { mapData } from '../map-data.js';

export function decorateScene(scene, canvas, world) {
  const settings = config.scenery;
  scene.fog = new THREE.Fog(config.colors.sky, settings.fogNear, settings.fogFar);
  const sky = new THREE.Mesh(new THREE.SphereGeometry(settings.skyRadius, 24, 12),
    new THREE.ShaderMaterial({ side: THREE.BackSide, depthWrite: false,
      uniforms: { low: { value: new THREE.Color(config.colors.sky) }, high: { value: new THREE.Color(config.colors.skyHigh) } },
      vertexShader: 'varying vec3 direction; void main(){direction=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: `uniform vec3 low; uniform vec3 high; varying vec3 direction;
        void main(){float t=smoothstep(-0.7,0.2,normalize(direction).y);gl_FragColor=vec4(mix(low,high,t),1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }` }));
  scene.add(sky);
  const walls = new THREE.Group();
  walls.name = 'strata';
  const map = world.map;
  const strata = generateStrata(map);
  for (let layer = 0; layer < strata[0].layers.length; layer++) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(strata.flatMap(edge => edge.layers[layer].positions), 3));
    geometry.computeVertexNormals();
    walls.add(new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: config.colors[strata[0].layers[layer].color], flatShading: true, side: THREE.DoubleSide })));
  }
  const seaGeometry = new THREE.BufferGeometry();
  seaGeometry.setAttribute('position', new THREE.Float32BufferAttribute(strata.flatMap(edge => edge.water), 3));
  seaGeometry.computeVertexNormals();
  const seaFace = new THREE.Mesh(seaGeometry, new THREE.MeshStandardMaterial({
    color: config.colors.seaDeep, transparent: true, opacity: settings.seaFaceOpacity, side: THREE.DoubleSide }));
  seaFace.name = 'sea-cutaway';
  walls.add(seaFace);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(map.size * 1.65, map.size * 1.65),
    new THREE.ShaderMaterial({ transparent: true, depthWrite: false,
      uniforms: { color: { value: new THREE.Color(config.colors.groundShadow) } },
      vertexShader: 'varying vec2 coord; void main(){coord=uv*2.0-1.0;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
      fragmentShader: 'uniform vec3 color; varying vec2 coord; void main(){float r=length(coord);float alpha=0.19*(1.0-smoothstep(0.35,1.0,r));gl_FragColor=vec4(color,alpha);}' }));
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(map.size / 2, settings.base - 6, map.size / 2);
  shadow.name = 'base-shadow';
  scene.add(shadow);
  scene.add(walls);
  const wavePositions = [];
  for (let z = settings.waveSpacing; z < map.size; z += settings.waveSpacing) {
    for (let x = settings.waveStart; x < map.size - settings.waveLength; x += settings.waveSpacing) wavePositions.push(x,settings.waveHeight,z,x+settings.waveLength,settings.waveHeight,z);
  }
  const waveGeometry = new THREE.BufferGeometry();
  waveGeometry.setAttribute('position', new THREE.Float32BufferAttribute(wavePositions, 3));
  const waves = new THREE.LineSegments(waveGeometry, new THREE.LineBasicMaterial({ color: config.colors.foam, transparent: true, opacity: settings.waveOpacity }));
  waves.name = 'sea-waves';
  scene.add(waves);
  const streaks = new THREE.Group();
  streaks.name = 'flow-highlights';
  const flows = map.channels.filter(channel => channel.type === 'stream' || channel.type === 'river').map(channel => channel.path);
  const flowGeometry = new THREE.SphereGeometry(settings.flowRadius, 4, 2);
  const flowMaterial = new THREE.MeshBasicMaterial({ color: config.colors.foam, transparent: true, opacity: settings.flowOpacity });
  for (const channel of flows) for (let i = 0; i < settings.flowsPerChannel; i++) {
    const mesh = new THREE.Mesh(flowGeometry, flowMaterial);
    mesh.userData = { channel, offset: i / settings.flowsPerChannel };
    streaks.add(mesh);
  }
  scene.add(streaks);
  const clouds = new THREE.Group();
  clouds.name = 'cloud-masses';
  scene.add(clouds);
  const cloudGeometry = new THREE.IcosahedronGeometry(1, 1);
  const labelLayer = document.createElement('div');
  labelLayer.className = 'map-labels';
  canvas.parentElement.append(labelLayer);
  const labels = mapData.labels.map(data => {
    const element = document.createElement('span');
    element.className = 'map-label';
    element.dataset.region = data.id;
    element.textContent = content.regions[data.id];
    labelLayer.append(element);
    return { ...data, element };
  });
  let labelsVisible = true;
  const labelsButton = document.querySelector('#toggle-labels');
  function toggleLabels() {
    labelsVisible = !labelsVisible;
    labelsButton.setAttribute('aria-pressed', String(labelsVisible));
  }
  labelsButton.addEventListener('click', toggleLabels);
  document.addEventListener('keydown', event => {
    if (event.repeat || event.ctrlKey || event.altKey || event.metaKey || event.target.closest('input, textarea, select, [contenteditable="true"]')) return;
    if (event.key.toLowerCase() === 'l') {
      event.preventDefault();
      toggleLabels();
    }
  });
  let lastClusters;
  let quality = qualityLevels.high;
  let labelSnapshot = [];
  return {
    setQuality(settings) { quality = settings; waves.visible = settings.waves; lastClusters = undefined; },
    update(camera) {
      sky.position.copy(camera.position);
      waves.position.z = Math.sin(world.time * settings.waveSpeed) * settings.waveTravel;
      for (const mesh of streaks.children) {
        const { channel, offset } = mesh.userData;
        const progress = (world.time * settings.flowSpeed + offset * channel.length) % (channel.length - 1);
        const a = channel[Math.floor(progress)], b = channel[Math.floor(progress) + 1];
        const t = progress % 1;
        const x = (a % map.stride * (1-t) + b % map.stride * t) * map.spacing;
        const z = (Math.floor(a / map.stride) * (1-t) + Math.floor(b / map.stride) * t) * map.spacing;
        mesh.position.set(x, heightAt(map,x,z) + settings.flowHeight, z);
      }
      if (lastClusters !== world.clusters) {
        lastClusters = world.clusters;
        for (const mesh of [...clouds.children]) { mesh.material.dispose(); clouds.remove(mesh); }
        for (const cluster of world.clusters.filter(item => item.visible)) {
          const members = cluster.ids.map(id => world.particles[id]).filter(p => p.state === 'cloud');
          if (!members.length) continue;
          const shade = Math.min(1, (cluster.size - config.cloud.cloudMinSize) / (config.cloud.rainStartSize - config.cloud.cloudMinSize));
          const material = new THREE.MeshStandardMaterial({ color: new THREE.Color(config.colors.cloud).lerp(new THREE.Color(config.colors.cloudDark), shade), flatShading: true, roughness: 1 });
          let blocks = 0;
          for (let i = 0; i < Math.min(settings.cloudLobes, members.length); i++) {
            const member = members[Math.floor(i * members.length / Math.min(settings.cloudLobes, members.length))];
            for (const [dx, dy, dz] of settings.cloudOffsets) {
              if (blocks++ >= quality.cloudBlocks) continue;
              const mesh = new THREE.Mesh(cloudGeometry, material.clone());
              mesh.castShadow = quality.shadows;
              mesh.receiveShadow = quality.shadows;
              mesh.position.set(member.x + dx, member.y + dy, member.z + dz);
              mesh.scale.set(settings.cloudRadius, settings.cloudRadius * settings.cloudFlatten, settings.cloudRadius);
              clouds.add(mesh);
            }
          }
          material.dispose();
        }
      }
      const rect = canvas.getBoundingClientRect();
      labelSnapshot = [];
      for (const label of labels) {
        label.element.textContent = label.id === 'pond' && !world.reservoirs.count('pond') ? content.emptyPond : content.regions[label.id];
        const point = new THREE.Vector3(...label.position).project(camera);
        const visible = labelsVisible && point.z >= -1 && point.z <= 1 && Math.abs(point.x) <= 1 && Math.abs(point.y) <= 1;
        label.element.hidden = !visible;
        label.element.style.left = `${rect.left + window.scrollX + (point.x + 1) * rect.width / 2}px`;
        label.element.style.top = `${rect.top + window.scrollY + (1 - point.y) * rect.height / 2}px`;
        if (visible) {
          const box = label.element.getBoundingClientRect();
          labelSnapshot.push(Object.freeze({ id: label.id, text: label.element.textContent, box: Object.freeze({ x: box.x, y: box.y, width: box.width, height: box.height }) }));
        }
      }
    },
    snapshot() {
      return Object.freeze({ objects: Object.freeze(scene.children.map(child => child.name).filter(Boolean)), strataLayers: strata[0].layers.length, seaCutaway: seaFace.geometry.attributes.position.count > 0, labels: Object.freeze([...labelSnapshot]),
        effects: Object.freeze({ wavesVisible: waves.visible, cloudBlocks: clouds.children.length, time: world.time, waveOffset: waves.position.z, flowPositions: Object.freeze(streaks.children.map(mesh => Object.freeze(mesh.position.toArray()))) }) });
    }
  };
}
