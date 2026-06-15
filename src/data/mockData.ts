// ─── Types ───────────────────────────────────────────────────────────────────
export type DateRangeKey = '30d' | '90d' | '180d';
export type TabKey =
'overview' |
'market-share' |
'influencer' |
'positioning' |
'sentiment';
export type IntentSignal =
'Buying consideration' |
'Shortlisting' |
'Dealer inquiry';
export type Severity = 'High' | 'Medium' | 'Low';

export interface Brand {
  id: string;
  name: string;
  short: string;
  color: string;
  isOwn?: boolean;
}

export interface BrandStats {
  brandId: string;
  videos: number;
  views: number;
  comments: number;
  likes: number;
  publishRate: number; // videos per week
}

export interface TrendPoint {
  label: string;
  sov: number; // share of voice %
  soe: number; // share of engagement %
}

export interface IntentComment {
  id: string;
  author: string;
  text: string;
  signal: IntentSignal;
  video: string;
  likes: number;
  daysAgo: number;
}

export interface UnmetNeed {
  id: string;
  title: string;
  description: string;
  frequency: number;
  severity: Severity;
  samples: {author: string;text: string;}[];
}

export interface RecurringQuestion {
  id: string;
  question: string;
  mentions: number;
  videos: number;
  answered: boolean;
}

// ─── Brands ──────────────────────────────────────────────────────────────────
export const SONALIKA_ID = 'sonalika';

export const BRANDS: Brand[] = [
{
  id: SONALIKA_ID,
  name: 'Sonalika',
  short: 'SON',
  color: '#1D4ED8',
  isOwn: true
},
{ id: 'mahindra', name: 'Mahindra', short: 'MAH', color: '#DC2626' },
{ id: 'swaraj', name: 'Swaraj', short: 'SWJ', color: '#D97706' },
{ id: 'johndeere', name: 'John Deere', short: 'JD', color: '#16A34A' },
{ id: 'newholland', name: 'New Holland', short: 'NH', color: '#0EA5E9' },
{ id: 'massey', name: 'Massey Ferguson', short: 'MF', color: '#7C3AED' }];


export const COMPETITORS = BRANDS.filter((b) => !b.isOwn);

export const getBrand = (id: string): Brand =>
BRANDS.find((b) => b.id === id) as Brand;

// ─── Date ranges ─────────────────────────────────────────────────────────────
export const DATE_RANGES: {key: DateRangeKey;label: string;}[] = [
{ key: '30d', label: 'Last 30 days' },
{ key: '90d', label: 'Last 90 days' },
{ key: '180d', label: 'Last 180 days' }];


const RANGE_MULTIPLIER: Record<DateRangeKey, number> = {
  '30d': 1,
  '90d': 2.9,
  '180d': 5.6
};

export const scaleCount = (n: number, range: DateRangeKey): number =>
Math.round(n * RANGE_MULTIPLIER[range]);

// ─── Brand stats (base = last 30 days) ──────────────────────────────────────
const BASE_STATS_30D: BrandStats[] = [
{
  brandId: 'sonalika',
  videos: 14,
  views: 2_410_000,
  comments: 8_920,
  likes: 96_400,
  publishRate: 3.5
},
{
  brandId: 'mahindra',
  videos: 22,
  views: 4_780_000,
  comments: 15_240,
  likes: 188_300,
  publishRate: 5.5
},
{
  brandId: 'swaraj',
  videos: 12,
  views: 2_080_000,
  comments: 7_410,
  likes: 81_900,
  publishRate: 3.0
},
{
  brandId: 'johndeere',
  videos: 16,
  views: 2_930_000,
  comments: 9_860,
  likes: 117_600,
  publishRate: 4.0
},
{
  brandId: 'newholland',
  videos: 8,
  views: 1_120_000,
  comments: 3_640,
  likes: 41_200,
  publishRate: 2.0
},
{
  brandId: 'massey',
  videos: 10,
  views: 1_610_000,
  comments: 5_230,
  likes: 62_800,
  publishRate: 2.5
}];


export const getBrandStats = (range: DateRangeKey): BrandStats[] =>
BASE_STATS_30D.map((s) => ({
  ...s,
  videos: scaleCount(s.videos, range),
  views: scaleCount(s.views, range),
  comments: scaleCount(s.comments, range),
  likes: scaleCount(s.likes, range)
}));

export const engagementOf = (s: BrandStats): number =>
s.views + s.likes + s.comments;

// ─── Trend data ──────────────────────────────────────────────────────────────
export const SOV_TRENDS: Record<DateRangeKey, TrendPoint[]> = {
  '30d': [
  { label: 'Week 1', sov: 15.8, soe: 14.9 },
  { label: 'Week 2', sov: 16.4, soe: 15.6 },
  { label: 'Week 3', sov: 17.9, soe: 16.8 },
  { label: 'Week 4', sov: 17.1, soe: 16.2 }],

  '90d': [
  { label: 'W1-2', sov: 14.2, soe: 13.5 },
  { label: 'W3-4', sov: 14.9, soe: 14.1 },
  { label: 'W5-6', sov: 15.3, soe: 14.6 },
  { label: 'W7-8', sov: 16.1, soe: 15.2 },
  { label: 'W9-10', sov: 16.8, soe: 15.9 },
  { label: 'W11-12', sov: 17.2, soe: 16.3 }],

  '180d': [
  { label: 'Jan', sov: 12.8, soe: 12.1 },
  { label: 'Feb', sov: 13.5, soe: 12.9 },
  { label: 'Mar', sov: 14.4, soe: 13.8 },
  { label: 'Apr', sov: 15.2, soe: 14.5 },
  { label: 'May', sov: 16.3, soe: 15.4 },
  { label: 'Jun', sov: 17.1, soe: 16.2 }]

};

// ─── Week presets (Content Market Share) ─────────────────────────────────────
export type WeekPreset = 1 | 4 | 8 | 12;

export const WEEK_PRESETS: {
  weeks: WeekPreset;
  label: string;
  videos: number;
  channels: number;
  window: string;
}[] = [
{
  weeks: 1,
  label: 'Last 1 week',
  videos: 148,
  channels: 17,
  window: 'Jun 01 – Jun 08, 2026'
},
{
  weeks: 4,
  label: 'Last 4 weeks',
  videos: 312,
  channels: 17,
  window: 'May 11 – Jun 08, 2026'
},
{
  weeks: 8,
  label: 'Last 8 weeks',
  videos: 468,
  channels: 17,
  window: 'Apr 13 – Jun 08, 2026'
},
{
  weeks: 12,
  label: 'Last 12 weeks',
  videos: 602,
  channels: 17,
  window: 'Mar 11 – Jun 08, 2026'
}];

export const getWeekPreset = (weeks: WeekPreset) =>
WEEK_PRESETS.find((p) => p.weeks === weeks)!;

const BASE_TOTAL_VIDEOS = BASE_STATS_30D.reduce((acc, s) => acc + s.videos, 0);

// Brand stats scaled so category video totals match the preset's attributed
// video count; brand shares stay proportional to the 30d base.
export const getWeeklyBrandStats = (weeks: WeekPreset): BrandStats[] => {
  const factor = getWeekPreset(weeks).videos / BASE_TOTAL_VIDEOS;
  return BASE_STATS_30D.map((s) => ({
    ...s,
    videos: Math.round(s.videos * factor),
    views: Math.round(s.views * factor),
    comments: Math.round(s.comments * factor),
    likes: Math.round(s.likes * factor),
    publishRate: Number((s.videos * factor / weeks).toFixed(1))
  }));
};

// ─── Per-brand share trends ──────────────────────────────────────────────────
export type ShareMetric = 'views' | 'videos' | 'comments' | 'likes' | 'combined';

export interface ShareTrendPoint {
  label: string;
  [brandId: string]: number | string;
}

const TOTAL_TRACKED_WEEKS = 24;

// Weekly per-brand share series (W1–W24) derived from the 30d base stats,
// sliced to the last N weeks of the preset window. A small deterministic sine
// wiggle keeps lines distinguishable while every point still sums to 100% —
// no random data, stable across renders.
export const getWeeklyShareTrends = (
weeks: WeekPreset,
metric: ShareMetric)
: ShareTrendPoint[] => {
  const valueOf = (s: BrandStats): number =>
  metric === 'combined' ? s.views + s.likes + s.comments : s[metric];
  const points: ShareTrendPoint[] = [];
  for (let i = TOTAL_TRACKED_WEEKS - weeks; i < TOTAL_TRACKED_WEEKS; i++) {
    const wiggled = BASE_STATS_30D.map(
      (s, bi) => valueOf(s) * (1 + 0.08 * Math.sin(i * 1.7 + bi * 2.3))
    );
    const total = wiggled.reduce((acc, v) => acc + v, 0);
    const point: ShareTrendPoint = { label: `W${i + 1}` };
    BASE_STATS_30D.forEach((s, bi) => {
      point[s.brandId] = Number((wiggled[bi] / total * 100).toFixed(1));
    });
    points.push(point);
  }
  return points;
};

// ─── Global KPI deltas & sentiment scores per range ──────────────────────────
export const KPI_META: Record<
  DateRangeKey,
  {
    sovDelta: number;
    soeDelta: number;
    freqDelta: number;
    sentimentScore: number;
    sentimentDelta: number;
    intentDelta: number;
  }> =
{
  '30d': {
    sovDelta: 1.3,
    soeDelta: 1.1,
    freqDelta: 0.5,
    sentimentScore: 72,
    sentimentDelta: 3,
    intentDelta: 18
  },
  '90d': {
    sovDelta: 2.6,
    soeDelta: 2.2,
    freqDelta: 0.8,
    sentimentScore: 70,
    sentimentDelta: 5,
    intentDelta: 24
  },
  '180d': {
    sovDelta: 4.3,
    soeDelta: 4.1,
    freqDelta: 1.2,
    sentimentScore: 69,
    sentimentDelta: 7,
    intentDelta: 31
  }
};

// ─── Sentiment split per range (% of analyzed comments) ─────────────────────
export const SENTIMENT_SPLIT: Record<
  DateRangeKey,
  {positive: number;neutral: number;negative: number;}> =
{
  '30d': { positive: 58, neutral: 27, negative: 15 },
  '90d': { positive: 56, neutral: 28, negative: 16 },
  '180d': { positive: 54, neutral: 29, negative: 17 }
};

// Base 30d counts of purchase-intent comments by signal type
export const INTENT_BASE_COUNTS: Record<IntentSignal, number> = {
  'Buying consideration': 412,
  Shortlisting: 268,
  'Dealer inquiry': 196
};

// ─── Purchase intent comments ────────────────────────────────────────────────
export const INTENT_COMMENTS: IntentComment[] = [
{
  id: 'ic1',
  author: 'Gurpreet Singh',
  text: 'Bhai 750 III Sikander ka on-road price kitna hai Punjab mein? Dealer se baat karni hai, harvest ke baad lena hai.',
  signal: 'Dealer inquiry',
  video: 'Sonalika Tiger DI 750 III Sikander — Full Review & Field Test',
  likes: 214,
  daysAgo: 2
},
{
  id: 'ic2',
  author: 'Ramesh Patil',
  text: 'Comparing this with Mahindra 575 DI and Swaraj 744. Sonalika 745 DI III looks best value for 50 HP segment. Final decision next month.',
  signal: 'Shortlisting',
  video: 'Sonalika DI 745 III vs Competition — Which 50 HP Tractor Wins?',
  likes: 187,
  daysAgo: 4
},
{
  id: 'ic3',
  author: 'Vijay Kumar Yadav',
  text: 'Mileage figures dekh ke impressed hoon. Soch raha hoon Tiger Electric lene ka for my 8 acre farm. EMI options available hain kya?',
  signal: 'Buying consideration',
  video: 'Sonalika Tiger Electric — India ka Pehla Electric Tractor',
  likes: 342,
  daysAgo: 5
},
{
  id: 'ic4',
  author: 'Harjinder Brar',
  text: 'Booked test drive at Ludhiana dealership after watching this. Rotavator ke saath performance dekhni hai pehle.',
  signal: 'Dealer inquiry',
  video: 'Sikander DLX DI 60 — Puddling & Rotavator Performance',
  likes: 156,
  daysAgo: 7
},
{
  id: 'ic5',
  author: 'Suresh Reddy',
  text: 'Shortlisted Sonalika 60 RX and John Deere 5310. Service network in Telangana will decide. Anyone with long-term experience?',
  signal: 'Shortlisting',
  video: 'Sonalika Sikander DI 60 RX — 1000 Hours Owner Review',
  likes: 198,
  daysAgo: 9
},
{
  id: 'ic6',
  author: 'Mohit Choudhary',
  text: 'Papa ke liye naya tractor lena hai is season. 4WD wala Sikander accha lag raha hai hilly area ke liye. Price range fit ho raha hai.',
  signal: 'Buying consideration',
  video: 'Sonalika Tiger DI 750 III Sikander — Full Review & Field Test',
  likes: 121,
  daysAgo: 11
},
{
  id: 'ic7',
  author: 'Balwinder Sandhu',
  text: 'Nearest dealer Bathinda mein hai kya? Exchange offer chal raha hai purane Swaraj ke against? Number share karo please.',
  signal: 'Dealer inquiry',
  video: 'Sonalika DI 745 III vs Competition — Which 50 HP Tractor Wins?',
  likes: 94,
  daysAgo: 13
},
{
  id: 'ic8',
  author: 'Anil Jadhav',
  text: 'Between this and New Holland 3630, leaning Sonalika for the heavier lift capacity. Loan process kitna time leta hai company finance se?',
  signal: 'Buying consideration',
  video: 'Sikander DLX DI 60 — Puddling & Rotavator Performance',
  likes: 167,
  daysAgo: 16
}];


// ─── Unmet needs / content gaps ──────────────────────────────────────────────
export const UNMET_NEEDS: UnmetNeed[] = [
{
  id: 'un1',
  title: 'Real-world mileage & fuel efficiency data',
  description:
  'Viewers repeatedly ask for actual diesel consumption per acre across implements — official videos only quote lab figures.',
  frequency: 486,
  severity: 'High',
  samples: [
  {
    author: 'Kuldeep Verma',
    text: 'Sab review mein power ki baat hoti hai, par actual diesel kharcha per acre rotavator ke saath koi nahi batata.'
  },
  {
    author: 'Prakash Pawar',
    text: 'Please show real fuel consumption in puddling for 5 hours continuous. Brochure numbers field mein match nahi karte.'
  }]

},
{
  id: 'un2',
  title: 'On-road price transparency by state',
  description:
  'No content covers ex-showroom vs on-road pricing, state subsidies, or insurance costs — the single most asked question.',
  frequency: 451,
  severity: 'High',
  samples: [
  {
    author: 'Devendra Singh',
    text: 'Price video kyu nahi banate state-wise? UP mein on-road price aur subsidy ke baad final kitna padega?'
  },
  {
    author: 'Santosh Kale',
    text: 'Every video says "contact dealer for price". Make one honest video with full price breakup including RTO and insurance.'
  }]

},
{
  id: 'un3',
  title: 'Implement compatibility guidance',
  description:
  'Farmers want clear guidance on which implements (rotavator size, harrow, thresher) pair with each model and HP class.',
  frequency: 327,
  severity: 'High',
  samples: [
  {
    author: 'Jagdish Meena',
    text: '745 ke saath 7 feet rotavator chalega ya 6 feet hi sahi rahega? Koi clear video nahi hai is par.'
  },
  {
    author: 'Nitin Gaikwad',
    text: 'Need a full video on implement matching — which Sonalika models handle 2 bottom MB plough in black soil?'
  }]

},
{
  id: 'un4',
  title: 'Service network & spare parts availability',
  description:
  'Concerns about service reach in eastern & southern states and spare part pricing go unaddressed in brand content.',
  frequency: 289,
  severity: 'Medium',
  samples: [
  {
    author: 'Tapan Mahato',
    text: 'Jharkhand mein service center kitne hain? Parts ke liye 100 km jaana padta hai, yahi dar lagta hai lene se pehle.'
  },
  {
    author: 'Ravi Shankar',
    text: 'Compare spare parts cost with Mahindra and Swaraj. Service network video banao district-wise.'
  }]

},
{
  id: 'un5',
  title: 'Hindi-language detailed walkarounds',
  description:
  'Long-form Hindi walkarounds with control-by-control explanation are requested; most deep dives are English-heavy.',
  frequency: 243,
  severity: 'Medium',
  samples: [
  {
    author: 'Omprakash Kushwaha',
    text: 'Pure Hindi mein detailed video banao bhai, English mix samajh nahi aata sab kisano ko.'
  },
  {
    author: 'Bhola Prasad',
    text: 'Dashboard ke sab buttons aur levers ka kaam Hindi mein samjhao ek video mein, bahut helpful hoga.'
  }]

},
{
  id: 'un6',
  title: 'Resale value & long-term ownership costs',
  description:
  'No content addresses 5-year ownership cost or resale value vs competitors — a key purchase factor for financed buyers.',
  frequency: 178,
  severity: 'Low',
  samples: [
  {
    author: 'Manoj Bishnoi',
    text: '5 saal baad resale value kya milegi Sonalika ki vs Mahindra? Loan pe le raha hoon isliye important hai.'
  },
  {
    author: 'Ashok Rathod',
    text: 'Make a video on total cost of ownership — service, parts, tyres for 5 years. Nobody covers this honestly.'
  }]

}];


// ─── Recurring questions ─────────────────────────────────────────────────────
export const RECURRING_QUESTIONS: RecurringQuestion[] = [
{
  id: 'q1',
  question: 'What is the on-road price with subsidy in my state?',
  mentions: 412,
  videos: 31,
  answered: false
},
{
  id: 'q2',
  question: 'Actual diesel consumption per hour with rotavator?',
  mentions: 368,
  videos: 27,
  answered: false
},
{
  id: 'q3',
  question: 'Is 4WD worth the extra cost for small farms?',
  mentions: 256,
  videos: 19,
  answered: true
},
{
  id: 'q4',
  question: 'Which implements are compatible with 745 DI III?',
  mentions: 231,
  videos: 22,
  answered: false
},
{
  id: 'q5',
  question: 'How does Tiger Electric perform in peak summer?',
  mentions: 204,
  videos: 12,
  answered: false
},
{
  id: 'q6',
  question: 'What are the EMI / financing options from Sonalika?',
  mentions: 189,
  videos: 24,
  answered: true
},
{
  id: 'q7',
  question: 'Spare parts cost comparison vs Mahindra & Swaraj?',
  mentions: 167,
  videos: 16,
  answered: false
},
{
  id: 'q8',
  question: 'Warranty terms and what exactly is covered?',
  mentions: 142,
  videos: 18,
  answered: true
}];


// ─── Formatting helpers ──────────────────────────────────────────────────────
export const formatNumber = (n: number): string => {
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000) return `${(n / 100_000).toFixed(1)} L`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return n.toString();
};

export const formatPercent = (n: number, decimals = 1): string =>
`${n.toFixed(decimals)}%`;