import React from 'react';
import { WEEK_PRESETS, WeekPreset } from '../../data/mockData';
interface WeekPresetSelectorProps {
  value: WeekPreset;
  onChange: (weeks: WeekPreset) => void;
}
export function WeekPresetSelector({
  value,
  onChange
}: WeekPresetSelectorProps) {
  return (
    <div role="group" aria-label="Date range preset" className="inline-flex">
      {WEEK_PRESETS.map((preset, i) => {
        const active = preset.weeks === value;
        const first = i === 0;
        const last = i === WEEK_PRESETS.length - 1;
        return (
          <button
            key={preset.weeks}
            type="button"
            onClick={() => onChange(preset.weeks)}
            aria-pressed={active}
            className="px-2.5 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
            style={{
              background: active ? '#1a1a2e' : '#ffffff',
              color: active ? '#ffffff' : '#64748b',
              border: `1px solid ${active ? '#1a1a2e' : '#cbd5e1'}`,
              marginLeft: first ? 0 : -1,
              borderTopLeftRadius: first ? 8 : 0,
              borderBottomLeftRadius: first ? 8 : 0,
              borderTopRightRadius: last ? 8 : 0,
              borderBottomRightRadius: last ? 8 : 0,
              position: active ? 'relative' : 'static',
              zIndex: active ? 1 : 0,
              whiteSpace: 'nowrap'
            }}>

            {preset.label}
          </button>);

      })}
    </div>);

}
