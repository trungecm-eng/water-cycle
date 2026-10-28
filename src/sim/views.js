import { config } from '../config.js';
import { mapData } from '../map-data.js';

export function parseView(search = '') {
  const name = new URLSearchParams(search).get('view');
  return Object.hasOwn(mapData.views, name) ? name : 'overview';
}

export class ViewTransition {
  constructor(camera, initial = 'overview') {
    this.camera = camera;
    this.name = Object.hasOwn(mapData.views, initial) ? initial : 'overview';
    this.apply(mapData.views[this.name]);
    this.transition = null;
  }
  apply(pose) {
    this.camera.target = [...pose.target];
    for (const key of ['azimuth', 'elevation', 'distance']) this.camera[key] = pose[key];
  }
  select(name, now) {
    if (!Object.hasOwn(mapData.views, name)) return;
    this.update(now);
    this.name = name;
    this.transition = { start: now, from: this.camera.snapshot(), to: mapData.views[name] };
  }
  focus(position, now) {
    this.update(now);
    this.name = 'free';
    this.transition = { start: now, from: this.camera.snapshot(), to: {
      target: [...position], azimuth: this.camera.azimuth,
      elevation: Math.max(config.camera.minElevation, Math.min(config.camera.maxElevation, this.camera.elevation)),
      distance: Math.max(config.camera.minDistance, Math.min(config.camera.maxDistance, 500))
    } };
  }
  update(now) {
    if (!this.transition) return;
    const { start, from, to } = this.transition;
    const t = Math.max(0, Math.min(1, (now - start) / config.camera.transitionDuration));
    if (t === 1) {
      this.apply(to);
      this.transition = null;
      return;
    }
    const eased = t * t * (3 - 2 * t);
    const delta = Math.atan2(Math.sin(to.azimuth - from.azimuth), Math.cos(to.azimuth - from.azimuth));
    this.apply({ target: from.target.map((value, i) => value + (to.target[i] - value) * eased),
      azimuth: from.azimuth + delta * eased,
      elevation: from.elevation + (to.elevation - from.elevation) * eased,
      distance: from.distance + (to.distance - from.distance) * eased });
  }
  interrupt() {
    this.transition = null;
    this.name = 'free';
  }
}
