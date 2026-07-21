import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CalendarIcon, TagIcon, TractorIcon, TrendingUpIcon, VideoIcon } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { TabInsights, TabOverviewCards } from '../TabOverview';
import { VSSelect, type VSSelectOption } from '../sentiment/VSSelect';
import { getBrandColor } from '../../utils/brandColors';
import { useKpiData } from '../../hooks/useKpiData';
import {
  calculateCompetitiveTrendTable,
  getVideoLevelRows,
  calculateVoiceInfluencerKpiCards,
  getAvailableBrands,
  getAvailableDateRange,
  getModelsForBrandFeature,
} from '../../utils/kpiCalculations';

const CHART_COLOR = '#2563EB';

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

const filterRowsByDateRange = (
  rows: Record<string, string>[],
  startDate: string,
  endDate: string
) => {
  if (!startDate && !endDate) return rows;

  return rows.filter((row) => {
    const postedDate = String(row.posted_date || '').slice(0, 10);
    if (!postedDate) return false;
    if (startDate && postedDate < startDate) return false;
    if (endDate && postedDate > endDate) return false;
    return true;
  });
};

const rowMentionsBrand = (row: Record<string, string>, brand: string) => {
  const searchableText = [
    row.detected_brands_from_transcript,
    row.title,
    row.description,
    row.page_content,
    row.sentiments,
    row.insights,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  return searchableText.includes(brand.toLowerCase());
};

const formatDisplayDate = (value: string) => {
  if (!value) return 'Not available';
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

const splitTrendRange = (startDate: string, endDate: string) => {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return { baselineStart: startDate, baselineEnd: startDate, currentStart: endDate, currentEnd: endDate };
  }
  const totalDays = Math.floor((end.getTime() - start.getTime()) / 86400000) + 1;
  const baselineDays = Math.ceil(totalDays / 2);
  const baselineEndDate = new Date(start);
  baselineEndDate.setDate(start.getDate() + baselineDays - 1);
  const currentStartDate = new Date(baselineEndDate);
  currentStartDate.setDate(baselineEndDate.getDate() + 1);
  return {
    baselineStart: startDate,
    baselineEnd: baselineEndDate.toISOString().slice(0, 10),
    currentStart: currentStartDate > end ? endDate : currentStartDate.toISOString().slice(0, 10),
    currentEnd: endDate,
  };
};

interface CompetitivePositioningTabProps {
  onBrandChange?: (brand: string) => void;
  standardKpis?: {
    totalVideos: number;
    tractorVideos: number;
    dateRange: string;
  };
}

export default function CompetitivePositioningTab({ standardKpis, onBrandChange }: CompetitivePositioningTabProps = {}) {
  const { rows, loading, error } = useKpiData();

  const availableBrands = useMemo(() => getAvailableBrands(rows), [rows]);
  const availableDateRange = useMemo(() => getAvailableDateRange(rows), [rows]);
  const [selectedBrand, setSelectedBrand] = useState('Sonalika');
  const [selectedStartDate, setSelectedStartDate] = useState('');
  const [selectedEndDate, setSelectedEndDate] = useState('');
  const [trendRangeMode, setTrendRangeMode] = useState<'page' | 'custom'>('page');
  const [trendStartDate, setTrendStartDate] = useState('');
  const [trendEndDate, setTrendEndDate] = useState('');

  useEffect(() => {
    if (!rows.length) return;
    setSelectedStartDate((current) => current || availableDateRange.minDate);
    setSelectedEndDate((current) => current || availableDateRange.maxDate);
    setTrendStartDate((current) => current || availableDateRange.minDate);
    setTrendEndDate((current) => current || availableDateRange.maxDate);
  }, [rows.length, availableDateRange.minDate, availableDateRange.maxDate]);

  const brandOptions = useMemo(() => {
    const options = availableBrands.length ? availableBrands : ['Sonalika'];
    return options.includes('Sonalika') ? options : ['Sonalika', ...options];
  }, [availableBrands]);

  const brandSelectOptions = useMemo<VSSelectOption[]>(
    () => brandOptions.map((brand) => ({ value: brand, label: brand, color: getBrandColor(brand) })),
    [brandOptions]
  );

  useEffect(() => {
    onBrandChange?.(selectedBrand);
  }, [selectedBrand, onBrandChange]);

  const filteredRows = useMemo(
    () => filterRowsByDateRange(rows, selectedStartDate, selectedEndDate),
    [rows, selectedStartDate, selectedEndDate]
  );


  const sharedKpiValues = useMemo(
    () => calculateVoiceInfluencerKpiCards(filteredRows),
    [filteredRows]
  );

  const resolvedStandardKpis = useMemo(
    () => ({
      totalVideos: standardKpis?.totalVideos ?? sharedKpiValues.videos_analyzed,
      tractorVideos:
        standardKpis?.tractorVideos ?? sharedKpiValues.tractor_videos_analyzed,
      dateRange: standardKpis?.dateRange ?? sharedKpiValues.date_range,
    }),
    [standardKpis, sharedKpiValues]
  );

  const competitorMentions = useMemo(() => {
    const selectedBrandRows = getVideoLevelRows(filteredRows).filter((row) =>
      rowMentionsBrand(row, selectedBrand)
    );

    return brandOptions
      .filter((brand) => brand.toLowerCase() !== selectedBrand.toLowerCase())
      .map((competitor) => ({
        competitor,
        mention_count: selectedBrandRows.filter((row) => rowMentionsBrand(row, competitor)).length,
      }))
      .filter((item) => item.mention_count > 0)
      .sort((a, b) => b.mention_count - a.mention_count);
  }, [filteredRows, selectedBrand, brandOptions]);

  const effectiveTrendStartDate = trendRangeMode === 'custom' ? trendStartDate : selectedStartDate;
  const effectiveTrendEndDate = trendRangeMode === 'custom' ? trendEndDate : selectedEndDate;

  const trendTableRows = useMemo(
    () => calculateCompetitiveTrendTable(rows, selectedBrand, effectiveTrendStartDate, effectiveTrendEndDate),
    [rows, selectedBrand, effectiveTrendStartDate, effectiveTrendEndDate]
  );

  const trendPeriods = useMemo(
    () => splitTrendRange(effectiveTrendStartDate, effectiveTrendEndDate),
    [effectiveTrendStartDate, effectiveTrendEndDate]
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

  const competitorProfiles = useMemo(
    () => new Map(competitorMentions.map((item) => [
      item.competitor,
      getModelsForBrandFeature(filteredRows, item.competitor, '', 3),
    ])),
    [filteredRows, competitorMentions]
  );

  const brandMentionShare = useMemo(
    () =>
      trendTableRows
        .find((item) => item.metric === 'Brand Mention Share')
        ?.currentWeek.replace(/\s*Share/i, '') || '0%',
    [trendTableRows]
  );

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
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-slate-950">Competitive Intelligence</h1>
          <p className="mt-1 text-sm text-slate-500">Competitor visibility and positioning within {selectedBrand}-related tractor content</p>
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <label className="text-xs font-semibold text-slate-500">
            From
            <input type="date" min={availableDateRange.minDate} max={selectedEndDate || availableDateRange.maxDate} value={selectedStartDate} onChange={(event) => setSelectedStartDate(event.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
          <label className="text-xs font-semibold text-slate-500">
            To
            <input type="date" min={selectedStartDate || availableDateRange.minDate} max={availableDateRange.maxDate} value={selectedEndDate} onChange={(event) => setSelectedEndDate(event.target.value)} className="mt-1 block rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-blue-500" />
          </label>
        </div>
      </div>

      <TabOverviewCards
        cards={[
          {
            label: 'Total Videos Analyzed',
            value: resolvedStandardKpis.totalVideos.toLocaleString(),
            descriptor: 'All monitored YouTube videos',
            icon: <VideoIcon size={15} />,
          },
          {
            label: 'Total Tractor Videos',
            value: resolvedStandardKpis.tractorVideos.toLocaleString(),
            descriptor: 'Tractor-related content identified',
            icon: <TractorIcon size={15} />,
          },
          {
            label: 'Competitor Brands Mentioned',
            value: competitorMentions.length.toLocaleString(),
            descriptor: 'Unique competitor brands detected',
            icon: <TagIcon size={15} />,
          },
          {
            label: 'Date Range',
            value: resolvedStandardKpis.dateRange,
            descriptor: 'Currently selected window',
            icon: <CalendarIcon size={15} />,
          },
        ]}
      />

      <div className="flex items-center gap-3">
        <span className="text-sm text-slate-500">Brand</span>
        <VSSelect value={selectedBrand} options={brandSelectOptions} onChange={setSelectedBrand} size="lg" ariaLabel="Select focus brand" />
      </div>

      <TabInsights
        question={`How does ${selectedBrand} stand vs competitors?`}
        cards={[
          {
            headline: `${topCompetitor?.competitor || 'No competitor'} most co-mentioned: ${Number(topCompetitor?.mention_count || 0).toLocaleString()} times`,
            detail: `${totalMentions > 0 && topCompetitor ? ((topCompetitor.mention_count / totalMentions) * 100).toFixed(1) : '0.0'}% of all competitor mentions`,
            icon: <TagIcon size={15} />,
            tone: 'amber',
          },
          {
            headline: `Brand mention share: ${brandMentionShare}`,
            detail: 'Pulled from the same two-week trend logic',
            icon: <TrendingUpIcon size={15} />,
            tone: 'green',
          },
        ]}
      />

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
          <EmptyState message="No competitor mentions were detected in the current selected-brand videos." />
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
                <th className="px-3 py-2 text-left font-semibold text-slate-600">
                  Models Identified
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

                    <td className="px-3 py-2 text-left text-xs text-slate-600">
                      {competitorProfiles.get(row.competitor)?.join(', ') || 'Not identified'}
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
        title="3. Competitive Trend Summary"
        subtitle={`Baseline: ${formatDisplayDate(trendPeriods.baselineStart)} – ${formatDisplayDate(trendPeriods.baselineEnd)}. Current: ${formatDisplayDate(trendPeriods.currentStart)} – ${formatDisplayDate(trendPeriods.currentEnd)}.`}
        actions={
          <div className="flex flex-wrap items-end gap-2">
            <label className="text-xs font-semibold text-slate-500">
              Trend Range
              <select
                value={trendRangeMode}
                onChange={(event) => setTrendRangeMode(event.target.value as 'page' | 'custom')}
                className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm"
              >
                <option value="page">Use Page Range</option>
                <option value="custom">Custom Range</option>
              </select>
            </label>
            {trendRangeMode === 'custom' ? (
              <>
                <label className="text-xs font-semibold text-slate-500">
                  From
                  <input type="date" min={availableDateRange.minDate} max={trendEndDate || availableDateRange.maxDate} value={trendStartDate} onChange={(event) => setTrendStartDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm" />
                </label>
                <label className="text-xs font-semibold text-slate-500">
                  To
                  <input type="date" min={trendStartDate || availableDateRange.minDate} max={availableDateRange.maxDate} value={trendEndDate} onChange={(event) => setTrendEndDate(event.target.value)} className="mt-1 block rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm" />
                </label>
              </>
            ) : null}
          </div>
        }
      >
        <div className="overflow-x-auto rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead style={{ backgroundColor: '#FFF200' }}>
              <tr>
                <th className="border border-slate-700 px-4 py-3 text-left text-base font-extrabold text-slate-950">
                  KPI / Strategic Metric
                </th>
                <th className="border border-slate-700 px-4 py-3 text-center text-base font-extrabold text-slate-950">
                  Baseline ({formatDisplayDate(trendPeriods.baselineStart)} – {formatDisplayDate(trendPeriods.baselineEnd)})
                </th>
                <th className="border border-slate-700 px-4 py-3 text-center text-base font-extrabold text-slate-950">
                  Current ({formatDisplayDate(trendPeriods.currentStart)} – {formatDisplayDate(trendPeriods.currentEnd)})
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
          Tractor Content Density = tractor videos / all videos. Brand Mention Share = selected-brand tractor videos / tractor videos. Sentiment is calculated from the selected brand’s sentiment mentions.
        </p>
      </SectionCard>

          </div>
  );
}
