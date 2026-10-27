import { config } from '../config.js';

export function render(canvas, world) {
  const ctx = canvas.getContext('2d');
  const { width, height } = config.world;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.save();
  ctx.scale(canvas.width / width, canvas.height / height);
  ctx.translate(0, height);
  ctx.scale(1, -1);
  ctx.fillStyle = config.colors.sky;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = config.colors.lake;
  ctx.fillRect(config.lake.left, config.lake.bottom, width - config.lake.left, world.lake.level - config.lake.bottom);
  ctx.fillStyle = config.colors.terrain;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  for (const [x, y] of config.terrain) ctx.lineTo(x, y);
  ctx.lineTo(width, 0);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = config.colors.sun;
  ctx.beginPath();
  ctx.arc(config.sun.x, config.sun.y, config.sun.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = config.colors.ray;
  for (const ray of world.rays) {
    ctx.beginPath();
    ctx.arc(ray.x, ray.y, config.visual.rayRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = config.colors.cloud;
  ctx.globalAlpha = config.visual.cloudOpacity;
  for (const cluster of world.clusters) {
    if (!cluster.visible) continue;
    ctx.beginPath();
    for (const id of cluster.ids) {
      const particle = world.particles[id];
      ctx.moveTo(particle.x + config.cloud.clusterRadius, particle.y);
      ctx.arc(particle.x, particle.y, config.cloud.clusterRadius, 0, Math.PI * 2);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  for (const particle of world.particles) {
    ctx.fillStyle = config.colors[particle.state];
    ctx.globalAlpha = particle.state === 'vapor' ? config.visual.vaporOpacity : 1;
    ctx.beginPath();
    const location = world.lake.locations.get(particle);
    const surface = location && world.lake.surface(location.column) === particle;
    const amplitude = surface ? config.visual.shakeAmplitude * Math.max(0, particle.temperature - config.heat.baseline) / (100 - config.heat.baseline) : 0;
    const phase = world.time * config.visual.shakeFrequency + particle.id + world.options.seed;
    ctx.arc(particle.x + Math.sin(phase) * amplitude, particle.y + Math.cos(phase) * amplitude,
      config.visual.particleRadius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  if (world.lake.count === 0) {
    ctx.fillStyle = config.colors.text;
    ctx.font = '18px system-ui';
    ctx.fillText('Hồ đã cạn', 20, 30);
  }
}
