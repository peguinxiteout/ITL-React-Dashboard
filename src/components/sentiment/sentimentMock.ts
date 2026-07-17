// ─── Viewer Sentiment mock data ──────────────────────────────────────────────
// Self-contained mock dataset for the redesigned Viewer Sentiment section.
// Every list item is tagged with a `brand` and `weeksAgo` so the section's
// brand dropdown and per-section week filter can filter purely client-side.

export const VS_BRANDS = [
  'All Brands',
  'Sonalika',
  'Mahindra',
  'Swaraj',
  'John Deere',
  'New Holland',
  'Massey Ferguson',
  'Escorts Kubota'
] as const;
export type VSBrand = (typeof VS_BRANDS)[number];

// Specific (non-aggregate) brands used for tagging and the by-brand charts.
export const SPECIFIC_BRANDS: VSBrand[] = VS_BRANDS.filter(
  (b) => b !== 'All Brands'
) as VSBrand[];

// Brand colors live in the shared palette: src/utils/brandColors.ts.

export const VS_WEEKS = [
  'All time',
  'Last 8 weeks',
  'Last 4 weeks',
  'Last 2 weeks'
] as const;
export type VSWeek = (typeof VS_WEEKS)[number];

export const WEEK_MAX: Record<VSWeek, number> = {
  'All time': Infinity,
  'Last 8 weeks': 8,
  'Last 4 weeks': 4,
  'Last 2 weeks': 2
};

export type SectionKey = 'intent' | 'needs' | 'questions';

// ─── Summary cards (driven only by the brand filter) ─────────────────────────
export interface RateCount {
  rate: number;
  count: number;
}

export const SUMMARY_BY_BRAND: Record<
  VSBrand,
  Record<SectionKey, RateCount>> =
{
  'All Brands': {
    intent: { rate: 14.61, count: 45 },
    needs: { rate: 22.73, count: 70 },
    questions: { rate: 54.22, count: 167 }
  },
  Sonalika: {
    intent: { rate: 16.2, count: 27 },
    needs: { rate: 28.4, count: 32 },
    questions: { rate: 61.4, count: 68 }
  },
  Mahindra: {
    intent: { rate: 11.4, count: 11 },
    needs: { rate: 19.6, count: 21 },
    questions: { rate: 49.8, count: 41 }
  },
  Swaraj: {
    intent: { rate: 8.7, count: 4 },
    needs: { rate: 14.2, count: 9 },
    questions: { rate: 38.6, count: 17 }
  },
  'John Deere': {
    intent: { rate: 6.2, count: 2 },
    needs: { rate: 10.8, count: 4 },
    questions: { rate: 28.4, count: 11 }
  },
  'New Holland': {
    intent: { rate: 7.7, count: 2 },
    needs: { rate: 9.3, count: 3 },
    questions: { rate: 22.1, count: 7 }
  },
  'Massey Ferguson': {
    intent: { rate: 5.1, count: 1 },
    needs: { rate: 7.6, count: 2 },
    questions: { rate: 18.3, count: 4 }
  },
  'Escorts Kubota': {
    intent: { rate: 4.3, count: 1 },
    needs: { rate: 6.1, count: 1 },
    questions: { rate: 14.2, count: 2 }
  }
};

// ─── Section divider tag rate per week selection ─────────────────────────────
export const SECTION_WEEK_RATE: Record<SectionKey, Record<VSWeek, number>> = {
  intent: {
    'All time': 14.61,
    'Last 8 weeks': 13.2,
    'Last 4 weeks': 11.8,
    'Last 2 weeks': 9.4
  },
  needs: {
    'All time': 22.73,
    'Last 8 weeks': 20.1,
    'Last 4 weeks': 18.6,
    'Last 2 weeks': 15.3
  },
  questions: {
    'All time': 54.22,
    'Last 8 weeks': 49.8,
    'Last 4 weeks': 44.1,
    'Last 2 weeks': 38.6
  }
};

export const SECTION_LABEL: Record<SectionKey, string> = {
  intent: 'Purchase Intent',
  needs: 'Unmet Needs',
  questions: 'Recurring Questions'
};

export const SECTION_COLOR: Record<SectionKey, { tag: string; bg: string }> = {
  intent: { tag: '#1D4ED8', bg: '#EFF4FF' },
  needs: { tag: '#B45309', bg: '#FEF6E7' },
  questions: { tag: '#7C3AED', bg: '#F4EEFE' }
};

// ─── Scaling helpers for aggregate charts ────────────────────────────────────
// Aggregate visuals (funnel, tiles, feature areas, donut, by-brand bars) are
// "recalculated" for the selected brand by scaling a category-wide base by the
// brand's share of that section's count, and by the week's rate proportion.
export const brandRatio = (brand: VSBrand, section: SectionKey): number => {
  if (brand === 'All Brands') return 1;
  return (
    SUMMARY_BY_BRAND[brand][section].count /
    SUMMARY_BY_BRAND['All Brands'][section].count);

};

export const weekMult = (section: SectionKey, week: VSWeek): number =>
SECTION_WEEK_RATE[section][week] / SECTION_WEEK_RATE[section]['All time'];

export interface BrandWeekTagged {
  brand: VSBrand;
  weeksAgo: number;
}

export const filterByBrandWeek = <T extends BrandWeekTagged,>(
items: T[],
brand: VSBrand,
week: VSWeek)
: T[] =>
items.filter(
  (it) =>
  (brand === 'All Brands' || it.brand === brand) &&
  it.weeksAgo <= WEEK_MAX[week]
);

// ─── Generators ──────────────────────────────────────────────────────────────
const AUTHORS = [
'Gurpreet Singh',
'Ramesh Patil',
'Vijay Yadav',
'Harjinder Brar',
'Suresh Reddy',
'Mohit Choudhary',
'Balwinder Sandhu',
'Anil Jadhav',
'Kuldeep Verma',
'Prakash Pawar',
'Devendra Singh',
'Santosh Kale',
'Jagdish Meena',
'Nitin Gaikwad',
'Tapan Mahato',
'Ravi Shankar',
'Omprakash Kushwaha',
'Bhola Prasad',
'Manoj Bishnoi',
'Ashok Rathod',
'Rajveer Dhillon',
'Karan Thakur',
'Sandeep Rana',
'Deepak Chauhan',
'Imran Sheikh',
'Lokesh Patel',
'Naresh Bhati',
'Pawan Solanki'];


const MODELS = [
'DI 750 Field Review',
'45 HP Full Test',
'4WD Walkaround',
'Mileage & Rotavator Test'];


const WEEKS_CYCLE = [1, 3, 5, 7];

// stable pseudo value so renders are deterministic (no Math.random)
const stableVal = (seed: number, base: number, span: number): number =>
base + Math.abs(Math.round(Math.sin(seed * 12.9898) * span)) % span;

// ── Purchase-intent comment cards ──
export type IntentSignal =
'Buying consideration' |
'Shortlisting' |
'Dealer inquiry';

const INTENT_SIGNALS: IntentSignal[] = [
'Buying consideration',
'Shortlisting',
'Dealer inquiry'];


const INTENT_TEXT: Record<IntentSignal, (b: string) => string> = {
  'Buying consideration': (b) =>
  `Seriously considering the ${b} after this review — fits my farm size and budget. EMI options available?`,
  Shortlisting: (b) =>
  `Shortlisted the ${b} against two others. Service network will decide my final pick next month.`,
  'Dealer inquiry': (b) =>
  `Nearest ${b} dealer in my district? Want to book a test drive and check the exchange offer on my old tractor.`
};

export interface IntentComment extends BrandWeekTagged {
  id: string;
  author: string;
  text: string;
  signal: IntentSignal;
  video: string;
  likes: number;
}

export const INTENT_COMMENTS: IntentComment[] = [];
SPECIFIC_BRANDS.forEach((b, bi) => {
  for (let i = 0; i < 4; i++) {
    const signal = INTENT_SIGNALS[i % 3];
    INTENT_COMMENTS.push({
      id: `ic-${bi}-${i}`,
      brand: b,
      author: AUTHORS[(bi * 4 + i) % AUTHORS.length],
      text: INTENT_TEXT[signal](b),
      signal,
      video: `${b} ${MODELS[i % MODELS.length]}`,
      likes: stableVal(bi * 4 + i + 1, 84, 280),
      weeksAgo: WEEKS_CYCLE[i % 4]
    });
  }
});

// ── Unmet-need comment cards ──
export type Severity = 'High' | 'Medium' | 'Low';

const NEED_TYPES = [
'Pricing transparency',
'Real-world mileage',
'Implement compatibility',
'Service network'];


const NEED_SEVERITY: Severity[] = ['High', 'High', 'Medium', 'Medium'];

const NEED_TEXT: Record<string, (b: string) => string> = {
  'Pricing transparency': (b) =>
  `${b} ka on-road price state-wise batao — har video sirf "contact dealer" bolta hai.`,
  'Real-world mileage': (b) =>
  `Actual diesel per acre with a rotavator on the ${b}? Brochure numbers don't match the field.`,
  'Implement compatibility': (b) =>
  `Which rotavator size pairs with the ${b}? No clear video on implement matching for this model.`,
  'Service network': (b) =>
  `How many ${b} service centers in my state? Spare-parts availability is my biggest worry before buying.`
};

export interface NeedComment extends BrandWeekTagged {
  id: string;
  author: string;
  text: string;
  needType: string;
  severity: Severity;
  video: string;
}

export const NEED_COMMENTS: NeedComment[] = [];
SPECIFIC_BRANDS.forEach((b, bi) => {
  for (let i = 0; i < 4; i++) {
    const needType = NEED_TYPES[i];
    NEED_COMMENTS.push({
      id: `nc-${bi}-${i}`,
      brand: b,
      author: AUTHORS[(bi * 4 + i + 7) % AUTHORS.length],
      text: NEED_TEXT[needType](b),
      needType,
      severity: NEED_SEVERITY[i],
      video: `${b} ${MODELS[(i + 1) % MODELS.length]}`,
      weeksAgo: WEEKS_CYCLE[i % 4]
    });
  }
});

// ── Top questions by engagement ──
const QUESTION_TEXT: ((b: string) => string)[] = [
(b) => `What is the on-road price of the ${b} with subsidy in my state?`,
(b) => `Actual diesel consumption per hour for the ${b} with a rotavator?`,
(b) => `Which implements are compatible with the ${b}?`,
(b) => `EMI and financing options available on the ${b}?`];


// Map a top question to the video title where it appeared.
const DEFAULT_QUESTION_VIDEO =
'Sonalika Tractor New GST PRICE 202526 Sonalika Tractor All Model Price';

const QUESTION_VIDEO_TITLES: { match: string; title: string }[] = [
{
  match: 'on-road price',
  title: 'Sonalika DI 55 III Sikander DLX Multispeed Tractor REVIEW price in India'
},
{
  match: 'diesel consumption',
  title: 'Sonalika DI 55 III Sikander DLX Multispeed Tractor REVIEW price in India'
},
{
  match: 'implements are compatible',
  title: 'Mahindra Yuvo Tech Plus 575 4WD दमदार 4WD ट्रेक्टर Mileage Price Features 2025'
},
{ match: 'Tiger Electric', title: DEFAULT_QUESTION_VIDEO },
{
  match: 'EMI and financing',
  title: 'Sonalika DI 55 III Sikander DLX Multispeed Tractor REVIEW price in India'
}];


export const questionVideoTitle = (question: string): string =>
QUESTION_VIDEO_TITLES.find((m) => question.includes(m.match))?.title ??
DEFAULT_QUESTION_VIDEO;

export interface TopQuestion extends BrandWeekTagged {
  id: string;
  question: string;
  likes: number;
  replies: number;
  videos: number;
  videoTitle: string;
}

export const TOP_QUESTIONS: TopQuestion[] = [];
SPECIFIC_BRANDS.forEach((b, bi) => {
  for (let i = 0; i < 4; i++) {
    TOP_QUESTIONS.push({
      id: `tq-${bi}-${i}`,
      brand: b,
      question: QUESTION_TEXT[i](b),
      likes: stableVal(bi * 4 + i + 3, 120, 360),
      replies: stableVal(bi * 4 + i + 9, 8, 40),
      videos: stableVal(bi * 4 + i + 5, 3, 18),
      videoTitle: questionVideoTitle(QUESTION_TEXT[i](b)),
      weeksAgo: WEEKS_CYCLE[i % 4]
    });
  }
});

// ── Per-video tables ──
export interface VideoRow extends BrandWeekTagged {
  id: string;
  video: string;
  primary: number; // intent comments / need mentions / questions
  secondary: string; // top signal / severity / top type
}

const buildVideoRows = (
prefix: string,
labels: string[])
: VideoRow[] => {
  const rows: VideoRow[] = [];
  SPECIFIC_BRANDS.forEach((b, bi) => {
    for (let i = 0; i < 3; i++) {
      rows.push({
        id: `${prefix}-${bi}-${i}`,
        brand: b,
        video: `${b} ${MODELS[i % MODELS.length]}`,
        primary: stableVal(bi * 3 + i + (prefix.length), 6, 48),
        secondary: labels[i % labels.length],
        weeksAgo: WEEKS_CYCLE[i % 4]
      });
    }
  });
  return rows;
};

export const INTENT_VIDEO_ROWS = buildVideoRows('iv', [
'Buying consideration',
'Shortlisting',
'Dealer inquiry']);

export const NEED_VIDEO_ROWS = buildVideoRows('nv', [
'High',
'Medium',
'High']);

export const QUESTION_VIDEO_ROWS = buildVideoRows('qv', [
'Pricing & finance',
'Specs & performance',
'Service & warranty']);


// ── Cross-video questions ──
export interface CrossVideoRow extends BrandWeekTagged {
  id: string;
  question: string;
  videos: number;
  mentions: number;
}

export const CROSS_VIDEO_QUESTIONS: CrossVideoRow[] = [];
SPECIFIC_BRANDS.forEach((b, bi) => {
  for (let i = 0; i < 3; i++) {
    CROSS_VIDEO_QUESTIONS.push({
      id: `cv-${bi}-${i}`,
      brand: b,
      question: QUESTION_TEXT[i % QUESTION_TEXT.length](b),
      videos: stableVal(bi * 3 + i + 11, 4, 22),
      mentions: stableVal(bi * 3 + i + 13, 30, 220),
      weeksAgo: WEEKS_CYCLE[i % 4]
    });
  }
});

// ── Recurring clusters accordion ──
export interface QuestionCluster extends BrandWeekTagged {
  id: string;
  title: string;
  count: number;
  items: string[];
}

const CLUSTER_TITLES = [
'Pricing & subsidy clarity',
'Fuel efficiency in real conditions'];


export const QUESTION_CLUSTERS: QuestionCluster[] = [];
SPECIFIC_BRANDS.forEach((b, bi) => {
  for (let i = 0; i < 2; i++) {
    QUESTION_CLUSTERS.push({
      id: `cl-${bi}-${i}`,
      brand: b,
      title: `${CLUSTER_TITLES[i]} — ${b}`,
      count: stableVal(bi * 2 + i + 17, 12, 60),
      items: [
      QUESTION_TEXT[i % QUESTION_TEXT.length](b),
      QUESTION_TEXT[(i + 1) % QUESTION_TEXT.length](b),
      QUESTION_TEXT[(i + 2) % QUESTION_TEXT.length](b)],

      weeksAgo: WEEKS_CYCLE[i % 4]
    });
  }
});

// ── Recurring Question Clusters section: headline metrics + tables ──
export const RECURRING_CLUSTER_METRICS: { label: string; value: number }[] = [
{ label: 'Recurring Clusters', value: 13 },
{ label: 'Most Asked (freq)', value: 8 }];


export interface RecurringQuestionRow {
  question: string;
  freq: number;
  likes: number;
  videos: number;
  type: string;
  crossVideo: boolean;
}

export const TOP_RECURRING_QUESTIONS: RecurringQuestionRow[] = [
{
  question:
  'What is the price of the Sonalika DI 55 III Sikander DLX Multispeed Tractor in Madhya Pradesh?',
  freq: 8,
  likes: 2,
  videos: 1,
  type: 'price_inquiry',
  crossVideo: false
},
{
  question: 'What is the engine specification of the Sonalika DI 55 III?',
  freq: 5,
  likes: 0,
  videos: 1,
  type: 'spec_inquiry',
  crossVideo: false
},
{
  question: 'What is the top speed of the Sonalika DI 55 III Sikander DLX?',
  freq: 3,
  likes: 1,
  videos: 1,
  type: 'spec_inquiry',
  crossVideo: false
},
{
  question: 'How much diesel does the Sonalika tractor consume in one bigha?',
  freq: 2,
  likes: 33,
  videos: 1,
  type: 'spec_inquiry',
  crossVideo: false
},
{
  question: 'Can you review the Swaraj 855 FE Protek?',
  freq: 2,
  likes: 8,
  videos: 1,
  type: 'content_request',
  crossVideo: false
},
{
  question: 'What is the on-road price of Sonalika Tiger DI 745 111 HDM + 4WD?',
  freq: 2,
  likes: 2,
  videos: 1,
  type: 'price_inquiry',
  crossVideo: false
},
{
  question:
  'What is the on-road price of Mahindra Yuvo Tech Plus 475 4WD in North Lakhimpur?',
  freq: 2,
  likes: 2,
  videos: 1,
  type: 'price_inquiry',
  crossVideo: false
},
{
  question: 'What is the on-road price of Sonalika 745 DI?',
  freq: 2,
  likes: 1,
  videos: 2,
  type: 'price_inquiry',
  crossVideo: true
},
{
  question: 'Where is the Mahindra Yuvo Tech Plus 575 4WD available?',
  freq: 2,
  likes: 1,
  videos: 1,
  type: 'availability_inquiry',
  crossVideo: false
},
{
  question: 'Can you make a video about tractor torque backup?',
  freq: 2,
  likes: 1,
  videos: 2,
  type: 'content_request',
  crossVideo: true
}];


export const MULTI_VIDEO_QUESTIONS: RecurringQuestionRow[] = [
{
  question: 'What is the on-road price of Sonalika 745 DI?',
  freq: 2,
  likes: 1,
  videos: 2,
  type: 'price_inquiry',
  crossVideo: true
},
{
  question: 'Can you make a video about tractor torque backup?',
  freq: 2,
  likes: 1,
  videos: 2,
  type: 'content_request',
  crossVideo: true
},
{
  question: 'Is there a John Deere tractor available for second-hand sale?',
  freq: 2,
  likes: 0,
  videos: 2,
  type: 'availability_inquiry',
  crossVideo: true
},
{
  question: 'Can you make a video of the Sonalika DLX 60?',
  freq: 2,
  likes: 0,
  videos: 2,
  type: 'content_request',
  crossVideo: true
}];


export const RECURRING_QUESTIONS_BY_TYPE: {
  type: string;
  distinct: number;
  occurrences: number;
}[] = [
{ type: 'price_inquiry', distinct: 5, occurrences: 16 },
{ type: 'spec_inquiry', distinct: 3, occurrences: 10 },
{ type: 'content_request', distinct: 3, occurrences: 6 },
{ type: 'availability_inquiry', distinct: 2, occurrences: 4 }];


// ─── Aggregate bases (All Brands; scaled per brand + week) ────────────────────
export const FUNNEL_BASE: { stage: string; value: number }[] = [
{ stage: 'Watching / aware', value: 308 },
{ stage: 'Considering', value: 142 },
{ stage: 'Shortlisting', value: 88 },
{ stage: 'Dealer inquiry', value: 61 },
{ stage: 'Intent expressed', value: 45 }];


export const NEED_TILE_BASE: { type: string; value: number }[] = [
{ type: 'Pricing transparency', value: 18 },
{ type: 'Real-world mileage', value: 15 },
{ type: 'Service network', value: 12 },
{ type: 'Implement compatibility', value: 10 },
{ type: 'Resale value', value: 8 },
{ type: 'Hindi walkthroughs', value: 7 }];


export const FEATURE_AREA_BASE: { area: string; value: number }[] = [
{ area: 'Pricing clarity', value: 24 },
{ area: 'Fuel efficiency', value: 19 },
{ area: 'Service & spare parts', value: 16 },
{ area: 'Implement matching', value: 13 },
{ area: 'Hydraulics & lift', value: 9 },
{ area: 'After-sales support', value: 6 }];


export const QUESTION_TYPE_BASE: {
  type: string;
  value: number;
  color: string;
}[] = [
{ type: 'Pricing & finance', value: 52, color: '#1D4ED8' },
{ type: 'Specs & performance', value: 41, color: '#16A34A' },
{ type: 'Implements & usage', value: 33, color: '#D97706' },
{ type: 'Service & warranty', value: 24, color: '#7C3AED' },
{ type: 'Comparison', value: 17, color: '#0EA5E9' }];
