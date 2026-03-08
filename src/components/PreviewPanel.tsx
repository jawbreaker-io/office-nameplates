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
      <div className="flex-1 flex flex-col min-h-0">
        <canvas
          ref={canvasRef}
          className="flex-1 w-full"
        />
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
