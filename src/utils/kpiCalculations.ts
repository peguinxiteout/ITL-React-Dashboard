import { KpiRow } from '../hooks/useKpiData';

export type SentimentLabel = 'Positive' | 'Neutral' | 'Negative';

export interface SentimentRecord {
  videoKey: string;
  channelTitle: string;
  postedDate: string;
  brand: string;
  feature: string;
  sentiment: SentimentLabel;
  sentence: string;
  geoState: string;
  geoCity: string;
}

export interface SentimentSummaryRow {
  brand?: string;
  feature?: string;
  geo_region?: string;
  week?: string;
  Positive: number;
  Neutral: number;
  Negative: number;
  total_mentions: number;
  Positive_pct: number;
  Neutral_pct: number;
  Negative_pct: number;
}

export interface FeatureMentionRow {
  feature: string;
  Positive?: number;
  Negative?: number;
  total_mentions: number;
}

export interface CreatorPerformanceRow {
  rank: number;
  channelTitle: string;

  tractor_video_count: number;
  sonalika_video_count: number;
  content_frequency: number;

  tractor_video_percentage: number;
  sonalika_mention_percentage: number;

  Positive: number;
  Neutral: number;
  Negative: number;
  total_sentiment_mentions: number;
  sentiment_score: number;

  views: number;
  likes: number;
  comments: number;
  engagement: number;
  engagement_rate_pct: number;

  overall_score: number;
}

export interface GeoCoverageRow {
  geo_region: string;
  sonalika_video_count: number;
  creator_count: number;
  content_distribution_pct: number;
  views: number;
  likes: number;
  comments: number;
  engagement: number;
}

export interface GeoCreatorRankingRow {
  geo_region: string;
  top_creator: string;
  creator_count: number;
  sonalika_video_count: number;
  engagement: number;
}

export interface CompetitorMentionRow {
  competitor: string;
  mention_count: number;
}

export interface DateRangeSummary {
  minDate: string;
  maxDate: string;
}

export interface WeeklyMentionTrendRow {
  week: string;
  mentions?: number;
  [brand: string]: string | number | undefined;
}

const COMPETITOR_BRANDS = [
  'Mahindra',
  'Swaraj',
  'John Deere',
  'New Holland',
  'Massey Ferguson',
  'Escorts Kubota',
  'Solis',
  'Yanmar',
];

const FEATURE_KEYWORD_MAP: Record<string, string[]> = {
  'Engine Performance': [
    'engine',
    'hp',
    'horsepower',
    'torque',
    'rpm',
    'cc',
    'cylinder',
    'power',
    'backup torque',
    'cooling',
    'overheat',
  ],
  'Fuel Efficiency': ['fuel', 'mileage', 'diesel', 'average', 'consumption'],
  Hydraulics: ['hydraulic', 'lifting', 'lift', 'ad/dc', 'addc', 'dcv', 'capacity'],
  PTO: ['pto', 'power take', 'reverse pto'],
  Transmission: [
    'transmission',
    'gear',
    'gearbox',
    'clutch',
    'speed',
    'creeper',
    'constant mesh',
    'shifting',
  ],
  'Operator Comfort': [
    'comfort',
    'seat',
    'steering',
    'dashboard',
    'platform',
    'driver',
    'suspension',
    'console',
  ],
  'Build Quality': [
    'build',
    'quality',
    'look',
    'design',
    'bonnet',
    'hood',
    'body',
    'bumper',
    'axle',
    'tire',
    'tyre',
    'ground clearance',
    'fender',
    'metal',
    'front',
    'finish',
    'premium',
    'strong',
    'heavy duty',
  ],
  'After-sales Service': ['service', 'warranty', 'dealer', 'workshop', 'support'],
  Price: ['price', 'cost', 'loan', 'finance', 'emi', 'on road', 'lakh'],
};

function toNumber(value: string | undefined): number {
  const parsed = Number(value || 0);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeBrandName(value: unknown): string {
  const text = String(value || '').trim();

  if (!text || ['none', 'nan', 'null', 'not detected', 'unknown'].includes(text.toLowerCase())) {
    return '';
  }

  const key = text.toLowerCase().replace(/\s+/g, ' ');

  const mapping: Record<string, string> = {
    mahindra: 'Mahindra',
    sonalika: 'Sonalika',
    sonalica: 'Sonalika',
    solis: 'Solis',
    yanmar: 'Yanmar',
    'john deere': 'John Deere',
    johndeere: 'John Deere',
    'new holland': 'New Holland',
    'massey ferguson': 'Massey Ferguson',
    swaraj: 'Swaraj',
    'escorts kubota': 'Escorts Kubota',
    kubota: 'Escorts Kubota',
    digitrac: 'Digitrac',
    force: 'Force',
    preet: 'Preet',
    'indo farm': 'Indo Farm',
  };

  return mapping[key] || text;
}

function normalizeBrandList(value: string | undefined): string[] {
  if (!value) return [];

  return value
    .split(',')
    .map((item) => normalizeBrandName(item))
    .filter(Boolean);
}

function normalizeSentiment(value: unknown): SentimentLabel {
  const text = String(value || '').trim().toLowerCase();

  if (text.startsWith('pos')) return 'Positive';
  if (text.startsWith('neg')) return 'Negative';
  return 'Neutral';
}

function canonicalFeature(value: unknown): string {
  const raw = String(value || '').trim();

  if (!raw) return 'Other';

  const text = raw.toLowerCase();

  for (const [feature, keywords] of Object.entries(FEATURE_KEYWORD_MAP)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return feature;
    }
  }

  return raw
    .slice(0, 80)
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function videoKey(row: KpiRow): string {
  return row.source_id || row.link || row.filename || Math.random().toString();
}

function safeParseSentiments(value: string | undefined): any[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function parseDate(value: string | undefined): Date | null {
  if (!value) return null;

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return null;

  return date;
}

function toInputDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function isDateWithinRange(value: string | undefined, startDate?: string, endDate?: string): boolean {
  const date = parseDate(value);

  if (!date) return false;

  if (startDate) {
    const start = new Date(`${startDate}T00:00:00`);
    if (date < start) return false;
  }

  if (endDate) {
    const end = new Date(`${endDate}T23:59:59`);
    if (date > end) return false;
  }

  return true;
}

function getWeekStart(date: Date): Date {
  const output = new Date(date);
  const day = output.getDay();
  const diff = output.getDate() - day + (day === 0 ? -6 : 1);

  output.setDate(diff);
  output.setHours(0, 0, 0, 0);

  return output;
}

function formatWeekLabel(date: Date): string {
  const weekStart = getWeekStart(date);
  const day = weekStart.getDate();
  const month = weekStart.toLocaleString('en-US', { month: 'short' });
  const year = weekStart.getFullYear();

  return `${day} ${month} ${year}`;
}

function sortByWeekLabel(a: string, b: string): number {
  return new Date(a).getTime() - new Date(b).getTime();
}

function formatGeoRegion(row: KpiRow | SentimentRecord): string {
  const state = 'geoState' in row ? row.geoState : row.geo_state;
  const city = 'geoCity' in row ? row.geoCity : row.geo_city;

  const cleanState = String(state || '').trim();
  const cleanCity = String(city || '').trim();

  if (!cleanState && !cleanCity) return '';

  if (cleanState && cleanCity) {
    return `${cleanState} (${cleanCity})`;
  }

  return cleanState || cleanCity;
}

function rowSearchableText(row: KpiRow): string {
  return [
    row.title,
    row.filename,
    row.page_content,
    row.company_brand_info,
    row.sentiments,
    row.detected_brands_from_transcript,
  ]
    .join(' ')
    .toLowerCase();
}

function rowMentionsBrand(row: KpiRow, brand: string): boolean {
  const normalizedBrand = normalizeBrandName(brand);
  const normalizedBrandLower = normalizedBrand.toLowerCase();

  const detectedBrands = normalizeBrandList(row.detected_brands_from_transcript)
    .map((item) => item.toLowerCase());

  if (detectedBrands.includes(normalizedBrandLower)) return true;

  const searchableText = rowSearchableText(row);

  if (normalizedBrandLower === 'sonalika') {
    return (
      searchableText.includes('sonalika') ||
      searchableText.includes('sonalica') ||
      searchableText.includes('सोनालिका') ||
      searchableText.includes('सोनालीका')
    );
  }

  return searchableText.includes(normalizedBrandLower);
}

function rowMentionsSonalika(row: KpiRow): boolean {
  return rowMentionsBrand(row, 'Sonalika');
}

export function getVideoLevelRows(rows: KpiRow[]): KpiRow[] {
  const seen = new Set<string>();
  const output: KpiRow[] = [];

  rows.forEach((row) => {
    const key = videoKey(row);

    if (!seen.has(key)) {
      seen.add(key);
      output.push(row);
    }
  });

  return output;
}

export function getSentimentRecords(rows: KpiRow[]): SentimentRecord[] {
  const records: SentimentRecord[] = [];

  rows.forEach((row) => {
    const parsed = safeParseSentiments(row.sentiments);
    const key = videoKey(row);

    parsed.forEach((item) => {
      const itemBrand = normalizeBrandName(item.Company || item.Brand);
      const fallbackBrand = normalizeBrandList(row.detected_brands_from_transcript)[0] || 'Unknown';
      const brand = itemBrand || fallbackBrand;

      records.push({
        videoKey: key,
        channelTitle: row.channelTitle || 'Unknown Creator',
        postedDate: row.posted_date || '',
        brand,
        feature: canonicalFeature(item.Label || item.feature || item.Feature),
        sentiment: normalizeSentiment(item.Opinion || item.sentiment),
        sentence: String(item.Sentence || item.sentence || '').trim(),
        geoState: row.geo_state || '',
        geoCity: row.geo_city || '',
      });
    });
  });

  const seen = new Set<string>();

  return records.filter((record) => {
    const dedupKey = [
      record.videoKey,
      record.brand,
      record.feature,
      record.sentiment,
      record.sentence,
    ].join('|');

    if (seen.has(dedupKey)) return false;

    seen.add(dedupKey);
    return true;
  });
}

function buildSentimentSummary<T extends 'brand' | 'feature' | 'geo_region' | 'week'>(
  records: SentimentRecord[],
  groupKey: T,
  getKeyValue: (record: SentimentRecord) => string
): SentimentSummaryRow[] {
  const grouped = new Map<string, SentimentSummaryRow>();

  records.forEach((record) => {
    const keyValue = getKeyValue(record);

    if (!keyValue) return;

    if (!grouped.has(keyValue)) {
      grouped.set(keyValue, {
        [groupKey]: keyValue,
        Positive: 0,
        Neutral: 0,
        Negative: 0,
        total_mentions: 0,
        Positive_pct: 0,
        Neutral_pct: 0,
        Negative_pct: 0,
      } as SentimentSummaryRow);
    }

    const item = grouped.get(keyValue)!;
    item[record.sentiment] += 1;
    item.total_mentions += 1;
  });

  return Array.from(grouped.values())
    .map((item) => {
      item.Positive_pct =
        item.total_mentions > 0
          ? Number(((item.Positive / item.total_mentions) * 100).toFixed(2))
          : 0;

      item.Neutral_pct =
        item.total_mentions > 0
          ? Number(((item.Neutral / item.total_mentions) * 100).toFixed(2))
          : 0;

      item.Negative_pct =
        item.total_mentions > 0
          ? Number(((item.Negative / item.total_mentions) * 100).toFixed(2))
          : 0;

      return item;
    })
    .sort((a, b) => b.total_mentions - a.total_mentions);
}

export function getAvailableBrands(rows: KpiRow[]): string[] {
  const brands = new Set<string>();

  getSentimentRecords(rows).forEach((record) => {
    const brand = normalizeBrandName(record.brand);
    if (brand && brand.toLowerCase() !== 'unknown') {
      brands.add(brand);
    }
  });

  rows.forEach((row) => {
    normalizeBrandList(row.detected_brands_from_transcript).forEach((brand) => {
      if (brand && brand.toLowerCase() !== 'unknown') {
        brands.add(brand);
      }
    });
  });

  return Array.from(brands).sort();
}

export function getAvailableDateRange(rows: KpiRow[]): DateRangeSummary {
  const dates = getVideoLevelRows(rows)
    .map((row) => parseDate(row.posted_date))
    .filter((date): date is Date => Boolean(date))
    .sort((a, b) => a.getTime() - b.getTime());

  if (!dates.length) {
    const today = toInputDate(new Date());
    return {
      minDate: today,
      maxDate: today,
    };
  }

  return {
    minDate: toInputDate(dates[0]),
    maxDate: toInputDate(dates[dates.length - 1]),
  };
}

export function calculateBrandLevelSentiment(rows: KpiRow[]): SentimentSummaryRow[] {
  const records = getSentimentRecords(rows).filter(
    (record) => record.brand && record.brand.toLowerCase() !== 'unknown'
  );

  return buildSentimentSummary(records, 'brand', (record) => record.brand);
}

export function calculateFeatureLevelSentiment(
  rows: KpiRow[],
  brandFilter: string
): SentimentSummaryRow[] {
  let records = getSentimentRecords(rows).filter(
    (record) => record.feature && record.feature !== 'Overall'
  );

  if (brandFilter && brandFilter !== 'All Brands') {
    records = records.filter(
      (record) => record.brand.toLowerCase() === brandFilter.toLowerCase()
    );
  }

  return buildSentimentSummary(records, 'feature', (record) => record.feature);
}

export function calculateMostMentionedFeatures(
  rows: KpiRow[],
  brandFilter: string,
  topN = 5
): {
  praised: FeatureMentionRow[];
  criticized: FeatureMentionRow[];
} {
  const featureData = calculateFeatureLevelSentiment(rows, brandFilter);

  const praised = featureData
    .filter((item) => item.Positive > 0)
    .sort((a, b) => b.Positive - a.Positive)
    .slice(0, topN)
    .map((item) => ({
      feature: item.feature || '',
      Positive: item.Positive,
      total_mentions: item.total_mentions,
    }));

  const criticized = featureData
    .filter((item) => item.Negative > 0)
    .sort((a, b) => b.Negative - a.Negative)
    .slice(0, topN)
    .map((item) => ({
      feature: item.feature || '',
      Negative: item.Negative,
      total_mentions: item.total_mentions,
    }));

  return {
    praised,
    criticized,
  };
}

export function calculateWeeklyMentionTrend(
  rows: KpiRow[],
  brandFilter: string,
  startDate?: string,
  endDate?: string,
  allBrands: string[] = []
): WeeklyMentionTrendRow[] {
  const videoRows = getVideoLevelRows(rows).filter((row) =>
    isDateWithinRange(row.posted_date, startDate, endDate)
  );

  const grouped = new Map<string, WeeklyMentionTrendRow>();

  videoRows.forEach((row) => {
    const date = parseDate(row.posted_date);
    if (!date) return;

    const week = formatWeekLabel(date);

    if (!grouped.has(week)) {
      grouped.set(week, {
        week,
        mentions: 0,
      });
    }

    const current = grouped.get(week)!;

    if (brandFilter === 'All Brands') {
      allBrands.forEach((brand) => {
        if (!brand || brand === 'All Brands') return;

        if (rowMentionsBrand(row, brand)) {
          current[brand] = Number(current[brand] || 0) + 1;
        }
      });
    } else if (rowMentionsBrand(row, brandFilter)) {
      current.mentions = Number(current.mentions || 0) + 1;
    }
  });

  return Array.from(grouped.values()).sort((a, b) =>
    sortByWeekLabel(a.week, b.week)
  );
}

export function calculateWeeklySentimentTrend(
  rows: KpiRow[],
  brandFilter: string,
  startDate?: string,
  endDate?: string
): SentimentSummaryRow[] {
  let records = getSentimentRecords(rows).filter((record) =>
    isDateWithinRange(record.postedDate, startDate, endDate)
  );

  if (brandFilter && brandFilter !== 'All Brands') {
    records = records.filter(
      (record) => record.brand.toLowerCase() === brandFilter.toLowerCase()
    );
  }

  return buildSentimentSummary(records, 'week', (record) => {
    const date = parseDate(record.postedDate);
    if (!date) return '';

    return formatWeekLabel(date);
  }).sort((a, b) => sortByWeekLabel(a.week || '', b.week || ''));
}

export function calculateCreatorPerformance(rows: KpiRow[]): CreatorPerformanceRow[] {
  const videoRows = getVideoLevelRows(rows);
  const sentimentRecords = getSentimentRecords(rows);
  const grouped = new Map<string, CreatorPerformanceRow>();

  videoRows.forEach((row) => {
    const creator = row.channelTitle || 'Unknown Creator';

    if (!grouped.has(creator)) {
      grouped.set(creator, {
        rank: 0,
        channelTitle: creator,

        tractor_video_count: 0,
        sonalika_video_count: 0,
        content_frequency: 0,

        tractor_video_percentage: 0,
        sonalika_mention_percentage: 0,

        Positive: 0,
        Neutral: 0,
        Negative: 0,
        total_sentiment_mentions: 0,
        sentiment_score: 0,

        views: 0,
        likes: 0,
        comments: 0,
        engagement: 0,
        engagement_rate_pct: 0,

        overall_score: 0,
      });
    }

    const item = grouped.get(creator)!;

    const views = toNumber(row.views);
    const likes = toNumber(row.likeCount);
    const comments = toNumber(row.comment_count);

    item.tractor_video_count += 1;
    item.content_frequency += 1;

    if (rowMentionsSonalika(row)) {
      item.sonalika_video_count += 1;
    }

    item.views += views;
    item.likes += likes;
    item.comments += comments;
    item.engagement += views + likes + comments;
  });

  sentimentRecords.forEach((record) => {
    if (record.brand.toLowerCase() !== 'sonalika') return;

    const creator = record.channelTitle || 'Unknown Creator';

    if (!grouped.has(creator)) return;

    const item = grouped.get(creator)!;

    item[record.sentiment] += 1;
    item.total_sentiment_mentions += 1;
  });

  const allRows = Array.from(grouped.values()).map((item) => {
    item.tractor_video_percentage = item.tractor_video_count > 0 ? 100 : 0;

    item.sonalika_mention_percentage =
      item.tractor_video_count > 0
        ? Number(((item.sonalika_video_count / item.tractor_video_count) * 100).toFixed(2))
        : 0;

    item.engagement_rate_pct =
      item.views > 0
        ? Number((((item.likes + item.comments) / item.views) * 100).toFixed(2))
        : 0;

    item.sentiment_score =
      item.total_sentiment_mentions > 0
        ? Number(
            (((item.Positive - item.Negative) / item.total_sentiment_mentions) * 100).toFixed(2)
          )
        : 0;

    return item;
  });

  const maxEngagement = Math.max(1, ...allRows.map((item) => item.engagement));
  const maxFrequency = Math.max(1, ...allRows.map((item) => item.content_frequency));

  return allRows
    .map((item) => {
      const engagementScore = (item.engagement / maxEngagement) * 40;
      const frequencyScore = (item.content_frequency / maxFrequency) * 20;
      const sonalikaScore = (item.sonalika_mention_percentage / 100) * 20;
      const sentimentScore = ((item.sentiment_score + 100) / 200) * 20;

      return {
        ...item,
        overall_score: Number(
          (engagementScore + frequencyScore + sonalikaScore + sentimentScore).toFixed(2)
        ),
      };
    })
    .sort((a, b) => b.engagement - a.engagement)
    .map((item, index) => ({
      ...item,
      rank: index + 1,
    }));
}

export function calculateGeoCoverage(rows: KpiRow[]): GeoCoverageRow[] {
  const videoRows = getVideoLevelRows(rows).filter(rowMentionsSonalika);
  const grouped = new Map<string, GeoCoverageRow>();
  const creatorsByRegion = new Map<string, Set<string>>();

  videoRows.forEach((row) => {
    const region = formatGeoRegion(row);

    if (!region) return;

    if (!grouped.has(region)) {
      grouped.set(region, {
        geo_region: region,
        sonalika_video_count: 0,
        creator_count: 0,
        content_distribution_pct: 0,
        views: 0,
        likes: 0,
        comments: 0,
        engagement: 0,
      });
    }

    if (!creatorsByRegion.has(region)) {
      creatorsByRegion.set(region, new Set<string>());
    }

    const item = grouped.get(region)!;
    const views = toNumber(row.views);
    const likes = toNumber(row.likeCount);
    const comments = toNumber(row.comment_count);

    item.sonalika_video_count += 1;
    item.views += views;
    item.likes += likes;
    item.comments += comments;
    item.engagement += views + likes + comments;

    creatorsByRegion.get(region)!.add(row.channelTitle || 'Unknown Creator');
  });

  const totalRegionalVideos = Array.from(grouped.values()).reduce(
    (sum, item) => sum + item.sonalika_video_count,
    0
  );

  return Array.from(grouped.values())
    .map((item) => ({
      ...item,
      creator_count: creatorsByRegion.get(item.geo_region)?.size || 0,
      content_distribution_pct:
        totalRegionalVideos > 0
          ? Number(((item.sonalika_video_count / totalRegionalVideos) * 100).toFixed(2))
          : 0,
    }))
    .sort((a, b) => b.sonalika_video_count - a.sonalika_video_count);
}

export function calculateGeoSentiment(rows: KpiRow[]): SentimentSummaryRow[] {
  const sonalikaVideoKeys = new Set(
    getVideoLevelRows(rows)
      .filter(rowMentionsSonalika)
      .map((row) => videoKey(row))
  );

  const records = getSentimentRecords(rows).filter((record) => {
    const region = formatGeoRegion(record);

    if (!region) return false;

    const isSonalikaBrand = record.brand.toLowerCase() === 'sonalika';
    const isFromSonalikaVideo = sonalikaVideoKeys.has(record.videoKey);

    return isSonalikaBrand || isFromSonalikaVideo;
  });

  return buildSentimentSummary(records, 'geo_region', (record) =>
    formatGeoRegion(record)
  );
}

export function calculateGeoCreatorRankings(rows: KpiRow[]): GeoCreatorRankingRow[] {
  const videoRows = getVideoLevelRows(rows).filter(rowMentionsSonalika);

  const regionCreatorMap = new Map<
    string,
    Map<string, { video_count: number; engagement: number }>
  >();

  videoRows.forEach((row) => {
    const region = formatGeoRegion(row);
    const creator = row.channelTitle || 'Unknown Creator';

    if (!region) return;

    if (!regionCreatorMap.has(region)) {
      regionCreatorMap.set(region, new Map());
    }

    const creatorMap = regionCreatorMap.get(region)!;

    if (!creatorMap.has(creator)) {
      creatorMap.set(creator, {
        video_count: 0,
        engagement: 0,
      });
    }

    const creatorItem = creatorMap.get(creator)!;
    const views = toNumber(row.views);
    const likes = toNumber(row.likeCount);
    const comments = toNumber(row.comment_count);

    creatorItem.video_count += 1;
    creatorItem.engagement += views + likes + comments;
  });

  return Array.from(regionCreatorMap.entries())
    .map(([region, creatorMap]) => {
      const creators = Array.from(creatorMap.entries()).sort((a, b) => {
        const engagementDiff = b[1].engagement - a[1].engagement;

        if (engagementDiff !== 0) return engagementDiff;

        return b[1].video_count - a[1].video_count;
      });

      const topCreator = creators[0];

      return {
        geo_region: region,
        top_creator: topCreator?.[0] || 'Unknown Creator',
        creator_count: creators.length,
        sonalika_video_count: creators.reduce(
          (sum, [, item]) => sum + item.video_count,
          0
        ),
        engagement: creators.reduce((sum, [, item]) => sum + item.engagement, 0),
      };
    })
    .sort((a, b) => b.sonalika_video_count - a.sonalika_video_count);
}


export interface VoiceInfluencerKpiCards {
  videos_analyzed: number;
  brands_detected: number;
  date_range: string;
}

function formatMonthYear(value: string): string {
  const date = parseDate(value);

  if (!date) return 'Not available';

  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  return `${month} ${year}`;
}

export function calculateVoiceInfluencerKpiCards(rows: KpiRow[]): VoiceInfluencerKpiCards {
  const videoRows = getVideoLevelRows(rows);
  const brands = getAvailableBrands(rows);
  const availableDateRange = getAvailableDateRange(rows);

  const dateRange =
    availableDateRange.minDate && availableDateRange.maxDate
      ? `${formatMonthYear(availableDateRange.minDate)} – ${formatMonthYear(availableDateRange.maxDate)}`
      : 'Not available';

  return {
    videos_analyzed: videoRows.length,
    brands_detected: brands.length,
    date_range: dateRange,
  };
}

export function calculateCompetitorMentionsInSonalikaVideos(
  rows: KpiRow[]
): CompetitorMentionRow[] {
  const videoRows = getVideoLevelRows(rows).filter(rowMentionsSonalika);

  const results = COMPETITOR_BRANDS.map((competitor) => ({
    competitor,
    mention_count: 0,
  }));

  videoRows.forEach((row) => {
    const text = rowSearchableText(row);

    results.forEach((item) => {
      if (text.includes(item.competitor.toLowerCase())) {
        item.mention_count += 1;
      }
    });
  });

  return results
    .filter((item) => item.mention_count > 0)
    .sort((a, b) => b.mention_count - a.mention_count);
}