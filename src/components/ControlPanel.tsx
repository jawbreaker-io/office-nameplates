import { useState } from 'react';
import type { NameplateState } from '../engine/types';
import { TextInputSection } from './TextInputSection';
import { ExportButton } from './ExportButton';
import { ShareModal } from './ShareModal';
import { buildShareUrl } from '../utils/shareUrl';

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
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');

  const handleShare = () => {
    const url = buildShareUrl(state.textLines);
    setShareUrl(url);
    setShowShareModal(true);
  };

  return (
    <div className="p-4 space-y-5">
      <h2 className="text-lg font-bold text-gray-800">Nameplate Generator</h2>

      <TextInputSection
        textLines={state.textLines}
        onTextChange={engine.setTextLine}
        isProcessing={state.isProcessing}
        disabled={!state.isBaseLoaded}
      />

      <button
        onClick={handleShare}
        className="w-full py-2.5 px-4 bg-teal-600 text-white text-sm font-medium rounded-lg
          hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2
          transition-colors flex items-center justify-center gap-2"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share Nameplate
      </button>

      <div className="border-t border-gray-200 pt-4">
        <h3 className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">Download Files</h3>
        <ExportButton
          onGenerate={engine.generateFinalMesh}
          isProcessing={state.isProcessing}
          disabled={!state.isBaseLoaded}
        />
      </div>

      {showShareModal && (
        <ShareModal
          onClose={() => setShowShareModal(false)}
          shareUrl={shareUrl}
        />
      )}
    </div>
  );
}
