import { ChangeEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  VideoIcon, TractorIcon, TagIcon,
  MegaphoneIcon, HeartHandshakeIcon, CalendarClockIcon,
  SmileIcon, ShoppingCartIcon, TrendingUpIcon, TrendingDownIcon,
} from 'lucide-react';

import { DashboardHeader } from '../components/DashboardHeader';
import { SectionCard } from '../components/SectionCard';
import { MarketShareTab } from '../components/market-share/MarketShareTab';
import { SentimentTab } from '../components/sentiment/SentimentTab';
import { COMPETITORS, DateRangeKey, TabKey } from '../data/mockData';
import VoiceInfluencerTab from '../components/influencer/VoiceInfluencerTab';
import CompetitivePositioningTab from '../components/positioning/CompetitivePositioningTab';
import { useScreenInit } from '../useScreenInit';
import {
  useCMSData,
  computeOverviewStats,
  computeCategoryData,
  computeChannelCoverage,
  computeBrandChannelMatrix,
  type CategoryItem,
  type ChannelCoverage,
  type BrandChannelRow,
} from '../hooks/useCMSData.js';
import { useVSData } from '../hooks/useVSData';

export interface GlobalDateRange {
  startDate: string;
  endDate: string;
}

const MIN_DATE = '2026-03-01';
const MAX_DATE = '2026-06-10';

const BRAND_ORDER = [
  'Sonalika', 'Mahindra', 'Swaraj', 'John Deere',
  'New Holland', 'Massey Ferguson', 'Escorts Kubota',
];

const CATEGORY_COLOR_MAP: Record<string, string> = {
  Tractor: '#185FA5',
  'Non-Tractor': '#9CA3AF',
};
const EXTRA_CATEGORY_COLORS = ['#1D9E75', '#EF9F27', '#AFA9EC', '#F0997B', '#ED93B1'];

function categoryColor(name: string, index: number): string {
  return CATEGORY_COLOR_MAP[name] ?? EXTRA_CATEGORY_COLORS[index] ?? '#94a3b8';
}

// ─── Heatmap colour helpers (mirrors ContentFrequencyChart) ──────────────────
function interpolateColor(value: number, min: number, max: number): string {
  if (max === min || value === 0) return '#E6F1FB';
  const normalized = (value - min) / (max - min);
  const light = [230, 241, 251];
  const dark = [12, 68, 124];
  const r = Math.round(light[0] + (dark[0] - light[0]) * normalized);
  const g = Math.round(light[1] + (dark[1] - light[1]) * normalized);
  const b = Math.round(light[2] + (dark[2] - light[2]) * normalized);
  return `rgb(${r}, ${g}, ${b})`;
}

function getTextColor(bgColor: string): string {
  const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#1f2937';
  const luminance = (parseInt(match[1]) * 299 + parseInt(match[2]) * 587 + parseInt(match[3]) * 114) / 1000;
  return luminance > 127.5 ? '#1f2937' : '#ffffff';
}

// ─── Date arithmetic (UTC-safe, no timezone drift) ────────────────────────────
const MS_PER_DAY = 86400000;

function dateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToIso(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// ─── Shared input style ───────────────────────────────────────────────────────
const dateInputStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '0.5px solid #cbd5e1',
  borderRadius: 6,
  fontSize: 13,
  padding: '6px 10px',
  outline: 'none',
  cursor: 'pointer',
  color: '#0f172a',
};

// ─── OverviewKpiCard ──────────────────────────────────────────────────────────
// Renders one KPI tile. delta=null shows a gray "no prior data" badge.
function OverviewKpiCard({
  icon,
  label,
  value,
  caption,
  delta,
  deltaSuffix,
  nullLabel = '— pts',
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  caption: string;
  delta: number | null;
  deltaSuffix: string;
  nullLabel?: string;
}) {
  const positive = (delta ?? 0) >= 0;
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
          {icon}
        </span>
        {delta === null ? (
          <span style={{
            background: '#f1f5f9', color: '#94a3b8', fontSize: 11,
            fontWeight: 600, padding: '2px 8px', borderRadius: 12,
          }}>
            {nullLabel}
          </span>
        ) : (
          <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
            {positive
              ? <TrendingUpIcon className="h-3 w-3" aria-hidden="true" />
              : <TrendingDownIcon className="h-3 w-3" aria-hidden="true" />}
            {positive ? '+' : ''}{delta}{deltaSuffix}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">{value}</p>
      <p className="text-sm font-medium text-slate-700">{label}</p>
      <p className="mt-0.5 text-xs text-slate-500">{caption}</p>
    </div>
  );
}

// ─── OverviewCard (summary metric tiles) ─────────────────────────────────────
function OverviewCard({
  icon, label, value, descriptor,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  descriptor: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
        <span style={{ color: '#94a3b8', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', color: '#94a3b8', textTransform: 'uppercase' }}>
          {label}
        </span>
      </div>
      <p style={{ fontSize: 30, fontWeight: 500, color: '#0f172a', lineHeight: 1, margin: '0 0 6px 0' }}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{descriptor}</p>
    </div>
  );
}

// ─── CategoryVideosCard ───────────────────────────────────────────────────────
function CategoryVideosCard({ data, loading }: { data: CategoryItem[]; loading: boolean }) {
  const maxCount = data.length > 0 ? Math.max(...data.map((d) => d.count)) : 1;
  return (
    <SectionCard
      title="Total Category Videos"
      subtitle="Content breakdown by category across all monitored channels"
    >
      {loading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Loading…</p>
      ) : (
        <>
          <div>
            {data.map((item, i) => (
              <div
                key={item.category}
                style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: i < data.length - 1 ? 10 : 0 }}
              >
                <span style={{ width: 120, fontSize: 13, fontWeight: 500, color: '#0f172a', flexShrink: 0 }}>
                  {item.category}
                </span>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 32,
                      borderRadius: 4,
                      width: `${(item.count / maxCount) * 100}%`,
                      backgroundColor: categoryColor(item.category, i),
                    }}
                  />
                </div>
                <span style={{ fontSize: 12, color: '#94a3b8', marginLeft: 10, whiteSpace: 'nowrap' }}>
                  {item.count.toLocaleString()} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
            ))}
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 14, marginBottom: 0 }}>
            Categories derived from pipeline classification. Additional categories will appear automatically as the pipeline is updated.
          </p>
        </>
      )}
    </SectionCard>
  );
}

// ─── ChannelCoverageCard ──────────────────────────────────────────────────────
function ChannelCoverageCard({
  data, totalMonitored, loading,
}: {
  data: ChannelCoverage;
  totalMonitored: number;
  loading: boolean;
}) {
  const pct = totalMonitored > 0 ? (data.tractorChannels / totalMonitored) * 100 : 0;
  return (
    <SectionCard
      title="Channel Coverage"
      subtitle="Monitored channel activity in selected date window"
    >
      {loading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Loading…</p>
      ) : (
        <>
          <div>
            <p style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.1 }}>
              {data.tractorChannels} of {totalMonitored} channels
            </p>
            <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
              contributed tractor content in selected window
            </p>
            <div style={{ background: '#E5E7EB', height: 6, borderRadius: 3, marginTop: 10 }}>
              <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: '#185FA5' }} />
            </div>
            <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', margin: '4px 0 0 0' }}>
              ({data.activeChannels} channels published any content in this window)
            </p>
          </div>
          <div style={{ borderTop: '0.5px solid #e2e8f0', margin: '14px 0' }} />
          <div>
            <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: '0 0 6px 0' }}>
              Not yet contributing tractor content:
            </p>
            <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
              {data.inactiveChannelNames.join(', ')}
            </p>
          </div>
        </>
      )}
    </SectionCard>
  );
}

// ─── BrandChannelHeatmap ──────────────────────────────────────────────────────
function BrandChannelHeatmap({ data, loading }: { data: BrandChannelRow[]; loading: boolean }) {
  const allValues = data.flatMap((r) => BRAND_ORDER.map((b) => r.brandCounts[b] ?? 0));
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;
  const channelColW = 130;
  const legendColW = 50;

  // Inline card with 12px padding so the table uses maximum width
  return (
    <section style={{ borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: 12 }}>
      <div style={{ marginBottom: 12 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Brand × Channel presence</h3>
        <p style={{ fontSize: 14, color: '#64748b', margin: '2px 0 0 0' }}>Videos per channel per brand — which channels cover which brands</p>
      </div>

      {loading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>Loading…</p>
      ) : (
        <>
          <div style={{ overflowX: 'auto' }}>
            <div style={{ position: 'relative' }}>
              <table style={{ tableLayout: 'fixed', width: '100%', borderCollapse: 'collapse' }}>
                <colgroup>
                  <col style={{ width: channelColW }} />
                  {BRAND_ORDER.map((b) => <col key={b} />)}
                  <col style={{ width: legendColW }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ height: 28, verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }} />
                    {BRAND_ORDER.map((brand) => (
                      <th
                        key={brand}
                        style={{
                          textAlign: 'center', fontSize: 11, fontWeight: 500,
                          color: '#64748b', padding: '6px 4px', height: 28,
                          verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0',
                        }}
                      >
                        {brand}
                      </th>
                    ))}
                    <th style={{ height: 28, borderBottom: '1px solid #e2e8f0' }} />
                  </tr>
                </thead>
                <tbody>
                  {data.map((row, i) => (
                    <tr key={row.channelName}>
                      <td style={{
                        textAlign: 'right', paddingRight: 8, fontSize: 11,
                        color: '#334155', height: 28, verticalAlign: 'middle',
                        backgroundColor: i % 2 === 0 ? 'rgba(0,0,0,0.01)' : 'transparent',
                      }}>
                        {row.channelName}
                      </td>
                      {BRAND_ORDER.map((brand) => {
                        const value = row.brandCounts[brand] ?? 0;
                        const bgColor = interpolateColor(value, 0, maxVal);
                        const textColor = getTextColor(bgColor);
                        return (
                          <td
                            key={brand}
                            style={{
                              height: 28, textAlign: 'center', verticalAlign: 'middle',
                              backgroundColor: bgColor, color: textColor,
                              fontSize: 11, fontWeight: 500, padding: '4px 6px',
                            }}
                          >
                            {value}
                          </td>
                        );
                      })}
                      <td style={{ width: legendColW, height: 28, backgroundColor: 'transparent' }} />
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Colour-scale legend — absolute-positioned to the right */}
              <div style={{ position: 'absolute', right: 0, top: 0, width: legendColW, display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 28 }}>
                <div style={{ position: 'relative', height: 80, width: 36 }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, background: 'linear-gradient(to bottom, rgb(12, 68, 124), rgb(230, 241, 251))', borderRadius: 3 }} />
                  <span style={{ position: 'absolute', left: 16, top: 0, fontSize: 10, color: '#64748b', lineHeight: 1, whiteSpace: 'nowrap' }}>{maxVal}</span>
                  <span style={{ position: 'absolute', left: 16, top: 36, fontSize: 10, color: '#94a3b8', lineHeight: 1, whiteSpace: 'nowrap' }}>{Math.round(maxVal / 2)}</span>
                  <span style={{ position: 'absolute', left: 16, bottom: 0, fontSize: 10, color: '#94a3b8', lineHeight: 1, whiteSpace: 'nowrap' }}>0</span>
                </div>
              </div>
            </div>
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 10, marginBottom: 0 }}>
            Unique videos per channel per brand in selected date window. Only channels with at least one attributed tractor video are shown.
          </p>
        </>
      )}
    </section>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const screenState = useScreenInit();

  const [activeTab, setActiveTab] = useState<TabKey>(
    (screenState?.activeTab as TabKey) ?? 'overview'
  );

  const [dateRange] = useState<DateRangeKey>('30d');

  const [selectedCompetitors] = useState<string[]>(
    COMPETITORS.map((c) => c.id)
  );

  const [globalDateRange, setGlobalDateRange] = useState<GlobalDateRange>({
    startDate: '2026-03-01',
    endDate: '2026-03-08',
  });

  const { allData, cmsData, loading: cmsLoading, error: cmsError, totalMonitored } = useCMSData();
  const { kpiSummary, loading: vsLoading } = useVSData();

  const { startDate, endDate } = globalDateRange;

  const overviewStats = useMemo(
    () => computeOverviewStats(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  const categoryData = useMemo(
    () => computeCategoryData(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  const channelCoverage = useMemo(
    () => computeChannelCoverage(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  const brandChannelMatrix = useMemo(
    () => computeBrandChannelMatrix(cmsData, startDate, endDate),
    [cmsData, startDate, endDate]
  );

  // ── Real-data KPI computation for Intelligence Overview ─────────────────────
  const overviewKpis = useMemo(() => {
    const startMs = dateToUtcMs(startDate);
    const endMs = dateToUtcMs(endDate);

    const windowRows = (cmsData as any[]).filter(
      (r) => r.publish_date >= startDate && r.publish_date <= endDate
    );

    const eng = (r: any): number =>
      (Number(r.view_count) || 0) + (Number(r.like_count) || 0) + (Number(r.comment_count) || 0);

    const sonalikaRows = windowRows.filter((r: any) => r.attributed_brand === 'Sonalika');

    // Share of Voice (Video Count — row-based, matches Video Volume donut)
    const sovViews = windowRows.length > 0 ? Math.round((sonalikaRows.length / windowRows.length) * 1000) / 10 : 0;

    // Share of Engagement
    const totalEng = windowRows.reduce((a: number, r: any) => a + eng(r), 0);
    const sonalikaEng = sonalikaRows.reduce((a: number, r: any) => a + eng(r), 0);
    const soe = totalEng > 0 ? Math.round((sonalikaEng / totalEng) * 1000) / 10 : 0;

    // Publish Rate: Sonalika unique videos / weeks in window
    // Category avg: (total attributed rows / 7 brands) / weeks in window
    const weeksInWindow = (endMs - startMs + MS_PER_DAY) / MS_PER_DAY / 7;
    const sonalikaVideos = new Set(sonalikaRows.map((r: any) => r.video_id)).size;
    const publishRate = weeksInWindow > 0 ? Math.round((sonalikaVideos / weeksInWindow) * 10) / 10 : 0;
    // category avg: sum of per-brand distinct video counts / num brands / weeks
    const brandVideoSets = new Map<string, Set<string>>();
    for (const r of windowRows) {
      const brand = (r as any).attributed_brand;
      if (!brandVideoSets.has(brand)) brandVideoSets.set(brand, new Set<string>());
      brandVideoSets.get(brand)!.add((r as any).video_id);
    }
    const numBrands = brandVideoSets.size;
    const totalBrandVideos = [...brandVideoSets.values()].reduce((a, s) => a + s.size, 0);
    const categoryAvgRate = numBrands > 0 && weeksInWindow > 0
      ? Math.round((totalBrandVideos / numBrands / weeksInWindow) * 10) / 10
      : 0;

    // Previous period deltas for SoV and SoE
    const periodDays = Math.round((endMs - startMs + MS_PER_DAY) / MS_PER_DAY);
    const prevEndMs = startMs - MS_PER_DAY;
    const prevStartMs = prevEndMs - periodDays * MS_PER_DAY;
    const prevStartIso = utcMsToIso(prevStartMs);
    const prevEndIso = utcMsToIso(prevEndMs);
    const noData = prevStartIso < '2026-03-01';

    let sovDelta: number | null = null;
    let soeDelta: number | null = null;
    let publishRateDelta: number | null = null;

    if (!noData) {
      const prevRows = (cmsData as any[]).filter(
        (r) => r.publish_date >= prevStartIso && r.publish_date <= prevEndIso
      );
      const prevSonalikaRows = prevRows.filter((r: any) => r.attributed_brand === 'Sonalika');
      const prevSov = prevRows.length > 0 ? (prevSonalikaRows.length / prevRows.length) * 100 : 0;
      sovDelta = Math.round((sovViews - prevSov) * 10) / 10;

      const prevTotalEng = prevRows.reduce((a: number, r: any) => a + eng(r), 0);
      const prevSonalikaEng = prevSonalikaRows.reduce((a: number, r: any) => a + eng(r), 0);
      const prevSoe = prevTotalEng > 0 ? (prevSonalikaEng / prevTotalEng) * 100 : 0;
      soeDelta = Math.round((soe - prevSoe) * 10) / 10;

      const prevSonalikaVideos = new Set(prevSonalikaRows.map((r: any) => r.video_id)).size;
      const prevWeeksInWindow = (prevEndMs - prevStartMs + MS_PER_DAY) / MS_PER_DAY / 7;
      const prevPublishRate = prevWeeksInWindow > 0 ? prevSonalikaVideos / prevWeeksInWindow : 0;
      publishRateDelta = Math.round((publishRate - prevPublishRate) * 10) / 10;
    }

    return { sovViews, sovDelta, soe, soeDelta, publishRate, categoryAvgRate, publishRateDelta };
  }, [cmsData, startDate, endDate]);

  const handleStartDate = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setGlobalDateRange((prev) => ({
      startDate: v,
      endDate: v > prev.endDate ? v : prev.endDate,
    }));
  };

  const handleEndDate = (e: ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setGlobalDateRange((prev) => ({
      startDate: v < prev.startDate ? v : prev.startDate,
      endDate: v,
    }));
  };

  const renderActiveTab = () => {
    if (activeTab === 'overview') {
      const piCount = vsLoading ? '…' : String(kpiSummary?.pi_count ?? 0);

      return (
        <div className="space-y-5">
          {/* Section header + date picker */}
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>
                Intelligence Overview
              </h2>
              <p style={{ fontSize: 12, color: '#94a3b8', margin: '3px 0 0 0' }}>
                Performance summary across all tracked brands
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ fontSize: 12, color: '#94a3b8', marginRight: 2 }}>Date Range</span>
              <input type="date" value={startDate} min={MIN_DATE} max={endDate} onChange={handleStartDate} style={dateInputStyle} />
              <span style={{ fontSize: 13, color: '#94a3b8' }}>–</span>
              <input type="date" value={endDate} min={startDate} max={MAX_DATE} onChange={handleEndDate} style={dateInputStyle} />
            </div>
          </div>

          {/* Five KPI cards — real data for 1–3, static for 4–5 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <OverviewKpiCard
              icon={<MegaphoneIcon className="h-5 w-5" aria-hidden="true" />}
              label="Share of Voice"
              value={cmsLoading ? '…' : `${overviewKpis.sovViews.toFixed(1)}%`}
              caption="of category video volume"
              delta={cmsLoading ? null : overviewKpis.sovDelta}
              deltaSuffix=" pts"
              nullLabel="— pts"
            />
            <OverviewKpiCard
              icon={<HeartHandshakeIcon className="h-5 w-5" aria-hidden="true" />}
              label="Share of Engagement"
              value={cmsLoading ? '…' : `${overviewKpis.soe.toFixed(1)}%`}
              caption="views + likes + comments"
              delta={cmsLoading ? null : overviewKpis.soeDelta}
              deltaSuffix=" pts"
              nullLabel="— pts"
            />
            <OverviewKpiCard
              icon={<CalendarClockIcon className="h-5 w-5" aria-hidden="true" />}
              label="Publish Rate"
              value={cmsLoading ? '…' : `${overviewKpis.publishRate.toFixed(1)}/wk`}
              caption={cmsLoading ? 'Loading…' : `vs ${overviewKpis.categoryAvgRate.toFixed(1)}/wk category avg`}
              delta={cmsLoading ? null : overviewKpis.publishRateDelta}
              deltaSuffix="/wk"
              nullLabel="— /wk"
            />
            <OverviewKpiCard
              icon={<SmileIcon className="h-5 w-5" aria-hidden="true" />}
              label="Sentiment Score"
              value="72"
              caption="out of 100, comment-based"
              delta={3}
              deltaSuffix=" pts"
            />
            <OverviewKpiCard
              icon={<ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />}
              label="Purchase-Intent Comments"
              value={piCount}
              caption="buying / shortlist / dealer signals"
              delta={null}
              deltaSuffix=""
              nullLabel="—"
            />
          </div>

          {/* Three summary metric cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <OverviewCard
              icon={<VideoIcon size={15} />}
              label="Total Videos"
              value={cmsLoading ? '…' : overviewStats.totalVideos}
              descriptor="All monitored YouTube videos"
            />
            <OverviewCard
              icon={<TractorIcon size={15} />}
              label="Tractor Videos"
              value={cmsLoading ? '…' : overviewStats.tractorVideos}
              descriptor="Tractor-related content identified"
            />
            <OverviewCard
              icon={<TagIcon size={15} />}
              label="Brands Mentioned"
              value={cmsLoading ? '…' : overviewStats.brandMentioned}
              descriptor={
                cmsLoading
                  ? 'Loading…'
                  : `${overviewStats.directVideos} direct · ${overviewStats.comparisonVideos} multi-brand`
              }
            />
          </div>

          {/* Total Category Videos bar chart */}
          <CategoryVideosCard data={categoryData} loading={cmsLoading} />

          {/* Channel Coverage */}
          <ChannelCoverageCard data={channelCoverage} totalMonitored={totalMonitored} loading={cmsLoading} />

          {/* Brand × Channel heatmap */}
          <BrandChannelHeatmap data={brandChannelMatrix} loading={cmsLoading} />
        </div>
      );
    }

    if (activeTab === 'market-share') {
      return (
        <MarketShareTab
          selectedCompetitors={selectedCompetitors}
          globalDateRange={globalDateRange}
          setGlobalDateRange={setGlobalDateRange}
          allData={allData}
          cmsData={cmsData}
          loading={cmsLoading}
          error={cmsError}
        />
      );
    }

    if (activeTab === 'sentiment') {
      return (
        <SentimentTab
          dateRange={dateRange}
          globalDateRange={globalDateRange}
          setGlobalDateRange={setGlobalDateRange}
        />
      );
    }

    if (activeTab === 'influencer') {
      return <VoiceInfluencerTab />;
    }

    if (activeTab === 'positioning') {
      return <CompetitivePositioningTab />;
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}
          className="pt-5"
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: activeTab === 'sentiment' ? 16 : -16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: activeTab === 'sentiment' ? -16 : 16 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              {renderActiveTab()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
