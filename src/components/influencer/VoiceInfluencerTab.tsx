import { useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
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

const SENTIMENT_COLORS = {
  Positive: '#2563EB',
  Neutral: '#94A3B8',
  Negative: '#F97316',
};

const BRAND_LINE_COLORS = [
  '#2563EB',
  '#F97316',
  '#14B8A6',
  '#8B5CF6',
  '#E11D48',
  '#64748B',
  '#84CC16',
  '#06B6D4',
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

const CREATOR_SORT_LABELS: Record<CreatorSortKey, string> = {
  engagement: 'Engagement',
  overall_score: 'Overall Score',
  sonalika_mention_percentage: 'Sonalika Mention %',
  tractor_video_percentage: 'Tractor Video %',
  content_frequency: 'Content Frequency',
  sentiment_score: 'Sentiment Score',
  engagement_rate_pct: 'Eng. Rate %',
};

const formatPercentTick = (value: number | string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${Math.round(numericValue)}%` : `${value}%`;
};

const formatTooltipPercent = (value: number | string) => {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? `${numericValue.toFixed(1)}%` : `${value}%`;
};

const getIntegerTicks = (maxValue: number) => {
  const safeMax = Math.max(1, Math.ceil(maxValue));
  return Array.from({ length: safeMax + 1 }, (_, index) => index);
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

export default function VoiceInfluencerTab() {
  const { rows, loading, error } = useKpiData();

  const availableBrands = useMemo(() => getAvailableBrands(rows), [rows]);
  const availableDateRange = useMemo(() => getAvailableDateRange(rows), [rows]);

  const [selectedBrand, setSelectedBrand] = useState('Sonalika');
  const [trendBrand, setTrendBrand] = useState('Sonalika');
  const [trendWeekOption, setTrendWeekOption] = useState<TrendWeekOption>('12');
  const [creatorSortKey, setCreatorSortKey] = useState<CreatorSortKey>('engagement');

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

  const brandSentimentChartData = useMemo(
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
          ...item,
          Positive_pct: positive,
          Neutral_pct: neutral,
          Negative_pct: negative,
        };
      }),
    [featureSentiment]
  );

  const mostMentioned = useMemo(
    () => calculateMostMentionedFeatures(rows, selectedBrand, 5),
    [rows, selectedBrand]
  );

  const mostMentionedMaxValue = useMemo(() => {
    const praisedMax = Math.max(
      0,
      ...mostMentioned.praised.map((item) => Number(item.Positive || 0))
    );

    const criticizedMax = Math.max(
      0,
      ...mostMentioned.criticized.map((item) => Number(item.Negative || 0))
    );

    return Math.max(praisedMax, criticizedMax, 1);
  }, [mostMentioned]);

  const mostMentionedTicks = useMemo(
    () => getIntegerTicks(mostMentionedMaxValue),
    [mostMentionedMaxValue]
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
        .slice(0, 10),
    [rows, creatorSortKey]
  );

  const geoCoverage = useMemo(
    () => calculateGeoCoverage(rows).slice(0, 10),
    [rows]
  );

  const geoSentiment = useMemo(
    () => calculateGeoSentiment(rows).slice(0, 10),
    [rows]
  );

  const geoSentimentChartData = useMemo(
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
    () => calculateGeoCreatorRankings(rows).slice(0, 10),
    [rows]
  );

  const geoContentMaxValue = useMemo(
    () => Math.max(1, ...geoCoverage.map((item) => item.sonalika_video_count)),
    [geoCoverage]
  );

  const geoCreatorMaxValue = useMemo(
    () => Math.max(1, ...geoCoverage.map((item) => item.creator_count)),
    [geoCoverage]
  );

  const geoContentTicks = useMemo(
    () => getIntegerTicks(geoContentMaxValue),
    [geoContentMaxValue]
  );

  const geoCreatorTicks = useMemo(
    () => getIntegerTicks(geoCreatorMaxValue),
    [geoCreatorMaxValue]
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
        <h1 className="text-3xl font-bold text-gray-900">
          Voice of Influencer
        </h1>
        <p className="mt-2 text-gray-600">
          Transcript-derived brand sentiment, feature sentiment, creator performance and geo-segmented insights.
        </p>
        <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Videos Analyzed</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {voiceKpiCards.videos_analyzed.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Total video-level records used for KPI calculations.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Brands Detected</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
              {voiceKpiCards.brands_detected.toLocaleString()}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Unique tractor brands identified from transcripts and metadata.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-medium text-slate-500">Date Range</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">
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
        subtitle="Positive, neutral and negative transcript sentiment split by brand."
      >
        <div className="h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={brandSentimentChartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 16, bottom: 8 }}
              barCategoryGap="22%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={formatPercentTick}
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="brand"
                width={130}
                interval={0}
                tick={{ fontSize: 13, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={formatTooltipPercent}
                labelStyle={{ color: '#0F172A', fontWeight: 600 }}
              />
              <Legend verticalAlign="bottom" height={32} iconType="square" wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Positive_pct" name="Positive" stackId="sentiment" fill={SENTIMENT_COLORS.Positive} radius={[4, 0, 0, 4]} />
              <Bar dataKey="Neutral_pct" name="Neutral" stackId="sentiment" fill={SENTIMENT_COLORS.Neutral} />
              <Bar dataKey="Negative_pct" name="Negative" stackId="sentiment" fill={SENTIMENT_COLORS.Negative} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="2. Feature-Level Sentiment"
        subtitle="Sentiment distribution for tractor features filtered by selected brand."
        actions={
          <select
            value={selectedBrand}
            onChange={(event) => setSelectedBrand(event.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
          >
            {brandOptions.map((brand) => (
              <option key={brand} value={brand}>
                {brand}
              </option>
            ))}
          </select>
        }
      >
        <div className="h-[360px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={featureSentimentChartData}
              layout="vertical"
              margin={{ top: 8, right: 24, left: 28, bottom: 8 }}
              barCategoryGap="24%"
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis
                type="number"
                domain={[0, 100]}
                ticks={[0, 25, 50, 75, 100]}
                tickFormatter={formatPercentTick}
                tick={{ fontSize: 12, fill: '#475569' }}
                axisLine={{ stroke: '#CBD5E1' }}
                tickLine={false}
              />
              <YAxis
                type="category"
                dataKey="feature"
                width={165}
                interval={0}
                tick={{ fontSize: 13, fill: '#334155' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                formatter={formatTooltipPercent}
                labelStyle={{ color: '#0F172A', fontWeight: 600 }}
              />
              <Legend verticalAlign="bottom" height={32} iconType="square" wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="Positive_pct" name="Positive" stackId="sentiment" fill={SENTIMENT_COLORS.Positive} radius={[4, 0, 0, 4]} />
              <Bar dataKey="Neutral_pct" name="Neutral" stackId="sentiment" fill={SENTIMENT_COLORS.Neutral} />
              <Bar dataKey="Negative_pct" name="Negative" stackId="sentiment" fill={SENTIMENT_COLORS.Negative} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </SectionCard>

      <SectionCard
        title="3. Most-Mentioned Features"
        subtitle={`Top praised and top criticized tractor features for ${selectedBrand}.`}
      >
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                3A. Top Praised Features — {selectedBrand}
              </h3>
              <p className="text-sm text-slate-500">
                Ranked by positive mention count.
              </p>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostMentioned.praised}
                  layout="vertical"
                  margin={{ top: 8, right: 18, left: 18, bottom: 6 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, mostMentionedMaxValue]}
                    ticks={mostMentionedTicks}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={145}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${value}`, 'Positive mentions']}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Bar dataKey="Positive" name="Positive mentions" fill={SENTIMENT_COLORS.Positive} radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                3B. Top Criticized Features — {selectedBrand}
              </h3>
              <p className="text-sm text-slate-500">
                Ranked by negative mention count.
              </p>
            </div>

            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={mostMentioned.criticized}
                  layout="vertical"
                  margin={{ top: 8, right: 18, left: 18, bottom: 6 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, mostMentionedMaxValue]}
                    ticks={mostMentionedTicks}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="feature"
                    width={145}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${value}`, 'Negative mentions']}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Bar dataKey="Negative" name="Negative mentions" fill={SENTIMENT_COLORS.Negative} radius={[0, 5, 5, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
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
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700"
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
        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <b>How to read:</b> the selected period is <b>{selectedTrendPeriodLabel}</b>. Mention trend shows
          weekly video count for the selected brand. Sentiment trend shows weekly positive, neutral and
          negative transcript mentions.
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                4A. Weekly Mention Trend
              </h3>
              <p className="text-sm text-slate-500">
                Weekly count of videos where the selected brand is mentioned.
              </p>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyMentionTrend} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />

                  {trendBrand === 'All Brands' ? (
                    mentionLineBrands.map((brand, index) => (
                      <Line
                        key={brand}
                        type="monotone"
                        dataKey={brand}
                        stroke={BRAND_LINE_COLORS[index % BRAND_LINE_COLORS.length]}
                        strokeWidth={2}
                        dot={{ r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    ))
                  ) : (
                    <Line
                      type="monotone"
                      dataKey="mentions"
                      name={`${trendBrand} mentions`}
                      stroke={SENTIMENT_COLORS.Positive}
                      strokeWidth={2}
                      dot={{ r: 3 }}
                      activeDot={{ r: 5 }}
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                4B. Weekly Sentiment Trend
              </h3>
              <p className="text-sm text-slate-500">
                Weekly positive, neutral and negative transcript sentiment mentions.
              </p>
            </div>

            <div className="h-[310px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklySentimentTrend} margin={{ top: 8, right: 20, left: 4, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="week" tick={{ fontSize: 12, fill: '#475569' }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#475569' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Positive" stroke={SENTIMENT_COLORS.Positive} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Neutral" stroke={SENTIMENT_COLORS.Neutral} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="Negative" stroke={SENTIMENT_COLORS.Negative} strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        title="5. Creator Performance Leaderboard"
        subtitle={`Default ranking is by engagement. Click any scoring column to re-rank the leaderboard. Current ranking: ${CREATOR_SORT_LABELS[creatorSortKey]}.`}
      >
        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <b>Ranking criteria included:</b> content frequency, tractor video percentage, Sonalika mention percentage,
          sentiment score and viewer engagement. Sentiment score is calculated from Sonalika sentiment mentions as
          ((positive - negative) / total sentiment mentions) × 100.
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Rank</th>
                <th className="px-3 py-2 text-left font-semibold text-slate-600">Creator</th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Content Frequency" sortKey="content_frequency" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Tractor Video %" sortKey="tractor_video_percentage" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Sonalika Mention %" sortKey="sonalika_mention_percentage" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Sentiment Score" sortKey="sentiment_score" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Engagement" sortKey="engagement" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Eng. Rate %" sortKey="engagement_rate_pct" />
                </th>
                <th className="px-3 py-2 text-right">
                  <SortableHeader label="Overall Score" sortKey="overall_score" />
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 bg-white">
              {creatorPerformance.map((row) => (
                <tr key={row.channelTitle}>
                  <td className="px-3 py-2 text-slate-700">{row.rank}</td>
                  <td className="px-3 py-2 font-medium text-slate-900">
                    {row.channelTitle}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.content_frequency}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.tractor_video_percentage.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.sonalika_mention_percentage.toFixed(1)}%
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.sentiment_score.toFixed(1)}
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-slate-900">
                    {row.engagement.toLocaleString()}
                  </td>
                  <td className="px-3 py-2 text-right text-slate-700">
                    {row.engagement_rate_pct.toFixed(2)}%
                  </td>
                  <td className="px-3 py-2 text-right font-semibold text-blue-700">
                    {row.overall_score.toFixed(1)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </SectionCard>

      <SectionCard
        title="6. Geo-Segmented Insights"
        subtitle="Influencer density, content distribution, regional sentiment variation and channel ranking by city/region."
      >
        <div className="mb-4 rounded-lg bg-slate-50 px-4 py-3 text-sm text-slate-600">
          <b>How to read:</b> content distribution shows where Sonalika-related videos are coming from.
          Influencer density shows how many unique creators are active in each region. Regional sentiment
          shows positive, neutral and negative split by region. The ranking table highlights the top creator
          in each region by engagement.
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                6A. Content Distribution by Region
              </h3>
              <p className="text-sm text-slate-500">
                Number of Sonalika-related videos by State / City.
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={geoCoverage}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 24, bottom: 6 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    ticks={geoContentTicks}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="geo_region"
                    width={145}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${value}`, 'Sonalika videos']}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="sonalika_video_count"
                    name="Sonalika videos"
                    fill={SENTIMENT_COLORS.Positive}
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-slate-900">
                6B. Influencer Density by Region
              </h3>
              <p className="text-sm text-slate-500">
                Unique creators contributing Sonalika-related videos by region.
              </p>
            </div>

            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={geoCoverage}
                  layout="vertical"
                  margin={{ top: 8, right: 20, left: 24, bottom: 6 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    ticks={geoCreatorTicks}
                    allowDecimals={false}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="geo_region"
                    width={145}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={(value: number | string) => [`${value}`, 'Unique creators']}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Bar
                    dataKey="creator_count"
                    name="Unique creators"
                    fill="#14B8A6"
                    radius={[0, 5, 5, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">
              6C. Regional Sentiment Variation
            </h3>
            <p className="text-sm text-slate-500">
              Positive, neutral and negative sentiment split by region.
            </p>
          </div>

          {geoSentimentChartData.length > 0 ? (
            <div className="h-[340px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={geoSentimentChartData}
                  layout="vertical"
                  margin={{ top: 8, right: 24, left: 28, bottom: 8 }}
                  barCategoryGap="24%"
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis
                    type="number"
                    domain={[0, 100]}
                    ticks={[0, 25, 50, 75, 100]}
                    tickFormatter={formatPercentTick}
                    tick={{ fontSize: 12, fill: '#475569' }}
                    axisLine={{ stroke: '#CBD5E1' }}
                    tickLine={false}
                  />
                  <YAxis
                    type="category"
                    dataKey="geo_region"
                    width={145}
                    interval={0}
                    tick={{ fontSize: 12, fill: '#334155' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    formatter={formatTooltipPercent}
                    labelStyle={{ color: '#0F172A', fontWeight: 600 }}
                  />
                  <Legend verticalAlign="bottom" height={32} iconType="square" wrapperStyle={{ fontSize: 13 }} />
                  <Bar dataKey="Positive_pct" name="Positive" stackId="sentiment" fill={SENTIMENT_COLORS.Positive} radius={[4, 0, 0, 4]} />
                  <Bar dataKey="Neutral_pct" name="Neutral" stackId="sentiment" fill={SENTIMENT_COLORS.Neutral} />
                  <Bar dataKey="Negative_pct" name="Negative" stackId="sentiment" fill={SENTIMENT_COLORS.Negative} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
              Regional sentiment is not available for the current CSV rows. This usually means the sentiment
              records do not contain region-mapped Sonalika sentiment mentions.
            </div>
          )}
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">
          <div className="mb-3">
            <h3 className="text-base font-semibold text-slate-900">
              6D. Regional Channel Ranking
            </h3>
            <p className="text-sm text-slate-500">
              Top creator in each region ranked by engagement from Sonalika-related videos.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Region</th>
                  <th className="px-3 py-2 text-left font-semibold text-slate-600">Top Creator</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Creators</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Sonalika Videos</th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-600">Engagement</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100 bg-white">
                {geoCreatorRankings.map((row) => (
                  <tr key={row.geo_region}>
                    <td className="px-3 py-2 font-medium text-slate-900">{row.geo_region}</td>
                    <td className="px-3 py-2 text-slate-700">{row.top_creator}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.creator_count}</td>
                    <td className="px-3 py-2 text-right text-slate-700">{row.sonalika_video_count}</td>
                    <td className="px-3 py-2 text-right font-semibold text-slate-900">
                      {row.engagement.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}