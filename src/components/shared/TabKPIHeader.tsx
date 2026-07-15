import React from 'react';
import { CalendarRangeIcon, TractorIcon, TagIcon, VideoIcon } from 'lucide-react';
import type { OverviewStats } from '../../hooks/useCMSData.js';
import type { GlobalDateRange } from '../../pages/Dashboard';

// Mirrors MIN_DATE / MAX_DATE in pages/Dashboard.tsx (IO's inline date picker).
// Duplicated here rather than imported so this shared header doesn't couple to
// the IO page module. If a third tab adopts this header, consider hoisting
// these into a single shared constants file instead of a third copy.
const DEFAULT_MIN_DATE = '2026-03-01';
const DEFAULT_MAX_DATE = '2026-06-10';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function parseIso(iso: string): { y: number; m: number; d: number } {
  const [y, m, d] = iso.split('-').map(Number);
  return { y, m, d };
}

// "2026-03-01" + "2026-03-08" -> "1–8 Mar 2026"; falls back to full month/year
// on both ends when the range crosses a month or year boundary.
function formatDateRangeLabel(startDate: string, endDate: string): string {
  if (!startDate || !endDate) return '—';
  const s = parseIso(startDate);
  const e = parseIso(endDate);
  const sMonth = MONTHS[s.m - 1] ?? '';
  const eMonth = MONTHS[e.m - 1] ?? '';
  if (s.y === e.y && s.m === e.m) return `${s.d}–${e.d} ${eMonth} ${e.y}`;
  if (s.y === e.y) return `${s.d} ${sMonth} – ${e.d} ${eMonth} ${e.y}`;
  return `${s.d} ${sMonth} ${s.y} – ${e.d} ${eMonth} ${e.y}`;
}

const dateInputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '0.5px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
  padding: '6px 10px',
  outline: 'none',
  cursor: 'pointer',
  color: '#0f172a',
};

// Single source of truth for the KPI card container look (background, border,
// radius, shadow, padding) — every card in the row, including the Date Range
// card, renders this same class so they can never visually drift apart.
const CARD_CONTAINER_CLASS = 'rounded-xl border border-slate-200 bg-white p-4';

function KPICard({
  icon, label, value, descriptor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  descriptor: React.ReactNode;
}) {
  return (
    <div className={CARD_CONTAINER_CLASS}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: '#94a3b8', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', color: '#94a3b8', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 500, color: '#0f172a', lineHeight: 1, margin: '0 0 6px 0' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{descriptor}</p>
    </div>
  );
}

function DateRangeCard({ startDate, endDate }: { startDate: string; endDate: string }) {
  return (
    <div className={CARD_CONTAINER_CLASS}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: '#94a3b8', display: 'flex' }}><CalendarRangeIcon size={15} /></span>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', color: '#94a3b8', textTransform: 'uppercase' }}>
          Date Range
        </span>
      </div>
      <p style={{ fontSize: 20, fontWeight: 600, color: '#0f172a', lineHeight: 1.2, margin: '0 0 6px 0' }}>
        {formatDateRangeLabel(startDate, endDate)}
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Currently selected window</p>
    </div>
  );
}

export interface TabKPIHeaderProps {
  title: string;
  subtitle: string;
  startDate: string;
  endDate: string;
  minDate?: string;
  maxDate?: string;
  onDateChange: (value: GlobalDateRange | ((prev: GlobalDateRange) => GlobalDateRange)) => void;
  stats: OverviewStats;
  loading?: boolean;
  actions?: React.ReactNode;
}

// Shared KPI header: title/subtitle + a functional date range picker (writes
// to the caller's globalDateRange state) + Total Videos / Tractor Videos /
// Brand Mentioned (all sourced from computeOverviewStats, same as IO) / a
// read-only Date Range card. Card 3's label+metric are currently fixed to
// "Brand Mentioned" for cross-tab consistency with IO — making it swappable
// per-tab is a follow-up, not implemented here.
export function TabKPIHeader({
  title,
  subtitle,
  startDate,
  endDate,
  minDate = DEFAULT_MIN_DATE,
  maxDate = DEFAULT_MAX_DATE,
  onDateChange,
  stats,
  loading = false,
  actions,
}: TabKPIHeaderProps) {
  const handleStartDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onDateChange((prev) => ({
      startDate: v,
      endDate: v > prev.endDate ? v : prev.endDate,
    }));
  };

  const handleEndDate = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    onDateChange((prev) => ({
      startDate: v < prev.startDate ? v : prev.startDate,
      endDate: v,
    }));
  };

  return (
    <div className="space-y-5">
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>{title}</h2>
          <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0 0' }}>{subtitle}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 2 }}>Date Range</span>
            <input type="date" value={startDate} min={minDate} max={endDate} onChange={handleStartDate} style={dateInputStyle} />
            <span style={{ fontSize: 13, color: '#94a3b8' }}>–</span>
            <input type="date" value={endDate} min={startDate} max={maxDate} onChange={handleEndDate} style={dateInputStyle} />
          </div>
          {actions}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KPICard
          icon={<VideoIcon size={15} />}
          label="Total Videos Analyzed"
          value={loading ? '…' : stats.totalVideos}
          descriptor="All monitored YouTube videos"
        />
        <KPICard
          icon={<TractorIcon size={15} />}
          label="Total Tractor Videos"
          value={loading ? '…' : stats.tractorVideos}
          descriptor="Tractor-related content identified"
        />
        <KPICard
          icon={<TagIcon size={15} />}
          label="Brand Mentioned"
          value={loading ? '…' : stats.brandMentioned}
          descriptor={loading ? 'Loading…' : `${stats.directVideos} direct · ${stats.comparisonVideos} multi-brand`}
        />
        <DateRangeCard startDate={startDate} endDate={endDate} />
      </div>
    </div>
  );
}
