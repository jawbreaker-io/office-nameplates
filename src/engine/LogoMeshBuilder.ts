import * as THREE from 'three';
import { SVGLoader } from 'three/examples/jsm/loaders/SVGLoader.js';
import type { BoundingBoxInfo } from './types';

export class LogoMeshBuilder {
  createLogoMesh(
    svgText: string,
    embossDepth: number,
    baseBBox: BoundingBoxInfo,
  ): THREE.Group {
    const loader = new SVGLoader();
    const svgData = loader.parse(svgText);

    if (svgData.paths.length === 0) {
      throw new Error('SVG contains no paths. Use a path-based SVG.');
    }

    if (svgData.paths.length > 200) {
      console.warn('SVG has >200 paths — CSG may be slow. Consider simplifying.');
    }

    const group = new THREE.Group();
    const material = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      roughness: 0.4,
      metalness: 0.1,
    });

    for (const path of svgData.paths) {
      const shapes = SVGLoader.createShapes(path);
      for (const shape of shapes) {
        const geometry = new THREE.ExtrudeGeometry(shape, {
          depth: embossDepth,
          bevelEnabled: false,
        });
        group.add(new THREE.Mesh(geometry, material));
      }
    }

    // Compute bounds and scale to fit left zone of nameplate
    const logoBBox = new THREE.Box3().setFromObject(group);
    const logoSize = new THREE.Vector3();
    logoBBox.getSize(logoSize);
    const logoCenter = new THREE.Vector3();
    logoBBox.getCenter(logoCenter);

    // Logo zone: left 30% of nameplate
    const logoZoneWidth = baseBBox.width * 0.28;
    const logoZoneHeight = baseBBox.height * 0.7;
    const scaleFactor = Math.min(
      logoZoneWidth / logoSize.x,
      logoZoneHeight / logoSize.y,
    );

    // Center the group at origin, scale, then position
    group.position.set(-logoCenter.x, -logoCenter.y, -logoCenter.z);

    const wrapper = new THREE.Group();
    wrapper.add(group);
    wrapper.scale.set(scaleFactor, -scaleFactor, scaleFactor); // flip Y (SVG coordinate system)

    // Position on left side of nameplate
    const logoX = baseBBox.min.x + baseBBox.width * 0.18;
    const logoY = baseBBox.center.y;
    const logoZ = baseBBox.max.z;
    wrapper.position.set(logoX, logoY, logoZ);

    return wrapper;
  }
}
