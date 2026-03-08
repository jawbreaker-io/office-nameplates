import type { NameplateState } from '../engine/types';
import { FileUploadSection } from './FileUploadSection';
import { TextInputSection } from './TextInputSection';
import { LogoUploadSection } from './LogoUploadSection';
import { ParameterControls } from './ParameterControls';
import { ExportButton } from './ExportButton';

interface EngineHandle {
  state: NameplateState;
  loadBaseSTL: (file: File) => void;
  setTextLine: (index: 0 | 1 | 2, text: string) => void;
  setEmbossDepth: (depth: number) => void;
  setFontSize: (size: number) => void;
  loadLogo: (file: File) => void;
  generateFinalMesh: () => void;
}

interface Props {
  engine: EngineHandle;
}

export function ControlPanel({ engine }: Props) {
  const { state } = engine;

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Nameplate Generator</h2>

      <FileUploadSection
        onFileSelected={engine.loadBaseSTL}
        isBaseLoaded={state.isBaseLoaded}
        isProcessing={state.isProcessing}
      />

      <TextInputSection
        textLines={state.textLines}
        onTextChange={engine.setTextLine}
        isProcessing={state.isProcessing}
        disabled={!state.isBaseLoaded}
      />

      <LogoUploadSection
        onFileSelected={engine.loadLogo}
        isProcessing={state.isProcessing}
        disabled={!state.isBaseLoaded}
      />

      <ParameterControls
        embossDepth={state.embossDepth}
        fontSize={state.fontSize}
        onEmbossDepthChange={engine.setEmbossDepth}
        onFontSizeChange={engine.setFontSize}
        disabled={!state.isBaseLoaded}
      />

      <ExportButton
        onGenerate={engine.generateFinalMesh}
        isProcessing={state.isProcessing}
        disabled={!state.isBaseLoaded}
      />
    </div>
  );
}
