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
  calculateTopPositiveBrandsForFeature,
  calculateCreatorPerformance,
  calculateFeatureLevelSentiment,
  calculateGeoCoverage,
  calculateGeoCreatorRankings,
  calculateGeoSentiment,
  calculateMostMentionedFeatures,
  calculateMostMentionedFeatureVerbatims,
  calculateVoiceInfluencerKpiCards,
  calculateTractorContentCategoryDistribution,
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

type TrendWeekOption = '2' | '3' | '4';

type CreatorSortKey =
  | 'engagement'
  | 'overall_score'
  | 'sonalika_mention_percentage'
  | 'tractor_video_percentage'
  | 'content_frequency'
  | 'sentiment_score'
  | 'engagement_rate_pct';


const TREND_WEEK_OPTIONS: { label: string; value: TrendWeekOption }[] = [
  { label: 'Last 2 weeks', value: '2' },
  { label: 'Last 3 weeks', value: '3' },
  { label: 'Last 4 weeks', value: '4' },
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
  const max = new Date(`${maxDate}T00:00:00`);

  if (Number.isNaN(max.getTime())) {
    return '';
  }

  const weekCount = Number(selectedWeeks);

  // Include the complete first visible bucket.
  // Example for Mar 15 and 2 weeks: start from Mar 1,
  // so the trend shows 1–8 Mar and 9–15 Mar.
  max.setDate(max.getDate() - weekCount * 7);

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

export default function VoiceInfluencerTab() {
  const { rows, loading, error } = useKpiData();

  const availableBrands = useMemo(() => getAvailableBrands(rows), [rows]);
  const availableDateRange = useMemo(() => getAvailableDateRange(rows), [rows]);

  const [selectedBrand, setSelectedBrand] = useState('Sonalika');
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [benchmarkMode, setBenchmarkMode] = useState<'overall' | 'competitors'>('competitors');
  const [trendBrand, setTrendBrand] = useState('Sonalika');
  const [trendWeekOption, setTrendWeekOption] = useState<TrendWeekOption>('2');
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

  const tractorContentCategoryData = useMemo(
    () => calculateTractorContentCategoryDistribution(rows),
    [rows]
  );

  const effectiveTrendStartDate = useMemo(
    () => getStartDateForWeekOption(availableDateRange.maxDate, trendWeekOption),
    [trendWeekOption, availableDateRange]
  );

  const effectiveTrendEndDate = availableDateRange.maxDate;

  const selectedTrendPeriodLabel = useMemo(() => {
    return (
      TREND_WEEK_OPTIONS.find((option) => option.value === trendWeekOption)?.label ||
      'Last 2 weeks'
    );
  }, [trendWeekOption]);

  const brandSentiment = useMemo(
    () => calculateBrandLevelSentiment(rows),
    [rows]
  );

  const brandSentimentTableData = useMemo(
    () =>
      brandSentiment
        .map((item) => {
          const positive = Number(item.Positive_pct.toFixed(2));
          const neutral = Number(item.Neutral_pct.toFixed(2));
          const negative = Number(Math.max(0, 100 - positive - neutral).toFixed(2));

          return {
            ...item,
            Positive_pct: positive,
            Neutral_pct: neutral,
            Negative_pct: negative,
          };
        })
        .sort((a, b) => {
          const aBrand = String(a.brand || '').toLowerCase();
          const bBrand = String(b.brand || '').toLowerCase();

          if (aBrand === 'sonalika') return -1;
          if (bBrand === 'sonalika') return 1;

          return b.video_count - a.video_count;
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

  const selectedFeatureData = useMemo(
    () =>
      selectedFeature
        ? featureSentimentChartData.find((item) => item.feature === selectedFeature) || null
        : null,
    [selectedFeature, featureSentimentChartData]
  );

  const selectedFeatureTopBrands = useMemo(
    () =>
      selectedFeature
        ? calculateTopPositiveBrandsForFeature(rows, selectedFeature, 3, selectedBrand)
        : [],
    [rows, selectedFeature, selectedBrand]
  );

  const selectedFeatureSingleChartData = useMemo(
    () =>
      selectedFeature && selectedFeatureData
        ? [
            {
              feature: selectedFeature,
              Positive: selectedFeatureData.Positive,
              Neutral: selectedFeatureData.Neutral,
              Negative: selectedFeatureData.Negative,
            },
          ]
        : [],
    [selectedFeature, selectedFeatureData]
  );

  const selectedFeatureCompetitorChartData = useMemo(
    () =>
      selectedFeatureTopBrands.map((item) => ({
        brand: item.brand,
        Positive: Number(item.Positive_pct.toFixed(1)),
        positiveMentions: item.Positive,
        totalMentions: item.total_mentions,
      })),
    [selectedFeatureTopBrands]
  );

  const topCompetitorByFeature = useMemo(
    () =>
      featureSentimentChartData
        .map((item) => {
          const topBrand = calculateTopPositiveBrandsForFeature(
            rows,
            item.feature,
            1,
            benchmarkMode === 'competitors' ? selectedBrand : ''
          )[0];

          return topBrand
            ? {
                feature: item.feature,
                brand: topBrand.brand,
                positivePct: Number(topBrand.Positive_pct.toFixed(1)),
              }
            : null;
        })
        .filter(
          (item): item is { feature: string; brand: string; positivePct: number } =>
            Boolean(item)
        ),
    [rows, selectedBrand, benchmarkMode, featureSentimentChartData]
  );

  const handleFeatureClick = (feature?: string) => {
    if (!feature) return;

    setSelectedFeature((currentFeature) =>
      currentFeature === feature ? null : feature
    );
  };

  const mostMentioned = useMemo(
    () => calculateMostMentionedFeatures(rows, selectedBrand, 5),
    [rows, selectedBrand]
  );

  const mostMentionedVerbatims = useMemo(
    () => calculateMostMentionedFeatureVerbatims(rows, selectedBrand, 3),
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


        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Videos Analyzed</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.videos_analyzed.toLocaleString()}
            </p>
            
            <p className="mt-1 text-xs font-semibold text-blue-800">
              Tractor videos: {voiceKpiCards.tractor_videos_analyzed.toLocaleString()}
            </p>
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Brands Detected</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.brands_detected.toLocaleString()}
            </p>
            
          </div>

          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">Date Range</p>
            <p className="mt-2 text-3xl font-bold text-blue-900">
              {voiceKpiCards.date_range}
            </p>
           
          </div>
        </div>
      </div>

      <SectionCard
        title="Tractor Content Category Split"
      >
        {tractorContentCategoryData.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  Tractor Video Category Distribution
                </h3>
                
              </div>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: '#60A5FA' }}
                  />
                  Total
                </span>
                <span className="inline-flex items-center gap-2 font-semibold text-slate-700">
                  <span
                    className="inline-block h-3 w-3 rounded-sm"
                    style={{ backgroundColor: '#F97316' }}
                  />
                  Sonalika
                </span>
              </div>
            </div>

            <div className="h-[390px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={tractorContentCategoryData}
                  margin={{ top: 28, right: 28, left: 4, bottom: 88 }}
                  barGap={6}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                  <XAxis
                    dataKey="category"
                    interval={0}
                    angle={-28}
                    textAnchor="end"
                    height={105}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    tickMargin={12}
                  />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Bar
                    dataKey="Total"
                    name="Total"
                    fill="#60A5FA"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  >
                    <LabelList
                      dataKey="Total"
                      position="top"
                      formatter={formatNumberLabel}
                      fill="#1E293B"
                      fontSize={12}
                      fontWeight={700}
                    />
                  </Bar>
                  <Bar
                    dataKey="Sonalika"
                    name="Sonalika"
                    fill="#F97316"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={42}
                  >
                    <LabelList
                      dataKey="Sonalika"
                      position="top"
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
        ) : (
          <EmptyState message="Tractor content category data is not available for the current CSV rows." />
        )}
      </SectionCard>

      <SectionCard
        title="Brand-Level Sentiment"
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
                  <th className="px-4 py-3 text-center font-bold text-slate-700">Sentiment Split</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {brandSentimentTableData.map((item) => {
                  const isSonalikaRow = String(item.brand || '').toLowerCase() === 'sonalika';

                  return (
                  <tr
                    key={item.brand}
                    className={isSonalikaRow ? 'bg-blue-50/70 ring-1 ring-inset ring-blue-100' : 'hover:bg-blue-50/40'}
                  >
                    <td className="px-4 py-3 font-bold text-slate-950">{item.brand}</td>
                    <td className="px-4 py-3 text-center text-slate-700">
                      {item.video_count.toLocaleString()}
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
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Brand-level sentiment is not available for the current CSV rows." />
        )}
      </SectionCard>

      <SectionCard
        title="Feature-Level Sentiment"
        actions={
          <select
            value={selectedBrand}
            onChange={(event) => {
              setSelectedBrand(event.target.value);
              setSelectedFeature(null);
            }}
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
          
        </div>

        {featureSentimentChartData.length > 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-300">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-950">
                  {selectedFeature
                    ? `${selectedFeature} Positive Sentiment Benchmark`
                    : `Feature Sentiment Comparison — ${selectedBrand}`}
                </h3>
                <p className="text-sm text-slate-500">
                  {selectedFeature
                    ? `Comparing ${selectedBrand} with the top 3 other tractor brands for this feature.`
                    : 'Click any feature bar to compare Sonalika with the top positive competitor brands for that feature.'}
                </p>
              </div>

              {selectedFeature ? (
                <button
                  type="button"
                  onClick={() => setSelectedFeature(null)}
                  className="rounded-full border border-blue-100 bg-blue-50 px-4 py-2 text-xs font-bold text-blue-800 transition hover:bg-blue-100"
                >
                  Back to all features
                </button>
              ) : null}
            </div>

            {!selectedFeature ? (
              <>
              <div className="h-[455px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={featureSentimentChartData}
                    margin={{ top: 42, right: 24, left: 4, bottom: 70 }}
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
                      labelFormatter={(label) => `Feature: ${label}`}
                    />
                    <Bar
                      dataKey="Positive"
                      name="Positive"
                      fill={SENTIMENT_COLORS.Positive}
                      radius={[6, 6, 0, 0]}
                      maxBarSize={34}
                      cursor="pointer"
                      onClick={(data: any) => handleFeatureClick(data?.payload?.feature)}
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
                      cursor="pointer"
                      onClick={(data: any) => handleFeatureClick(data?.payload?.feature)}
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
                      cursor="pointer"
                      onClick={(data: any) => handleFeatureClick(data?.payload?.feature)}
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

              {topCompetitorByFeature.length > 0 ? (
                <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                      Top positive benchmark by feature
                    </p>

                    <div className="inline-flex rounded-full border border-blue-100 bg-white p-1 text-xs font-bold shadow-sm">
                      <button
                        type="button"
                        onClick={() => setBenchmarkMode('overall')}
                        className={`rounded-full px-3 py-1 transition ${
                          benchmarkMode === 'overall'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        Overall
                      </button>
                      <button
                        type="button"
                        onClick={() => setBenchmarkMode('competitors')}
                        className={`rounded-full px-3 py-1 transition ${
                          benchmarkMode === 'competitors'
                            ? 'bg-blue-700 text-white'
                            : 'text-slate-600 hover:bg-blue-50'
                        }`}
                      >
                        Competitors
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
                    {topCompetitorByFeature.map((item) => (
                      <div
                        key={`${item.feature}-${item.brand}`}
                        className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs shadow-sm"
                      >
                        <p className="font-bold text-slate-950">{item.feature}</p>
                        <p className="mt-1 text-blue-700">
                          {item.brand} · {item.positivePct.toFixed(1)}% positive
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
              </>
            ) : (
              <div className="overflow-x-auto">
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
                    gap: '20px',
                    alignItems: 'stretch',
                    minWidth: '1080px',
                  }}
                >
                  <div className="rounded-2xl border border-blue-100 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                        Client Brand
                      </p>
                      <h4 className="mt-2 text-lg font-bold text-slate-950">
                        {selectedBrand} — {selectedFeature}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Same feature sentiment split for the selected brand.
                      </p>
                    </div>

                    {selectedFeatureSingleChartData.length > 0 ? (
                      <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={selectedFeatureSingleChartData}
                            margin={{ top: 36, right: 24, left: 4, bottom: 46 }}
                            barGap={8}
                            barCategoryGap="34%"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                            <XAxis
                              dataKey="feature"
                              interval={0}
                              tick={{ fontSize: 12, fill: '#475569' }}
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
                            <Bar
                              dataKey="Positive"
                              name="Positive"
                              fill={SENTIMENT_COLORS.Positive}
                              radius={[6, 6, 0, 0]}
                              maxBarSize={52}
                            >
                              <LabelList
                                dataKey="Positive"
                                position="top"
                                formatter={formatPercentLabel}
                                fill="#1E3A8A"
                                fontSize={12}
                                fontWeight={700}
                              />
                            </Bar>
                            <Bar
                              dataKey="Neutral"
                              name="Neutral"
                              fill={SENTIMENT_COLORS.Neutral}
                              radius={[6, 6, 0, 0]}
                              maxBarSize={52}
                            >
                              <LabelList
                                dataKey="Neutral"
                                position="top"
                                formatter={formatPercentLabel}
                                fill="#334155"
                                fontSize={12}
                                fontWeight={700}
                              />
                            </Bar>
                            <Bar
                              dataKey="Negative"
                              name="Negative"
                              fill={SENTIMENT_COLORS.Negative}
                              radius={[6, 6, 0, 0]}
                              maxBarSize={52}
                            >
                              <LabelList
                                dataKey="Negative"
                                position="top"
                                formatter={formatPercentLabel}
                                fill="#991B1B"
                                fontSize={12}
                                fontWeight={700}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyState message={`No ${selectedFeature} sentiment available for ${selectedBrand}.`} />
                    )}
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-wide text-slate-500">
                        Top Positive Competitor Brands
                      </p>
                      <h4 className="mt-2 text-lg font-bold text-slate-950">
                        Top 3 brands for {selectedFeature}
                      </h4>
                      <p className="mt-1 text-sm text-slate-500">
                        Positive sentiment only, excluding {selectedBrand}.
                      </p>
                    </div>

                    {selectedFeatureCompetitorChartData.length > 0 ? (
                      <div className="h-[340px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart
                            data={selectedFeatureCompetitorChartData}
                            layout="vertical"
                            margin={{ top: 24, right: 52, left: 28, bottom: 16 }}
                            barCategoryGap="32%"
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                            <XAxis
                              type="number"
                              domain={[0, 100]}
                              tickFormatter={formatPercentTick}
                              tick={{ fontSize: 12, fill: '#475569' }}
                            />
                            <YAxis
                              type="category"
                              dataKey="brand"
                              width={115}
                              tick={{ fontSize: 12, fill: '#0F172A', fontWeight: 700 }}
                            />
                            <Tooltip
                              formatter={(value: number | string) => [
                                `${Number(value).toFixed(1)}%`,
                                'Positive',
                              ]}
                              labelFormatter={(label) => `Brand: ${label}`}
                            />
                            <Bar
                              dataKey="Positive"
                              name="Positive"
                              fill={SENTIMENT_COLORS.Positive}
                              radius={[0, 8, 8, 0]}
                              maxBarSize={34}
                            >
                              <LabelList
                                dataKey="Positive"
                                position="right"
                                formatter={formatPercentLabel}
                                fill="#1E3A8A"
                                fontSize={12}
                                fontWeight={700}
                              />
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <EmptyState message={`No positive competitor sentiment found for ${selectedFeature}.`} />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <EmptyState message={`Feature-level sentiment is not available for ${selectedBrand}.`} />
        )}
      </SectionCard>

      <SectionCard
        title="Most-Mentioned Features"
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50 p-5 shadow-sm">
            <div className="mb-4">
              <h3 className="text-lg font-bold text-slate-950">
                Top Praised Features — {selectedBrand}
              </h3>
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
                Top Criticized Features — {selectedBrand}
              </h3>
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

        {mostMentionedVerbatims.length > 0 ? (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-4">
              
              <h3 className="mt-2 text-lg font-bold text-slate-950">
                {selectedBrand} criticism vs competitor praise
              </h3>
              
            </div>

            <div className="space-y-4">
              {mostMentionedVerbatims.map((item) => (
                <div
                  key={item.feature}
                  className="rounded-2xl border border-slate-100 bg-slate-50 p-4"
                >
                  <h4 className="mb-3 text-base font-bold text-slate-950">
                    {item.feature}
                  </h4>

                  <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <div className="rounded-xl border border-red-100 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-red-700">
                          {selectedBrand} Negative Verbatim
                        </p>
                      </div>

                      {item.clientNegative ? (
                        <div>
                          <blockquote className="border-l-4 border-red-500 pl-4 text-sm leading-6 text-slate-700">
                            “{item.clientNegative.sentence}”
                          </blockquote>
                          <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs leading-5 text-slate-700 sm:grid-cols-2">
                            <p>
                              <span className="font-bold text-slate-800">Content type:</span>{' '}
                              {item.clientNegative.content_type || 'Not available'}
                            </p>
                            <p>
                              <span className="font-bold text-slate-800">Creator:</span>{' '}
                              {item.clientNegative.creator || 'Not available'}
                            </p>
                            <p>
                              <span className="font-bold text-slate-800">Region:</span>{' '}
                              {item.clientNegative.region || 'Not available'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No clean negative verbatim available for this feature.
                        </p>
                      )}
                    </div>

                    <div className="rounded-xl border border-blue-100 bg-white p-4">
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <p className="text-xs font-bold uppercase tracking-wide text-blue-700">
                          Competitor Positive Verbatim
                        </p>
                        {item.competitorPositive ? (
                          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700">
                            {item.competitorPositive.brand}
                          </span>
                        ) : null}
                      </div>

                      {item.competitorPositive ? (
                        <div>
                          <blockquote className="border-l-4 border-blue-600 pl-4 text-sm leading-6 text-slate-700">
                            “{item.competitorPositive.sentence}”
                          </blockquote>
                          <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg bg-blue-50 px-3 py-2 text-xs leading-5 text-slate-700 sm:grid-cols-2">
                            <p>
                              <span className="font-bold text-slate-800">Content type:</span>{' '}
                              {item.competitorPositive.content_type || 'Not available'}
                            </p>
                            <p>
                              <span className="font-bold text-slate-800">Creator:</span>{' '}
                              {item.competitorPositive.creator || 'Not available'}
                            </p>
                            <p>
                              <span className="font-bold text-slate-800">Region:</span>{' '}
                              {item.competitorPositive.region || 'Not available'}
                            </p>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500">
                          No positive competitor verbatim available for this feature.
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </SectionCard>

      <SectionCard
        title="Trend Analysis: Weekly Mention & Sentiment Movement"
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="mb-3">
              <h3 className="text-base font-bold text-slate-950">
                Weekly Mention Trend
              </h3>
              
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
                Weekly Sentiment Trend
              </h3>
              
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
        title="Creator Performance Leaderboard"
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

        {creatorPerformance.length > 0 ? (
          <div className="space-y-3">
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

            <div className="rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3 text-xs leading-5 text-slate-600">
              <p className="font-bold text-slate-800">Creator leaderboard formula notes</p>
              <p>
                <span className="font-semibold">Scope:</span> this leaderboard includes only creators with Sonalika-related tractor videos. Creators with 0% Sonalika mention are excluded from this KPI.
              </p>
              <p>
                <span className="font-semibold">Content Frequency</span> = number of Sonalika-related videos by the creator. 
                <span className="font-semibold"> Sonalika Mention %</span> = (Sonalika-related videos / selected creator videos) × 100.
              </p>
              <p>
                <span className="font-semibold">Sentiment Score</span> = ((Positive Sonalika sentiment mentions − Negative Sonalika sentiment mentions) / Total Sonalika sentiment mentions) × 100. A positive value means positive sentiment is stronger; a negative value means criticism is stronger.
              </p>
              <p>
                <span className="font-semibold">Engagement</span> = Total Views + Total Likes + Total Comments from Sonalika-related videos. 
                <span className="font-semibold"> Engagement Rate %</span> = ((Likes + Comments) / Views) × 100.
              </p>
              <p>
                <span className="font-semibold">Overall Score</span> = normalized weighted score: Engagement contributes 40%, Content Frequency contributes 20%, Sonalika Mention % contributes 20%, and Sentiment Score contributes 20%.
              </p>
            </div>
          </div>
        ) : (
          <EmptyState message="Creator performance data is not available for the current CSV rows." />
        )}
      </SectionCard>

      <SectionCard
        title="Geo-Segmented Insights"
      >

        {geoCoverage.length > 0 ? (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-4">
                <h3 className="text-base font-bold text-slate-950">
                  Content Distribution by Region
                </h3>
                
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
                  Influencer Density by Region
                </h3>
                
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
                Regional Sentiment Distribution
              </h3>
              
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
                Top Creator by Region
              </h3>
              
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
          <EmptyState message="Top creator by region is not available for the current CSV rows." />
        )}
      </SectionCard>
    </div>
  );
}