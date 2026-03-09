import { describe, it, expect, beforeAll } from 'vitest';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as THREE from 'three';
import { STLImporter } from '../../src/engine/STLImporter';
import { TextMeshBuilder } from '../../src/engine/TextMeshBuilder';
import { LogoMeshBuilder } from '../../src/engine/LogoMeshBuilder';
import { CSGProcessor } from '../../src/engine/CSGProcessor';
import { STLExporterService } from '../../src/engine/STLExporterService';
import { STLLoader } from 'three/examples/jsm/loaders/STLLoader.js';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { DEFAULT_TEXT_BOXES } from '../../src/engine/types';

function loadFixtureSTL(): ArrayBuffer {
  const buf = readFileSync(join(__dirname, '../fixtures/simple-plate.stl'));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

function loadFixtureSVG(): string {
  return readFileSync(join(__dirname, '../fixtures/test-logo.svg'), 'utf-8');
}

function isValidBinarySTL(buffer: ArrayBuffer): boolean {
  if (buffer.byteLength < 84) return false;
  const view = new DataView(buffer);
  const triCount = view.getUint32(80, true);
  return buffer.byteLength === 80 + 4 + 50 * triCount;
}

describe('Full Pipeline Integration', () => {
  let textBuilder: TextMeshBuilder;

  beforeAll(() => {
    // Load font synchronously
    const fontJson = readFileSync(
      join(__dirname, '../../public/fonts/helvetiker_regular.typeface.json'),
      'utf-8',
    );
    const loader = new FontLoader();
    const font = loader.parse(JSON.parse(fontJson));

    textBuilder = new TextMeshBuilder();
    (textBuilder as unknown as { font: unknown }).font = font;
  });

  it('load STL → add text (2 lines) → CSG → export → valid STL with more triangles', async () => {
    const importer = new STLImporter();
    const baseGeom = importer.loadFromArrayBuffer(loadFixtureSTL());
    const baseBBox = STLImporter.getBoundingBoxInfo(baseGeom);
    const baseTriCount = baseGeom.getAttribute('position').count / 3;

    const textGroup = textBuilder.createMultiLineTextMeshes(
      ['John', 'Doe'],
      1.5,
      baseBBox,
      [...DEFAULT_TEXT_BOXES],
    );
    const textGeometries = CSGProcessor.flattenGroup(textGroup);

    const processor = new CSGProcessor();
    const result = await processor.union(baseGeom, textGeometries);

    const exporter = new STLExporterService();
    const buffer = exporter.exportToArrayBuffer(result);

    expect(isValidBinarySTL(buffer)).toBe(true);

    const view = new DataView(buffer);
    const resultTriCount = view.getUint32(80, true);
    expect(resultTriCount).toBeGreaterThan(baseTriCount);
  });

  it('load STL → add text + logo → CSG → export → valid STL', async () => {
    const importer = new STLImporter();
    const baseGeom = importer.loadFromArrayBuffer(loadFixtureSTL());
    const baseBBox = STLImporter.getBoundingBoxInfo(baseGeom);

    const textGroup = textBuilder.createMultiLineTextMeshes(
      ['Jane', 'Smith'],
      1.5,
      baseBBox,
      [...DEFAULT_TEXT_BOXES],
    );
    const textGeometries = CSGProcessor.flattenGroup(textGroup);

    const logoBuilder = new LogoMeshBuilder();
    const logoGroup = logoBuilder.createLogoMesh(loadFixtureSVG(), 1.5, baseBBox);
    const logoGeometries = CSGProcessor.flattenGroup(logoGroup);

    const allEmboss = [...textGeometries, ...logoGeometries];
    const processor = new CSGProcessor();
    const result = await processor.union(baseGeom, allEmboss);

    const exporter = new STLExporterService();
    const buffer = exporter.exportToArrayBuffer(result);
    expect(isValidBinarySTL(buffer)).toBe(true);
  });

  it('load STL → no text, no logo → export → output matches input triangle count', async () => {
    const importer = new STLImporter();
    const baseGeom = importer.loadFromArrayBuffer(loadFixtureSTL());

    const processor = new CSGProcessor();
    const result = await processor.union(baseGeom, []);

    const exporter = new STLExporterService();
    const buffer = exporter.exportToArrayBuffer(result);
    expect(isValidBinarySTL(buffer)).toBe(true);

    const view = new DataView(buffer);
    const resultTriCount = view.getUint32(80, true);
    const inputTriCount = baseGeom.getAttribute('position').count / 3;
    expect(resultTriCount).toBe(inputTriCount);
  });

  it('3 lines of text with some empty → only non-empty lines embossed', () => {
    const importer = new STLImporter();
    const baseGeom = importer.loadFromArrayBuffer(loadFixtureSTL());
    const baseBBox = STLImporter.getBoundingBoxInfo(baseGeom);

    const textGroup = textBuilder.createMultiLineTextMeshes(
      ['Alice', '', 'Engineer'],
      1.5,
      baseBBox,
      [...DEFAULT_TEXT_BOXES],
    );

    expect(textGroup.children.length).toBe(2);

    const textGeometries = CSGProcessor.flattenGroup(textGroup);
    expect(textGeometries.length).toBe(2);
  });

  it('very long name auto-scales and CSG still succeeds', { timeout: 15000 }, async () => {
    const importer = new STLImporter();
    const baseGeom = importer.loadFromArrayBuffer(loadFixtureSTL());
    const baseBBox = STLImporter.getBoundingBoxInfo(baseGeom);

    const textGroup = textBuilder.createMultiLineTextMeshes(
      ['Bartholomew Fitzwilliam III'],
      1.5,
      baseBBox,
      [...DEFAULT_TEXT_BOXES],
    );
    const textGeometries = CSGProcessor.flattenGroup(textGroup);

    const processor = new CSGProcessor();
    const result = await processor.union(baseGeom, textGeometries);

    const exporter = new STLExporterService();
    const buffer = exporter.exportToArrayBuffer(result);
    expect(isValidBinarySTL(buffer)).toBe(true);
  });
});
