import type * as THREE from 'three';

export interface PositionOffset {
  x: number; // left/right as percentage of nameplate width (-50 to 50)
  y: number; // up/down as percentage of nameplate height (-50 to 50)
  scale: number; // size multiplier (0.1 to 3.0)
}

export interface TextBoxConfig {
  x: number;      // horizontal offset from default center, % of nameplate width (-50 to 50)
  y: number;      // vertical offset from default position, % of nameplate height (-50 to 50)
  width: number;  // box width as % of nameplate width (5 to 80)
  height: number; // box height as % of nameplate height (5 to 50)
}

export interface NameplateState {
  isBaseLoaded: boolean;
  textLines: [string, string, string];
  logoFile: File | null;
  embossDepth: number;
  isProcessing: boolean;
  error: string | null;
  statusMessage: string;
  logoPosition: PositionOffset;
  textBoxes: [TextBoxConfig, TextBoxConfig, TextBoxConfig];
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

export const DEFAULT_TEXT_BOXES: [TextBoxConfig, TextBoxConfig, TextBoxConfig] = [
  { x: 0, y: -15, width: 50, height: 25 },  // First Name
  { x: 0, y: -12, width: 50, height: 10 },  // Last Name
  { x: 0, y: -1, width: 50, height: 10 },   // Title / Extra
];

export const DEFAULT_STATE: NameplateState = {
  isBaseLoaded: false,
  textLines: ['James', 'RICHARDSON', ''],
  logoFile: null,
  embossDepth: 1.5,
  isProcessing: false,
  error: null,
  statusMessage: 'Loading...',
  logoPosition: { x: 4, y: 0, scale: 1.2 },
  textBoxes: [...DEFAULT_TEXT_BOXES],
};
