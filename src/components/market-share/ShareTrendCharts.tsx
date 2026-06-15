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
import {
  BRANDS,
  Brand,
  SONALIKA_ID,
  ShareMetric,
  WeekPreset,
  getWeeklyShareTrends } from
'../../data/mockData';
// Sonalika's line color in the trend charts (distinct from its donut/table blue)
const SONALIKA_TREND_COLOR = '#EF9F27';
const lineColor = (brand: Brand): string =>
brand.id === SONALIKA_ID ? SONALIKA_TREND_COLOR : brand.color;
interface ShareTrendChartsProps {
  weeks: WeekPreset;
  selectedBrands: string[];
}
const SOV_METRICS: {
  key: ShareMetric;
  label: string;
}[] = [
{
  key: 'views',
  label: 'Views'
},
{
  key: 'videos',
  label: 'Video Count'
},
{
  key: 'comments',
  label: 'Comments'
}];

const SOE_METRICS: {
  key: ShareMetric;
  label: string;
}[] = [
{
  key: 'combined',
  label: 'Combined'
},
{
  key: 'views',
  label: 'Views'
},
{
  key: 'likes',
  label: 'Likes'
},
{
  key: 'comments',
  label: 'Comments'
}];

function MetricPills({
  options,
  value,
  onChange,
  groupLabel




}: {options: {key: ShareMetric;label: string;}[];value: ShareMetric;onChange: (m: ShareMetric) => void;groupLabel: string;}) {
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
  metric,
  brands



}: {weeks: WeekPreset;metric: ShareMetric;brands: Brand[];}) {
  const data = getWeeklyShareTrends(weeks, metric);
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
            const isOwn = brand.id === SONALIKA_ID;
            return (
              <Line
                key={brand.id}
                type="monotone"
                dataKey={brand.id}
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
  selectedBrands
}: ShareTrendChartsProps) {
  const [sovMetric, setSovMetric] = useState<ShareMetric>('views');
  const [soeMetric, setSoeMetric] = useState<ShareMetric>('combined');
  const brands = BRANDS.filter((b) => selectedBrands.includes(b.name));
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

          <TrendChart weeks={weeks} metric={sovMetric} brands={brands} />
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

          <TrendChart weeks={weeks} metric={soeMetric} brands={brands} />
        </div>
      </div>

      {/* Shared brand legend spanning the full card width */}
      <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 border-t border-slate-100 pt-3">
        {brands.map((brand) => {
          const isOwn = brand.id === SONALIKA_ID;
          return (
            <span
              key={brand.id}
              className="flex items-center gap-1.5 text-xs text-slate-600">

              <span
                style={{
                  width: 18,
                  height: isOwn ? 3 : 2,
                  borderRadius: 2,
                  backgroundColor: lineColor(brand)
                }}
                aria-hidden="true" />

              {brand.name}
            </span>);

        })}
      </div>
    </SectionCard>);

}
