import * as THREE from 'three';
import { SceneManager } from './SceneManager';
import { STLImporter } from './STLImporter';
import { TextMeshBuilder } from './TextMeshBuilder';
import { LogoMeshBuilder } from './LogoMeshBuilder';
import { CSGProcessor } from './CSGProcessor';
import { STLExporterService } from './STLExporterService';
import { ThreeMFExporterService } from './ThreeMFExporterService';
import { downloadBlob, readFileAsArrayBuffer, readFileAsText } from '../utils/fileHelpers';
import type { NameplateState, EngineCallbacks, BoundingBoxInfo, PositionOffset, TextBoxConfig } from './types';
import { DEFAULT_STATE } from './types';

export class NameplateEngine {
  private sceneManager: SceneManager;
  private stlImporter = new STLImporter();
  private textMeshBuilder = new TextMeshBuilder();
  private logoMeshBuilder = new LogoMeshBuilder();
  private csgProcessor = new CSGProcessor();
  private stlExporter = new STLExporterService();
  private threeMFExporter = new ThreeMFExporterService();

  private state: NameplateState = { ...DEFAULT_STATE };
  private callbacks: EngineCallbacks;

  // Scene objects
  private baseMesh: THREE.Mesh | null = null;
  private baseGeometry: THREE.BufferGeometry | null = null;
  private baseBBox: BoundingBoxInfo | null = null;
  private textGroup: THREE.Group | null = null;
  private logoGroup: THREE.Group | null = null;
  private svgText: string | null = null;

  constructor(canvas: HTMLCanvasElement, callbacks: EngineCallbacks) {
    this.sceneManager = new SceneManager(canvas);
    this.callbacks = callbacks;
    this.loadBundledAssets();
  }

  private async loadBundledAssets(): Promise<void> {
    try {
      // Load font and base STL in parallel so the font is ready
      // before updateTextPreview() runs (prevents missing-text race)
      const [, stlBuffer] = await Promise.all([
        this.textMeshBuilder.loadFont(),
        fetch('/nameplate-base.stl').then((r) => r.arrayBuffer()),
      ]);
      const geometry = this.stlImporter.loadFromArrayBuffer(stlBuffer);

      this.baseGeometry = geometry;
      this.baseBBox = STLImporter.getBoundingBoxInfo(geometry);

      const material = new THREE.MeshStandardMaterial({
        color: 0xa5d1ea,
        roughness: 0.5,
        metalness: 0.2,
      });
      this.baseMesh = new THREE.Mesh(geometry, material);
      this.baseMesh.castShadow = true;
      this.baseMesh.receiveShadow = true;
      this.sceneManager.scene.add(this.baseMesh);
      this.sceneManager.fitCameraToObject(this.baseMesh);

      this.updateState({
        isBaseLoaded: true,
        statusMessage: 'Enter your name to get started.',
      });

      // Render default text if any
      this.updateTextPreview();

      // Load bundled company logo
      const svgResponse = await fetch('/company-logo.svg');
      this.svgText = await svgResponse.text();
      this.updateLogoPreview();
    } catch (err) {
      this.updateState({
        error: `Failed to load assets: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }

  private updateState(partial: Partial<NameplateState>): void {
    Object.assign(this.state, partial);
    this.callbacks.onStateChange(partial);
  }

  getState(): NameplateState {
    return { ...this.state };
  }

  async loadBaseSTL(file: File): Promise<void> {
    try {
      this.updateState({ statusMessage: 'Loading STL...', error: null });
      const buffer = await readFileAsArrayBuffer(file);
      const geometry = this.stlImporter.loadFromArrayBuffer(buffer);

      // Remove old base mesh
      if (this.baseMesh) {
        this.sceneManager.scene.remove(this.baseMesh);
        this.baseMesh.geometry.dispose();
        (this.baseMesh.material as THREE.Material).dispose();
      }

      this.baseGeometry = geometry;
      this.baseBBox = STLImporter.getBoundingBoxInfo(geometry);

      const material = new THREE.MeshStandardMaterial({
        color: 0xa5d1ea,
        roughness: 0.5,
        metalness: 0.2,
      });
      this.baseMesh = new THREE.Mesh(geometry, material);
      this.sceneManager.scene.add(this.baseMesh);
      this.sceneManager.fitCameraToObject(this.baseMesh);

      this.updateState({
        isBaseLoaded: true,
        statusMessage: 'STL loaded. Enter text or upload a logo.',
      });

      // Refresh overlays
      this.updateTextPreview();
      this.updateLogoPreview();
    } catch (err) {
      this.updateState({
        error: `Failed to load STL: ${err instanceof Error ? err.message : 'Unknown error'}`,
        statusMessage: 'Error loading STL.',
      });
    }
  }

  setTextLine(index: 0 | 1 | 2, text: string): void {
    const lines = [...this.state.textLines] as [string, string, string];
    lines[index] = text;
    this.updateState({ textLines: lines });
    this.updateTextPreview();
  }

  setEmbossDepth(depth: number): void {
    this.updateState({ embossDepth: depth });
    this.updateTextPreview();
    this.updateLogoPreview();
  }

  setTextBox(index: 0 | 1 | 2, config: TextBoxConfig): void {
    const boxes = [...this.state.textBoxes] as [TextBoxConfig, TextBoxConfig, TextBoxConfig];
    boxes[index] = config;
    this.updateState({ textBoxes: boxes });
    this.updateTextPreview();
  }

  setLogoPosition(position: PositionOffset): void {
    this.updateState({ logoPosition: position });
    this.updateLogoPreview();
  }

  async loadLogo(file: File): Promise<void> {
    try {
      this.svgText = await readFileAsText(file);
      this.updateState({ logoFile: file, error: null });
      this.updateLogoPreview();
    } catch (err) {
      this.updateState({
        error: `Failed to load SVG: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }

  private enableShadows(object: THREE.Object3D): void {
    object.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }

  private updateTextPreview(): void {
    if (this.textGroup) {
      this.sceneManager.scene.remove(this.textGroup);
    }
    if (!this.baseBBox) return;

    this.textGroup = this.textMeshBuilder.createMultiLineTextMeshes(
      this.state.textLines,
      this.state.embossDepth,
      this.baseBBox,
      this.state.textBoxes,
    );
    this.enableShadows(this.textGroup);
    this.sceneManager.scene.add(this.textGroup);
  }

  private updateLogoPreview(): void {
    if (this.logoGroup) {
      this.sceneManager.scene.remove(this.logoGroup);
    }
    if (!this.baseBBox || !this.svgText) return;

    try {
      this.logoGroup = this.logoMeshBuilder.createLogoMesh(
        this.svgText,
        this.state.embossDepth,
        this.baseBBox,
        this.state.logoPosition,
      );
      this.enableShadows(this.logoGroup);
      this.sceneManager.scene.add(this.logoGroup);
    } catch (err) {
      this.updateState({
        error: `Logo error: ${err instanceof Error ? err.message : 'Unknown error'}`,
      });
    }
  }

  async generateFinalMesh(format: 'stl' | '3mf' = '3mf'): Promise<void> {
    if (!this.baseGeometry || !this.baseBBox) {
      throw new Error('No base STL loaded.');
    }

    this.updateState({ isProcessing: true, statusMessage: 'Generating mesh...', error: null });

    try {
      // Collect all emboss geometries in world space
      const embossGeometries: THREE.BufferGeometry[] = [];

      // Text geometries
      if (this.textGroup) {
        embossGeometries.push(...CSGProcessor.flattenGroup(this.textGroup));
      }

      // Logo geometries
      if (this.logoGroup) {
        embossGeometries.push(...CSGProcessor.flattenGroup(this.logoGroup));
      }

      // Export
      const firstName = this.state.textLines[0].trim();
      const lastName = this.state.textLines[1].trim();
      const filename = [firstName, lastName].filter(Boolean).join('_').replace(/\s+/g, '_') || 'nameplate';

      if (format === '3mf') {
        // Two watertight parts via CSG: base with cutout + emboss contribution
        const [baseGeom, embossGeom] = await this.csgProcessor.unionSplit(this.baseGeometry, embossGeometries);
        const blob = this.threeMFExporter.exportToBlob([
          { name: 'Baseplate', geometry: baseGeom, material: { name: 'Baseplate', color: '#A5D1EA' } },
          { name: 'Emboss', geometry: embossGeom, material: { name: 'Emboss', color: '#FFFFFF' } },
        ], filename);
        downloadBlob(blob, `${filename}.3mf`);
      } else {
        // STL: single CSG union
        const finalGeometry = await this.csgProcessor.union(this.baseGeometry, embossGeometries);
        const blob = this.stlExporter.exportToBlob(finalGeometry);
        downloadBlob(blob, `${filename}.stl`);
      }

      this.updateState({
        isProcessing: false,
        statusMessage: 'Download started!',
      });
    } catch (err) {
      this.updateState({
        isProcessing: false,
        error: `Generation failed: ${err instanceof Error ? err.message : 'Unknown error'}`,
        statusMessage: 'Error during generation.',
      });
    }
  }

  resetView(): void {
    this.sceneManager.resetView();
  }

  setDirectionalLight(x: number, y: number, z: number, intensity: number): void {
    this.sceneManager.directionalLight.position.set(x, y, z);
    this.sceneManager.directionalLight.intensity = intensity;
  }

  setBackLight(x: number, y: number, z: number, intensity: number): void {
    this.sceneManager.backLight.position.set(x, y, z);
    this.sceneManager.backLight.intensity = intensity;
  }

  setAmbientIntensity(intensity: number): void {
    this.sceneManager.ambientLight.intensity = intensity;
  }

  getCameraInfo(): { position: { x: number; y: number; z: number }; target: { x: number; y: number; z: number } } {
    const p = this.sceneManager.camera.position;
    const t = this.sceneManager.controls.target;
    return {
      position: { x: p.x, y: p.y, z: p.z },
      target: { x: t.x, y: t.y, z: t.z },
    };
  }

  dispose(): void {
    this.sceneManager.dispose();
  }
}
