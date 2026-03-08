import * as THREE from 'three';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import type { BoundingBoxInfo } from './types';

export class STLImporter {
  private loader = new STLLoader();

  loadFromArrayBuffer(buffer: ArrayBuffer): THREE.BufferGeometry {
    const geometry = this.loader.parse(buffer);
    geometry.computeVertexNormals();
    this.centerGeometry(geometry);
    return geometry;
  }

  private centerGeometry(geometry: THREE.BufferGeometry): void {
    geometry.computeBoundingBox();
    const center = new THREE.Vector3();
    geometry.boundingBox!.getCenter(center);
    geometry.translate(-center.x, -center.y, -center.z);
    geometry.computeBoundingBox();
  }

  static getBoundingBoxInfo(geometry: THREE.BufferGeometry): BoundingBoxInfo {
    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const size = new THREE.Vector3();
    box.getSize(size);
    const center = new THREE.Vector3();
    box.getCenter(center);

    return {
      min: box.min.clone(),
      max: box.max.clone(),
      width: size.x,
      height: size.y,
      depth: size.z,
      center: center.clone(),
    };
  }
}
