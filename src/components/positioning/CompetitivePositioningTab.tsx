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
import {
  calculateCompetitiveMtpComparison,
  calculateCompetitiveTrendTable,
  calculateCompetitorMentionsInSonalikaVideos,
  getVideoLevelRows,
} from '../../utils/kpiCalculations';

const CHART_COLOR = '#2563EB';
const SONALIKA_COLOR = '#FACC15';
const SONALIKA_PANEL_COLOR = '#DBEAFE';

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
    {message}
  </div>
);

const TrendArrow = ({ trend }: { trend: 'up' | 'down' | 'flat' }) => {
  if (trend === 'up') {
    return <span className="text-2xl font-bold text-green-600">▲</span>;
  }

  if (trend === 'down') {
    return <span className="text-2xl font-bold text-red-600">▼</span>;
  }

  return <span className="text-2xl font-bold text-slate-900">▬</span>;
};

const MtpNodeCard = ({
  title,
  points,
  side,
}: {
  title: string;
  points: string[];
  side: 'sonalika' | 'other';
}) => (
  <div
    className={`rounded-xl border p-4 shadow-sm ${
      side === 'sonalika'
        ? 'border-blue-200 bg-white'
        : 'border-blue-200 bg-white'
    }`}
  >
    <h4 className="text-center text-sm font-bold text-slate-950">{title}</h4>
    <ol className="mt-2 list-decimal space-y-1 pl-4 text-xs leading-5 text-slate-700">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ol>
  </div>
);

export default function CompetitivePositioningTab() {
  const { rows, loading, error } = useKpiData();

  const videoLevelRows = useMemo(
    () => getVideoLevelRows(rows),
    [rows]
  );

  const competitorMentions = useMemo(
    () => calculateCompetitorMentionsInSonalikaVideos(rows),
    [rows]
  );

  const mtpComparison = useMemo(
    () => calculateCompetitiveMtpComparison(rows),
    [rows]
  );

  const trendTableRows = useMemo(
    () => calculateCompetitiveTrendTable(rows),
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
        
        <p className="mt-2 inline-flex rounded-md bg-slate-100 px-3 py-1 text-sm text-slate-600">
          {videoLevelRows.length} videos are being analyzed
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

      <SectionCard title="1. Competitor Mention Frequency">
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
          <EmptyState message="No competitor mentions were detected in the current Sonalika-related videos." />
        )}
      </SectionCard>

      <SectionCard title="2. Competitor Positioning Summary">
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
<SectionCard
        title="3. Major Talking Points (MTP)"
      >
        {mtpComparison.sonalika.length > 0 || mtpComparison.otherBrands.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-5 grid grid-cols-[1fr_auto_1fr] items-center gap-4">
              <div className="text-center">
                <span
                  className="inline-flex rounded px-2 py-1 text-base font-extrabold text-slate-950"
                  style={{ backgroundColor: SONALIKA_COLOR }}
                >
                  Sonalika
                </span>
              </div>
              <div className="text-xl font-extrabold text-slate-950">VS</div>
              <div className="text-center">
                <span
                  className="inline-flex rounded px-2 py-1 text-base font-extrabold text-slate-950"
                  style={{ backgroundColor: SONALIKA_COLOR }}
                >
                  Other Brands
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr]">
              <div
                className="relative rounded-2xl border border-blue-100 p-4"
                style={{ backgroundColor: SONALIKA_PANEL_COLOR }}
              >
                <div className="absolute left-1/2 top-4 hidden h-[calc(100%-32px)] w-px -translate-x-1/2 bg-slate-300 lg:block" />
                <div className="relative grid gap-4">
                  {mtpComparison.sonalika.map((item, index) => (
                    <div
                      key={item.title}
                      className={index % 2 === 0 ? 'lg:pr-16' : 'lg:pl-16'}
                    >
                      <MtpNodeCard
                        title={item.title}
                        points={item.points}
                        side="sonalika"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="hidden w-8 items-center justify-center lg:flex">
                <div className="h-full w-px bg-slate-300" />
              </div>

              <div className="relative rounded-2xl border border-slate-200 bg-white p-4">
                <div className="absolute left-1/2 top-4 hidden h-[calc(100%-32px)] w-px -translate-x-1/2 bg-slate-300 lg:block" />
                <div className="relative grid gap-4">
                  {mtpComparison.otherBrands.map((item, index) => (
                    <div
                      key={item.title}
                      className={index % 2 === 0 ? 'lg:pl-16' : 'lg:pr-16'}
                    >
                      <MtpNodeCard
                        title={item.title}
                        points={item.points}
                        side="other"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message="No tractor-category talking points are available for the current data." />
        )}
      </SectionCard>

      <SectionCard
        title="4. Two-Week Competitive Trend Summary"
        subtitle="Baseline is 1 Mar – 8 Mar. Current week is 9 Mar – 15 Mar."
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead style={{ backgroundColor: '#FFF200' }}>
              <tr>
                <th className="border border-slate-700 px-4 py-3 text-left text-base font-extrabold text-slate-950">
                  KPI / Strategic Metric
                </th>
                <th className="border border-slate-700 px-4 py-3 text-center text-base font-extrabold text-slate-950">
                  Baseline (1st Mar - 8th Mar)
                </th>
                <th className="border border-slate-700 px-4 py-3 text-center text-base font-extrabold text-slate-950">
                  Current Week
                </th>
                <th className="border border-slate-700 px-4 py-3 text-center text-base font-extrabold text-slate-950">
                  Trend
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200 bg-white">
              {trendTableRows.map((row) => (
                <tr key={row.metric}>
                  <td className="border border-slate-700 px-4 py-3 font-bold text-slate-900">
                    {row.metric}
                  </td>
                  <td className="border border-slate-700 px-4 py-3 text-center text-slate-800">
                    {row.baseline}
                  </td>
                  <td className="border border-slate-700 px-4 py-3 text-center text-slate-800">
                    {row.currentWeek}
                  </td>
                  <td className="border border-slate-700 px-4 py-3 text-center">
                    <TrendArrow trend={row.trend} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-xs text-slate-500">
          Tractor Content Density = tractor videos / all videos. Brand Mention Share = Sonalika-related tractor videos / tractor videos. Sentiment is calculated from Sonalika sentiment mentions.
        </p>
      </SectionCard>

          </div>
  );
}
