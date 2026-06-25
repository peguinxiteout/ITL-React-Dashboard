import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCartIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  ThumbsUpIcon,
  MessageSquareIcon,
  VideoIcon,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionCard } from '../SectionCard';
import { SectionHeader } from '../SectionHeader';
import { VSSelect, VSSelectOption } from './VSSelect';
import { DateRangeKey } from '../../data/mockData';
import {
  VS_BRANDS,
  VSBrand,
  VS_WEEKS,
  VSWeek,
  VS_BRAND_COLOR,
  SECTION_LABEL,
  SECTION_COLOR,
  SectionKey,
} from './sentimentMock';
import { useVSData } from '../../hooks/useVSData';

interface SentimentTabProps {
  dateRange: DateRangeKey;
  globalDateRange?: { startDate: string; endDate: string };
  setGlobalDateRange?: (v: any) => void;
}

const SIGNAL_BADGE: Record<string, string> = {
  'Buying consideration': 'bg-blue-50 text-blue-700',
  Shortlisting: 'bg-amber-50 text-amber-700',
  'Dealer inquiry': 'bg-emerald-50 text-emerald-700',
};

const SEVERITY_BADGE: Record<string, string> = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600',
};

const TYPE_BADGE_CLS: Record<string, string> = {
  price_inquiry: 'bg-amber-50 text-amber-700',
  spec_inquiry: 'bg-teal-50 text-teal-700',
  content_request: 'bg-blue-50 text-blue-700',
  availability_inquiry: 'bg-purple-50 text-purple-700',
};

const QUESTION_TYPE_COLORS: Record<string, string> = {
  price_inquiry: '#1D4ED8',
  spec_inquiry: '#16A34A',
  content_request: '#D97706',
  availability_inquiry: '#7C3AED',
};
const QT_COLOR_FALLBACKS = ['#0EA5E9', '#EC4899', '#64748B'];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' } },
};

const BRAND_OPTIONS: VSSelectOption[] = VS_BRANDS.map((b) => ({
  value: b,
  label: b,
  color: b === 'All Brands' ? undefined : VS_BRAND_COLOR[b],
}));

const WEEK_OPTIONS: VSSelectOption[] = VS_WEEKS.map((w) => ({
  value: w,
  label: w,
}));

type VSSectionId = 'pi' | 'un' | 'rq';

const VS_ACCENT: Record<VSSectionId, string> = {
  pi: '#185FA5',
  un: '#D85A30',
  rq: '#1D9E75',
};

const DEFAULT_VISIBLE = 5;

function BrandDot({ brand, size = 8 }: { brand: string; size?: number }) {
  const color = VS_BRAND_COLOR[brand];
  if (!color) return null;
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor: color,
        flexShrink: 0,
      }}
    />
  );
}

function SectionDivider({
  section,
  rate,
  week,
  onWeekChange,
}: {
  section: SectionKey;
  rate: number;
  week: VSWeek;
  onWeekChange: (w: VSWeek) => void;
}) {
  const c = SECTION_COLOR[section];
  return (
    <div className="flex items-center gap-3">
      <span
        className="inline-flex shrink-0 items-center rounded-full px-3 py-1 text-xs font-semibold"
        style={{ backgroundColor: c.bg, color: c.tag }}
      >
        {SECTION_LABEL[section]} · {rate}%
      </span>
      <VSSelect
        size="sm"
        value={week}
        options={WEEK_OPTIONS}
        onChange={(v) => onWeekChange(v as VSWeek)}
        ariaLabel={`${SECTION_LABEL[section]} week filter`}
      />
      <div className="h-px flex-1 bg-slate-200" />
    </div>
  );
}

function EmptyRow({ label }: { label: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-sm text-slate-400">
      No {label} for this brand / time window.
    </div>
  );
}

function ViewAllButton({
  expanded,
  collapsedLabel,
  color,
  onClick,
}: {
  expanded: boolean;
  collapsedLabel: string;
  color: string;
  onClick: () => void;
}) {
  return (
    <div className="mt-3 flex justify-end">
      <button
        type="button"
        onClick={onClick}
        style={{
          background: 'none',
          border: 'none',
          padding: 0,
          fontSize: 12,
          color,
          cursor: 'pointer',
        }}
      >
        {expanded ? 'Show less ←' : collapsedLabel}
      </button>
    </div>
  );
}

function BrandBars({
  byBrand,
  selectedBrand,
}: {
  byBrand: { brand: string; count: number }[];
  selectedBrand: VSBrand;
}) {
  const max = Math.max(...byBrand.map((d) => d.count), 1);
  return (
    <div className="space-y-2.5">
      {byBrand.map((d) => {
        const muted = selectedBrand !== 'All Brands' && d.brand !== selectedBrand;
        const color = muted ? '#cbd5e1' : (VS_BRAND_COLOR[d.brand] || '#94a3b8');
        return (
          <div key={d.brand} className="flex items-center gap-3">
            <span
              className="w-28 shrink-0 truncate text-xs"
              style={{
                color: muted ? '#94a3b8' : '#334155',
                fontWeight: !muted && selectedBrand !== 'All Brands' ? 700 : 400,
              }}
            >
              {d.brand}
            </span>
            <div className="relative h-4 flex-1 overflow-hidden rounded bg-slate-100">
              <div
                className="absolute inset-y-0 left-0 rounded"
                style={{
                  width: `${(d.count / max) * 100}%`,
                  backgroundColor: color,
                  opacity: muted ? 0.5 : 1,
                }}
              />
            </div>
            <span
              className="w-8 shrink-0 text-right text-xs tabular-nums"
              style={{ color: muted ? '#94a3b8' : '#334155' }}
            >
              {d.count}
            </span>
          </div>
        );
      })}
      <p className="pt-1 text-[11px] text-slate-400">
        Cross-brand reference — selected brand highlighted, others muted.
      </p>
    </div>
  );
}

export function SentimentTab({ dateRange }: SentimentTabProps) {
  void dateRange;

  const [selectedVSBrand, setSelectedVSBrand] = useState<VSBrand>('All Brands');
  const [activeVSSection, setActiveVSSection] = useState<VSSectionId>('pi');
  const [intentWeek, setIntentWeek] = useState<VSWeek>('All time');
  const [needsWeek, setNeedsWeek] = useState<VSWeek>('All time');
  const [questionsWeek, setQuestionsWeek] = useState<VSWeek>('All time');

  const [piVideosOpen, setPiVideosOpen] = useState(false);
  const [piCommentsOpen, setPiCommentsOpen] = useState(false);
  const [unVideosOpen, setUnVideosOpen] = useState(false);
  const [unCommentsOpen, setUnCommentsOpen] = useState(false);
  const [rqQuestionsOpen, setRqQuestionsOpen] = useState(false);
  const [topRecurringOpen, setTopRecurringOpen] = useState(false);

  const {
    loading,
    error,
    kpiSummary,
    intentKpi,
    needsKpi,
    questionsKpi,
    purchaseIntentData,
    unmetNeedsData,
    recurringQuestionsData,
  } = useVSData({
    brand: selectedVSBrand,
    intentWeek,
    needsWeek,
    questionsWeek,
  });

  if (loading) {
    return (
      <div className="px-4 py-10 text-center" style={{ fontSize: 13, color: '#94a3b8' }}>
        Loading data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="px-4 py-10 text-center" style={{ fontSize: 13, color: '#ef4444' }}>
        Failed to load data.
      </div>
    );
  }

  const brand = selectedVSBrand;

  const summaryCards = [
    {
      key: 'intent' as SectionKey,
      section: 'pi' as VSSectionId,
      accent: VS_ACCENT.pi,
      label: 'Purchase Intent Rate',
      icon: <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />,
      rate: kpiSummary.pi_rate,
      count: kpiSummary.pi_count,
      countLabel: 'intent comments',
    },
    {
      key: 'needs' as SectionKey,
      section: 'un' as VSSectionId,
      accent: VS_ACCENT.un,
      label: 'Unmet Needs Rate',
      icon: <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />,
      rate: kpiSummary.un_rate,
      count: kpiSummary.un_count,
      countLabel: 'needs detected',
    },
    {
      key: 'questions' as SectionKey,
      section: 'rq' as VSSectionId,
      accent: VS_ACCENT.rq,
      label: 'Recurring Questions Rate',
      icon: <HelpCircleIcon className="h-5 w-5" aria-hidden="true" />,
      rate: kpiSummary.qs_rate,
      count: kpiSummary.qs_count,
      countLabel: 'questions detected',
    },
  ];

  // Stage funnel
  const funnel = purchaseIntentData.stageDistribution;
  const funnelMax = Math.max(...funnel.map((s) => s.count), 1);

  // Need tiles
  const needTiles = unmetNeedsData.needTypeDist;

  // Feature areas
  const featureAreas = unmetNeedsData.featureAreas;
  const featureMax = Math.max(...featureAreas.map((f) => f.count), 1);

  // Question types with colors for donut
  const questionTypes = recurringQuestionsData.questionTypeDist.map((q, i) => ({
    ...q,
    color: QUESTION_TYPE_COLORS[q.type] || QT_COLOR_FALLBACKS[i % QT_COLOR_FALLBACKS.length],
  }));
  const questionTypesTotal = questionTypes.reduce((a, q) => a + q.count, 0);

  // Clusters
  const clusters = recurringQuestionsData.clusters;
  const crossVideoClusters = clusters.filter((c) => c.is_cross_video === true || c.is_cross_video === 'True');
  const recurringClustersCount = clusters.length;
  const mostAskedFreq = clusters.length > 0 ? Math.max(...clusters.map((c) => c.frequency || 0)) : 0;
  const unansweredCount = recurringClustersCount - crossVideoClusters.length;

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-5">
      {/* Header */}
      <motion.div variants={item}>
        <SectionHeader
          title="Viewer Sentiment"
          descriptor="Purchase intent, unmet needs, and recurring questions from viewer comments"
          meta={`Based on ${kpiSummary.total_comments.toLocaleString()} analyzed comments · real data`}
        />
      </motion.div>

      {/* Control bar */}
      <motion.div variants={item}>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Brand</span>
          <VSSelect
            size="lg"
            value={selectedVSBrand}
            options={BRAND_OPTIONS}
            onChange={(v) => setSelectedVSBrand(v as VSBrand)}
            ariaLabel="Brand filter"
          />
        </div>
      </motion.div>

      {/* Summary cards */}
      <motion.div variants={item} className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {summaryCards.map((card) => {
          const active = activeVSSection === card.section;
          return (
            <button
              type="button"
              key={card.key}
              onClick={() => setActiveVSSection(card.section)}
              aria-pressed={active}
              className={`rounded-xl p-4 text-left transition ${active ? 'bg-white shadow-sm' : 'bg-slate-100'}`}
              style={{
                border: active ? '1px solid #e2e8f0' : '1px solid transparent',
                borderLeft: `4px solid ${active ? card.accent : 'transparent'}`,
              }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: active ? `${card.accent}1A` : '#e2e8f0',
                    color: active ? card.accent : '#94a3b8',
                  }}
                >
                  {card.icon}
                </span>
                <p className={`text-sm font-medium ${active ? 'text-slate-700' : 'text-slate-400'}`}>
                  {card.label}
                </p>
              </div>
              <p className={`mt-3 text-2xl font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                {card.rate}%
              </p>
              <p className={`text-xs ${active ? 'text-slate-500' : 'text-slate-400'}`}>
                {card.count} {card.countLabel}
              </p>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(card.rate, 100)}%`,
                    backgroundColor: active ? card.accent : '#cbd5e1',
                  }}
                />
              </div>
            </button>
          );
        })}
      </motion.div>

      {/* ───────────── Purchase Intent ───────────── */}
      {activeVSSection === 'pi' && (
        <motion.div variants={item} className="space-y-4">
          <SectionDivider
            section="intent"
            rate={intentKpi.pi_rate}
            week={intentWeek}
            onWeekChange={setIntentWeek}
          />

          {/* Lost sale signals alert */}
          {kpiSummary.pi_lost_sales > 0 ? (
            <div
              className="rounded-lg border border-red-100 bg-red-50 px-4 py-2.5 text-sm text-red-700"
            >
              <strong>{kpiSummary.pi_lost_sales}</strong> lost-sale signal{kpiSummary.pi_lost_sales !== 1 ? 's' : ''} detected in current corpus.
            </div>
          ) : (
            <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-400">
              No lost-sale signals detected in current corpus.
            </div>
          )}

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Stage distribution funnel */}
            <SectionCard
              title="Stage Distribution"
              subtitle="Comment volume by buying-journey stage"
            >
              {funnel.length === 0 ? (
                <EmptyRow label="stage data" />
              ) : (
                <div className="space-y-2.5">
                  {funnel.map((s) => (
                    <div key={s.stage}>
                      <div className="mb-1 flex items-center justify-between text-xs text-slate-600">
                        <span>{s.stage}</span>
                        <span className="tabular-nums font-medium text-slate-700">{s.count}</span>
                      </div>
                      <div className="h-4 overflow-hidden rounded bg-slate-100">
                        <div
                          className="h-full rounded bg-blue-600"
                          style={{ width: `${(s.count / funnelMax) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Intent by brand */}
            <SectionCard title="Intent by Brand" subtitle="Purchase-intent comments per brand">
              {purchaseIntentData.byBrand.length === 0 ? (
                <EmptyRow label="brand data" />
              ) : (
                <BrandBars byBrand={purchaseIntentData.byBrand} selectedBrand={brand} />
              )}
            </SectionCard>
          </div>

          {/* Purchase intent by video */}
          <SectionCard
            title="Purchase Intent by Video"
            subtitle="Videos driving buying-consideration comments"
          >
            {purchaseIntentData.byVideo.length === 0 ? (
              <EmptyRow label="intent videos" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="py-2.5 pr-4 font-semibold">Video</th>
                        <th className="py-2.5 pr-4 font-semibold">Brand</th>
                        <th className="py-2.5 pr-4 font-semibold">Intent comments</th>
                        <th className="py-2.5 pr-4 font-semibold">Top signal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(piVideosOpen
                        ? purchaseIntentData.byVideo
                        : purchaseIntentData.byVideo.slice(0, DEFAULT_VISIBLE)
                      ).map((v, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{v.title}</td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <BrandDot brand={v.brand} size={7} />
                              {v.brand || '—'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-slate-700">{v.intent_count}</td>
                          <td className="py-3 pr-4">
                            {v.topSignal ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIGNAL_BADGE[v.topSignal] ?? 'bg-slate-100 text-slate-600'}`}
                              >
                                {v.topSignal}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {purchaseIntentData.byVideo.length > DEFAULT_VISIBLE && (
                  <ViewAllButton
                    expanded={piVideosOpen}
                    collapsedLabel="View all videos →"
                    color={VS_ACCENT.pi}
                    onClick={() => setPiVideosOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </SectionCard>

          {/* Purchase intent comment cards */}
          <SectionCard
            title="Purchase Intent Comments"
            subtitle="Representative comments indicating buying intent"
          >
            {purchaseIntentData.topComments.length === 0 ? (
              <EmptyRow label="intent comments" />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(piCommentsOpen
                    ? purchaseIntentData.topComments
                    : purchaseIntentData.topComments.slice(0, DEFAULT_VISIBLE)
                  ).map((c, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <BrandDot brand={c.pi_brand} size={8} />
                        <span className="text-sm font-semibold text-slate-900">
                          {c.pi_brand || 'Viewer'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIGNAL_BADGE[c.pi_stage] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {c.pi_stage}
                        </span>
                        <span className="ml-auto text-xs text-slate-400">{c.weeksAgo}w ago</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                        {c.comment_text}
                      </p>
                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span className="truncate text-xs text-slate-500">on: {c.title}</span>
                        <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                          <ThumbsUpIcon className="h-3 w-3" aria-hidden="true" /> {c.comment_likeCount}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {purchaseIntentData.topComments.length > DEFAULT_VISIBLE && (
                  <ViewAllButton
                    expanded={piCommentsOpen}
                    collapsedLabel={`View all ${kpiSummary.pi_count} comments →`}
                    color={VS_ACCENT.pi}
                    onClick={() => setPiCommentsOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </SectionCard>
        </motion.div>
      )}

      {/* ───────────── Unmet Needs ───────────── */}
      {activeVSSection === 'un' && (
        <motion.div variants={item} className="space-y-4">
          <SectionDivider
            section="needs"
            rate={needsKpi.un_rate}
            week={needsWeek}
            onWeekChange={setNeedsWeek}
          />

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Need type tile grid */}
            <SectionCard title="Need Types" subtitle="Comment volume by unmet-need category">
              {needTiles.length === 0 ? (
                <EmptyRow label="need type data" />
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {needTiles.map((t) => (
                    <div key={t.type} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                      <p className="text-xl font-bold text-slate-900 tabular-nums">{t.count}</p>
                      <p className="mt-0.5 text-xs text-slate-500">{t.type}</p>
                    </div>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* Top complained feature areas */}
            <SectionCard
              title="Top Complained Feature Areas"
              subtitle="Ranked by mention volume"
            >
              {featureAreas.length === 0 ? (
                <EmptyRow label="feature area data" />
              ) : (
                <ol className="space-y-2.5">
                  {featureAreas.map((f, i) => (
                    <li key={f.area} className="flex items-center gap-3">
                      <span className="w-5 shrink-0 text-sm font-bold text-slate-400">#{i + 1}</span>
                      <span className="w-36 shrink-0 truncate text-xs text-slate-700">{f.area}</span>
                      <div className="relative h-3.5 flex-1 overflow-hidden rounded bg-slate-100">
                        <div
                          className="absolute inset-y-0 left-0 rounded bg-amber-500"
                          style={{ width: `${(f.count / featureMax) * 100}%` }}
                        />
                      </div>
                      <span className="w-8 shrink-0 text-right text-xs tabular-nums text-slate-700">
                        {f.count}
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </SectionCard>
          </div>

          {/* Unmet needs by video */}
          <SectionCard
            title="Unmet Needs by Video"
            subtitle="Videos surfacing the most content gaps"
          >
            {unmetNeedsData.byVideo.length === 0 ? (
              <EmptyRow label="unmet-need videos" />
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[560px] text-sm">
                    <thead>
                      <tr className="border-b border-slate-200 text-left text-slate-600">
                        <th className="py-2.5 pr-4 font-semibold">Video</th>
                        <th className="py-2.5 pr-4 font-semibold">Brand</th>
                        <th className="py-2.5 pr-4 font-semibold">Need mentions</th>
                        <th className="py-2.5 pr-4 font-semibold">Severity</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(unVideosOpen
                        ? unmetNeedsData.byVideo
                        : unmetNeedsData.byVideo.slice(0, DEFAULT_VISIBLE)
                      ).map((v, i) => (
                        <tr key={i} className="border-b border-slate-100 last:border-0">
                          <td className="py-3 pr-4 font-medium text-slate-900">{v.title}</td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1.5 text-slate-600">
                              <BrandDot brand={v.brand} size={7} />
                              {v.brand || '—'}
                            </span>
                          </td>
                          <td className="py-3 pr-4 tabular-nums text-slate-700">{v.needs_count}</td>
                          <td className="py-3 pr-4">
                            {v.topSeverity ? (
                              <span
                                className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGE[v.topSeverity] ?? 'bg-slate-100 text-slate-600'}`}
                              >
                                {v.topSeverity}
                              </span>
                            ) : (
                              <span className="text-slate-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {unmetNeedsData.byVideo.length > DEFAULT_VISIBLE && (
                  <ViewAllButton
                    expanded={unVideosOpen}
                    collapsedLabel="View all videos →"
                    color={VS_ACCENT.un}
                    onClick={() => setUnVideosOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </SectionCard>

          {/* Unmet need comment cards */}
          <SectionCard
            title="Unmet Need Comments"
            subtitle="Representative pain points expressed by viewers"
          >
            {unmetNeedsData.topComments.length === 0 ? (
              <EmptyRow label="unmet-need comments" />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(unCommentsOpen
                    ? unmetNeedsData.topComments
                    : unmetNeedsData.topComments.slice(0, DEFAULT_VISIBLE)
                  ).map((c, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <BrandDot brand={c.un_brand} size={8} />
                        <span className="text-sm font-semibold text-slate-900">
                          {c.un_brand || 'Viewer'}
                        </span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_BADGE[c.un_intensity] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {c.un_intensity}
                        </span>
                        <span className="ml-auto text-xs text-slate-400">{c.weeksAgo}w ago</span>
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                        {c.comment_text}
                      </p>
                      <div className="mt-2 flex items-center gap-2 text-xs text-slate-500">
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600">
                          {c.un_need_type}
                        </span>
                        <span className="truncate">on: {c.title}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                {unmetNeedsData.topComments.length > DEFAULT_VISIBLE && (
                  <ViewAllButton
                    expanded={unCommentsOpen}
                    collapsedLabel={`View all ${kpiSummary.un_count} comments →`}
                    color={VS_ACCENT.un}
                    onClick={() => setUnCommentsOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </SectionCard>
        </motion.div>
      )}

      {/* ───────────── Recurring Questions ───────────── */}
      {activeVSSection === 'rq' && (
        <motion.div variants={item} className="space-y-4">
          <SectionDivider
            section="questions"
            rate={questionsKpi.qs_rate}
            week={questionsWeek}
            onWeekChange={setQuestionsWeek}
          />

          {/* Unanswered callout */}
          <div className="rounded-lg border border-slate-100 bg-slate-50 px-4 py-2.5 text-sm text-slate-600">
            <strong>{unansweredCount}</strong> of {recurringClustersCount} clusters may be unanswered (not yet cross-video).
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            {/* Question types donut */}
            <SectionCard title="Question Types" subtitle="Share of recurring questions by topic">
              <div className="flex items-center gap-4">
                <div className="h-44 w-44 shrink-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={questionTypes}
                        dataKey="count"
                        nameKey="type"
                        cx="50%"
                        cy="50%"
                        innerRadius={42}
                        outerRadius={72}
                        paddingAngle={2}
                        stroke="none"
                      >
                        {questionTypes.map((q) => (
                          <Cell key={q.type} fill={q.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: number) => [value, 'Questions']}
                        contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <ul className="flex-1 space-y-1.5">
                  {questionTypes.map((q) => (
                    <li key={q.type} className="flex items-center gap-2 text-xs text-slate-600">
                      <span
                        className="inline-block h-2.5 w-2.5 shrink-0 rounded-full"
                        style={{ backgroundColor: q.color }}
                      />
                      <span className="flex-1 truncate">{q.type}</span>
                      <span className="tabular-nums font-medium text-slate-700">
                        {questionTypesTotal > 0
                          ? Math.round((q.count / questionTypesTotal) * 100)
                          : 0}
                        %
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionCard>

            {/* Questions by brand */}
            <SectionCard title="Questions by Brand" subtitle="Recurring questions per brand">
              {recurringQuestionsData.byBrand.length === 0 ? (
                <EmptyRow label="brand data" />
              ) : (
                <BrandBars byBrand={recurringQuestionsData.byBrand} selectedBrand={brand} />
              )}
            </SectionCard>
          </div>

          {/* Top questions by engagement */}
          <SectionCard
            title="Top Questions by Engagement"
            subtitle="Most-liked recurring questions"
          >
            {recurringQuestionsData.topQuestions.length === 0 ? (
              <EmptyRow label="top questions" />
            ) : (
              <>
                <ul className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  {(rqQuestionsOpen
                    ? recurringQuestionsData.topQuestions
                    : recurringQuestionsData.topQuestions.slice(0, DEFAULT_VISIBLE)
                  ).map((q, i) => (
                    <li key={i} className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                      <div className="flex items-center gap-2">
                        <BrandDot brand={q.qs_brand} size={8} />
                        <span className="text-xs text-slate-500">{q.qs_brand || '—'}</span>
                        <span className="ml-auto text-xs text-slate-400">{q.weeksAgo}w ago</span>
                      </div>
                      <p className="mt-1.5 text-sm font-medium leading-relaxed text-slate-800">
                        {q.qs_normalized_question}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                          <ThumbsUpIcon className="h-3 w-3" aria-hidden="true" />
                          {q.comment_likeCount}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquareIcon className="h-3 w-3" aria-hidden="true" />
                          —
                        </span>
                        <span
                          className="flex min-w-0 flex-1 items-center gap-1 truncate"
                          style={{ fontSize: '11px', color: 'var(--color-text-secondary)' }}
                          title={q.title}
                        >
                          <VideoIcon
                            className="shrink-0"
                            style={{ width: '11px', height: '11px' }}
                            aria-hidden="true"
                          />
                          <span className="truncate">{q.title}</span>
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
                {recurringQuestionsData.topQuestions.length > DEFAULT_VISIBLE && (
                  <ViewAllButton
                    expanded={rqQuestionsOpen}
                    collapsedLabel={`View all ${kpiSummary.qs_count} questions →`}
                    color={VS_ACCENT.rq}
                    onClick={() => setRqQuestionsOpen((o) => !o)}
                  />
                )}
              </>
            )}
          </SectionCard>

          {/* Recurring clusters accordion */}
          <SectionCard
            title="Recurring Question Clusters"
            subtitle="Grouped semantically-similar questions — click to expand"
          >
            {/* Headline metrics */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Recurring Clusters', value: recurringClustersCount },
                { label: 'Most Asked (freq)', value: mostAskedFreq },
              ].map((m) => (
                <div key={m.label} className="rounded-lg border border-slate-100 bg-slate-50 p-3">
                  <p className="text-xs text-slate-500">{m.label}</p>
                  <p className="mt-0.5 text-2xl font-bold text-slate-900 tabular-nums">{m.value}</p>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, borderTop: '0.5px solid #e2e8f0' }} />

            {/* Top Recurring Questions table */}
            <p className="mb-1 text-sm font-semibold text-slate-900" style={{ marginTop: 20 }}>
              Top Recurring Questions
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="py-2.5 pr-4 font-semibold">Question</th>
                    <th className="py-2.5 pr-4 font-semibold">Frequency</th>
                    <th className="py-2.5 pr-4 font-semibold">Total Likes</th>
                    <th className="py-2.5 pr-4 font-semibold">Videos</th>
                    <th className="py-2.5 pr-4 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {([...clusters].sort((a, b) => (b.frequency || 0) - (a.frequency || 0)))
                    .slice(0, topRecurringOpen ? undefined : DEFAULT_VISIBLE)
                    .map((q, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="py-3 pr-4 font-medium text-slate-900">
                          {q.canonical_question}
                        </td>
                        <td className="py-3 pr-4 tabular-nums text-slate-700">{q.frequency}</td>
                        <td className="py-3 pr-4 tabular-nums text-slate-700">{q.total_likes}</td>
                        <td className="py-3 pr-4 tabular-nums text-slate-700">{q.video_count}</td>
                        <td className="py-3 pr-4">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_BADGE_CLS[q.question_type] ?? 'bg-slate-100 text-slate-600'}`}
                          >
                            {q.question_type}
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
            {clusters.length > DEFAULT_VISIBLE && (
              <ViewAllButton
                expanded={topRecurringOpen}
                collapsedLabel="View all →"
                color={VS_ACCENT.rq}
                onClick={() => setTopRecurringOpen((o) => !o)}
              />
            )}

            {/* Questions appearing across multiple videos table */}
            <div className="my-4 border-t border-slate-100" />
            <p className="mb-0.5 text-sm font-semibold text-slate-900">
              Questions appearing across multiple videos
            </p>
            <p className="mb-3 text-sm text-slate-500">
              Same question raised in 2+ videos — strongest content gap signal
            </p>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-slate-600">
                    <th className="py-2.5 pr-4 font-semibold">Question</th>
                    <th className="py-2.5 pr-4 font-semibold">Frequency</th>
                    <th className="py-2.5 pr-4 font-semibold">Total Likes</th>
                    <th className="py-2.5 pr-4 font-semibold">Videos</th>
                    <th className="py-2.5 pr-4 font-semibold">Type</th>
                  </tr>
                </thead>
                <tbody>
                  {crossVideoClusters.map((q, i) => (
                    <tr key={i} className="border-b border-slate-100 last:border-0">
                      <td className="py-3 pr-4 font-medium text-slate-900">
                        {q.canonical_question}
                      </td>
                      <td className="py-3 pr-4 tabular-nums text-slate-700">{q.frequency}</td>
                      <td className="py-3 pr-4 tabular-nums text-slate-700">{q.total_likes}</td>
                      <td className="py-3 pr-4 tabular-nums text-slate-700">{q.video_count}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${TYPE_BADGE_CLS[q.question_type] ?? 'bg-slate-100 text-slate-600'}`}
                        >
                          {q.question_type}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {crossVideoClusters.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-4 text-center text-sm text-slate-400">
                        No cross-video questions found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </SectionCard>
        </motion.div>
      )}
    </motion.div>
  );
}
