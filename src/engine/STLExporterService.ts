import * as THREE from 'three';
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js';

export class STLExporterService {
  private exporter = new STLExporter();

  exportToBlob(geometry: THREE.BufferGeometry): Blob {
    const mesh = new THREE.Mesh(geometry);
    const result = this.exporter.parse(mesh, { binary: true });
    return new Blob([result], { type: 'application/octet-stream' });
  }

  exportToArrayBuffer(geometry: THREE.BufferGeometry): ArrayBuffer {
    const mesh = new THREE.Mesh(geometry);
    const result = this.exporter.parse(mesh, { binary: true });
    if (result instanceof ArrayBuffer) return result;
    // DataView case
    return (result as DataView).buffer as ArrayBuffer;
  }
}
