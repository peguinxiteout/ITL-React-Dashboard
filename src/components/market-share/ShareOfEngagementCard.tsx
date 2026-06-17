import React, { useState } from 'react';
import { WeekPreset } from '../../data/mockData';

type SovMode = 'views' | 'videoCount';

const SUMMARY: Record<WeekPreset, { soe: number; gap: number }> = {
  1:  { soe: 14.8, gap: -1.4 },
  4:  { soe: 15.5, gap: -1.2 },
  8:  { soe: 15.9, gap: -1.0 },
  12: { soe: 16.2, gap: -0.9 },
};


const BASE_VIEWS: { brand: string; sov: number; soe: number }[] = [
  { brand: 'Sonalika',        sov: 17.1, soe: 16.2 },
  { brand: 'Mahindra',        sov: 19.8, soe: 19.5 },
  { brand: 'Swaraj',          sov: 36.8, soe: 37.3 },
  { brand: 'John Deere',      sov:  8.8, soe:  8.6 },
  { brand: 'New Holland',     sov: 12.4, soe: 12.3 },
  { brand: 'Massey Ferguson', sov:  8.1, soe:  8.0 },
  { brand: 'Escorts Kubota',  sov:  9.6, soe:  9.5 },
];

const BASE_VIDEO_COUNT: { brand: string; sov: number; soe: number }[] = [
  { brand: 'Sonalika',        sov: 11.6, soe: 16.2 },
  { brand: 'Mahindra',        sov: 20.9, soe: 19.5 },
  { brand: 'Swaraj',          sov: 15.1, soe: 37.3 },
  { brand: 'John Deere',      sov:  7.7, soe:  8.6 },
  { brand: 'New Holland',     sov: 16.7, soe: 12.3 },
  { brand: 'Massey Ferguson', sov:  7.9, soe:  8.0 },
  { brand: 'Escorts Kubota',  sov: 20.1, soe:  9.5 },
];

const SOV_SCALE: Record<WeekPreset, number> = { 12: 1.0, 8: 0.92, 4: 0.85, 1: 0.78 };

const AXIS_MAX = 40;
const GRID_TICKS = [0, 10, 20, 30, 40];
const ROW_H = 44;
const DOT_D = 14;

const SOV_COLOR = '#185FA5';
const SOE_COLOR = '#1D9E75';
const AMBER_HL = 'rgba(239,159,39,0.10)';
const GREEN_LINE = '#1D9E75';
const RED_LINE  = '#E55F5F';

interface Props {
  selectedWeeks: WeekPreset;
  selectedBrands: string[];
}

export function ShareOfEngagementCard({ selectedWeeks, selectedBrands }: Props) {
  const [mode, setMode] = useState<SovMode>('views');

  const summary  = SUMMARY[selectedWeeks];
  const sovScale = SOV_SCALE[selectedWeeks];
  const soeScale = summary.soe / 16.2;

  const baseData = mode === 'views' ? BASE_VIEWS : BASE_VIDEO_COUNT;
  const rows = baseData
    .filter((d) => selectedBrands.includes(d.brand))
    .map((d) => ({
      brand: d.brand,
      sov:   d.sov * sovScale,
      soe:   d.soe * soeScale,
      isSon: d.brand === 'Sonalika',
    }));

  const xPct = (v: number) => `${(v / AXIS_MAX) * 100}%`;
  const xNum = (v: number) => (v / AXIS_MAX) * 100;

  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">

      {/* ── Part 1: Summary block ─────────────────────────────────── */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-slate-900">Share of Engagement</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          Sonalika's combined engagement share vs category
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-5">
        <div
          className="rounded-lg p-4"
          style={{ backgroundColor: '#FFF8EE', border: '1px solid #F5D8A0' }}
        >
          <p className="text-xs mb-2" style={{ color: '#A16207' }}>
            Sonalika SoE — Combined
          </p>
          <p className="text-3xl font-bold mb-1" style={{ color: '#EF9F27' }}>
            {summary.soe.toFixed(1)}%
          </p>
          <p className="text-xs text-slate-500">share of total category engagement</p>
        </div>

        <div className="rounded-lg p-4 bg-slate-50 border border-slate-200">
          <p className="text-xs text-slate-500 mb-2">SoV – SoE Gap</p>
          <p
            className="text-3xl font-bold mb-1"
            style={{ color: summary.gap >= 0 ? '#16a34a' : '#E55F5F' }}
          >
            {summary.gap >= 0 ? '+' : ''}
            {summary.gap.toFixed(1)} pp
          </p>
          <p className="text-xs text-slate-500">negative = content under-delivers on engagement vs presence</p>
        </div>
      </div>

      {/* 0.5px divider */}
      <div style={{ borderTop: '0.5px solid #e2e8f0', marginBottom: '1.25rem' }} />

      {/* ── Part 2: Dumbbell chart ────────────────────────────────── */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm font-semibold text-slate-800">SoV vs SoE by brand</p>
          <p className="mt-0.5 text-xs text-slate-500">
            Comparing presence to engagement resonance
          </p>
        </div>

        {/* Segmented toggle */}
        <div
          className="flex overflow-hidden rounded-md"
          style={{ border: '1px solid #e2e8f0', flexShrink: 0 }}
        >
          {(['views', 'videoCount'] as SovMode[]).map((m, i) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                padding: '6px 12px',
                backgroundColor: mode === m ? '#1a1a2e' : 'white',
                color: mode === m ? 'white' : '#6b7280',
                border: 'none',
                borderLeft: i > 0 ? '1px solid #e2e8f0' : 'none',
                cursor: 'pointer',
                fontWeight: mode === m ? 600 : 400,
                fontSize: 12,
              }}
            >
              {m === 'views' ? 'Views' : 'Video Count'}
            </button>
          ))}
        </div>
      </div>

      {/* Dumbbell rows + x-axis */}
      <div>
        {rows.map((row) => {
          const sx = xNum(row.sov);
          const ex = xNum(row.soe);
          const lineLeft = Math.min(sx, ex);
          const lineW    = Math.abs(sx - ex);
          const lineColor = row.soe > row.sov ? GREEN_LINE : RED_LINE;

          return (
            <div
              key={row.brand}
              style={{
                display: 'flex',
                alignItems: 'center',
                height: ROW_H,
                backgroundColor: row.isSon ? AMBER_HL : 'transparent',
              }}
            >
              {/* Brand name */}
              <div
                style={{
                  width: 100,
                  flexShrink: 0,
                  fontSize: 12,
                  color: '#334155',
                  paddingRight: 8,
                  fontWeight: row.isSon ? 600 : 400,
                }}
              >
                {row.brand}
              </div>

              {/* Chart area */}
              <div style={{ flex: 1, minWidth: 0, position: 'relative', height: '100%' }}>
                {/* Gridlines */}
                {GRID_TICKS.map((g) => (
                  <div
                    key={g}
                    style={{
                      position: 'absolute',
                      left: xPct(g),
                      top: 0,
                      bottom: 0,
                      width: 1,
                      backgroundColor: '#f1f5f9',
                      pointerEvents: 'none',
                    }}
                  />
                ))}

                {/* Connecting line */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${lineLeft}%`,
                    width: `${lineW}%`,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    height: 1.5,
                    backgroundColor: lineColor,
                    pointerEvents: 'none',
                  }}
                />

                {/* SoV dot (blue) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${sx}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: DOT_D,
                    height: DOT_D,
                    borderRadius: '50%',
                    backgroundColor: SOV_COLOR,
                    zIndex: 1,
                  }}
                />

                {/* SoE dot (green) */}
                <div
                  style={{
                    position: 'absolute',
                    left: `${ex}%`,
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: DOT_D,
                    height: DOT_D,
                    borderRadius: '50%',
                    backgroundColor: SOE_COLOR,
                    zIndex: 1,
                  }}
                />
              </div>

              {/* Value labels */}
              <div
                style={{
                  width: 116,
                  flexShrink: 0,
                  paddingLeft: 10,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 11,
                }}
              >
                <span style={{ color: SOV_COLOR, fontWeight: 600 }}>
                  {row.sov.toFixed(1)}%
                </span>
                <span style={{ color: '#cbd5e1' }}>·</span>
                <span style={{ color: SOE_COLOR, fontWeight: 600 }}>
                  {row.soe.toFixed(1)}%
                </span>
              </div>
            </div>
          );
        })}

        {/* X-axis label row */}
        <div style={{ display: 'flex', height: 24 }}>
          <div style={{ width: 100, flexShrink: 0 }} />
          <div style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {GRID_TICKS.map((g, i) => (
              <div
                key={g}
                style={{
                  position: 'absolute',
                  left: xPct(g),
                  top: 4,
                  fontSize: 10,
                  color: '#94a3b8',
                  whiteSpace: 'nowrap',
                  transform:
                    i === 0
                      ? 'none'
                      : i === GRID_TICKS.length - 1
                      ? 'translateX(-100%)'
                      : 'translateX(-50%)',
                }}
              >
                {g}%
              </div>
            ))}
          </div>
          <div style={{ width: 116, flexShrink: 0 }} />
        </div>
      </div>

      {/* Legend */}
      <div className="mt-3 flex flex-col items-center gap-1">
        <div className="flex items-center gap-5 text-xs text-slate-600">
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: SOV_COLOR,
              }}
            />
            SoV ({mode === 'views' ? 'Views' : 'Video Count'})
          </span>
          <span className="flex items-center gap-1.5">
            <span
              style={{
                display: 'inline-block',
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: SOE_COLOR,
              }}
            />
            SoE (Combined)
          </span>
        </div>
        <p className="text-[10px] text-slate-400">
          Line color: green = SoE outperforms SoV · red = SoV outperforms SoE
        </p>
      </div>
    </section>
  );
}
