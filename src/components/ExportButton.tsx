interface Props {
  onGenerate: () => void;
  isProcessing: boolean;
  disabled: boolean;
}

export function ExportButton({ onGenerate, isProcessing, disabled }: Props) {
  return (
    <button
      onClick={onGenerate}
      disabled={disabled || isProcessing}
      className="w-full py-2.5 px-4 bg-blue-600 text-white text-sm font-medium rounded-lg
        hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
        disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
    >
      {isProcessing ? (
        <span className="flex items-center justify-center gap-2">
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          Generating...
        </span>
      ) : (
        'Generate & Download STL'
      )}
    </button>
  );
}
