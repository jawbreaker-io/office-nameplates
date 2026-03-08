interface Props {
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  disabled: boolean;
}

export function ParameterControls({
  fontSize,
  onFontSizeChange,
  disabled,
}: Props) {
  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Parameters</h3>
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
    </section>
  );
}
