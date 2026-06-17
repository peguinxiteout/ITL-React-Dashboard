import React, { useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer } from
'recharts';
import { SectionCard } from '../SectionCard';

// Sonalika's line color in the trend charts (distinct from its donut/table blue)
const SONALIKA_TREND_COLOR = '#EF9F27';

interface TrendBrand {
  name: string;
  color: string;
  isOwn: boolean;
}
interface WeeklyShareRow {
  brand: string;
  week: string;
  sov_views: number;
  sov_videos: number;
  sov_comments: number;
  sov_likes: number;
  soe: number;
}
interface ShareTrendChartsProps {
  weeks: string[];
  weeklySoV: WeeklyShareRow[];
  brands: TrendBrand[];
}

// Maps each metric pill to the share column it reads from weeklySoV.
type ShareField = keyof Omit<WeeklyShareRow, 'brand' | 'week'>;
const SOV_METRICS: { key: ShareField; label: string }[] = [
{ key: 'sov_views', label: 'Views' },
{ key: 'sov_videos', label: 'Video Count' },
{ key: 'sov_comments', label: 'Comments' }];

const SOE_METRICS: { key: ShareField; label: string }[] = [
{ key: 'soe', label: 'Combined' },
{ key: 'sov_views', label: 'Views' },
{ key: 'sov_likes', label: 'Likes' },
{ key: 'sov_comments', label: 'Comments' }];

const lineColor = (brand: TrendBrand): string =>
brand.isOwn ? SONALIKA_TREND_COLOR : brand.color;

// "2026-W24" → "W24"
const weekLabel = (week: string): string => week.replace(/^\d{4}-/, '');

function MetricPills({
  options,
  value,
  onChange,
  groupLabel




}: {options: {key: ShareField;label: string;}[];value: ShareField;onChange: (m: ShareField) => void;groupLabel: string;}) {
  return (
    <div
      className="mb-3 flex flex-wrap items-center gap-1.5"
      role="group"
      aria-label={groupLabel}>

      {options.map((o) => {
        const active = o.key === value;
        return (
          <button
            key={o.key}
            type="button"
            onClick={() => onChange(o.key)}
            aria-pressed={active}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? 'bg-blue-700 text-white' : 'border border-slate-300 bg-white text-slate-600 hover:bg-slate-50'}`}>

            {o.label}
          </button>);

      })}
    </div>);

}

function TrendChart({
  weeks,
  weeklySoV,
  field,
  brands




}: {weeks: string[];weeklySoV: WeeklyShareRow[];field: ShareField;brands: TrendBrand[];}) {
  // Pivot: one row per week, one column per brand holding that week's share.
  const byKey = new Map<string, number>();
  weeklySoV.forEach((r) => byKey.set(`${r.brand}__${r.week}`, r[field]));
  const data = weeks.map((w) => {
    const point: { [k: string]: number | string } = { label: weekLabel(w) };
    brands.forEach((b) => {
      point[b.name] = byKey.get(`${b.name}__${w}`) ?? 0;
    });
    return point;
  });
  // With a single data point no line segments exist — show dots for every
  // brand so the chart isn't empty on the 1-week preset.
  const singlePoint = data.length === 1;
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={data}
          margin={{
            top: 4,
            right: 8,
            left: -16,
            bottom: 0
          }}>

          <CartesianGrid
            strokeDasharray="3 3"
            stroke="#e2e8f0"
            vertical={false} />

          <XAxis
            dataKey="label"
            tick={{
              fontSize: 12,
              fill: '#64748b'
            }}
            tickLine={false}
            axisLine={{
              stroke: '#e2e8f0'
            }} />

          <YAxis
            tick={{
              fontSize: 12,
              fill: '#64748b'
            }}
            tickLine={false}
            axisLine={false}
            unit="%" />

          <Tooltip
            formatter={(value: number) => `${value.toFixed(1)}%`}
            contentStyle={{
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e2e8f0'
            }} />

          {brands.map((brand) => {
            const isOwn = brand.isOwn;
            return (
              <Line
                key={brand.name}
                type="monotone"
                dataKey={brand.name}
                name={brand.name}
                stroke={lineColor(brand)}
                strokeWidth={isOwn ? 2.5 : 1.5}
                strokeOpacity={isOwn ? 1 : 0.6}
                dot={
                isOwn ?
                {
                  r: 3,
                  fill: SONALIKA_TREND_COLOR
                } :
                singlePoint ?
                {
                  r: 2.5,
                  fill: brand.color,
                  fillOpacity: 0.6
                } :
                false
                } />);


          })}
        </LineChart>
      </ResponsiveContainer>
    </div>);

}
export function ShareTrendCharts({
  weeks,
  weeklySoV,
  brands
}: ShareTrendChartsProps) {
  const [sovMetric, setSovMetric] = useState<ShareField>('sov_views');
  const [soeMetric, setSoeMetric] = useState<ShareField>('soe');
  return (
    <SectionCard title="Share trends" subtitle="Weekly SoV and SoE by brand">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-5">
        {/* Left column: Share of Voice */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-800">
            Share of Voice
          </h4>
          <MetricPills
            options={SOV_METRICS}
            value={sovMetric}
            onChange={setSovMetric}
            groupLabel="Share of Voice metric" />

          <TrendChart weeks={weeks} weeklySoV={weeklySoV} field={sovMetric} brands={brands} />
        </div>

        {/* Vertical divider */}
        <div
          className="hidden self-stretch lg:block"
          style={{
            width: '0.5px',
            background: '#e2e8f0'
          }}
          aria-hidden="true" />

        {/* Right column: Share of Engagement */}
        <div>
          <h4 className="mb-2 text-sm font-semibold text-slate-800">
            Share of Engagement
          </h4>
          <MetricPills
            options={SOE_METRICS}
            value={soeMetric}
            onChange={setSoeMetric}
            groupLabel="Share of Engagement metric" />

          <TrendChart weeks={weeks} weeklySoV={weeklySoV} field={soeMetric} brands={brands} />
        </div>
      </div>

      {/* Shared brand legend spanning the full card width */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
        {brands.map((brand) =>
        <span
          key={brand.name}
          className="flex items-center gap-1.5 text-xs text-slate-600">

          <span
            style={{
              width: 18,
              height: brand.isOwn ? 3 : 2,
              borderRadius: 2,
              backgroundColor: lineColor(brand)
            }}
            aria-hidden="true" />

          {brand.name}
        </span>
        )}
      </div>
    </SectionCard>);

}
