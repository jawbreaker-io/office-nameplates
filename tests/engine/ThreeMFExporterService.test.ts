// @vitest-environment node
import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { unzipSync, strFromU8 } from 'fflate';
import { ThreeMFExporterService } from '../../src/engine/ThreeMFExporterService';

function makeBox(w = 10, h = 10, d = 10): THREE.BufferGeometry {
  return new THREE.BoxGeometry(w, h, d);
}

function makeParts() {
  return [
    { name: 'Base', geometry: makeBox(), material: { name: 'Base', color: '#A5D1EA' } },
    { name: 'Emboss', geometry: makeBox(5, 5, 5), material: { name: 'Emboss', color: '#FFFFFF' } },
  ];
}

describe('ThreeMFExporterService', () => {
  it('exports parts to a non-empty Uint8Array', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    expect(data.byteLength).toBeGreaterThan(0);
  });

  it('produces a valid ZIP containing required 3MF files', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);

    expect(unzipped['[Content_Types].xml']).toBeDefined();
    expect(unzipped['_rels/.rels']).toBeDefined();
    expect(unzipped['3D/3dmodel.model']).toBeDefined();
  });

  it('model XML contains separate objects with components assembly', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('object id="1" name="Base"');
    expect(modelXml).toContain('object id="2" name="Emboss"');
    expect(modelXml).toContain('<components>');
    expect(modelXml).toContain('component objectid="1"');
    expect(modelXml).toContain('component objectid="2"');
    expect(modelXml).toContain('unit="millimeter"');
  });

  it('includes basematerials with correct colors', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('<basematerials');
    expect(modelXml).toContain('displaycolor="#A5D1EA"');
    expect(modelXml).toContain('displaycolor="#FFFFFF"');
  });

  it('each part object references its material via pid/pindex', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('pindex="0"');
    expect(modelXml).toContain('pindex="1"');
  });

  it('each part contains vertices and triangles', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('<vertices>');
    expect(modelXml).toContain('<triangles>');
    expect(modelXml).toContain('<vertex');
    expect(modelXml).toContain('<triangle');
  });

  it('assembly object uses provided name', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts(), 'John Doe');
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('name="John Doe"');
  });

  it('assembly object defaults to Nameplate when no name provided', () => {
    const exporter = new ThreeMFExporterService();
    const data = exporter.exportToUint8Array(makeParts());
    const unzipped = unzipSync(data);
    const modelXml = strFromU8(unzipped['3D/3dmodel.model']);

    expect(modelXml).toContain('name="Nameplate"');
  });

  it('exportToBlob returns a Blob with correct MIME type', () => {
    const exporter = new ThreeMFExporterService();
    const blob = exporter.exportToBlob(makeParts());
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/vnd.ms-package.3dmanufacturing-3dmodel+xml');
  });
});
