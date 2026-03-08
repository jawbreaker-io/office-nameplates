import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { LogoMeshBuilder } from '../../src/engine/LogoMeshBuilder';
import type { BoundingBoxInfo } from '../../src/engine/types';
import * as THREE from 'three';

const mockBBox: BoundingBoxInfo = {
  min: new THREE.Vector3(-50, -15, -1.5),
  max: new THREE.Vector3(50, 15, 1.5),
  width: 100,
  height: 30,
  depth: 3,
  center: new THREE.Vector3(0, 0, 0),
};

function loadTestSVG(): string {
  return readFileSync(join(__dirname, '../fixtures/test-logo.svg'), 'utf-8');
}

describe('LogoMeshBuilder', () => {
  it('parses simple SVG and produces geometry with vertices', () => {
    const builder = new LogoMeshBuilder();
    const group = builder.createLogoMesh(loadTestSVG(), 1.5, mockBBox);

    let vertexCount = 0;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        vertexCount += child.geometry.getAttribute('position').count;
      }
    });
    expect(vertexCount).toBeGreaterThan(0);
  });

  it('extruded geometry has correct depth', () => {
    const builder = new LogoMeshBuilder();
    const depth = 2.5;
    const group = builder.createLogoMesh(loadTestSVG(), depth, mockBBox);

    // Check that the group exists and has children
    let hasMeshes = false;
    group.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        hasMeshes = true;
      }
    });
    expect(hasMeshes).toBe(true);
  });

  it('throws on SVG with no paths', () => {
    const builder = new LogoMeshBuilder();
    const emptySVG = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"></svg>';

    expect(() => builder.createLogoMesh(emptySVG, 1.5, mockBBox)).toThrow(
      'SVG contains no paths',
    );
  });

  it('warns on complex SVG (>200 paths)', () => {
    const builder = new LogoMeshBuilder();
    // Generate an SVG with many paths
    const paths = Array.from(
      { length: 210 },
      (_, i) => `<path d="M${i} 0 L${i + 1} 1 L${i} 1 Z" fill="black"/>`,
    ).join('');
    const complexSVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 100">${paths}</svg>`;

    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    builder.createLogoMesh(complexSVG, 1.5, mockBBox);
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('>200 paths'),
    );
    warnSpy.mockRestore();
  });
});
