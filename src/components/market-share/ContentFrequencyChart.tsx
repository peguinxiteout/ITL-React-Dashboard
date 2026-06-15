import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  ReferenceLine } from
'recharts';
import { SectionCard } from '../SectionCard';
import { BrandStats, SONALIKA_ID, getBrand } from '../../data/mockData';
interface ContentFrequencyChartProps {
  stats: BrandStats[];
}
export function ContentFrequencyChart({ stats }: ContentFrequencyChartProps) {
  const data = [...stats].
  sort((a, b) => b.publishRate - a.publishRate).
  map((s) => ({
    name: getBrand(s.brandId).name,
    rate: s.publishRate,
    color: getBrand(s.brandId).color,
    isOwn: s.brandId === SONALIKA_ID
  }));
  const categoryAvg =
  stats.
  filter((s) => s.brandId !== SONALIKA_ID).
  reduce((acc, s) => acc + s.publishRate, 0) /
  Math.max(stats.length - 1, 1);
  return (
    <SectionCard
      title="Content Frequency"
      subtitle="Videos published per week — Sonalika vs each competitor">
      
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{
              top: 4,
              right: 24,
              left: 16,
              bottom: 0
            }}>
            
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#e2e8f0"
              horizontal={false} />
            
            <XAxis
              type="number"
              tick={{
                fontSize: 12,
                fill: '#64748b'
              }}
              tickLine={false}
              axisLine={{
                stroke: '#e2e8f0'
              }}
              unit="/wk" />
            
            <YAxis
              type="category"
              dataKey="name"
              width={110}
              tick={{
                fontSize: 12,
                fill: '#334155'
              }}
              tickLine={false}
              axisLine={false} />
            
            <Tooltip
              formatter={(value: number) => [
              `${value.toFixed(1)} videos/week`,
              'Publish rate']
              }
              contentStyle={{
                fontSize: 12,
                borderRadius: 8,
                border: '1px solid #e2e8f0'
              }}
              cursor={{
                fill: '#f1f5f9'
              }} />
            
            <ReferenceLine
              x={categoryAvg}
              stroke="#94a3b8"
              strokeDasharray="4 4"
              label={{
                value: `Avg ${categoryAvg.toFixed(1)}`,
                position: 'top',
                fontSize: 11,
                fill: '#64748b'
              }} />
            
            <Bar dataKey="rate" radius={[0, 4, 4, 0]} barSize={20}>
              {data.map((d) =>
              <Cell
                key={d.name}
                fill={d.color}
                fillOpacity={d.isOwn ? 1 : 0.75} />

              )}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </SectionCard>);

}