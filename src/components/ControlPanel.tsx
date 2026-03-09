import type { NameplateState } from '../engine/types';
import { TextInputSection } from './TextInputSection';
import { ExportButton } from './ExportButton';

interface EngineHandle {
  state: NameplateState;
  setTextLine: (index: 0 | 1 | 2, text: string) => void;
  generateFinalMesh: (format: 'stl' | '3mf') => void;
}

interface Props {
  engine: EngineHandle;
}

export function ControlPanel({ engine }: Props) {
  const { state } = engine;

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Nameplate Generator</h2>

      <TextInputSection
        textLines={state.textLines}
        onTextChange={engine.setTextLine}
        isProcessing={state.isProcessing}
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
