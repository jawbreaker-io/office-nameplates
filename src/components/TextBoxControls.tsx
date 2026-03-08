import { useState } from 'react';
import type { TextBoxConfig } from '../engine/types';

function Slider({ label, value, min, max, step, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{value.toFixed(step < 1 ? 1 : 0)}</span>
      </label>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer"
      />
    </div>
  );
}

const LINE_LABELS = ['First Name', 'Last Name', 'Title / Extra'];

interface Props {
  textBoxes: [TextBoxConfig, TextBoxConfig, TextBoxConfig];
  onChange: (index: 0 | 1 | 2, config: TextBoxConfig) => void;
}

export function TextBoxControls({ textBoxes, onChange }: Props) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <h3 className="text-sm font-semibold text-gray-700 mb-2">Text Box Layout</h3>
      <div className="space-y-1">
        {LINE_LABELS.map((label, i) => {
          const index = i as 0 | 1 | 2;
          const config = textBoxes[index];
          const isOpen = openIndex === i;

          const update = (partial: Partial<TextBoxConfig>) => {
            onChange(index, { ...config, ...partial });
          };

          return (
            <div key={label}>
              <button
                onClick={() => setOpenIndex(isOpen ? null : i)}
                className="flex items-center justify-between w-full text-xs font-medium text-gray-600 py-1"
              >
                <span>{label}</span>
                <span className="text-[10px] text-gray-400">{isOpen ? '▲' : '▼'}</span>
              </button>

              {isOpen && (
                <div className="ml-1 mb-2 space-y-1 border-l-2 border-gray-200 pl-2">
                  <Slider label="Left / Right" value={config.x} min={-50} max={50} step={1} onChange={(v) => update({ x: v })} />
                  <Slider label="Up / Down" value={config.y} min={-50} max={50} step={1} onChange={(v) => update({ y: v })} />
                  <Slider label="Width" value={config.width} min={5} max={80} step={1} onChange={(v) => update({ width: v })} />
                  <Slider label="Height" value={config.height} min={2} max={50} step={1} onChange={(v) => update({ height: v })} />
                  <div className="pt-1 text-[10px] text-gray-400 font-mono">
                    x:{config.x} y:{config.y} w:{config.width} h:{config.height}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
