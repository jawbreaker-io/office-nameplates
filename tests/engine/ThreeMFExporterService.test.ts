// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { unzipSync, strFromU8 } from 'fflate';
import { ThreeMFExporterService } from '../../src/engine/ThreeMFExporterService';

function makeBox(): THREE.BufferGeometry {
  return new THREE.BoxGeometry(10, 10, 10);
}

describe('ThreeMFExporterService', () => {
  it('exports a geometry to a non-empty Uint8Array', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeBox());
    expect(data.byteLength).toBeGreaterThan(0);
  });

  it('produces a valid ZIP containing required 3MF files', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeBox());
    const unzipped = unzipSync(data);

    expect(unzipped['[Content_Types].xml']).toBeDefined();
    expect(unzipped['_rels/.rels']).toBeDefined();
    expect(unzipped['3D/3dmodel.model']).toBeDefined();
  });

  it('model XML contains vertices and triangles', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeBox());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('<vertices>');
    expect(modelXml).toContain('<triangles>');
    expect(modelXml).toContain('<vertex');
    expect(modelXml).toContain('<triangle');
    expect(modelXml).toContain('unit="millimeter"');
  });

  it('exports correct vertex and triangle counts for a box', () => {
    const exporter = new ThreeMFExporterService();
    const geom = makeBox();
    const data = exporter.exportToUint8Array(geom);
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    const vertexCount = (modelXml.match(/<vertex /g) || []).length;
    const triangleCount = (modelXml.match(/<triangle /g) || []).length;

    expect(vertexCount).toBe(geom.getAttribute('position').count);
    expect(triangleCount).toBe(geom.index!.count / 3);
  });

  it('exportToBlob returns a Blob with correct MIME type', () => {
    const exporter = new ThreeMFExporterService();
    const blob = exporter.exportToBlob(makeBox());
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  });
});
