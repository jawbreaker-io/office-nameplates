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
  const [showDownloads, setShowDownloads] = useState(false);

  const handleShare = async () => {
    const url = buildShareUrl(state.textLines);
    setShareUrl(url);
    setShowShareModal(true);
    // Copy immediately while user activation is still valid —
    // clipboard API rejects writes outside of direct user gestures
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback: modal still shows the URL for manual copy
    }
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
        <button
          onClick={() => setShowDownloads(!showDownloads)}
          className="flex items-center gap-1.5 text-xs font-medium text-gray-400 uppercase tracking-wide
            hover:text-gray-600 transition-colors w-full"
        >
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor"
            strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
            className={`transition-transform ${showDownloads ? 'rotate-90' : ''}`}
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
          Download Files
        </button>
        {showDownloads && (
          <div className="mt-2">
            <ExportButton
              onGenerate={engine.generateFinalMesh}
              isProcessing={state.isProcessing}
              disabled={!state.isBaseLoaded}
            />
          </div>
        )}
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
