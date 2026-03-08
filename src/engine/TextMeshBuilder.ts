import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { BoundingBoxInfo } from './types';

export class TextMeshBuilder {
  private font: Font | null = null;
  private fontLoadPromise: Promise<Font> | null = null;

  async loadFont(url = '/fonts/helvetiker_regular.typeface.json'): Promise<void> {
    if (this.font) return;
    if (this.fontLoadPromise) {
      await this.fontLoadPromise;
      return;
    }
    this.fontLoadPromise = new Promise<Font>((resolve, reject) => {
      const loader = new FontLoader();
      loader.load(url, resolve, undefined, reject);
    });
    this.font = await this.fontLoadPromise;
  }

  createTextMesh(
    text: string,
    fontSize: number,
    embossDepth: number,
    maxWidth: number,
  ): THREE.Mesh | null {
    if (!this.font || !text.trim()) return null;

    const geometry = new TextGeometry(text, {
      font: this.font,
      size: fontSize,
      depth: embossDepth,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness: 0.2,
      bevelSize: 0.1,
      bevelSegments: 2,
    });

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const textWidth = box.max.x - box.min.x;

    // Auto-scale if text exceeds max width
    if (textWidth > maxWidth && maxWidth > 0) {
      const scale = maxWidth / textWidth;
      geometry.scale(scale, scale, 1);
      geometry.computeBoundingBox();
    }

    const material = new THREE.MeshStandardMaterial({
      color: 0x4488ff,
      roughness: 0.4,
      metalness: 0.1,
    });

    return new THREE.Mesh(geometry, material);
  }

  createMultiLineTextMeshes(
    lines: string[],
    fontSize: number,
    embossDepth: number,
    baseBBox: BoundingBoxInfo,
  ): THREE.Group {
    const group = new THREE.Group();

    // Text zone: right 60% of nameplate
    const textZoneWidth = baseBBox.width * 0.55;
    const textZoneStartX = baseBBox.min.x + baseBBox.width * 0.4;
    const lineSpacing = fontSize * 1.4;

    // Vertical centering of text block
    const nonEmptyCount = lines.filter((l) => l.trim()).length || 1;
    const totalTextHeight = nonEmptyCount * lineSpacing;
    const startY = baseBBox.max.y + totalTextHeight / 2 - lineSpacing / 2;

    let lineIndex = 0;
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const mesh = this.createTextMesh(line, fontSize, embossDepth, textZoneWidth);
      if (mesh) {
        mesh.position.set(
          textZoneStartX,
          startY - lineIndex * lineSpacing,
          baseBBox.max.z,
        );
        group.add(mesh);
        lineIndex++;
      }
    }

    return group;
  }
}
