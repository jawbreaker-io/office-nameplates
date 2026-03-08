interface Props {
  embossDepth: number;
  fontSize: number;
  onEmbossDepthChange: (depth: number) => void;
  onFontSizeChange: (size: number) => void;
  disabled: boolean;
}

export function ParameterControls({
  embossDepth,
  fontSize,
  onEmbossDepthChange,
  onFontSizeChange,
  disabled,
}: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h3>
      <div className="space-y-3">
        <div>
          <label className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Emboss Depth</span>
            <span>{embossDepth.toFixed(1)} mm</span>
          </label>
          <input
            type="range"
            min="0.5"
            max="5"
            step="0.1"
            value={embossDepth}
            onChange={(e) => onEmbossDepthChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
        <div>
          <label className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Font Size</span>
            <span>{fontSize.toFixed(0)} pt</span>
          </label>
          <input
            type="range"
            min="4"
            max="20"
            step="1"
            value={fontSize}
            onChange={(e) => onFontSizeChange(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer
              disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>
      </div>
    </section>
  );
}
