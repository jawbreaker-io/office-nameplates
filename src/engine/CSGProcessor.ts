import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ManifoldToplevel } from 'manifold-3d';
import { setWasmUrl, getManifoldModule } from 'manifold-3d/lib/wasm.js';

let manifoldModule: ManifoldToplevel | null = null;

async function resolveWasmUrl(): Promise<string> {
  if (typeof process !== 'undefined' && process.versions?.node) {
    // Node.js (tests): dynamically import 'module' to avoid Vite browser externalization
    const { createRequire } = await import('module');
    const req = createRequire(import.meta.url);
    const wasmJsPath = req.resolve('manifold-3d/lib/wasm.js');
    return wasmJsPath.replace(/lib\/wasm\.js$/, 'manifold.wasm');
  }
  // Browser: serve from public/
  return '/manifold.wasm';
}

async function getModule(): Promise<ManifoldToplevel> {
  if (!manifoldModule) {
    setWasmUrl(await resolveWasmUrl());
    manifoldModule = await getManifoldModule();
  }
  return manifoldModule;
}

export class CSGProcessor {
  private modulePromise: Promise<ManifoldToplevel>;

  constructor() {
    this.modulePromise = getModule();
  }

  private prepareGeometry(geometry: THREE.BufferGeometry): THREE.BufferGeometry {
    let geom = geometry.clone();

    // Strip all attributes except position — Manifold only needs positions + indices
    for (const name of Object.keys(geom.attributes)) {
      if (name !== 'position') {
        geom.deleteAttribute(name);
      }
    }

    // Always merge vertices by position to create a true manifold topology
    // (Three.js duplicates vertices per face for smooth normals)
    geom = mergeVertices(geom, 1e-4);

    if (!geom.index) {
      const posCount = geom.getAttribute('position').count;
      geom.setIndex(Array.from({ length: posCount }, (_, i) => i));
    }

    return geom;
  }

  private toManifold(wasm: ManifoldToplevel, geometry: THREE.BufferGeometry) {
    const posAttr = geometry.getAttribute('position');
    const index = geometry.index!;

    const vertProperties = new Float32Array(posAttr.count * 3);
    for (let i = 0; i < posAttr.count; i++) {
      vertProperties[i * 3] = posAttr.getX(i);
      vertProperties[i * 3 + 1] = posAttr.getY(i);
      vertProperties[i * 3 + 2] = posAttr.getZ(i);
    }

    const triVerts = new Uint32Array(index.count);
    for (let i = 0; i < index.count; i++) {
      triVerts[i] = index.getX(i);
    }

    const mesh = new wasm.Mesh({ numProp: 3, vertProperties, triVerts });
    return new wasm.Manifold(mesh);
  }

  private fromManifold(manifold: { getMesh(): { numVert: number; numTri: number; triVerts: Uint32Array; position(i: number): Float32Array } }): THREE.BufferGeometry {
    const mesh = manifold.getMesh();

    const positions = new Float32Array(mesh.numVert * 3);
    for (let i = 0; i < mesh.numVert; i++) {
      const pos = mesh.position(i);
      positions[i * 3] = pos[0];
      positions[i * 3 + 1] = pos[1];
      positions[i * 3 + 2] = pos[2];
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setIndex(new THREE.BufferAttribute(new Uint32Array(mesh.triVerts), 1));
    geometry.computeVertexNormals();

    return geometry;
  }

  async union(baseGeometry: THREE.BufferGeometry, embossGeometries: THREE.BufferGeometry[]): Promise<THREE.BufferGeometry> {
    if (embossGeometries.length === 0) {
      return baseGeometry.clone();
    }

    const wasm = await this.modulePromise;

    // Prepare and merge all emboss geometries into one
    const prepared = embossGeometries.map((g) => this.prepareGeometry(g));
    const mergedEmboss = prepared.length === 1
      ? prepared[0]
      : mergeGeometries(prepared, false) ?? prepared[0];

    const preparedBase = this.prepareGeometry(baseGeometry);

    // Convert to Manifold
    const baseManifold = this.toManifold(wasm, preparedBase);
    const embossManifold = this.toManifold(wasm, mergedEmboss);

    let result;
    try {
      result = baseManifold.add(embossManifold);
      const status = result.status();
      if (status !== 'NoError') {
        throw new Error(`Manifold operation returned status: ${status}`);
      }
    } catch (err) {
      baseManifold.delete();
      embossManifold.delete();
      throw new Error(
        `CSG union failed: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        'The input mesh may not be manifold.',
      );
    }

    // Convert back to Three.js geometry
    const outputGeometry = this.fromManifold(result);

    // Clean up WASM objects
    baseManifold.delete();
    embossManifold.delete();
    result.delete();

    return outputGeometry;
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
