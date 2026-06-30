export interface KpiSummary {
  total_comments: number;
  pi_rate: number;
  pi_count: number;
  pi_lost_sales: number;
  un_rate: number;
  un_count: number;
  un_high_intensity: number;
  un_content_gaps: number;
  qs_rate: number;
  qs_count: number;
}

export interface StageItem {
  stage: string;
  count: number;
}

export interface BrandCount {
  brand: string;
  count: number;
}

export interface IntentVideoRow {
  title: string;
  channel_name: string;
  published_at: string;
  intent_count: number;
  brand: string;
  topSignal: string;
}

export interface IntentComment {
  comment_text: string;
  pi_stage: string;
  pi_brand: string | null;
  pi_confidence: number;
  comment_likeCount: number;
  title: string;
  channel_name: string;
  weeksAgo: number;
}

export interface PurchaseIntentData {
  stageDistribution: StageItem[];
  byBrand: BrandCount[];
  brandedCount: number;
  totalCount: number;
  unattributedCount: number;
  byVideo: IntentVideoRow[];
  topComments: IntentComment[];
}

export interface NeedTypeItem {
  type: string;
  count: number;
}

export interface FeatureAreaItem {
  area: string;
  count: number;
}

export interface NeedVideoRow {
  title: string;
  channel_name: string;
  published_at: string;
  needs_count: number;
  brand: string;
  topSeverity: string | null;
}

export interface NeedComment {
  comment_text: string;
  un_need_type: string;
  un_intensity: string;
  un_brand: string | null;
  comment_likeCount: number;
  title: string;
  channel_name: string;
  weeksAgo: number;
}

export interface UnmetNeedsData {
  needTypeDist: NeedTypeItem[];
  byBrand: BrandCount[];
  featureAreas: FeatureAreaItem[];
  byVideo: NeedVideoRow[];
  topComments: NeedComment[];
}

export interface QuestionTypeItem {
  type: string;
  count: number;
}

export interface QuestionVideoRow {
  title: string;
  question_count: number;
  total_comments: number;
  question_rate: number;
}

export interface TopQuestion {
  qs_normalized_question: string;
  qs_question_type: string;
  comment_likeCount: number;
  title: string;
  channel_name: string;
  qs_is_content_gap: boolean;
  qs_brand: string;
  weeksAgo: number;
}

export interface ClusterRow {
  cluster_id: number;
  canonical_question: string;
  frequency: number;
  total_likes: number;
  video_count: number;
  content_ids: string;
  question_type: string;
  topic: string;
  member_questions: string;
  is_cross_video: boolean | string;
  brand?: string | null;
  channel_name?: string | null;
}

export interface RecurringQuestionsData {
  questionTypeDist: QuestionTypeItem[];
  byBrand: BrandCount[];
  byVideo: QuestionVideoRow[];
  topQuestions: TopQuestion[];
  clusters: ClusterRow[];
}

export interface UseVSDataOptions {
  brand?: string;
  intentWeek?: string;
  needsWeek?: string;
  questionsWeek?: string;
}

export interface UseVSDataResult {
  loading: boolean;
  error: string | null;
  successRows: Record<string, unknown>[];
  clusters: ClusterRow[];
  kpiSummary: KpiSummary;
  intentKpi: KpiSummary;
  needsKpi: KpiSummary;
  questionsKpi: KpiSummary;
  purchaseIntentData: PurchaseIntentData;
  unmetNeedsData: UnmetNeedsData;
  recurringQuestionsData: RecurringQuestionsData;
}

export function useVSData(options?: UseVSDataOptions): UseVSDataResult;
