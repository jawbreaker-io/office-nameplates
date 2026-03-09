import { useRef, useEffect, useState, useCallback } from 'react';
import { NameplateEngine } from '../engine/NameplateEngine';
import type { NameplateState, PositionOffset, TextBoxConfig } from '../engine/types';
import { DEFAULT_STATE } from '../engine/types';
import { getRandomAuthor } from '../utils/randomAuthor';

export function useNameplateEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<NameplateEngine | null>(null);
  const [initialAuthor] = useState(() => getRandomAuthor());
  const [state, setState] = useState<NameplateState>(() => ({
    ...DEFAULT_STATE,
    textLines: [initialAuthor[0], initialAuthor[1], ''],
  }));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new NameplateEngine(canvas, {
      onStateChange: (partial) => {
        setState((prev) => ({ ...prev, ...partial }));
      },
    });
    engineRef.current = engine;

    // Sync random author to engine so 3D preview matches UI
    engine.setTextLine(0, initialAuthor[0]);
    engine.setTextLine(1, initialAuthor[1]);

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [canvasRef, initialAuthor]);

  const loadBaseSTL = useCallback((file: File) => {
    engineRef.current?.loadBaseSTL(file);
  }, []);

  const setTextLine = useCallback((index: 0 | 1 | 2, text: string) => {
    engineRef.current?.setTextLine(index, text);
  }, []);

  const setEmbossDepth = useCallback((depth: number) => {
    engineRef.current?.setEmbossDepth(depth);
  }, []);

  const loadLogo = useCallback((file: File) => {
    engineRef.current?.loadLogo(file);
  }, []);

  const generateFinalMesh = useCallback((format: 'stl' | '3mf' = '3mf') => {
    return engineRef.current?.generateFinalMesh(format);
  }, []);

  const resetView = useCallback(() => {
    engineRef.current?.resetView();
  }, []);

  const setDirectionalLight = useCallback((x: number, y: number, z: number, intensity: number) => {
    engineRef.current?.setDirectionalLight(x, y, z, intensity);
  }, []);

  const setBackLight = useCallback((x: number, y: number, z: number, intensity: number) => {
    engineRef.current?.setBackLight(x, y, z, intensity);
  }, []);

  const setAmbientIntensity = useCallback((intensity: number) => {
    engineRef.current?.setAmbientIntensity(intensity);
  }, []);

  const setLogoPosition = useCallback((position: PositionOffset) => {
    engineRef.current?.setLogoPosition(position);
  }, []);

  const setTextBox = useCallback((index: 0 | 1 | 2, config: TextBoxConfig) => {
    engineRef.current?.setTextBox(index, config);
  }, []);

  const getCameraInfo = useCallback(() => {
    return engineRef.current?.getCameraInfo() ?? null;
  }, []);

  return {
    state,
    loadBaseSTL,
    setTextLine,
    setEmbossDepth,
    loadLogo,
    generateFinalMesh,
    resetView,
    setDirectionalLight,
    setBackLight,
    setAmbientIntensity,
    setLogoPosition,
    setTextBox,
    getCameraInfo,
  };
}
