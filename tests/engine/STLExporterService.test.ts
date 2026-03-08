import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { STLExporterService } from '../../src/engine/STLExporterService';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';

describe('STLExporterService', () => {
  it('exports simple mesh to non-empty ArrayBuffer', () => {
    const exporter = new STLExporterService();
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const buffer = exporter.exportToArrayBuffer(geometry);

    expect(buffer.byteLength).toBeGreaterThan(0);
  });

  it('exported binary STL has correct header and triangle count', () => {
    const exporter = new STLExporterService();
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const buffer = exporter.exportToArrayBuffer(geometry);

    // Binary STL: 80-byte header + 4-byte triangle count
    expect(buffer.byteLength).toBeGreaterThan(84);

    const view = new DataView(buffer);
    const triangleCount = view.getUint32(80, true);

    // BoxGeometry: 6 faces × 2 triangles = 12 triangles
    expect(triangleCount).toBe(12);

    // Verify total size: 80 + 4 + (50 × triangleCount)
    expect(buffer.byteLength).toBe(80 + 4 + 50 * triangleCount);
  });

  it('round-trip: export then re-import preserves triangle count', () => {
    const exporter = new STLExporterService();
    const geometry = new THREE.BoxGeometry(10, 10, 10);
    const buffer = exporter.exportToArrayBuffer(geometry);

    // Re-import
    const loader = new STLLoader();
    const reimported = loader.parse(buffer);

    // STL is non-indexed, so compare triangle counts (vertex count / 3)
    // BoxGeometry is indexed (24 verts), but STL expands to 36 (12 tri × 3)
    const view = new DataView(buffer);
    const exportedTriangles = view.getUint32(80, true);
    const reimportedTriangles = reimported.getAttribute('position').count / 3;

    expect(reimportedTriangles).toBe(exportedTriangles);
  });

  it('exportToBlob returns a Blob with content', () => {
    const exporter = new STLExporterService();
    const geometry = new THREE.BoxGeometry(5, 5, 5);
    const blob = exporter.exportToBlob(geometry);

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
  });
});
