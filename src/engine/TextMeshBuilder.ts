import * as THREE from 'three';
import { FontLoader, Font } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import type { BoundingBoxInfo, TextBoxConfig } from './types';

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
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });

    return new THREE.Mesh(geometry, material);
  }

  createTextMeshFitToBox(
    text: string,
    embossDepth: number,
    boxWidth: number,
    boxHeight: number,
  ): THREE.Mesh | null {
    if (!this.font || !text.trim()) return null;

    // Create text at a reference size, then scale to fit the target box
    const refSize = 10;
    const bevelThickness = 0.15;
    const geometry = new TextGeometry(text, {
      font: this.font,
      size: refSize,
      depth: embossDepth - 2 * bevelThickness,
      curveSegments: 6,
      bevelEnabled: true,
      bevelThickness,
      bevelSize: 0.1,
      bevelSegments: 2,
    });

    geometry.computeBoundingBox();
    const box = geometry.boundingBox!;
    const textWidth = box.max.x - box.min.x;
    const textHeight = box.max.y - box.min.y;

    if (textWidth === 0 || textHeight === 0) return null;

    // Scale uniformly to fit within box (constrained by both width and height)
    const scaleX = boxWidth / textWidth;
    const scaleY = boxHeight / textHeight;
    const scale = Math.min(scaleX, scaleY);

    geometry.scale(scale, scale, 1); // Don't scale Z to preserve emboss depth
    geometry.computeBoundingBox();

    // Center geometry at origin so position.set() places the center
    const newBox = geometry.boundingBox!;
    const centerX = (newBox.min.x + newBox.max.x) / 2;
    const centerY = (newBox.min.y + newBox.max.y) / 2;
    geometry.translate(-centerX, -centerY, 0);

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.4,
      metalness: 0.1,
    });

    return new THREE.Mesh(geometry, material);
  }

  createMultiLineTextMeshes(
    lines: string[],
    embossDepth: number,
    baseBBox: BoundingBoxInfo,
    textBoxes: TextBoxConfig[],
  ): THREE.Group {
    const group = new THREE.Group();

    // Text zone: center of the right portion (40%-95% of nameplate width)
    const textZoneCenterX = baseBBox.min.x + baseBBox.width * 0.67;

    // Default Y positions: evenly space all line slots across nameplate height
    // Using all slots (not just non-empty) keeps positions stable
    const totalLines = lines.length;
    const ySpacing = baseBBox.height / (totalLines + 1);

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const config = textBoxes[i] ?? { x: 0, y: 0, width: 50, height: 20 };

      // Box dimensions in world units
      const boxWidth = (config.width / 100) * baseBBox.width;
      const boxHeight = (config.height / 100) * baseBBox.height;

      const mesh = this.createTextMeshFitToBox(line, embossDepth, boxWidth, boxHeight);
      if (!mesh) continue;

      // Default center Y for this line slot (top to bottom)
      const defaultY = baseBBox.max.y - ySpacing * (i + 1);

      // Apply user offsets
      const offsetX = (config.x / 100) * baseBBox.width;
      const offsetY = (config.y / 100) * baseBBox.height;

      mesh.position.set(
        textZoneCenterX + offsetX,
        defaultY + offsetY,
        baseBBox.max.z,
      );

      group.add(mesh);
    }

    return group;
  }
}
