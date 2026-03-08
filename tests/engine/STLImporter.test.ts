import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { STLImporter } from '../../src/engine/STLImporter';

function loadFixture(): ArrayBuffer {
  const buf = readFileSync(join(__dirname, '../fixtures/simple-plate.stl'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

describe('STLImporter', () => {
  it('parses binary STL fixture and returns BufferGeometry with vertices', () => {
    const importer = new STLImporter();
    const geometry = importer.loadFromArrayBuffer(loadFixture());
    const positions = geometry.getAttribute('position');

    // 12 triangles × 3 vertices = 36 vertices
    expect(positions.count).toBe(36);
  });

  it('computes bounding box with expected dimensions', () => {
    const importer = new STLImporter();
    const geometry = importer.loadFromArrayBuffer(loadFixture());
    const bbox = STLImporter.getBoundingBoxInfo(geometry);

    // Plate is 100×30×3, centered at origin
    expect(bbox.width).toBeCloseTo(100, 0);
    expect(bbox.height).toBeCloseTo(30, 0);
    expect(bbox.depth).toBeCloseTo(3, 0);
  });

  it('centers geometry so bounding box is symmetric around origin', () => {
    const importer = new STLImporter();
    const geometry = importer.loadFromArrayBuffer(loadFixture());
    const bbox = STLImporter.getBoundingBoxInfo(geometry);

    expect(bbox.center.x).toBeCloseTo(0, 1);
    expect(bbox.center.y).toBeCloseTo(0, 1);
    expect(bbox.center.z).toBeCloseTo(0, 1);
  });

  it('throws on invalid data', () => {
    const importer = new STLImporter();
    const invalidBuffer = new ArrayBuffer(10);

    expect(() => importer.loadFromArrayBuffer(invalidBuffer)).toThrow();
  });
});
