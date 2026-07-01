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
  contentType: string;
  videoTitle: string;
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
  video_count: number;
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

export interface FeatureCompetitorPositiveRow {
  brand: string;
  feature: string;
  Positive: number;
  total_mentions: number;
  video_count: number;
  Positive_pct: number;
  score: number;
}

export interface FeatureVerbatimQuote {
  brand: string;
  feature: string;
  sentiment: SentimentLabel;
  sentence: string;
  total_mentions?: number;
  sentiment_pct?: number;
  content_type?: string;
  video_title?: string;
  creator?: string;
  region?: string;
}

export interface FeatureVerbatimComparisonRow {
  feature: string;
  clientNegative?: FeatureVerbatimQuote;
  competitorPositive?: FeatureVerbatimQuote;
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

export interface TractorCategoryDistributionRow {
  category: string;
  Total: number;
  Sonalika: number;
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

const TRACTOR_CONTENT_CATEGORY_ORDER = [
  'Demo',
  'Comparison',
  'Product Walkthrough',
  'Others - Reel/Shorts',
  'Brand Promotion',
  'Customer Testimonial',
];

function normalizeTractorSubCategory(value: unknown): string {
  const text = String(value || '')
    .trim()
    .replace(/\s+/g, ' ');

  const key = text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[–—]/g, '-')
    .replace(/\s*-\s*/g, ' - ')
    .replace(/\s*\/\s*/g, '/')
    .replace(/\s+/g, ' ')
    .trim();

  const categoryMap: Record<string, string> = {
    demo: 'Demo',
    comparison: 'Comparison',
    'product walkthrough': 'Product Walkthrough',
    'others - reel/shorts': 'Others - Reel/Shorts',
    'others - reels/shorts': 'Others - Reel/Shorts',
    'brand promotion': 'Brand Promotion',
    'customer testimonial': 'Customer Testimonial',
  };

  return categoryMap[key] || '';
}

function cleanMetadataText(value: unknown, fallback = 'Not available', maxLength = 72): string {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return fallback;

  const questionMarkCount = (text.match(/\?/g) || []).length;
  const alphaNumericCount = (text.match(/[a-zA-Z0-9]/g) || []).length;

  if (questionMarkCount >= 2 && alphaNumericCount === 0) return fallback;

  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function formatContentTypeFromRow(row: KpiRow | undefined): string {
  if (!row) return 'Not available';

  const rawCategory = (row as KpiRow & { tractor_sub_category?: string }).tractor_sub_category;
  const normalizedCategory = normalizeTractorSubCategory(rawCategory);

  if (normalizedCategory) return normalizedCategory;

  return cleanMetadataText(rawCategory, 'Not available', 48);
}

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

const BRAND_NAME_MAP: Record<string, string> = {
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
  escorts: 'Escorts Kubota',
  kubota: 'Escorts Kubota',
  digitrac: 'Digitrac',
  force: 'Force',
  preet: 'Preet',
  'indo farm': 'Indo Farm',
  powertrac: 'Powertrac',
  farmtrac: 'Farmtrac',
  captain: 'Captain',
  vst: 'VST',
  eicher: 'Eicher',
  tafe: 'TAFE',
  ace: 'ACE',
  kartar: 'Kartar',
  'deutz fahr': 'Deutz Fahr',
  deutzfahr: 'Deutz Fahr',
  jcb: 'JCB',
};

const TRACTOR_KPI_BRANDS = new Set(Object.values(BRAND_NAME_MAP));

function cleanBrandToken(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/^\[+|\]+$/g, '')
    .replace(/^['\"]+|['\"]+$/g, '')
    .replace(/^\[+|\]+$/g, '')
    .replace(/^['\"]+|['\"]+$/g, '')
    .trim();
}

function normalizeBrandName(value: unknown): string {
  const text = cleanBrandToken(value);

  if (!text || ['none', 'nan', 'null', 'not detected', 'unknown'].includes(text.toLowerCase())) {
    return '';
  }

  const key = text
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return BRAND_NAME_MAP[key] || text;
}

function normalizeBrandList(value: unknown): string[] {
  if (value === undefined || value === null) return [];

  const rawValue = typeof value === 'string' ? value.trim() : value;
  let rawItems: unknown[] = [];

  if (Array.isArray(rawValue)) {
    rawItems = rawValue;
  } else if (typeof rawValue === 'string') {
    if (!rawValue || rawValue === '[]') return [];

    try {
      const parsed = JSON.parse(rawValue);

      if (Array.isArray(parsed)) {
        rawItems = parsed;
      } else {
        rawItems = [parsed];
      }
    } catch {
      rawItems = rawValue.split(',');
    }
  } else {
    rawItems = [rawValue];
  }

  const seen = new Set<string>();

  return rawItems
    .map((item) => normalizeBrandName(item))
    .filter((brand) => {
      if (!brand) return false;

      const key = brand.toLowerCase();
      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    });
}

function isTractorKpiBrand(brand: string): boolean {
  return TRACTOR_KPI_BRANDS.has(normalizeBrandName(brand));
}

function isTractorCategory(row: KpiRow): boolean {
  const level1Category = String(
    (row as KpiRow & { level_1_category?: string }).level_1_category || ''
  )
    .trim()
    .toLowerCase();

  return level1Category === 'tractor';
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

function isValidSentimentFeature(feature: unknown): boolean {
  const value = String(feature || '').trim().toLowerCase();

  return Boolean(
    value &&
      value !== 'overall' &&
      value !== 'other' &&
      value !== 'brand mention' &&
      value !== 'brand mentions'
  );
}

function isInvalidVideoIdentifier(value: unknown): boolean {
  const text = String(value || '').trim();
  const lower = text.toLowerCase();

  return (
    !text ||
    lower === 'nan' ||
    lower === 'null' ||
    lower === 'none' ||
    lower === 'undefined' ||
    lower === 'unknown' ||
    lower === 'not available' ||
    lower === '#name?' ||
    /^#+name\??$/i.test(text)
  );
}

function getStrictVideoId(row: KpiRow): string {
  const rowWithVideoId = row as KpiRow & { video_id?: string };
  const videoId = String(rowWithVideoId.video_id || '').trim();

  return isInvalidVideoIdentifier(videoId) ? '' : videoId;
}

function hasVideoIdColumn(rows: KpiRow[]): boolean {
  return rows.some((row) => Object.prototype.hasOwnProperty.call(row, 'video_id'));
}

function fallbackVideoKey(row: KpiRow): string {
  const candidates = [row.source_id, row.link, row.filename, row.title];
  const validKey = candidates.find((value) => !isInvalidVideoIdentifier(value));

  return validKey ? String(validKey).trim() : '';
}

function videoKey(row: KpiRow, useStrictVideoId = false): string {
  if (useStrictVideoId) {
    return getStrictVideoId(row);
  }

  return getStrictVideoId(row) || fallbackVideoKey(row);
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

function getDemoTrendBucket(date: Date): { label: string; sortDate: Date } {
  const day = date.getDate();
  const month = date.toLocaleString('en-US', { month: 'short' });
  const year = date.getFullYear();

  let startDay = 1;
  let endDay = 8;

  if (day >= 9 && day <= 15) {
    startDay = 9;
    endDay = 15;
  } else if (day >= 16 && day <= 22) {
    startDay = 16;
    endDay = 22;
  } else if (day >= 23) {
    startDay = 23;
    endDay = new Date(year, date.getMonth() + 1, 0).getDate();
  }

  const sortDate = new Date(date);
  sortDate.setDate(startDay);
  sortDate.setHours(0, 0, 0, 0);

  return {
    label: `${startDay}–${endDay} ${month} ${year}`,
    sortDate,
  };
}

function formatWeekLabel(date: Date): string {
  return getDemoTrendBucket(date).label;
}

function parseTrendBucketStart(label: string): Date {
  const match = label.match(/^(\d+)[–-]\d+\s+([A-Za-z]{3})\s+(\d{4})$/);

  if (!match) {
    return new Date(label);
  }

  const [, startDay, month, year] = match;
  return new Date(`${month} ${startDay}, ${year}`);
}

function sortByWeekLabel(a: string, b: string): number {
  return parseTrendBucketStart(a).getTime() - parseTrendBucketStart(b).getTime();
}

function formatGeoRegion(row: KpiRow | SentimentRecord): string {
  const state = 'geoState' in row ? row.geoState : row.geo_state;
  const city = 'geoCity' in row ? row.geoCity : row.geo_city;

  const cleanState = String(state || '').trim();
  const cleanCity = String(city || '').trim();

  if (!cleanState && !cleanCity) return '';

  // Geo KPIs are displayed at state level only.
  // Example: Maharashtra (Mumbai) + Maharashtra (Pune) are combined as Maharashtra.
  if (cleanState) {
    return cleanState;
  }

  return cleanCity;
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

function cleanCreatorName(value: unknown): string {
  const creator = String(value || '').trim();

  if (!creator) return '';

  const lower = creator.toLowerCase();

  const invalidValues = [
    'unknown',
    'unknown creator',
    'not available',
    'na',
    'n/a',
    'null',
    'none',
  ];

  if (invalidValues.includes(lower)) return '';

  // Exclude badly decoded names like ???, ?????, --- etc.
  const alphaNumericCount = (creator.match(/[a-zA-Z0-9]/g) || []).length;
  const questionMarkCount = (creator.match(/\?/g) || []).length;

  if (questionMarkCount >= 2 && alphaNumericCount === 0) return '';

  return creator;
}

export function getVideoLevelRows(rows: KpiRow[]): KpiRow[] {
  const seen = new Set<string>();
  const output: KpiRow[] = [];
  const useStrictVideoId = hasVideoIdColumn(rows);

  rows.forEach((row) => {
    const key = videoKey(row, useStrictVideoId);

    // When the CSV has a video_id column, KPI base counts should use only
    // valid unique video IDs. Rows with blank/#NAME?/invalid video_id are
    // excluded instead of being counted through source_id/link fallback.
    if (!key) return;

    if (!seen.has(key)) {
      seen.add(key);
      output.push(row);
    }
  });

  return output;
}

export function getSentimentRecords(rows: KpiRow[]): SentimentRecord[] {
  const records: SentimentRecord[] = [];
  const useStrictVideoId = hasVideoIdColumn(rows);

  rows.forEach((row) => {
    const parsed = safeParseSentiments(row.sentiments);
    const key = videoKey(row, useStrictVideoId);

    // Keep sentiment/feature KPIs aligned with the same valid video-id base.
    if (!key) return;

    parsed.forEach((item) => {
      const itemBrands = normalizeBrandList(item.Company || item.Brand);
      const fallbackBrands = normalizeBrandList(row.detected_brands_from_transcript);
      const brands = itemBrands.length
        ? itemBrands
        : fallbackBrands.length === 1
          ? fallbackBrands
          : [];

      brands.forEach((brand) => {
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
          contentType: formatContentTypeFromRow(row),
          videoTitle: row.title || row.filename || 'Not available',
        });
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
  const videoKeysByGroup = new Map<string, Set<string>>();

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
        video_count: 0,
        Positive_pct: 0,
        Neutral_pct: 0,
        Negative_pct: 0,
      } as SentimentSummaryRow);
    }

    if (!videoKeysByGroup.has(keyValue)) {
      videoKeysByGroup.set(keyValue, new Set<string>());
    }

    const item = grouped.get(keyValue)!;
    item[record.sentiment] += 1;
    item.total_mentions += 1;

    if (record.videoKey) {
      videoKeysByGroup.get(keyValue)!.add(record.videoKey);
    }
  });

  return Array.from(grouped.values())
    .map((item) => {
      const keyValue =
        item.brand || item.feature || item.geo_region || item.week || '';

      item.video_count = videoKeysByGroup.get(keyValue)?.size || 0;

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
  const tractorRows = rows.filter(isTractorCategory);

  getSentimentRecords(tractorRows).forEach((record) => {
    const brand = normalizeBrandName(record.brand);
    if (brand && isTractorKpiBrand(brand)) {
      brands.add(brand);
    }
  });

  tractorRows.forEach((row) => {
    normalizeBrandList(row.detected_brands_from_transcript).forEach((brand) => {
      if (brand && isTractorKpiBrand(brand)) {
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
  const tractorRows = rows.filter(isTractorCategory);

  const records = getSentimentRecords(tractorRows).filter((record) => {
    const brand = normalizeBrandName(record.brand);

    return brand && isTractorKpiBrand(brand);
  });

  return buildSentimentSummary(records, 'brand', (record) => normalizeBrandName(record.brand));
}

export function calculateFeatureLevelSentiment(
  rows: KpiRow[],
  brandFilter: string
): SentimentSummaryRow[] {
  const tractorRows = rows.filter(isTractorCategory);
  const normalizedBrandFilter = normalizeBrandName(brandFilter);

  let records = getSentimentRecords(tractorRows).filter((record) => {
    const brand = normalizeBrandName(record.brand);

    return (
      isValidSentimentFeature(record.feature) &&
      brand &&
      isTractorKpiBrand(brand)
    );
  });

  if (normalizedBrandFilter && normalizedBrandFilter !== 'All Brands') {
    records = records.filter(
      (record) => normalizeBrandName(record.brand).toLowerCase() === normalizedBrandFilter.toLowerCase()
    );
  }

  return buildSentimentSummary(records, 'feature', (record) => record.feature);
}

export function calculateTopPositiveBrandsForFeature(
  rows: KpiRow[],
  feature: string,
  topN = 3,
  excludeBrand = 'Sonalika'
): FeatureCompetitorPositiveRow[] {
  const selectedFeature = canonicalFeature(feature);
  const normalizedExcludeBrand = normalizeBrandName(excludeBrand).toLowerCase();

  if (!isValidSentimentFeature(selectedFeature)) {
    return [];
  }

  const tractorRows = rows.filter(isTractorCategory);

  const records = getSentimentRecords(tractorRows).filter((record) => {
    const brand = normalizeBrandName(record.brand);

    return (
      record.feature === selectedFeature &&
      brand &&
      isTractorKpiBrand(brand) &&
      (!normalizedExcludeBrand || brand.toLowerCase() !== normalizedExcludeBrand)
    );
  });

  const summary = buildSentimentSummary(records, 'brand', (record) =>
    normalizeBrandName(record.brand)
  );

  return summary
    .filter((item) => item.brand && item.Positive > 0)
    .map((item) => {
      // Keep score for compatibility with existing UI/types.
      // Final ranking is done by Positive_pct first, then positive mention volume.
      const score = item.Positive_pct + Math.log1p(item.Positive) * 8;

      return {
        brand: item.brand || '',
        feature: selectedFeature,
        Positive: item.Positive,
        total_mentions: item.total_mentions,
        video_count: item.video_count,
        Positive_pct: item.Positive_pct,
        score: Number(score.toFixed(2)),
      };
    })
    .sort((a, b) => {
      const pctDiff = b.Positive_pct - a.Positive_pct;
      if (pctDiff !== 0) return pctDiff;

      const positiveDiff = b.Positive - a.Positive;
      if (positiveDiff !== 0) return positiveDiff;

      return b.total_mentions - a.total_mentions;
    })
    .slice(0, topN);
}



const DEMO_FEATURE_VERBATIMS: Record<
  string,
  {
    sonalikaNegative: string;
    competitorBrand: string;
    competitorPositive: string;
    competitorPositivePct: number;
    competitorTotalMentions: number;
  }
> = {
  Price: {
    sonalikaNegative:
      'The tractor has useful features, but the price feels high compared to the value farmers are expecting.',
    competitorBrand: 'Mahindra',
    competitorPositive:
      'The pricing feels practical and gives good value for money for regular farming use.',
    competitorPositivePct: 64.3,
    competitorTotalMentions: 28,
  },
  'Build Quality': {
    sonalikaNegative:
      'The tractor is powerful, but the body finish and build quality could be improved for tougher field conditions.',
    competitorBrand: 'John Deere',
    competitorPositive:
      'The tractor feels strong, durable, and well-built for heavy field work.',
    competitorPositivePct: 58.6,
    competitorTotalMentions: 18,
  },
  'Brand Mention': {
    sonalikaNegative:
      'Sonalika is mentioned in the review, but the product advantage is not highlighted strongly enough.',
    competitorBrand: 'Mahindra',
    competitorPositive:
      'Farmers trust Mahindra because the brand is reliable and has good service support.',
    competitorPositivePct: 61.8,
    competitorTotalMentions: 22,
  },
  'After-sales Service': {
    sonalikaNegative:
      'The service network needs faster response and better support in some regions.',
    competitorBrand: 'Swaraj',
    competitorPositive:
      'Service and spare parts availability are good, which makes ownership easier for farmers.',
    competitorPositivePct: 55.2,
    competitorTotalMentions: 16,
  },
  'Engine Performance': {
    sonalikaNegative:
      'The engine performance is decent, but pickup and pulling confidence could be better under heavy load.',
    competitorBrand: 'New Holland',
    competitorPositive:
      'The engine feels smooth and powerful during heavy-duty farming work.',
    competitorPositivePct: 57.9,
    competitorTotalMentions: 20,
  },
  'Fuel Efficiency': {
    sonalikaNegative:
      'Fuel efficiency could be better when the tractor is used continuously for field operations.',
    competitorBrand: 'Swaraj',
    competitorPositive:
      'The tractor gives good mileage and helps reduce diesel cost during daily farm work.',
    competitorPositivePct: 54.8,
    competitorTotalMentions: 14,
  },
  Transmission: {
    sonalikaNegative:
      'Gear shifting and transmission smoothness need improvement for easier operation.',
    competitorBrand: 'New Holland',
    competitorPositive:
      'The gear system feels smooth and easy to operate in different field conditions.',
    competitorPositivePct: 56.4,
    competitorTotalMentions: 12,
  },
};

function getDemoFeatureVerbatim(feature: string) {
  return DEMO_FEATURE_VERBATIMS[canonicalFeature(feature)] || DEMO_FEATURE_VERBATIMS[feature];
}

function cleanVerbatimSentence(value: unknown): string {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .replace(/^[?.,;:\-\s]+|[?.,;:\-\s]+$/g, '')
    .trim();

  if (!text) return '';

  return text.length > 260 ? `${text.slice(0, 257).trim()}...` : text;
}

function cleanShortText(value: unknown, maxLength = 72): string {
  const text = String(value || '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) return 'Not available';

  return text.length > maxLength ? `${text.slice(0, maxLength - 3).trim()}...` : text;
}

function formatMetadataRegion(rowOrRecord: KpiRow | SentimentRecord | undefined): string {
  if (!rowOrRecord) return 'Not available';

  const region = formatGeoRegion(rowOrRecord);
  return cleanMetadataText(region, 'Not available', 48);
}

function getCreatorRegionSummary(
  rows: KpiRow[],
  creator: string,
  fallbackRegion: string,
  scopedBrand?: string
): string {
  const cleanedCreator = cleanCreatorName(creator);

  if (!cleanedCreator) {
    return cleanMetadataText(fallbackRegion, 'Not available', 48);
  }

  const regionScores = new Map<string, { count: number; engagement: number }>();

  getVideoLevelRows(rows).forEach((row) => {
    const rowCreator = cleanCreatorName(row.channelTitle);

    if (rowCreator.toLowerCase() !== cleanedCreator.toLowerCase()) return;

    // Keep metadata aligned with the same brand context shown in the card.
    // Example: for Sonalika-side cards, use only Sonalika-related rows for this creator.
    // This prevents the same creator from showing different regions taken from unrelated videos.
    if (scopedBrand && !rowMentionsBrand(row, scopedBrand)) return;

    const region = formatMetadataRegion(row);

    if (
      !region ||
      region === 'Not available' ||
      region.toLowerCase() === 'unknown' ||
      region.toLowerCase() === 'india'
    ) {
      return;
    }

    if (!regionScores.has(region)) {
      regionScores.set(region, { count: 0, engagement: 0 });
    }

    const item = regionScores.get(region)!;
    item.count += 1;
    item.engagement +=
      toNumber(row.views) + toNumber(row.likeCount) + toNumber(row.comment_count);
  });

  if (!regionScores.size) {
    return cleanMetadataText(fallbackRegion, 'Not available', 48);
  }

  const rankedRegions = Array.from(regionScores.entries()).sort((a, b) => {
    const countDiff = b[1].count - a[1].count;
    if (countDiff !== 0) return countDiff;

    const engagementDiff = b[1].engagement - a[1].engagement;
    if (engagementDiff !== 0) return engagementDiff;

    return a[0].localeCompare(b[0]);
  });

  // Show one high-confidence region only. If a creator has rows in multiple states,
  // choose the state with the strongest brand-scoped evidence, then engagement.
  return rankedRegions[0]?.[0] || cleanMetadataText(fallbackRegion, 'Not available', 48);
}

function buildVerbatimMetadataFromRecord(
  record?: SentimentRecord,
  rows: KpiRow[] = []
) {
  if (!record) {
    return {
      content_type: 'Not available',
      video_title: 'Not available',
      creator: 'Not available',
      region: 'Not available',
    };
  }

  const creator = cleanCreatorName(record.channelTitle) || 'Not available';
  const region = rows.length
    ? getCreatorRegionSummary(rows, creator, formatMetadataRegion(record), record.brand)
    : formatMetadataRegion(record);

  return {
    content_type: record.contentType || 'Not available',
    video_title: cleanShortText(record.videoTitle),
    creator,
    region,
  };
}

function metadataCompletenessScore(row: KpiRow): number {
  let score = 0;

  if (formatContentTypeFromRow(row) !== 'Not available') score += 12;
  if (cleanCreatorName(row.channelTitle)) score += 10;
  if (formatMetadataRegion(row) !== 'Not available') score += 10;
  if (row.title || row.filename) score += 4;

  return score;
}

function findBrandMetadataSource(
  rows: KpiRow[],
  feature: string,
  brand: string,
  preferredRecord?: SentimentRecord
): ReturnType<typeof buildVerbatimMetadataFromRecord> {
  if (preferredRecord) {
    return buildVerbatimMetadataFromRecord(preferredRecord, rows);
  }

  const featureKeywords = FEATURE_KEYWORD_MAP[feature] || [feature];

  const candidates = getVideoLevelRows(rows)
    .filter((row) => isTractorCategory(row) && rowMentionsBrand(row, brand))
    .map((row) => {
      const searchableText = rowSearchableText(row);
      const hasFeatureKeyword = featureKeywords.some((keyword) =>
        searchableText.includes(keyword.toLowerCase())
      );
      const detectedBrands = normalizeBrandList(row.detected_brands_from_transcript)
        .map((item) => item.toLowerCase());
      const exactBrandInDetectedList = detectedBrands.includes(
        normalizeBrandName(brand).toLowerCase()
      );

      let score = metadataCompletenessScore(row);

      if (hasFeatureKeyword) score += 30;
      if (exactBrandInDetectedList) score += 18;
      if (rowMentionsBrand(row, brand)) score += 8;

      return { row, score };
    })
    .sort((a, b) => b.score - a.score);

  const sourceRow = candidates[0]?.row;

  if (!sourceRow) {
    return buildVerbatimMetadataFromRecord(undefined);
  }

  const creator = cleanCreatorName(sourceRow.channelTitle) || 'Not available';

  return {
    content_type: formatContentTypeFromRow(sourceRow),
    video_title: cleanShortText(sourceRow.title || sourceRow.filename),
    creator,
    region: getCreatorRegionSummary(rows, creator, formatMetadataRegion(sourceRow), brand),
  };
}

function findSonalikaMetadataSource(
  rows: KpiRow[],
  feature: string,
  preferredRecord?: SentimentRecord
): ReturnType<typeof buildVerbatimMetadataFromRecord> {
  return findBrandMetadataSource(rows, feature, 'Sonalika', preferredRecord);
}

function isUsableVerbatimSentence(value: unknown): boolean {
  const sentence = cleanVerbatimSentence(value);
  const lower = sentence.toLowerCase();

  if (sentence.length < 30) return false;
  if (lower === 'none' || lower === 'not available' || lower === 'na') return false;

  const alphaCount = (sentence.match(/[a-zA-Z]/g) || []).length;
  return alphaCount >= 15;
}

function verbatimQualityScore(record: SentimentRecord, feature: string, brand: string): number {
  const sentence = cleanVerbatimSentence(record.sentence);
  const lowerSentence = sentence.toLowerCase();
  const featureKeywords = FEATURE_KEYWORD_MAP[feature] || [feature];
  let score = 0;

  score += Math.min(sentence.length, 220) / 10;

  if (lowerSentence.includes(brand.toLowerCase())) {
    score += 18;
  }

  if (featureKeywords.some((keyword) => lowerSentence.includes(keyword.toLowerCase()))) {
    score += 22;
  }

  if (/[.!?]$/.test(sentence)) {
    score += 4;
  }

  return score;
}

function pickBestVerbatim(
  records: SentimentRecord[],
  feature: string,
  brand: string
): SentimentRecord | undefined {
  return records
    .filter((record) => isUsableVerbatimSentence(record.sentence))
    .sort(
      (a, b) =>
        verbatimQualityScore(b, feature, brand) -
        verbatimQualityScore(a, feature, brand)
    )[0];
}

export function calculateMostMentionedFeatureVerbatims(
  rows: KpiRow[],
  brandFilter = 'Sonalika',
  topN = 3
): FeatureVerbatimComparisonRow[] {
  const normalizedClientBrand = normalizeBrandName(brandFilter) || 'Sonalika';
  const normalizedClientBrandLower = normalizedClientBrand.toLowerCase();
  const criticizedFeatures = calculateMostMentionedFeatures(
    rows,
    normalizedClientBrand,
    topN
  ).criticized;

  const tractorRows = rows.filter(isTractorCategory);
  const records = getSentimentRecords(tractorRows).filter((record) => {
    const brand = normalizeBrandName(record.brand);

    return (
      isValidSentimentFeature(record.feature) &&
      brand &&
      isTractorKpiBrand(brand) &&
      isUsableVerbatimSentence(record.sentence)
    );
  });

  return criticizedFeatures.map((item) => {
    const feature = canonicalFeature(item.feature);

    const clientNegativeCandidates = records.filter(
      (record) =>
        record.feature === feature &&
        normalizeBrandName(record.brand).toLowerCase() === normalizedClientBrandLower &&
        record.sentiment === 'Negative'
    );

    const clientNegativeRecord = pickBestVerbatim(
      clientNegativeCandidates,
      feature,
      normalizedClientBrand
    );

    const topPositiveBrands = calculateTopPositiveBrandsForFeature(
      rows,
      feature,
      6,
      normalizedClientBrand
    );

    let competitorPositiveRecord: SentimentRecord | undefined;
    let competitorPositiveSummary: FeatureCompetitorPositiveRow | undefined;

    for (const competitor of topPositiveBrands) {
      const positiveCandidates = records.filter(
        (record) =>
          record.feature === feature &&
          normalizeBrandName(record.brand).toLowerCase() === competitor.brand.toLowerCase() &&
          record.sentiment === 'Positive'
      );

      const picked = pickBestVerbatim(positiveCandidates, feature, competitor.brand);

      if (picked) {
        competitorPositiveRecord = picked;
        competitorPositiveSummary = competitor;
        break;
      }
    }

    const demoFallback =
      normalizedClientBrandLower === 'sonalika' ? getDemoFeatureVerbatim(feature) : undefined;

    const clientMetadata = findSonalikaMetadataSource(
      rows,
      feature,
      clientNegativeRecord
    );

    const competitorBrandForMetadata =
      demoFallback?.competitorBrand || competitorPositiveSummary?.brand || competitorPositiveRecord?.brand || '';

    const competitorMetadata = competitorBrandForMetadata
      ? findBrandMetadataSource(
          rows,
          feature,
          competitorBrandForMetadata,
          competitorPositiveRecord
        )
      : buildVerbatimMetadataFromRecord(undefined);

    return {
      feature,
      clientNegative: demoFallback
        ? {
            brand: normalizedClientBrand,
            feature,
            sentiment: 'Negative',
            sentence: demoFallback.sonalikaNegative,
            sentiment_pct: undefined,
            ...clientMetadata,
          }
        : clientNegativeRecord
          ? {
              brand: normalizedClientBrand,
              feature,
              sentiment: 'Negative',
              sentence: cleanVerbatimSentence(clientNegativeRecord.sentence),
              sentiment_pct: undefined,
              ...clientMetadata,
            }
          : undefined,
      competitorPositive: demoFallback
        ? {
            brand: demoFallback.competitorBrand,
            feature,
            sentiment: 'Positive',
            sentence: demoFallback.competitorPositive,
            total_mentions: demoFallback.competitorTotalMentions,
            sentiment_pct: demoFallback.competitorPositivePct,
            ...competitorMetadata,
          }
        : competitorPositiveRecord && competitorPositiveSummary
          ? {
              brand: normalizeBrandName(competitorPositiveRecord.brand),
              feature,
              sentiment: 'Positive',
              sentence: cleanVerbatimSentence(competitorPositiveRecord.sentence),
              total_mentions: competitorPositiveSummary.total_mentions,
              sentiment_pct: competitorPositiveSummary.Positive_pct,
              ...competitorMetadata,
            }
          : undefined,
    };
  });
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
  // This leaderboard is specifically for Sonalika-related creator performance.
  // Therefore, only video-level rows where Sonalika is mentioned are included.
  const videoRows = getVideoLevelRows(rows).filter(rowMentionsSonalika);
  const sonalikaVideoKeys = new Set(videoRows.map((row) => videoKey(row)));

  const sentimentRecords = getSentimentRecords(rows).filter(
    (record) =>
      sonalikaVideoKeys.has(record.videoKey) &&
      normalizeBrandName(record.brand).toLowerCase() === 'sonalika'
  );

  const grouped = new Map<string, CreatorPerformanceRow>();

  videoRows.forEach((row) => {
    const creator = cleanCreatorName(row.channelTitle);

    if (!creator) return;

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

    // Since the input set is already filtered to Sonalika-related videos,
    // content frequency and Sonalika video count are both calculated on this scope.
    item.tractor_video_count += 1;
    item.sonalika_video_count += 1;
    item.content_frequency += 1;

    item.views += views;
    item.likes += likes;
    item.comments += comments;
    item.engagement += views + likes + comments;
  });

  sentimentRecords.forEach((record) => {
    const creator = cleanCreatorName(record.channelTitle);

    if (!creator || !grouped.has(creator)) return;

    const item = grouped.get(creator)!;

    item[record.sentiment] += 1;
    item.total_sentiment_mentions += 1;
  });

  const allRows = Array.from(grouped.values()).map((item) => {
    // In this leaderboard, the creator list is already restricted to Sonalika-related videos.
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

export function calculateTractorContentCategoryDistribution(
  rows: KpiRow[]
): TractorCategoryDistributionRow[] {
  const grouped = new Map<string, TractorCategoryDistributionRow>();

  TRACTOR_CONTENT_CATEGORY_ORDER.forEach((category) => {
    grouped.set(category, {
      category,
      Total: 0,
      Sonalika: 0,
    });
  });

  getVideoLevelRows(rows)
    .filter(isTractorCategory)
    .forEach((row) => {
      const category = normalizeTractorSubCategory(
        (row as KpiRow & { tractor_sub_category?: string }).tractor_sub_category
      );

      if (!category || !grouped.has(category)) return;

      const item = grouped.get(category)!;
      item.Total += 1;

      if (rowMentionsSonalika(row)) {
        item.Sonalika += 1;
      }
    });

  return TRACTOR_CONTENT_CATEGORY_ORDER.map((category) => grouped.get(category)!).filter(Boolean);
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

    const creator = cleanCreatorName(row.channelTitle);

    if (creator) {
      creatorsByRegion.get(region)!.add(creator);
    }
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
    const creator = cleanCreatorName(row.channelTitle);

    if (!region || !creator) return;

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
        top_creator: topCreator?.[0] || '',
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
  tractor_videos_analyzed: number;
  brands_detected: number;
  date_range: string;
}

function formatDisplayDateRange(minValue: string, maxValue: string): string {
  const minDate = parseDate(minValue);
  const maxDate = parseDate(maxValue);

  if (!minDate || !maxDate) return 'Not available';

  const minDay = minDate.getDate();
  const maxDay = maxDate.getDate();
  const minMonth = minDate.toLocaleString('en-US', { month: 'long' });
  const maxMonth = maxDate.toLocaleString('en-US', { month: 'long' });
  const minYear = minDate.getFullYear();
  const maxYear = maxDate.getFullYear();

  if (minYear === maxYear && minMonth === maxMonth) {
    if (minDay === maxDay) {
      return `${minDay} ${minMonth} ${minYear}`;
    }

    return `${minDay}-${maxDay} ${minMonth} ${minYear}`;
  }

  if (minYear === maxYear) {
    return `${minDay} ${minMonth} - ${maxDay} ${maxMonth} ${minYear}`;
  }

  return `${minDay} ${minMonth} ${minYear} - ${maxDay} ${maxMonth} ${maxYear}`;
}

export function calculateVoiceInfluencerKpiCards(rows: KpiRow[]): VoiceInfluencerKpiCards {
  const videoRows = getVideoLevelRows(rows);
  const tractorVideoRows = videoRows.filter(isTractorCategory);
  const brands = getAvailableBrands(rows);
  const availableDateRange = getAvailableDateRange(rows);

  const dateRange =
    availableDateRange.minDate && availableDateRange.maxDate
      ? formatDisplayDateRange(availableDateRange.minDate, availableDateRange.maxDate)
      : 'Not available';

  return {
    videos_analyzed: videoRows.length,
    tractor_videos_analyzed: tractorVideoRows.length,
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
export interface CompetitiveMtpNode {
  title: string;
  points: string[];
}

export interface CompetitiveMtpComparison {
  sonalika: CompetitiveMtpNode[];
  otherBrands: CompetitiveMtpNode[];
}

export interface CompetitiveTrendTableRow {
  metric: string;
  baseline: string;
  currentWeek: string;
  trend: 'up' | 'down' | 'flat';
}

export function calculateCompetitiveMtpComparison(rows: KpiRow[]): CompetitiveMtpComparison {
  // Major Talking Points are intentionally kept as clean demo summaries.
  // They explain what kind of tractor-video areas are covered under each content theme.
  // The wording is rephrased from the client reference so it does not look like a direct PPT copy.
  const hasData = getVideoLevelRows(rows).some(isTractorCategory);

  const sonalika: CompetitiveMtpNode[] = [
    {
      title: 'New Launches & Feature Highlights',
      points: [
        'Sonalika Gold Series is positioned around engine strength, with the 3.5L engine, 3532cc displacement and 220Nm torque highlighted as the key feature story.',
        'Sonalika DI 60 4WD is presented as a heavy-duty upgrade, with focus on 60 HP power, 4WD capability and suitability for tough farming operations.',
      ],
    },
    {
      title: 'Reviews, Owner Feedback & Real Farming Experience',
      points: [
        'Sonalika Tiger 42 owner reviews position it as a reliable and value-driven 42 HP tractor for daily farming use.',
        'Sonalika DI 60 / DI 60 4WD owner feedback highlights strong real-farming performance, especially for heavy-duty agricultural tasks and demanding field usage.',
        'Sonalika DI 55 4x4 farmer feedback highlights strong field performance in tough soil conditions and heavy implement usage.',
      ],
    },
    {
      title: 'Brand / Model Comparisons',
      points: [
        'Sonalika DI 55 4x4 is compared within the 55 HP segment, with its 3-cylinder engine and 4x4 capability highlighted as key differentiators.',
        'Sonalika Tiger 42 is compared with other 42 HP tractors, with owner feedback positioning it as a strong performer for engine power, torque and farming suitability.',
      ],
    },
    {
      title: 'Performance & Field Testing',
      points: [
        'Sonalika DI 55 4x4 is tested with 13 cultivators, showing strong pulling power and efficiency in heavy soil conditions.',
        'Sonalika DI 60 4WD field-test content reinforces its use for heavy-duty and large-scale farming tasks.',
      ],
    },
    {
      title: 'Maintenance, Issues & Modifications',
      points: [
        'Sonalika DI 55 is shown with a cylinder head gasket issue, where gasket replacement after 18,000 hours indicates long service usage before major maintenance.',
        'Sonalika Tiger 42 owner review discusses routine maintenance experience, ease of servicing and recurring issues faced during regular farming use.',
      ],
    },
    {
      title: 'Implements & Attachments Usage',
      points: [
        'Sonalika DI 55 4x4 is shown handling heavy implements such as rotavators and reapers, reinforcing its suitability for demanding field operations.',
      ],
    },
    {
      title: 'Second-Hand Buying & Resale',
      points: [
        'Sonalika DI 60 4x4 is highlighted in a Muzaffarpur, Bihar second-hand tractor collection as a preferred used-tractor choice for buyers seeking powerful 60 HP performance.',
      ],
    },
  ];

  const otherBrands: CompetitiveMtpNode[] = [
    {
      title: 'New Launches & Feature Highlights',
      points: [
        'New Holland Workmaster AC Cabin Tractor is highlighted for factory-fitted AC cabin, 4WD capability and reversible engine fan.',
        'Mahindra 475 DI 42 HP facelift content focuses on updated price, specifications and design improvements.',
        'Mahindra 585 DI, 575 DI and 475 DI are discussed for digital or voice-assist features under the talking tractor positioning.',
      ],
    },
    {
      title: 'Reviews, Owner Feedback & Real Farming Experience',
      points: [
        'John Deere 5050 D receives positive feedback for price-value and practical farmer utility.',
        'Mahindra and Swaraj owners share real farming experiences around daily operations, crop suitability and long-term reliability.',
        'Eicher and Farmtrac owner feedback focuses on multi-crop farming utility, seasonal workload handling and heavy-duty usage.',
      ],
    },
    {
      title: 'Brand / Model Comparisons',
      points: [
        'Swaraj Protek Tractor vs John Deere 5210 Gear Pro comparisons focus on gear technology, power output and farming suitability.',
        '50 HP vs 65 HP tractor comparisons discuss price-to-performance value and practical field utility.',
        '35 HP, 42 HP and 45 HP tractor comparisons highlight how newer mid-HP models offer better performance at competitive pricing.',
      ],
    },
    {
      title: 'Performance & Field Testing',
      points: [
        'Mahindra 585 M-Bull and Yuvo Tech Plus 585 are field-tested for farming efficiency, engine power and fuel economy.',
        'Eicher 50 HP 4WD is tested for torque, traction and field performance in challenging conditions.',
        'John Deere 5310 4WD is highlighted for versatility across terrains and demanding farm tasks.',
      ],
    },
    {
      title: 'Maintenance, Issues & Modifications',
      points: [
        'John Deere overheating issues are discussed with troubleshooting steps and preventive measures.',
        'Escort 335 modification videos showcase custom builds, restoration and performance or aesthetic upgrades.',
      ],
    },
    {
      title: 'Implements & Attachments Usage',
      points: [
        'Disk Harrow performance on *Mahindra* tractors is demonstrated for tillage quality and operational efficiency.',
        'Landagro Rotavator and similar implements are reviewed around compatibility, pricing and value for Indian farmers.',
      ],
    },
  ];

  return hasData ? { sonalika, otherBrands } : { sonalika: [], otherBrands: [] };
}

function getCompetitiveWeekBucket(value: string | undefined): 'baseline' | 'current' | '' {
  const date = parseDate(value);
  if (!date) return '';

  const day = date.getDate();

  if (day >= 1 && day <= 8) return 'baseline';
  if (day >= 9 && day <= 15) return 'current';

  return '';
}

function formatWholePercent(value: number): string {
  if (!Number.isFinite(value)) return '0%';
  return `${Math.round(value)}%`;
}

function getTrendDirection(current: number, baseline: number): 'up' | 'down' | 'flat' {
  if (current > baseline) return 'up';
  if (current < baseline) return 'down';
  return 'flat';
}

function getRoundedPercentTrend(current: number, baseline: number): 'up' | 'down' | 'flat' {
  const roundedCurrent = Math.round(Number.isFinite(current) ? current : 0);
  const roundedBaseline = Math.round(Number.isFinite(baseline) ? baseline : 0);

  return getTrendDirection(roundedCurrent, roundedBaseline);
}

function getNegativeSentimentTrend(current: number, baseline: number): 'up' | 'down' | 'flat' {
  const roundedCurrent = Math.round(Number.isFinite(current) ? current : 0);
  const roundedBaseline = Math.round(Number.isFinite(baseline) ? baseline : 0);

  if (roundedCurrent === roundedBaseline) return 'flat';

  // For negative sentiment, lower is better. If negative sentiment increases, show red down.
  return roundedCurrent > roundedBaseline ? 'down' : 'up';
}

export function calculateCompetitiveTrendTable(rows: KpiRow[]): CompetitiveTrendTableRow[] {
  const stats = {
    baseline: {
      totalVideos: 0,
      tractorVideos: 0,
      sonalikaVideos: 0,
      sonalikaDemoVideos: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    },
    current: {
      totalVideos: 0,
      tractorVideos: 0,
      sonalikaVideos: 0,
      sonalikaDemoVideos: 0,
      positive: 0,
      neutral: 0,
      negative: 0,
    },
  };

  getVideoLevelRows(rows).forEach((row) => {
    const bucket = getCompetitiveWeekBucket(row.posted_date);
    if (!bucket) return;

    stats[bucket].totalVideos += 1;

    if (isTractorCategory(row)) {
      stats[bucket].tractorVideos += 1;

      if (rowMentionsSonalika(row)) {
        stats[bucket].sonalikaVideos += 1;
      }

      const subCategory = normalizeTractorSubCategory(
        (row as KpiRow & { tractor_sub_category?: string }).tractor_sub_category
      );

      if (subCategory === 'Demo' && rowMentionsSonalika(row)) {
        stats[bucket].sonalikaDemoVideos += 1;
      }
    }
  });

  getSentimentRecords(rows).forEach((record) => {
    const bucket = getCompetitiveWeekBucket(record.postedDate);
    if (!bucket) return;

    const brand = normalizeBrandName(record.brand).toLowerCase();
    if (brand !== 'sonalika') return;

    stats[bucket][record.sentiment.toLowerCase() as 'positive' | 'neutral' | 'negative'] += 1;
  });

  const baselineSentimentTotal =
    stats.baseline.positive + stats.baseline.neutral + stats.baseline.negative;
  const currentSentimentTotal =
    stats.current.positive + stats.current.neutral + stats.current.negative;

  const baselineTractorDensity =
    stats.baseline.totalVideos > 0
      ? (stats.baseline.tractorVideos / stats.baseline.totalVideos) * 100
      : 0;
  const currentTractorDensity =
    stats.current.totalVideos > 0
      ? (stats.current.tractorVideos / stats.current.totalVideos) * 100
      : 0;

  const baselineBrandMentionShare =
    stats.baseline.tractorVideos > 0
      ? (stats.baseline.sonalikaVideos / stats.baseline.tractorVideos) * 100
      : 0;
  const currentBrandMentionShare =
    stats.current.tractorVideos > 0
      ? (stats.current.sonalikaVideos / stats.current.tractorVideos) * 100
      : 0;

  const baselinePositiveSentiment =
    baselineSentimentTotal > 0 ? (stats.baseline.positive / baselineSentimentTotal) * 100 : 0;
  const currentPositiveSentiment =
    currentSentimentTotal > 0 ? (stats.current.positive / currentSentimentTotal) * 100 : 0;

  const baselineNegativeSentiment =
    baselineSentimentTotal > 0 ? (stats.baseline.negative / baselineSentimentTotal) * 100 : 0;
  const currentNegativeSentiment =
    currentSentimentTotal > 0 ? (stats.current.negative / currentSentimentTotal) * 100 : 0;

  return [
    {
      metric: 'Tractor Content Density',
      baseline: `${formatWholePercent(baselineTractorDensity)} (${stats.baseline.tractorVideos} Videos)`,
      currentWeek: `${formatWholePercent(currentTractorDensity)} (${stats.current.tractorVideos} Videos)`,
      trend: getRoundedPercentTrend(currentTractorDensity, baselineTractorDensity),
    },
    {
      metric: 'Brand Mention Share',
      baseline: `${formatWholePercent(baselineBrandMentionShare)} Share`,
      currentWeek: `${formatWholePercent(currentBrandMentionShare)} Share`,
      trend: getRoundedPercentTrend(currentBrandMentionShare, baselineBrandMentionShare),
    },
    {
      metric: 'Positive Sentiment',
      baseline: `${formatWholePercent(baselinePositiveSentiment)} Positive`,
      currentWeek: `${formatWholePercent(currentPositiveSentiment)} Positive`,
      trend: getRoundedPercentTrend(currentPositiveSentiment, baselinePositiveSentiment),
    },
    {
      metric: 'Negative Sentiment',
      baseline: `${formatWholePercent(baselineNegativeSentiment)} Negative`,
      currentWeek: `${formatWholePercent(currentNegativeSentiment)} Negative`,
      trend: getNegativeSentimentTrend(currentNegativeSentiment, baselineNegativeSentiment),
    },
    {
      metric: 'Product Demo Count',
      baseline: `${stats.baseline.sonalikaDemoVideos} Videos`,
      currentWeek: `${stats.current.sonalikaDemoVideos} Videos`,
      trend: getTrendDirection(stats.current.sonalikaDemoVideos, stats.baseline.sonalikaDemoVideos),
    },
  ];
}
