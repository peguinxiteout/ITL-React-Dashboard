export interface BrandMeta {
  short: string;
  color: string;
  isOwn?: boolean;
}

export interface BrandSummaryRow {
  brand: string;
  video_count: number;
  row_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  total_engagement: number;
  avg_views_per_video: number;
  sov_views: number;
  sov_videos: number;
  sov_comments: number;
  soe: number;
  color: string;
  short: string;
  isOwn: boolean;
}

export interface WeeklyDataRow {
  brand: string;
  week: string;
  video_count: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
}

export interface WeeklySoVRow extends WeeklyDataRow {
  sov_views: number;
  sov_videos: number;
  sov_comments: number;
  sov_likes: number;
  soe: number;
}

export interface VideoListRow {
  video_id: string;
  title: string;
  channel_name: string;
  publish_date: string;
  publish_week: string;
  view_count: number;
  like_count: number;
  comment_count: number;
  attributed_brand: string;
  duration_seconds: number;
  is_short: number;
}

export interface OverviewStats {
  totalVideos: number;
  tractorVideos: number;
  brandMentioned: number;
  directVideos: number;
  comparisonVideos: number;
}

export interface CategoryItem {
  category: string;
  count: number;
  percentage: number;
}

export interface ChannelCoverage {
  tractorChannels: number;
  activeChannels: number;
  inactiveChannelNames: string[];
}

export interface BrandChannelRow {
  channelName: string;
  total: number;
  brandCounts: Record<string, number>;
}

export const CMS_BRAND_META: Record<string, BrandMeta>;
export const SONALIKA_BRAND: string;

export function summarizeBrands(rows: Record<string, unknown>[]): BrandSummaryRow[];
export function buildWeeklyData(rows: Record<string, unknown>[]): WeeklyDataRow[];
export function buildWeeklySoV(weeklyData: WeeklyDataRow[]): WeeklySoVRow[];
export function uniqueWeeks(rows: Record<string, unknown>[]): string[];
export function recentWeeks(weeks: string[], n: number): string[];
export function computeOverviewStats(
  allData: Record<string, unknown>[],
  startDate: string,
  endDate: string
): OverviewStats;

export function computeCategoryData(
  allData: Record<string, unknown>[],
  startDate: string,
  endDate: string
): CategoryItem[];

export function computeChannelCoverage(
  allData: Record<string, unknown>[],
  startDate: string,
  endDate: string
): ChannelCoverage;

export function computeBrandChannelMatrix(
  cmsData: Record<string, unknown>[],
  startDate: string,
  endDate: string
): BrandChannelRow[];

export interface UseCMSDataResult {
  loading: boolean;
  error: string | null;
  allData: Record<string, unknown>[];
  cmsData: Record<string, unknown>[];
  brandSummary: BrandSummaryRow[];
  weeklyData: WeeklyDataRow[];
  weeklySoV: WeeklySoVRow[];
  videoList: VideoListRow[];
  weeks: string[];
  sonalikaStats: BrandSummaryRow | null;
  sovSeGap: number;
  totalMonitored: number;
}

export function useCMSData(): UseCMSDataResult;
