import { describe, it, expect } from 'vitest';
import * as THREE from 'three';
import { CSGProcessor } from '../../src/engine/CSGProcessor';

function makeBox(w: number, h: number, d: number, position?: THREE.Vector3): THREE.BufferGeometry {
  const geom = new THREE.BoxGeometry(w, h, d);
  if (position) {
    geom.translate(position.x, position.y, position.z);
  }
  return geom;
}

describe('CSGProcessor', () => {
  it('union of two box geometries produces more triangles than base', async () => {
    const processor = new CSGProcessor();
    const base = makeBox(10, 10, 10);
    const add = makeBox(5, 5, 5, new THREE.Vector3(5, 5, 5));

    const result = await processor.union(base, [add]);
    const resultTriCount = result.index!.count / 3;
    // BoxGeometry: 12 triangles (6 faces × 2 tris)
    expect(resultTriCount).toBeGreaterThan(12);
  });

  it('union with empty geometry list returns base geometry unchanged', async () => {
    const processor = new CSGProcessor();
    const base = makeBox(10, 10, 10);
    const baseVertexCount = base.getAttribute('position').count;

    const result = await processor.union(base, []);
    const resultVertexCount = result.getAttribute('position').count;

    expect(resultVertexCount).toBe(baseVertexCount);
  });

  it('flattenGroup extracts world-space geometries from nested group', () => {
    const group = new THREE.Group();
    const mesh1 = new THREE.Mesh(makeBox(2, 2, 2));
    mesh1.position.set(5, 0, 0);
    const mesh2 = new THREE.Mesh(makeBox(3, 3, 3));
    mesh2.position.set(-5, 0, 0);
    group.add(mesh1, mesh2);

    const geometries = CSGProcessor.flattenGroup(group);
    expect(geometries.length).toBe(2);

    // Verify world-space transform was applied
    geometries[0].computeBoundingBox();
    const center = new THREE.Vector3();
    geometries[0].boundingBox!.getCenter(center);
    expect(center.x).toBeCloseTo(5, 0);
  });

  it('flattenGroup returns empty array for empty group', () => {
    const group = new THREE.Group();
    const geometries = CSGProcessor.flattenGroup(group);
    expect(geometries.length).toBe(0);
  });
});
