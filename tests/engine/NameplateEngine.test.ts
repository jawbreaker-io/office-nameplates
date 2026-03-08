import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NameplateEngine } from '../../src/engine/NameplateEngine';

// Mock SceneManager to avoid WebGL context requirement
vi.mock('../../src/engine/SceneManager', () => {
  class MockSceneManager {
    scene = { add: vi.fn(), remove: vi.fn(), traverse: vi.fn() };
    camera = { position: { set: vi.fn() } };
    renderer = { dispose: vi.fn() };
    controls = { dispose: vi.fn(), target: { copy: vi.fn() }, update: vi.fn() };
    fitCameraToObject = vi.fn();
    dispose = vi.fn();
  }
  return { SceneManager: MockSceneManager };
});

describe('NameplateEngine', () => {
  let engine: NameplateEngine;
  const stateChanges: Record<string, unknown>[] = [];

  beforeEach(() => {
    stateChanges.length = 0;
    const canvas = document.createElement('canvas');
    Object.defineProperty(canvas, 'clientWidth', { value: 800 });
    Object.defineProperty(canvas, 'clientHeight', { value: 600 });
    engine = new NameplateEngine(canvas, {
      onStateChange: (partial) => stateChanges.push(partial),
    });
  });

  it('initializes with default state', () => {
    const state = engine.getState();
    expect(state.isBaseLoaded).toBe(false);
    expect(state.textLines).toEqual(['', '', '']);
    expect(state.embossDepth).toBe(1.5);
    expect(state.fontSize).toBe(8);
    expect(state.isProcessing).toBe(false);
  });

  it('setTextLine updates state', () => {
    engine.setTextLine(0, 'John');
    const state = engine.getState();
    expect(state.textLines[0]).toBe('John');
  });

  it('setTextLine with empty string clears the line', () => {
    engine.setTextLine(0, 'John');
    engine.setTextLine(0, '');
    const state = engine.getState();
    expect(state.textLines[0]).toBe('');
  });

  it('setEmbossDepth updates state', () => {
    engine.setEmbossDepth(3.0);
    const state = engine.getState();
    expect(state.embossDepth).toBe(3.0);
  });

  it('setFontSize updates state', () => {
    engine.setFontSize(12);
    const state = engine.getState();
    expect(state.fontSize).toBe(12);
  });

  it('generateFinalMesh throws without base STL', async () => {
    await expect(engine.generateFinalMesh()).rejects.toThrow('No base STL loaded');
  });

  it('state changes are emitted via callback', () => {
    engine.setTextLine(1, 'Doe');
    expect(stateChanges.length).toBeGreaterThan(0);

    const lastChange = stateChanges[stateChanges.length - 1];
    expect(lastChange).toHaveProperty('textLines');
  });

  it('dispose does not throw', () => {
    expect(() => engine.dispose()).not.toThrow();
  });
});
