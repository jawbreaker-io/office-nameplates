import { useRef, useEffect, useState, useCallback } from 'react';
import { NameplateEngine } from '../engine/NameplateEngine';
import type { NameplateState } from '../engine/types';
import { DEFAULT_STATE } from '../engine/types';

export function useNameplateEngine(canvasRef: React.RefObject<HTMLCanvasElement | null>) {
  const engineRef = useRef<NameplateEngine | null>(null);
  const [state, setState] = useState<NameplateState>({ ...DEFAULT_STATE });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new NameplateEngine(canvas, {
      onStateChange: (partial) => {
        setState((prev) => ({ ...prev, ...partial }));
      },
    });
    engineRef.current = engine;

    return () => {
      engine.dispose();
      engineRef.current = null;
    };
  }, [canvasRef]);

  const loadBaseSTL = useCallback((file: File) => {
    engineRef.current?.loadBaseSTL(file);
  }, []);

  const setTextLine = useCallback((index: 0 | 1 | 2, text: string) => {
    engineRef.current?.setTextLine(index, text);
  }, []);

  const setEmbossDepth = useCallback((depth: number) => {
    engineRef.current?.setEmbossDepth(depth);
  }, []);

  const setFontSize = useCallback((size: number) => {
    engineRef.current?.setFontSize(size);
  }, []);

  const loadLogo = useCallback((file: File) => {
    engineRef.current?.loadLogo(file);
  }, []);

  const generateFinalMesh = useCallback(() => {
    return engineRef.current?.generateFinalMesh();
  }, []);

  return {
    state,
    loadBaseSTL,
    setTextLine,
    setEmbossDepth,
    setFontSize,
    loadLogo,
    generateFinalMesh,
  };
}
