import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import { TextMeshBuilder } from '../../src/engine/TextMeshBuilder';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import type { BoundingBoxInfo } from '../../src/engine/types';
import { DEFAULT_TEXT_BOXES } from '../../src/engine/types';
import * as THREE from 'three';

// Load font synchronously for tests
function loadFontSync() {
  const fontJson = readFileSync(
    join(__dirname, '../../public/fonts/helvetiker_regular.typeface.json'),
    'utf-8',
  );
  const loader = new FontLoader();
  return loader.parse(JSON.parse(fontJson));
}

// Inject the font into TextMeshBuilder by calling loadFont with a data URL
async function createBuilderWithFont(): Promise<TextMeshBuilder> {
  const builder = new TextMeshBuilder();
  // Access private font field directly for testing
  const font = loadFontSync();
  (builder as unknown as { font: unknown }).font = font;
  return builder;
}

const mockBBox: BoundingBoxInfo = {
  min: new THREE.Vector3(-50, -15, -1.5),
  max: new THREE.Vector3(50, 15, 1.5),
  width: 100,
  height: 30,
  depth: 3,
  center: new THREE.Vector3(0, 0, 0),
};

describe('TextMeshBuilder', () => {
  let builder: TextMeshBuilder;

  beforeAll(async () => {
    builder = await createBuilderWithFont();
  });

  it('creates text geometry with vertices for a given string', () => {
    const mesh = builder.createTextMesh('Hello', 8, 1.5, 60);
    expect(mesh).not.toBeNull();
    const positions = mesh!.geometry.getAttribute('position');
    expect(positions.count).toBeGreaterThan(0);
  });

  it('returns null for empty string', () => {
    const mesh = builder.createTextMesh('', 8, 1.5, 60);
    expect(mesh).toBeNull();
  });

  it('returns null for whitespace-only string', () => {
    const mesh = builder.createTextMesh('   ', 8, 1.5, 60);
    expect(mesh).toBeNull();
  });

  it('auto-scales text wider than max width', () => {
    const mesh = builder.createTextMesh('WWWWWWWWWWWWWWWWWWWW', 8, 1.5, 40);
    expect(mesh).not.toBeNull();
    mesh!.geometry.computeBoundingBox();
    const box = mesh!.geometry.boundingBox!;
    const width = box.max.x - box.min.x;
    expect(width).toBeLessThanOrEqual(40 + 0.5); // small tolerance
  });

  it('font size affects geometry bounding box proportionally', () => {
    const small = builder.createTextMesh('A', 6, 1.5, 200);
    const large = builder.createTextMesh('A', 12, 1.5, 200);

    small!.geometry.computeBoundingBox();
    large!.geometry.computeBoundingBox();

    const smallHeight =
      small!.geometry.boundingBox!.max.y - small!.geometry.boundingBox!.min.y;
    const largeHeight =
      large!.geometry.boundingBox!.max.y - large!.geometry.boundingBox!.min.y;

    // Larger font should produce taller geometry
    expect(largeHeight).toBeGreaterThan(smallHeight);
  });

  it('creates text mesh fit to box dimensions', () => {
    const mesh = builder.createTextMeshFitToBox('Hello', 1.5, 40, 10);
    expect(mesh).not.toBeNull();

    mesh!.geometry.computeBoundingBox();
    const box = mesh!.geometry.boundingBox!;
    const width = box.max.x - box.min.x;
    const height = box.max.y - box.min.y;

    // Text should fit within the box
    expect(width).toBeLessThanOrEqual(40 + 0.5);
    expect(height).toBeLessThanOrEqual(10 + 0.5);
  });

  it('createTextMeshFitToBox centers geometry at origin', () => {
    const mesh = builder.createTextMeshFitToBox('Test', 1.5, 30, 8);
    expect(mesh).not.toBeNull();

    mesh!.geometry.computeBoundingBox();
    const box = mesh!.geometry.boundingBox!;
    const centerX = (box.min.x + box.max.x) / 2;
    const centerY = (box.min.y + box.max.y) / 2;

    // Center should be approximately at origin
    expect(Math.abs(centerX)).toBeLessThan(0.5);
    expect(Math.abs(centerY)).toBeLessThan(0.5);
  });

  it('createTextMeshFitToBox returns null for empty text', () => {
    expect(builder.createTextMeshFitToBox('', 1.5, 40, 10)).toBeNull();
    expect(builder.createTextMeshFitToBox('   ', 1.5, 40, 10)).toBeNull();
  });

  it('creates multi-line text with different Y offsets', () => {
    const group = builder.createMultiLineTextMeshes(
      ['Line 1', 'Line 2', 'Line 3'],
      1.5,
      mockBBox,
      [...DEFAULT_TEXT_BOXES],
    );

    expect(group.children.length).toBe(3);

    // Each line should have a different Y position
    const yPositions = group.children.map((c) => c.position.y);
    const uniqueY = new Set(yPositions);
    expect(uniqueY.size).toBe(3);
  });

  it('skips empty lines in multi-line output', () => {
    const group = builder.createMultiLineTextMeshes(
      ['Line 1', '', 'Line 3'],
      1.5,
      mockBBox,
      [...DEFAULT_TEXT_BOXES],
    );

    expect(group.children.length).toBe(2);
  });
});
