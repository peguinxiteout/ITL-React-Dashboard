import { ChangeEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  VideoIcon, TractorIcon, TagIcon,
  MegaphoneIcon,
  SmileIcon, TrendingUpIcon,
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
import { useKpiData } from '../hooks/useKpiData';
import {
  calculateBrandLevelSentiment,
  calculateMostMentionedFeatures,
  calculateCreatorPerformance,
  calculateGeoCoverage,
  calculateCompetitorMentionsInSonalikaVideos,
  calculateCompetitiveTrendTable,
} from '../utils/kpiCalculations';

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

// ─── Key Insights helpers ─────────────────────────────────────────────────────
function KiSignalCard({
  bg, textColor, icon, headline, sub,
}: {
  bg: string; textColor: string; icon: React.ReactNode; headline: string; sub: string;
}) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: textColor, marginTop: 1, flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: textColor, margin: '0 0 2px 0' }}>{headline}</p>
          <p style={{ fontSize: 11, color: textColor, margin: 0, opacity: 0.75 }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

function KiModuleHeader({
  pillBg, pillText, moduleName, question, tabKey, setActiveTab,
}: {
  pillBg: string; pillText: string; moduleName: string; question: string;
  tabKey: TabKey; setActiveTab: (tab: TabKey) => void;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ background: pillBg, color: pillText, fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 12, whiteSpace: 'nowrap' }}>
          {moduleName}
        </span>
        <span style={{ fontSize: 14, fontWeight: 500, color: '#0f172a' }}>{question}</span>
      </div>
      <button
        onClick={() => setActiveTab(tabKey)}
        style={{ fontSize: 11, color: '#94a3b8', background: 'none', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap', padding: 0 }}
      >
        View full tab →
      </button>
    </div>
  );
}

// ─── KeyInsightsCard ──────────────────────────────────────────────────────────
function KeyInsightsCard({
  setActiveTab,
}: {
  setActiveTab: (tab: TabKey) => void;
}) {
  // Reuse the same KPI CSV and calculation functions used by
  // VoiceInfluencerTab and CompetitivePositioningTab so this overview
  // cannot drift away from the detailed tab numbers.
  const { rows: kpiRows } = useKpiData();

  // ── State A bullet data ───────────────────────────────────────────────────────

  const voiStateA = useMemo(() => {
    const sonalikaSentiment = calculateBrandLevelSentiment(kpiRows).find(
      (item: any) => String(item.brand || '').toLowerCase() === 'sonalika'
    );

    const positivePct = Number((sonalikaSentiment?.Positive_pct || 0).toFixed(1));
    const neutralPct = Number((sonalikaSentiment?.Neutral_pct || 0).toFixed(1));
    const negativePct = Number((sonalikaSentiment?.Negative_pct || 0).toFixed(1));
    const totalEntries = Number(sonalikaSentiment?.total_mentions || 0);
    const sentColor = positivePct >= 50 ? '#639922' : positivePct >= 25 ? '#EF9F27' : '#E24B4A';

    const mostMentioned = calculateMostMentionedFeatures(kpiRows, 'Sonalika', 5);
    const topPraised = mostMentioned.praised[0];
    const topCriticised = mostMentioned.criticized[0];

    const creators = calculateCreatorPerformance(kpiRows);
    const topCreator = [...creators].sort(
      (a: any, b: any) => Number(b.engagement || 0) - Number(a.engagement || 0)
    )[0];

    const topRegions = calculateGeoCoverage(kpiRows)
      .filter((item: any) => {
        const region = String(item.geo_region || '').toLowerCase();
        return region && region !== 'unknown' && region !== 'not available' && region !== 'india';
      })
      .slice(0, 3)
      .map((item: any) => item.geo_region);

    return {
      positivePct,
      neutralPct,
      negativePct,
      totalEntries,
      sentColor,
      topPraisedFeature: topPraised?.feature || '—',
      topPraisedCount: Number(topPraised?.Positive || 0),
      topCriticisedFeature: topCriticised?.feature || '',
      topCriticisedCount: Number(topCriticised?.Negative || 0),
      activeCreators: creators.length,
      topCreatorName: topCreator?.channelTitle || '—',
      topCreatorEngagement: Number(topCreator?.engagement || 0),
      topRegions,
    };
  }, [kpiRows]);

  const cpStateA = useMemo(() => {
    const competitorMentions = calculateCompetitorMentionsInSonalikaVideos(kpiRows);
    const totalMentions = competitorMentions.reduce(
      (sum: number, item: any) => sum + Number(item.mention_count || 0),
      0
    );
    const topCompetitor = competitorMentions[0];
    const competitorPct =
      totalMentions > 0 && topCompetitor
        ? Number(((Number(topCompetitor.mention_count || 0) / totalMentions) * 100).toFixed(1))
        : 0;

    const trendRows = calculateCompetitiveTrendTable(kpiRows);
    const brandMentionShareRow = trendRows.find((item: any) => item.metric === 'Brand Mention Share');
    const brandMentionShare = brandMentionShareRow?.currentWeek?.replace(/\s*Share/i, '') || '0%';

    return {
      uniqueBrands: competitorMentions.length,
      totalMentions,
      topCompetitorName: topCompetitor?.competitor || '—',
      topCompetitorCount: Number(topCompetitor?.mention_count || 0),
      competitorPct,
      brandMentionShare,
      trendRows,
    };
  }, [kpiRows]);



  const kiDivider = <div style={{ borderTop: '0.5px solid var(--color-border-tertiary, #e2e8f0)', margin: '20px 0' }} />;

  return (
    <section style={{ borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Key insights</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>Auto-generated from current date window</p>
      </div>

      {/* ── VoI Module ── */}
      <KiModuleHeader pillBg="#EEEDFE" pillText="#3C3489" moduleName="Voice of Influencer" question="How do creators talk about Sonalika?" tabKey="influencer" setActiveTab={setActiveTab} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<SmileIcon size={14} />} headline={`${voiStateA.positivePct}% positive sentiment, ${voiStateA.negativePct}% negative`} sub={`${voiStateA.neutralPct}% neutral across Sonalika sentiment signals`} />
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<TrendingUpIcon size={14} />} headline={`${voiStateA.topPraisedFeature} most praised`} sub={`${voiStateA.topPraisedCount} positive signal${voiStateA.topPraisedCount !== 1 ? 's' : ''} in detailed tab`} />
        <KiSignalCard bg="#E6F1FB" textColor="#0C447C" icon={<VideoIcon size={14} />} headline={`Top creator: ${voiStateA.topCreatorName}`} sub={`${voiStateA.topCreatorEngagement.toLocaleString()} total engagement`} />
        <KiSignalCard bg="#FAEEDA" textColor="#633806" icon={<MegaphoneIcon size={14} />} headline={`${voiStateA.topRegions.slice(0, 2).join(' & ') || 'Regional'} coverage leads`} sub={`${voiStateA.topRegions.join(', ') || 'No region data available'}`} />
      </div>

      {kiDivider}

      {/* ── CP Module ── */}
      <KiModuleHeader pillBg="#FAEEDA" pillText="#633806" moduleName="Competitive Positioning" question="How does Sonalika stand vs competitors?" tabKey="positioning" setActiveTab={setActiveTab} />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <KiSignalCard bg="#FAEEDA" textColor="#633806" icon={<TagIcon size={14} />} headline={`${cpStateA.topCompetitorName} most co-mentioned: ${cpStateA.topCompetitorCount} times`} sub={`${cpStateA.competitorPct.toFixed(1)}% of all competitor mentions`} />
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<TrendingUpIcon size={14} />} headline={`Brand mention share: ${cpStateA.brandMentionShare}`} sub="Pulled from the same two-week trend logic" />
      </div>

    </section>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const screenState = useScreenInit();

  const [activeTab, setActiveTab] = useState<TabKey>(
    (screenState?.activeTab as TabKey) ?? 'overview'
  );

  // Brand currently selected on whichever of CMS/VS is active — mirrored into
  // the header title. Cleared when navigating to a tab that has no brand
  // selector so the header falls back to the static title instead of showing
  // a stale brand from the tab the user just left.
  const [activeTabBrandName, setActiveTabBrandName] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'overview') {
      setActiveTabBrandName(null);
    }
  }, [activeTab]);

  const handleCMSBrandChange = useCallback((brand: string) => setActiveTabBrandName(brand), []);
  const handleVSBrandChange = useCallback((brand: string) => setActiveTabBrandName(brand), []);
  const handleInfluencerBrandChange = useCallback((brand: string) => setActiveTabBrandName(brand), []);
  const handlePositioningBrandChange = useCallback((brand: string) => setActiveTabBrandName(brand), []);

  const headerTitle =
    (['market-share', 'sentiment', 'influencer', 'positioning'] as TabKey[]).includes(activeTab) && activeTabBrandName
      ? `${activeTabBrandName} YouTube Intelligence`
      : 'Sonalika YouTube Intelligence';

  const [dateRange] = useState<DateRangeKey>('30d');

  const [selectedCompetitors] = useState<string[]>(
    COMPETITORS.map((c) => c.id)
  );

  const [globalDateRange, setGlobalDateRange] = useState<GlobalDateRange>({
    startDate: '2026-03-09',
    endDate: '2026-03-15',
  });

  const { allData, cmsData, loading: cmsLoading, error: cmsError, totalMonitored } = useCMSData();

  const { startDate, endDate } = globalDateRange;

  const overviewStats = useMemo(() => {
    const cleanData = allData.filter(
      (row: any) => row.video_id && !String(row.video_id).startsWith('#') && row.video_id !== 'NaN' && String(row.video_id).trim() !== ''
    );
    return computeOverviewStats(cleanData, startDate, endDate);
  }, [allData, startDate, endDate]);

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
              label="Brand Mentioned"
              value={cmsLoading ? '…' : overviewStats.brandMentioned}
              descriptor={
                cmsLoading
                  ? 'Loading…'
                  : `${overviewStats.directVideos} direct · ${overviewStats.comparisonVideos} multi-brand`
              }
            />
          </div>

          {/* Key Insights */}
          <KeyInsightsCard setActiveTab={setActiveTab} />

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
          onBrandChange={handleCMSBrandChange}
        />
      );
    }

    if (activeTab === 'sentiment') {
      return (
        <SentimentTab
          dateRange={dateRange}
          globalDateRange={globalDateRange}
          setGlobalDateRange={setGlobalDateRange}
          allData={allData}
          cmsLoading={cmsLoading}
          onBrandChange={handleVSBrandChange}
        />
      );
    }

    if (activeTab === 'influencer') {
      return <VoiceInfluencerTab onBrandChange={handleInfluencerBrandChange} />;
    }

    if (activeTab === 'positioning') {
      return <CompetitivePositioningTab onBrandChange={handlePositioningBrandChange} />;
    }

    return null;
  };

  return (
    <div className="min-h-screen w-full bg-slate-50">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} title={headerTitle} />

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
