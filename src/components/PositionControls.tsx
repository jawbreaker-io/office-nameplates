import { useState } from 'react';
import type { PositionOffset } from '../engine/types';

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

interface Props {
  title: string;
  position: PositionOffset;
  onChange: (position: PositionOffset) => void;
}

export function PositionControls({ title, position, onChange }: Props) {
  const [open, setOpen] = useState(false);

  const update = (partial: Partial<PositionOffset>) => {
    onChange({ ...position, ...partial });
  };

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
      >
        <span>{title}</span>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          <Slider label="Left / Right" value={position.x} min={-50} max={50} step={1} onChange={(v) => update({ x: v })} />
          <Slider label="Up / Down" value={position.y} min={-50} max={50} step={1} onChange={(v) => update({ y: v })} />
          <Slider label="Size" value={position.scale} min={0.2} max={3.0} step={0.1} onChange={(v) => update({ scale: v })} />
          <div className="pt-1 text-[10px] text-gray-400 font-mono">
            x:{position.x} y:{position.y} scale:{position.scale.toFixed(1)}
          </div>
        </div>
      )}
    </section>
  );
}
