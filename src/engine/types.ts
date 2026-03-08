import type * as THREE from 'three';

export interface NameplateState {
  isBaseLoaded: boolean;
  textLines: [string, string, string];
  logoFile: File | null;
  embossDepth: number;
  fontSize: number;
  isProcessing: boolean;
  error: string | null;
  statusMessage: string;
}

export interface EngineCallbacks {
  onStateChange: (state: Partial<NameplateState>) => void;
}

export interface BoundingBoxInfo {
  min: THREE.Vector3;
  max: THREE.Vector3;
  width: number;
  height: number;
  depth: number;
  center: THREE.Vector3;
}

export const DEFAULT_STATE: NameplateState = {
  isBaseLoaded: false,
  textLines: ['', '', ''],
  logoFile: null,
  embossDepth: 1.5,
  fontSize: 8,
  isProcessing: false,
  error: null,
  statusMessage: 'Upload a nameplate STL to begin.',
};
