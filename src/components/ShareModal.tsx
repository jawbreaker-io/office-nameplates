import { useState, useEffect } from 'react';

interface Props {
  onClose: () => void;
  shareUrl: string;
}

export function ShareModal({ onClose, shareUrl }: Props) {
  const [phase, setPhase] = useState<'generating' | 'ready'>('generating');

  useEffect(() => {
    const timer = setTimeout(() => {
      setPhase('ready');
    }, 1500);

    return () => clearTimeout(timer);
  }, [shareUrl]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      onClick={onClose}
      data-testid="share-modal-backdrop"
    >
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-gray-600"
          aria-label="Close"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {phase === 'generating' ? (
          <div className="text-center py-4" data-testid="share-generating">
            <svg className="animate-spin h-8 w-8 mx-auto text-teal-600 mb-3" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <p className="text-gray-700 font-medium">Generating your share link...</p>
          </div>
        ) : (
          <div className="text-center py-4" data-testid="share-ready">
            <div className="w-12 h-12 rounded-full bg-teal-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-teal-600">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <p className="text-gray-800 font-medium mb-1">Link copied to clipboard!</p>
            <p className="text-xs text-gray-500 break-all bg-gray-50 rounded p-2 mt-3">{shareUrl}</p>
          </div>
        )}
      </div>
    </div>
  );
}
