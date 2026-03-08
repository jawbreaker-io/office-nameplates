import { useRef } from 'react';
import { useNameplateEngine } from '../hooks/useNameplateEngine';
import { ControlPanel } from './ControlPanel';

export function PreviewPanel() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engine = useNameplateEngine(canvasRef);

  return (
    <div className="flex flex-col md:flex-row h-screen">
      {/* Left: Control Panel */}
      <div className="w-full md:w-80 flex-shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
        <ControlPanel engine={engine} />
      </div>

      {/* Right: 3D Preview */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        <canvas
          ref={canvasRef}
          className="flex-1 w-full"
        />
        <button
          onClick={engine.resetView}
          className="absolute top-3 right-3 px-2.5 py-2 bg-white/80 hover:bg-white
            border border-gray-300 rounded-lg text-gray-700 shadow-sm
            backdrop-blur-sm transition-colors flex items-center gap-1.5"
          title="Reset to front view"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="3" />
            <line x1="12" y1="3" x2="12" y2="6" />
            <line x1="12" y1="18" x2="12" y2="21" />
            <line x1="3" y1="12" x2="6" y2="12" />
            <line x1="18" y1="12" x2="21" y2="12" />
          </svg>
          <span className="text-xs font-medium">Front</span>
        </button>
        {/* Status bar */}
        <div className="h-8 flex items-center px-3 bg-gray-100 border-t border-gray-200 text-xs text-gray-600">
          {engine.state.error ? (
            <span className="text-red-600">{engine.state.error}</span>
          ) : (
            <span>{engine.state.statusMessage}</span>
          )}
        </div>
      </div>
    </div>
  );
}
