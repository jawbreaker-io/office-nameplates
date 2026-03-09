interface Props {
  onGenerate: (format: 'stl' | '3mf') => void;
  isProcessing: boolean;
  disabled: boolean;
}

function Spinner() {
  return (
    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

export function ExportButton({ onGenerate, isProcessing, disabled }: Props) {
  return (
    <div className="flex gap-2">
      <button
        onClick={() => onGenerate('3mf')}
        disabled={disabled || isProcessing}
        className="flex-1 py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg
          hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Spinner />
            Generating...
          </span>
        ) : (
          'Download 3MF'
        )}
      </button>
      <button
        onClick={() => onGenerate('stl')}
        disabled={disabled || isProcessing}
        className="py-2.5 px-4 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg border border-gray-300
          hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2
          disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        STL
      </button>
    </div>
  );
}
