import { useState } from 'react';

interface LightState {
  x: number;
  y: number;
  z: number;
  intensity: number;
}

interface Props {
  onDirectionalChange: (x: number, y: number, z: number, intensity: number) => void;
  onBackLightChange: (x: number, y: number, z: number, intensity: number) => void;
  onAmbientChange: (intensity: number) => void;
}

function LightSlider({ label, value, min, max, step, onChange, suffix }: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  suffix?: string;
}) {
  return (
    <div>
      <label className="flex justify-between text-xs text-gray-500">
        <span>{label}</span>
        <span>{value}{suffix}</span>
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

export function LightControls({ onDirectionalChange, onBackLightChange, onAmbientChange }: Props) {
  const [open, setOpen] = useState(false);
  const [ambient, setAmbient] = useState(1.0);
  const [main, setMain] = useState<LightState>({ x: 100, y: 200, z: 150, intensity: 1.0 });
  const [back, setBack] = useState<LightState>({ x: -100, y: 100, z: -150, intensity: 0.5 });

  const updateMain = (partial: Partial<LightState>) => {
    const next = { ...main, ...partial };
    setMain(next);
    onDirectionalChange(next.x, next.y, next.z, next.intensity);
  };

  const updateBack = (partial: Partial<LightState>) => {
    const next = { ...back, ...partial };
    setBack(next);
    onBackLightChange(next.x, next.y, next.z, next.intensity);
  };

  return (
    <section>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-700"
      >
        <span>Lighting</span>
        <span className="text-xs text-gray-400">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="mt-2 space-y-4 text-xs">
          <div className="space-y-1">
            <p className="font-medium text-gray-600">Ambient</p>
            <LightSlider label="Intensity" value={ambient} min={0} max={2} step={0.1}
              onChange={(v) => { setAmbient(v); onAmbientChange(v); }} />
          </div>

          <div className="space-y-1">
            <p className="font-medium text-gray-600">Main Light</p>
            <LightSlider label="X" value={main.x} min={-300} max={300} step={10} onChange={(v) => updateMain({ x: v })} />
            <LightSlider label="Y" value={main.y} min={-300} max={300} step={10} onChange={(v) => updateMain({ y: v })} />
            <LightSlider label="Z" value={main.z} min={-300} max={300} step={10} onChange={(v) => updateMain({ z: v })} />
            <LightSlider label="Intensity" value={main.intensity} min={0} max={3} step={0.1} onChange={(v) => updateMain({ intensity: v })} />
          </div>

          <div className="space-y-1">
            <p className="font-medium text-gray-600">Back Light</p>
            <LightSlider label="X" value={back.x} min={-300} max={300} step={10} onChange={(v) => updateBack({ x: v })} />
            <LightSlider label="Y" value={back.y} min={-300} max={300} step={10} onChange={(v) => updateBack({ y: v })} />
            <LightSlider label="Z" value={back.z} min={-300} max={300} step={10} onChange={(v) => updateBack({ z: v })} />
            <LightSlider label="Intensity" value={back.intensity} min={0} max={3} step={0.1} onChange={(v) => updateBack({ intensity: v })} />
          </div>

          <div className="pt-1 border-t border-gray-200 text-[10px] text-gray-400 font-mono leading-relaxed">
            <p>Main: ({main.x}, {main.y}, {main.z}) @ {main.intensity}</p>
            <p>Back: ({back.x}, {back.y}, {back.z}) @ {back.intensity}</p>
            <p>Ambient: {ambient}</p>
          </div>
        </div>
      )}
    </section>
  );
}
