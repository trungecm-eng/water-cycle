import { config } from '../config.js';
import { heightAt } from './heightmap.js';
import { cellAt } from './drainage.js';

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class Camera {
  constructor(map, reservoirs) {
    this.map = map;
    this.reservoirs = reservoirs;
    Object.assign(this, { azimuth: config.camera.azimuth, elevation: config.camera.elevation, distance: config.camera.distance });
  }
  rotate(azimuth, elevation = 0) {
    this.azimuth = ((this.azimuth + azimuth) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    this.elevation = clamp(this.elevation + elevation, config.camera.minElevation, config.camera.maxElevation);
  }
  zoom(factor) {
    this.distance = clamp(this.distance * factor, config.camera.minDistance, config.camera.maxDistance);
  }
  snapshot() {
    const settings = config.camera;
    const [tx, ty, tz] = settings.target;
    const radians = this.elevation * Math.PI / 180;
    const horizontal = this.distance * Math.cos(radians);
    const x = tx + horizontal * Math.sin(this.azimuth);
    const z = tz + horizontal * Math.cos(this.azimuth);
    let floor = 0;
    if (x >= 0 && x <= this.map.size && z >= 0 && z <= this.map.size) {
      const id = this.map.reservoirs[cellAt(this.map, x, z)];
      floor = Math.max(heightAt(this.map, x, z), id ? this.reservoirs.level(id) : -Infinity);
    }
    // Lift the eye above obstacles without changing the user's orbit settings.
    const y = Math.max(ty + this.distance * Math.sin(radians), floor + settings.clearance);
    return Object.freeze({ position: Object.freeze({ x, y, z }), target: Object.freeze([...settings.target]), azimuth: this.azimuth,
      elevation: this.elevation, distance: this.distance });
  }
}
