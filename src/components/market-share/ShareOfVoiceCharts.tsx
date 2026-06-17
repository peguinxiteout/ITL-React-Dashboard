import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionCard } from '../SectionCard';
import { formatNumber } from '../../data/mockData';

interface BrandSummary {
  brand: string;
  video_count: number;
  total_views: number;
  total_comments: number;
  color: string;
  isOwn: boolean;
}
interface ShareOfVoiceChartsProps {
  summary: BrandSummary[];
}
type MetricKey = 'video_count' | 'total_views' | 'total_comments';
const METRICS: {
  key: MetricKey;
  label: string;
}[] = [
{
  key: 'video_count',
  label: 'Video Volume'
},
{
  key: 'total_views',
  label: 'Views'
},
{
  key: 'total_comments',
  label: 'Comments'
}];

export function ShareOfVoiceCharts({ summary }: ShareOfVoiceChartsProps) {
  return (
    <SectionCard
      title="Share of Voice"
      subtitle="Sonalika's proportion of category video volume, views and comments">

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {METRICS.map((metric) => {
          const total = summary.reduce((acc, s) => acc + s[metric.key], 0);
          const sonalikaShare =
          total > 0 ?
          (summary.find((s) => s.isOwn)?.[metric.key] ?? 0) / total * 100 :
          0;
          const data = summary.map((s) => ({
            name: s.brand,
            value: s[metric.key],
            color: s.color
          }));
          return (
            <div key={metric.key} className="flex flex-col items-center">
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}>

                      {data.map((d) =>
                      <Cell key={d.name} fill={d.color} />
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                      formatNumber(value),
                      name]
                      }
                      contentStyle={{
                        fontSize: 12,
                        borderRadius: 8,
                        border: '1px solid #e2e8f0'
                      }} />

                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">
                    {sonalikaShare.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500">Sonalika</span>
                </div>
              </div>
              <p className="mt-1 text-sm font-medium text-slate-700">
                {metric.label}
              </p>
              <p className="text-xs text-slate-500">
                {formatNumber(total)} total in category
              </p>
            </div>);

        })}
      </div>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-4">
        {summary.map((s) =>
        <span
          key={s.brand}
          className="flex items-center gap-1.5 text-xs text-slate-600">

          <span
            className="h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: s.color
            }}
            aria-hidden="true" />

          {s.brand}
        </span>
        )}
      </div>
    </SectionCard>);

}
