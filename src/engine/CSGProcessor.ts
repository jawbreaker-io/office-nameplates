import * as THREE from 'three';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { ManifoldToplevel } from 'manifold-3d';
import { setWasmUrl, getManifoldModule } from 'manifold-3d/lib/wasm.js';

let manifoldModule: ManifoldToplevel | null = null;

async function resolveWasmUrl(): Promise<string> {
  // Node.js (tests): dynamically import 'module' to avoid Vite browser externalization
  // Use globalThis check to avoid referencing 'process' which needs @types/node
  const g = globalThis as Record<string, unknown>;
  const proc = g['process'] as { versions?: { node?: string } } | undefined;
  if (proc?.versions?.node) {
    // @ts-expect-error — 'module' is a Node.js builtin, not available in browser tsconfig types
    const { createRequire } = await (import(/* @vite-ignore */ 'module') as Promise<{ createRequire: (url: string) => { resolve: (id: string) => string } }>);
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

  private prepareManifolds(wasm: ManifoldToplevel, baseGeometry: THREE.BufferGeometry, embossGeometries: THREE.BufferGeometry[]) {
    const prepared = embossGeometries.map((g) => this.prepareGeometry(g));
    const mergedEmboss = prepared.length === 1
      ? prepared[0]
      : mergeGeometries(prepared, false) ?? prepared[0];

    const preparedBase = this.prepareGeometry(baseGeometry);

    return {
      baseManifold: this.toManifold(wasm, preparedBase),
      embossManifold: this.toManifold(wasm, mergedEmboss),
    };
  }

  async union(baseGeometry: THREE.BufferGeometry, embossGeometries: THREE.BufferGeometry[]): Promise<THREE.BufferGeometry> {
    if (embossGeometries.length === 0) {
      return baseGeometry.clone();
    }

    const wasm = await this.modulePromise;
    const { baseManifold, embossManifold } = this.prepareManifolds(wasm, baseGeometry, embossGeometries);

    let result;
    try {
      result = baseManifold.add(embossManifold);
    } catch (err) {
      baseManifold.delete();
      embossManifold.delete();
      throw new Error(
        `CSG union failed: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        'The input mesh may not be manifold.',
      );
    }

    const outputGeometry = this.fromManifold(result);

    baseManifold.delete();
    embossManifold.delete();
    result.delete();

    return outputGeometry;
  }

  /**
   * Produces two watertight geometries via CSG:
   *   basePart  = base − emboss  (base plate with emboss footprint cut out)
   *   embossPart = union − basePart  (the emboss contribution)
   * Both are independently manifold.
   */
  async unionSplit(baseGeometry: THREE.BufferGeometry, embossGeometries: THREE.BufferGeometry[]): Promise<[THREE.BufferGeometry, THREE.BufferGeometry]> {
    if (embossGeometries.length === 0) {
      return [baseGeometry.clone(), new THREE.BufferGeometry()];
    }

    const wasm = await this.modulePromise;
    const { baseManifold, embossManifold } = this.prepareManifolds(wasm, baseGeometry, embossGeometries);

    let unionResult, basePart, embossPart;
    try {
      unionResult = baseManifold.add(embossManifold);
      basePart = baseManifold.subtract(embossManifold);
      embossPart = unionResult.subtract(basePart);
    } catch (err) {
      baseManifold.delete();
      embossManifold.delete();
      unionResult?.delete();
      basePart?.delete();
      throw new Error(
        `CSG split failed: ${err instanceof Error ? err.message : 'Unknown error'}. ` +
        'The input mesh may not be manifold.',
      );
    }

    const baseGeom = this.fromManifold(basePart);
    const embossGeom = this.fromManifold(embossPart);

    baseManifold.delete();
    embossManifold.delete();
    unionResult.delete();
    basePart.delete();
    embossPart.delete();

    return [baseGeom, embossGeom];
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
