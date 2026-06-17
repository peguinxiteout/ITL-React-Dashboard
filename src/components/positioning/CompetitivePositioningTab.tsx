import { useMemo } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '../SectionCard';
import { useKpiData } from '../../hooks/useKpiData';
import { calculateCompetitorMentionsInSonalikaVideos } from '../../utils/kpiCalculations';

const CHART_COLOR = '#2563EB';

export default function CompetitivePositioningTab() {
  const { rows, loading, error } = useKpiData();

  const competitorMentions = useMemo(
    () => calculateCompetitorMentionsInSonalikaVideos(rows),
    [rows]
  );

  const totalMentions = useMemo(
    () =>
      competitorMentions.reduce(
        (sum, item) => sum + item.mention_count,
        0
      ),
    [competitorMentions]
  );

  const topCompetitor = competitorMentions[0];

  if (loading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6">
        <p className="text-slate-600">Loading KPI CSV data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6">
        <p className="text-red-700">Error loading CSV: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Competitive Positioning
        </h1>
        <p className="mt-2 text-gray-600">
          Competitor mention frequency within Sonalika-related tractor videos.
        </p>
        <p className="mt-2 inline-flex rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600">
          {rows.length} KPI rows loaded
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Total Competitor Mentions
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {totalMentions}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Competitor Brands Mentioned
          </p>
          <p className="mt-2 text-3xl font-bold text-slate-900">
            {competitorMentions.length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-medium text-slate-500">
            Most Mentioned Competitor
          </p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {topCompetitor ? topCompetitor.competitor : 'No data'}
          </p>
          {topCompetitor && (
            <p className="mt-1 text-sm text-slate-500">
              {topCompetitor.mention_count} mentions
            </p>
          )}
        </div>
      </div>

      <SectionCard
        title="1. Competitor Mention Frequency"
        subtitle="Number of Sonalika-related videos where each competitor brand is mentioned."
      >
        {competitorMentions.length > 0 ? (
          <div className="h-[360px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={competitorMentions}
                layout="vertical"
                margin={{ top: 8, right: 24, left: 28, bottom: 8 }}
                barCategoryGap="24%"
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} />

                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#475569' }}
                  axisLine={{ stroke: '#CBD5E1' }}
                  tickLine={false}
                />

                <YAxis
                  type="category"
                  dataKey="competitor"
                  width={150}
                  interval={0}
                  tick={{ fontSize: 13, fill: '#334155' }}
                  axisLine={false}
                  tickLine={false}
                />

                <Tooltip
                  formatter={(value: number | string) => [
                    `${value}`,
                    'Mentions',
                  ]}
                  labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                />

                <Bar
                  dataKey="mention_count"
                  name="Mentions"
                  fill={CHART_COLOR}
                  radius={[0, 5, 5, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No competitor mentions were detected in the current Sonalika-related videos.
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="2. Competitor Positioning Summary"
        subtitle="Tabular view of competitor mention counts and share within total competitor mentions."
      >
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Rank
                </th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Competitor
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Mention Count
                </th>
                <th className="px-3 py-2 text-right font-semibold text-slate-600">
                  Mention Share
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {competitorMentions.map((row, index) => {
                const share =
                  totalMentions > 0
                    ? (row.mention_count / totalMentions) * 100
                    : 0;

                return (
                  <tr key={row.competitor}>
                    <td className="px-3 py-2 text-slate-700">
                      {index + 1}
                    </td>

                    <td className="px-3 py-2 font-medium text-slate-900">
                      {row.competitor}
                    </td>

                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {row.mention_count}
                    </td>

                    <td className="px-3 py-2 text-right text-slate-700">
                      {share.toFixed(1)}%
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {competitorMentions.length === 0 && (
          <div className="mt-4 rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            No competitor positioning summary is available because competitor mentions were not found.
          </div>
        )}
      </SectionCard>

      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        <b>How this is calculated:</b> only Sonalika-related videos are considered.
        The transcript, detected brand fields, title, filename and extracted brand metadata are scanned
        for competitor brand names. Each competitor is counted once per matching video.
      </div>
    </div>
  );
}