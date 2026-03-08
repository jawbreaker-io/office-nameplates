import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { Brush, Evaluator, ADDITION } from 'three-bvh-csg';

export class CSGProcessor {
  private evaluator: Evaluator;

  constructor() {
    this.evaluator = new Evaluator();
    // Only require position + normal (STL has no UVs).
    // The default includes 'uv' which crashes when geometries lack it.
    this.evaluator.attributes = ['position', 'normal'];
  }

  private prepareBrush(geometry: THREE.BufferGeometry): Brush {
    let geom = geometry.clone();

    // Strip all attributes except position and normal — CSG requires
    // matching attributes across all operands, and STL only needs these two.
    for (const name of Object.keys(geom.attributes)) {
      if (name !== 'position' && name !== 'normal') {
        geom.deleteAttribute(name);
      }
    }

    // CSG requires indexed geometry — convert non-indexed to indexed
    if (!geom.index) {
      geom = mergeVertices(geom);
    }
    if (!geom.index) {
      const posCount = geom.getAttribute('position').count;
      const indices = Array.from({ length: posCount }, (_, i) => i);
      geom.setIndex(indices);
    }

    geom.computeVertexNormals();
    const brush = new Brush(geom);
    brush.updateMatrixWorld();
    return brush;
  }

  union(baseGeometry: THREE.BufferGeometry, embossGeometries: THREE.BufferGeometry[]): THREE.BufferGeometry {
    if (embossGeometries.length === 0) {
      return baseGeometry.clone();
    }

    let resultBrush = this.prepareBrush(baseGeometry);

    for (const embossGeom of embossGeometries) {
      const embossBrush = this.prepareBrush(embossGeom);

      try {
        resultBrush = this.evaluator.evaluate(resultBrush, embossBrush, ADDITION);
      } catch (err) {
        throw new Error(
          `CSG union failed: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
          'The input STL may be non-manifold. Try repairing it in a mesh tool.',
        );
      }
    }

    return resultBrush.geometry;
  }

  /**
   * Flattens a THREE.Group hierarchy into an array of world-space BufferGeometries.
   */
  static flattenGroup(group: THREE.Group): THREE.BufferGeometry[] {
    const geometries: THREE.BufferGeometry[] = [];
    group.updateMatrixWorld(true);

    group.traverse((child) => {
      if (child instanceof THREE.Mesh && child.geometry) {
        const geom = child.geometry.clone();
        geom.applyMatrix4(child.matrixWorld);
        geometries.push(geom);
      }
    });

    return geometries;
  }
}
