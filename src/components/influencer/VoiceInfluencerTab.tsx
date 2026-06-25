import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SectionCard } from '../SectionCard';
import { useKpiData } from '../../hooks/useKpiData';
import {
  calculateBrandLevelSentiment,
  calculateCreatorPerformance,
  calculateFeatureLevelSentiment,
  calculateGeoCoverage,
  calculateGeoCreatorRankings,
  calculateGeoSentiment,
  calculateMostMentionedFeatures,
  calculateVoiceInfluencerKpiCards,
  calculateWeeklyMentionTrend,
  calculateWeeklySentimentTrend,
  getAvailableBrands,
  getAvailableDateRange,
} from '../../utils/kpiCalculations';

const COLORS = {
  primary: '#1D4ED8',
  neutral: '#CBD5E1',
  negative: '#DC2626',
};

const SENTIMENT_COLORS = {
  Positive: COLORS.primary,
  Neutral: COLORS.neutral,
  Negative: COLORS.negative,
};

const BRAND_LINE_COLORS = [
  '#1D4ED8',
  '#2563EB',
  '#3B82F6',
  '#60A5FA',
  '#93C5FD',
  '#1E40AF',
  '#64748B',
  '#0F172A',
];

type TrendWeekOption = '1' | '2' | '4' | '6' | '8' | '12' | 'all';

type CreatorSortKey =
  | 'engagement'
  | 'overall_score'
  | 'sonalika_mention_percentage'
  | 'tractor_video_percentage'
  | 'content_frequency'
  | 'sentiment_score'
  | 'engagement_rate_pct';


const TREND_WEEK_OPTIONS: { label: string; value: TrendWeekOption }[] = [
  { label: 'Last 1 week', value: '1' },
  { label: 'Last 2 weeks', value: '2' },
  { label: 'Last 4 weeks', value: '4' },
  { label: 'Last 6 weeks', value: '6' },
  { label: 'Last 8 weeks', value: '8' },
  { label: 'Last 12 weeks', value: '12' },
  { label: 'All available weeks', value: 'all' },
];

const CREATOR_LIMIT_OPTIONS = [5, 10, 15, 20];

const CREATOR_SORT_LABELS: Record<CreatorSortKey, string> = {
  engagement: 'Engagement',
  overall_score: 'Overall Score',
  sonalika_mention_percentage: 'Sonalika Mention %',
  tractor_video_percentage: 'Tractor Video %',
  content_frequency: 'Content Frequency',
  sentiment_score: 'Sentiment Score',
  engagement_rate_pct: 'Eng. Rate %',
};

const getStartDateForWeekOption = (
  maxDate: string,
  selectedWeeks: TrendWeekOption
) => {
  if (selectedWeeks === 'all') {
    return '';
  }

  const max = new Date(`${maxDate}T00:00:00`);

  if (Number.isNaN(max.getTime())) {
    return '';
  }

  const weekCount = Number(selectedWeeks);
  const daysToSubtract = weekCount * 7 - 1;

  max.setDate(max.getDate() - daysToSubtract);

  return max.toISOString().slice(0, 10);
};

const formatPercentTick = (value: number | string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${Math.round(numericValue)}%` : `${value}%`;
};

const formatPercentLabel = (value: unknown) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '';
  }

  return `${numericValue.toFixed(1)}%`;
};

const formatNumberLabel = (value: unknown) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue) || numericValue <= 0) {
    return '';
  }

  return numericValue.toLocaleString();
};

const isKnownGeoRegion = (region?: string) => {
  const value = String(region || '').trim().toLowerCase();

  return (
    value.length > 0 &&
    value !== 'unknown' &&
    value !== 'unknown region' &&
    value !== 'not available' &&
    value !== 'na' &&
    value !== 'n/a' &&
    value !== 'india'
  );
};

const SentimentStrip = ({
  positive,
  neutral,
  negative,
  height = 'h-7',
  showLabels = true,
  minWidth = 'min-w-[460px]',
}: {
  positive: number;
  neutral: number;
  negative: number;
  height?: string;
  showLabels?: boolean;
  minWidth?: string;
}) => {
  const segments = [
    {
      key: 'Positive',
      value: Math.max(0, Number(positive || 0)),
      className: 'bg-blue-700 text-white',
    },
    {
      key: 'Neutral',
      value: Math.max(0, Number(neutral || 0)),
      className: 'bg-slate-300 text-slate-900',
    },
    {
      key: 'Negative',
      value: Math.max(0, Number(negative || 0)),
      className: 'bg-red-600 text-white',
    },
  ];

  const visibleSegments = segments.filter((segment) => segment.value > 0);

  return (
    <div
      className={`flex ${height} ${minWidth} w-full overflow-hidden rounded-none bg-slate-100 text-[11px] font-bold`}
    >
      {visibleSegments.map((segment) => (
        <div
          key={segment.key}
          className={`flex items-center justify-center ${segment.className}`}
          style={{
            width: `${segment.value}%`,
            minWidth: showLabels ? '44px' : undefined,
          }}
          title={`${segment.key} ${segment.value.toFixed(1)}%`}
        >
          {showLabels ? `${segment.value.toFixed(1)}%` : ''}
        </div>
      ))}
    </div>
  );
};

const EmptyState = ({ message }: { message: string }) => (
  <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
    {message}
  </div>
);

const SentimentLegend = () => (
  <div className="flex flex-wrap items-center gap-4 text-xs">
    <span className="inline-flex items-center gap-2 font-medium text-slate-600">
      <span className="h-3 w-3 rounded-full bg-blue-700" /> Positive
    </span>
    <span className="inline-flex items-center gap-2 font-medium text-slate-600">
      <span className="h-3 w-3 rounded-full bg-slate-300" /> Neutral
    </span>
    <span className="inline-flex items-center gap-2 font-medium text-slate-600">
      <span className="h-3 w-3 rounded-full bg-red-600" /> Negative
    </span>
  </div>
);

export default function VoiceInfluencerTab(_props: {
  globalDateRange?: { startDate: string; endDate: string };
  setGlobalDateRange?: (v: any) => void;
} = {}) {
  const { rows, loading, error } = useKpiData();

  const availableBrands = useMemo(() => getAvailableBrands(rows), [rows]);
  const availableDateRange = useMemo(() => getAvailableDateRange(rows), [rows]);

  const [selectedBrand, setSelectedBrand] = useState('Sonalika');
  const [trendBrand, setTrendBrand] = useState('Sonalika');
  const [trendWeekOption, setTrendWeekOption] = useState<TrendWeekOption>('12');
  const [creatorSortKey, setCreatorSortKey] = useState<CreatorSortKey>('engagement');
  const [creatorLimit, setCreatorLimit] = useState(5);

  const brandOptions = useMemo(() => {
    const options = availableBrands.length ? availableBrands : ['Sonalika'];

    if (!options.includes('Sonalika')) {
      return ['Sonalika', ...options];
    }

    return options;
  }, [availableBrands]);

  const trendOptions = useMemo(() => ['All Brands', ...brandOptions], [brandOptions]);

  const voiceKpiCards = useMemo(
    () => calculateVoiceInfluencerKpiCards(rows),
    [rows]
  );

  const effectiveTrendStartDate = useMemo(() => {
    if (trendWeekOption === 'all') {
      return availableDateRange.minDate;
    }

    return getStartDateForWeekOption(availableDateRange.maxDate, trendWeekOption);
  }, [trendWeekOption, availableDateRange]);

  const effectiveTrendEndDate = availableDateRange.maxDate;

  const selectedTrendPeriodLabel = useMemo(() => {
    return (
      TREND_WEEK_OPTIONS.find((option) => option.value === trendWeekOption)?.label ||
      'Last 12 weeks'
    );
  }, [trendWeekOption]);

  const brandSentiment = useMemo(
    () => calculateBrandLevelSentiment(rows),
    [rows]
  );

  const brandSentimentTableData = useMemo(
    () =>
      brandSentiment.map((item) => {
        const positive = Number(item.Positive_pct.toFixed(2));
        const neutral = Number(item.Neutral_pct.toFixed(2));
        const negative = Number(Math.max(0, 100 - positive - neutral).toFixed(2));

        return {
          ...item,
          Positive_pct: positive,
          Neutral_pct: neutral,
          Negative_pct: negative,
        };
      }),
    [brandSentiment]
  );

  const featureSentiment = useMemo(
    () => calculateFeatureLevelSentiment(rows, selectedBrand).slice(0, 10),
    [rows, selectedBrand]
  );

  const featureSentimentChartData = useMemo(
    () =>
      featureSentiment.map((item) => {
        const positive = Number(item.Positive_pct.toFixed(2));
        const neutral = Number(item.Neutral_pct.toFixed(2));
        const negative = Number(Math.max(0, 100 - positive - neutral).toFixed(2));

        return {
          feature: item.feature || 'Unknown Feature',
          Positive: positive,
          Neutral: neutral,
          Negative: negative,
        };
      }),
    [featureSentiment]
  );

  const mostMentioned = useMemo(
    () => calculateMostMentionedFeatures(rows, selectedBrand, 5),
    [rows, selectedBrand]
  );

  const weeklyMentionTrend = useMemo(
    () =>
      calculateWeeklyMentionTrend(
        rows,
        trendBrand,
        effectiveTrendStartDate,
        effectiveTrendEndDate,
        brandOptions
      ),
    [rows, trendBrand, effectiveTrendStartDate, effectiveTrendEndDate, brandOptions]
  );

  const weeklySentimentTrend = useMemo(
    () =>
      calculateWeeklySentimentTrend(
        rows,
        trendBrand,
        effectiveTrendStartDate,
        effectiveTrendEndDate
      ),
    [rows, trendBrand, effectiveTrendStartDate, effectiveTrendEndDate]
  );

  const mentionLineBrands = useMemo(() => {
    if (trendBrand !== 'All Brands') return [];

    return brandOptions.filter((brand) =>
      weeklyMentionTrend.some((row) => Number(row[brand] || 0) > 0)
    );
  }, [trendBrand, brandOptions, weeklyMentionTrend]);

  const creatorPerformance = useMemo(
    () =>
      calculateCreatorPerformance(rows)
        .sort((a, b) => Number(b[creatorSortKey]) - Number(a[creatorSortKey]))
        .map((item, index) => ({
          ...item,
          rank: index + 1,
        }))
        .slice(0, creatorLimit),
    [rows, creatorSortKey, creatorLimit]
  );

  const geoCoverage = useMemo(
    () =>
      calculateGeoCoverage(rows)
        .filter((item) => isKnownGeoRegion(item.geo_region))
        .slice(0, 10),
    [rows]
  );

  const geoSentiment = useMemo(
    () =>
      calculateGeoSentiment(rows)
        .filter((item) => isKnownGeoRegion(item.geo_region))
        .slice(0, 10),
    [rows]
  );

  const geoSentimentTableData = useMemo(
    () =>
      geoSentiment.map((item) => {
        const positive = Number(item.Positive_pct.toFixed(2));
        const neutral = Number(item.Neutral_pct.toFixed(2));
        const negative = Number(Math.max(0, 100 - positive - neutral).toFixed(2));

        return {
          ...item,
          Positive_pct: positive,
          Neutral_pct: neutral,
          Negative_pct: negative,
        };
      }),
    [geoSentiment]
  );

  const geoCreatorRankings = useMemo(
    () =>
      calculateGeoCreatorRankings(rows)
        .filter((item) => isKnownGeoRegion(item.geo_region))
        .slice(0, 5),
    [rows]
  );

  const geoContentChartData = useMemo(
    () =>
      geoCoverage.map((item) => ({
        region: item.geo_region,
        videos: item.sonalika_video_count,
        distribution: Number(item.content_distribution_pct.toFixed(1)),
      })),
    [geoCoverage]
  );

  const geoCreatorChartData = useMemo(
    () =>
      geoCoverage.map((item) => ({
        region: item.geo_region,
        creators: item.creator_count,
      })),
    [geoCoverage]
  );

  const geoSentimentChartData = useMemo(
    () =>
      geoSentimentTableData.map((item) => ({
        region: item.geo_region,
        Positive: item.Positive_pct,
        Neutral: item.Neutral_pct,
        Negative: item.Negative_pct,
      })),
    [geoSentimentTableData]
  );

  const SortableHeader = ({
    label,
    sortKey,
    align = 'right',
  }: {
    label: string;
    sortKey: CreatorSortKey;
    align?: 'left' | 'right';
  }) => (
    <button
      type="button"
      onClick={() => setCreatorSortKey(sortKey)}
      className={`inline-flex items-center gap-1 font-semibold ${
        align === 'right' ? 'justify-end text-right' : 'justify-start text-left'
      } ${creatorSortKey === sortKey ? 'text-blue-700' : 'text-slate-600'}`}
    >
      {label}
      <span className="text-xs">{creatorSortKey === sortKey ? '↓' : '↕'}</span>
    </button>
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
      <div>
        <h1 className="text-3xl font-bold text-slate-950">
          Voice of Influencer
        </h1>
        <p className="mt-2 text-slate-600">
          Transcript-derived brand sentiment, feature sentiment, creator performance and geo-segmented insights.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Videos Analyzed</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.videos_analyzed.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total video-level records used for KPI calculations.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Brands Detected</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.brands_detected.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Unique tractor brands identified from transcripts and metadata.
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Date Range</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.date_range}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Posting period covered by the current dashboard dataset.
            </p>
          </div>
        </div>
      </div>

      <SectionCard
        title="1. Brand-Level Sentiment"
        subtitle="Positive, neutral and negative sentiment split by brand. Videos show brand coverage, while sentiment mentions are extracted transcript sentiment statements used for percentage calculation."
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <SentimentLegend />
        </div>

        {brandSentimentTableData.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Brand</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Videos</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Sentiment Mentions</th>
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Sentiment Split</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {brandSentimentTableData.map((item) => (
                  <tr key={item.brand} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 font-bold text-slate-950">{item.brand}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {item.video_count.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-900">
                      {item.total_mentions.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <SentimentStrip
                        positive={item.Positive_pct}
                        neutral={item.Neutral_pct}
                        negative={item.Negative_pct}
                        height="h-7"
                        showLabels
                        minWidth="min-w-[460px]"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Brand-level sentiment is not available for the current CSV rows." />
        )}
      </SectionCard>

      <SectionCard
        title="2. Feature-Level Sentiment"
        subtitle="Positive, neutral and negative sentiment percentage for each tractor feature filtered by selected brand."
        actions={
          <select
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
            className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400"
          >
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        }
      >
        <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
          <SentimentLegend />
          <p className="text-xs font-medium text-slate-500">
            Values are displayed directly on bars.
          </p>
        </div>

        {featureSentimentChartData.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-950">
                Feature Sentiment Comparison — {selectedBrand}
              </h3>
              <p className="text-sm text-slate-500">
                Grouped vertical bars compare positive, neutral and negative sentiment across features.
              </p>
            </div>

            <div className="h-[455px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={featureSentimentChartData}
                  margin={{ top: 42, right: 24, left: 4, bottom: 90 }}
                  barGap={4}
                  barCategoryGap="18%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="feature"
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={95}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={formatPercentTick}
                    tick={{ fontSize: 12, fill: '#475569' }}
                  />
                  <Tooltip
                    formatter={(value: number | string, name: string) => [
                      `${Number(value).toFixed(1)}%`,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar
                    dataKey="Positive"
                    name="Positive"
                    fill={SENTIMENT_COLORS.Positive}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  >
                    <LabelList
                      dataKey="Positive"
                      position="top"
                      formatter={formatPercentLabel}
                      fill="#1E3A8A"
                      fontSize={11}
                      fontWeight={700}
                    />
                  </Bar>
                  <Bar
                    dataKey="Neutral"
                    name="Neutral"
                    fill={SENTIMENT_COLORS.Neutral}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  >
                    <LabelList
                      dataKey="Neutral"
                      position="top"
                      formatter={formatPercentLabel}
                      fill="#334155"
                      fontSize={11}
                      fontWeight={700}
                    />
                  </Bar>
                  <Bar
                    dataKey="Negative"
                    name="Negative"
                    fill={SENTIMENT_COLORS.Negative}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={34}
                  >
                    <LabelList
                      dataKey="Negative"
                      position="top"
                      formatter={formatPercentLabel}
                      fill="#991B1B"
                      fontSize={11}
                      fontWeight={700}
                    />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <EmptyState message={`Feature-level sentiment is not available for ${selectedBrand}.`} />
        )}
      </SectionCard>

      <SectionCard
        title="3. Most-Mentioned Features"
        subtitle={`Top praised and top criticized tractor features for ${selectedBrand}.`}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">
                3A. Top Praised Features — {selectedBrand}
              </h3>
              <p className="text-sm text-slate-500">
                Ranked by positive mention count.
              </p>
            </div>

            {mostMentioned.praised.length > 0 ? (
              <div className="space-y-3">
                {mostMentioned.praised.map((item, index) => (
                  <div
                    key={item.feature}
                    className="flex items-center justify-between gap-4 rounded-xl border border-blue-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-700 text-sm font-bold text-white">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-950">{item.feature}</p>
                        <p className="text-xs text-slate-500">
                          {item.total_mentions.toLocaleString()} total mentions
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-blue-800">
                        {Number(item.Positive || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">positive</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No praised features available for the selected brand." />
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">
                3B. Top Criticized Features — {selectedBrand}
              </h3>
              <p className="text-sm text-slate-500">
                Ranked by negative mention count.
              </p>
            </div>

            {mostMentioned.criticized.length > 0 ? (
              <div className="space-y-3">
                {mostMentioned.criticized.map((item, index) => (
                  <div
                    key={item.feature}
                    className="flex items-center justify-between gap-4 rounded-xl border border-red-100 bg-red-50/40 p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-full bg-red-600 text-sm font-bold text-white">
                        #{index + 1}
                      </span>
                      <div>
                        <p className="font-bold text-slate-950">{item.feature}</p>
                        <p className="text-xs text-slate-500">
                          {item.total_mentions.toLocaleString()} total mentions
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-red-700">
                        {Number(item.Negative || 0).toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-500">negative</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState message="No criticized features available for the selected brand." />
            )}
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="4. Trend Analysis: Weekly Mention & Sentiment Movement"
        subtitle="Weekly view of brand mention volume and sentiment movement for the selected period."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={trendBrand}
              onChange={(event) => setTrendBrand(event.target.value)}
              className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400"
            >
              {trendOptions.map((brand) => (
                <option key={brand} value={brand}>
                  {brand}
                </option>
              ))}
            </select>

            <select
              value={trendWeekOption}
              onChange={(event) => setTrendWeekOption(event.target.value as TrendWeekOption)}
              className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400"
            >
              {TREND_WEEK_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        }
      >
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          <b>How to read:</b> the selected period is <b>{selectedTrendPeriodLabel}</b>. Mention trend shows
          weekly video count for the selected brand. Sentiment trend shows weekly positive, neutral and
          negative transcript sentiment mentions.
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-bold text-slate-950">
                4A. Weekly Mention Trend
              </h3>
              <p className="text-sm text-slate-500">
                Weekly count of videos where the selected brand is mentioned.
              </p>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weeklyMentionTrend} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <defs>
                    <linearGradient id="mentionBlue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.35} />
                      <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.03} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />

                  {trendBrand === 'All Brands' ? (
                    mentionLineBrands.map((brand, index) => (
                      <Area
                        key={brand}
                        type="monotone"
                        dataKey={brand}
                        stroke={BRAND_LINE_COLORS[index % BRAND_LINE_COLORS.length]}
                        fill="url(#mentionBlue)"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))
                  ) : (
                    <Area
                      type="monotone"
                      dataKey="mentions"
                      name={`${trendBrand} mentions`}
                      stroke={COLORS.primary}
                      fill="url(#mentionBlue)"
                      strokeWidth={3}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-bold text-slate-950">
                4B. Weekly Sentiment Trend
              </h3>
              <p className="text-sm text-slate-500">
                Weekly positive, neutral and negative transcript sentiment mentions.
              </p>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySentimentTrend} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Positive" stroke={SENTIMENT_COLORS.Positive} strokeWidth={3} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Neutral" stroke={SENTIMENT_COLORS.Neutral} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Negative" stroke={SENTIMENT_COLORS.Negative} strokeWidth={2.5} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="5. Creator Performance Leaderboard"
        subtitle={`Top ${creatorLimit} creator ranking based on ${CREATOR_SORT_LABELS[creatorSortKey]}. Use the filter to switch between Top 5, Top 10, Top 15 or Top 20.`}
        actions={
          <select
            value={creatorLimit}
            onChange={(event) => setCreatorLimit(Number(event.target.value))}
            className="rounded-xl border border-blue-100 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm outline-none focus:border-blue-400"
          >
            {CREATOR_LIMIT_OPTIONS.map((limit) => (
              <option key={limit} value={limit}>
                Top {limit}
              </option>
            ))}
          </select>
        }
      >
        <div className="mb-4 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          <b>Ranking criteria included:</b> content frequency, tractor video percentage, Sonalika mention percentage,
          sentiment score and viewer engagement. Default view is ranked by engagement. Click any scoring column to re-rank.
        </div>

        {creatorPerformance.length > 0 ? (
          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Rank</th>
                  <th className="px-4 py-3 text-left font-bold text-slate-700">Creator</th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Content Frequency" sortKey="content_frequency" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Tractor Video %" sortKey="tractor_video_percentage" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Sonalika Mention %" sortKey="sonalika_mention_percentage" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Sentiment Score" sortKey="sentiment_score" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Engagement" sortKey="engagement" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Eng. Rate %" sortKey="engagement_rate_pct" />
                  </th>
                  <th className="px-4 py-3 text-right">
                    <SortableHeader label="Overall Score" sortKey="overall_score" />
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {creatorPerformance.map((row) => (
                  <tr key={row.channelTitle} className="hover:bg-blue-50/40">
                    <td className="px-4 py-3 text-slate-700">
                      <span
                        className={`inline-flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                          row.rank <= 3
                            ? 'bg-blue-700 text-white'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-950">
                      {row.channelTitle}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.content_frequency}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.tractor_video_percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.sonalika_mention_percentage.toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.sentiment_score.toFixed(1)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-950">
                      {row.engagement.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right text-slate-700">
                      {row.engagement_rate_pct.toFixed(2)}%
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-blue-700">
                      {row.overall_score.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Creator performance data is not available for the current CSV rows." />
        )}
      </SectionCard>

      <SectionCard
        title="6. Geo-Segmented Insights"
        subtitle="Influencer density by city/region, distribution of content by region, inferred from video language and available influencer location data, to identify regional variations in mentions, sentiment, and channel rankings."
      >
        <div className="mb-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-slate-700">
          <b>How to read:</b> these charts show where Sonalika is being discussed, which regions have active creators,
          and where regional sentiment or creator rankings indicate stronger visibility.
        </div>

        {geoCoverage.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-950">
                  6A. Content Distribution by Region
                </h3>
                <p className="text-sm text-slate-500">
                  Unique Sonalika-related videos identified by region.
                </p>
              </div>

              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={geoContentChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 48, left: 35, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="region"
                      width={95}
                      tick={{ fontSize: 12, fill: '#475569' }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="videos"
                      name="Unique Sonalika videos"
                      fill="#F59E0B"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={36}
                    >
                      <LabelList
                        dataKey="videos"
                        position="right"
                        formatter={formatNumberLabel}
                        fill="#1E293B"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-950">
                  6B. Influencer Density by Region
                </h3>
                <p className="text-sm text-slate-500">
                  Unique creators contributing Sonalika-related content.
                </p>
              </div>

              <div className="h-[310px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={geoCreatorChartData}
                    layout="vertical"
                    margin={{ top: 10, right: 48, left: 35, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                    <YAxis
                      type="category"
                      dataKey="region"
                      width={95}
                      tick={{ fontSize: 12, fill: '#475569' }}
                    />
                    <Tooltip />
                    <Bar
                      dataKey="creators"
                      name="Unique creators"
                      fill="#60A5FA"
                      radius={[0, 8, 8, 0]}
                      maxBarSize={36}
                    >
                      <LabelList
                        dataKey="creators"
                        position="right"
                        formatter={formatNumberLabel}
                        fill="#1E293B"
                        fontSize={12}
                        fontWeight={700}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState message="Geo-segmented coverage is not available for the current CSV rows." />
        )}

        {geoSentimentChartData.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-950">
                6C. Regional Sentiment Variation
              </h3>
              <p className="text-sm text-slate-500">
                Positive, neutral and negative sentiment split by available region.
              </p>
            </div>

            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={geoSentimentChartData}
                  margin={{ top: 42, right: 24, left: 4, bottom: 70 }}
                  barGap={4}
                  barCategoryGap="22%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="region"
                    interval={0}
                    angle={-20}
                    textAnchor="end"
                    height={70}
                    tick={{ fontSize: 11, fill: '#475569' }}
                  />
                  <YAxis
                    domain={[0, 100]}
                    tickFormatter={formatPercentTick}
                    tick={{ fontSize: 12, fill: '#475569' }}
                  />
                  <Tooltip
                    formatter={(value: number | string, name: string) => [
                      `${Number(value).toFixed(1)}%`,
                      name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="Positive" name="Positive" fill={SENTIMENT_COLORS.Positive} radius={[6, 6, 0, 0]} maxBarSize={34}>
                    <LabelList dataKey="Positive" position="top" formatter={formatPercentLabel} fill="#1E3A8A" fontSize={11} fontWeight={700} />
                  </Bar>
                  <Bar dataKey="Neutral" name="Neutral" fill={SENTIMENT_COLORS.Neutral} radius={[6, 6, 0, 0]} maxBarSize={34}>
                    <LabelList dataKey="Neutral" position="top" formatter={formatPercentLabel} fill="#334155" fontSize={11} fontWeight={700} />
                  </Bar>
                  <Bar dataKey="Negative" name="Negative" fill={SENTIMENT_COLORS.Negative} radius={[6, 6, 0, 0]} maxBarSize={34}>
                    <LabelList dataKey="Negative" position="top" formatter={formatPercentLabel} fill="#991B1B" fontSize={11} fontWeight={700} />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        ) : (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-800">
            Regional sentiment is not available for the current extracted sentiment records. Showing regional content coverage and creator presence only.
          </div>
        )}

        {geoCreatorRankings.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-950">
                6D. Geo-wise Creator Ranking
              </h3>
              <p className="text-sm text-slate-500">
                Top regional creators ranked by engagement from Sonalika-related videos.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 lg:grid-cols-5">
              {geoCreatorRankings.map((row, index) => (
                <div
                  key={`${row.geo_region}-${row.top_creator}`}
                  className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-700 text-xs font-bold text-white">
                      #{index + 1}
                    </span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                      {row.geo_region}
                    </span>
                  </div>

                  <h4 className="min-h-[44px] text-sm font-bold text-slate-950">
                    {row.top_creator}
                  </h4>

                  <div className="mt-4 space-y-2 text-xs">
                    <div className="flex justify-between rounded-lg bg-blue-50 px-3 py-2">
                      <span className="text-slate-600">Videos</span>
                      <span className="font-bold text-blue-800">
                        {row.sonalika_video_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-slate-600">Creators</span>
                      <span className="font-bold text-slate-800">
                        {row.creator_count.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between rounded-lg bg-slate-50 px-3 py-2">
                      <span className="text-slate-600">Engagement</span>
                      <span className="font-bold text-slate-950">
                        {row.engagement.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState message="Geo-wise creator ranking is not available for the current CSV rows." />
        )}
      </SectionCard>
    </div>
  );
}