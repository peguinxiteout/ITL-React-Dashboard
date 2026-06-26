import { ChangeEvent, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  VideoIcon, TractorIcon, TagIcon,
  MegaphoneIcon, HeartHandshakeIcon, CalendarIcon,
  SmileIcon, ShoppingCartIcon, TrendingUpIcon, TrendingDownIcon,
  StarIcon, UsersIcon, CrosshairIcon, TrophyIcon, BarChart3Icon,
  AlertCircleIcon, HelpCircleIcon,
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
function KiDeltaBadge({ delta, suffix = 'pp' }: { delta: number; suffix?: string }) {
  const color = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#94a3b8';
  const bg = delta > 0 ? '#f0fdf4' : delta < 0 ? '#fef2f2' : '#f8fafc';
  const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '▬';
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 500, padding: '1px 6px', borderRadius: 10, whiteSpace: 'nowrap' }}>
      {arrow} {Math.abs(delta).toFixed(1)}{suffix}
    </span>
  );
}

function KiMetricCard({
  icon, label, value, subtitle, delta, deltaSuffix = 'pp',
}: {
  icon: React.ReactNode; label: string; value: string; subtitle: string;
  delta?: number; deltaSuffix?: string;
}) {
  return (
    <div style={{ background: 'var(--color-background-secondary, #f8fafc)', borderRadius: 12, padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ color: '#94a3b8', display: 'flex' }}>{icon}</span>
          <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: '0.07em', color: '#94a3b8', textTransform: 'uppercase' }}>
            {label}
          </span>
        </div>
        {delta !== undefined && <KiDeltaBadge delta={delta} suffix={deltaSuffix} />}
      </div>
      <p style={{ fontSize: 30, fontWeight: 500, color: '#0f172a', lineHeight: 1, margin: '0 0 6px 0' }}>{value}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>{subtitle}</p>
    </div>
  );
}

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
  cmsData, allData, successRows, startDate, endDate, cmsLoading, vsLoading, setActiveTab,
}: {
  cmsData: any[]; allData: any[]; successRows: any[];
  startDate: string; endDate: string;
  cmsLoading: boolean; vsLoading: boolean;
  setActiveTab: (tab: TabKey) => void;
}) {
  const { prevStartIso, prevEndIso, numDays } = useMemo(() => {
    const sMs = dateToUtcMs(startDate);
    const eMs = dateToUtcMs(endDate);
    const nd = Math.round((eMs - sMs + MS_PER_DAY) / MS_PER_DAY);
    const prevEndMs = sMs - MS_PER_DAY;
    const prevStartMs = prevEndMs - (nd - 1) * MS_PER_DAY;
    return { numDays: nd, prevStartIso: utcMsToIso(prevStartMs), prevEndIso: utcMsToIso(prevEndMs) };
  }, [startDate, endDate]);

  const hasPrevData = useMemo(
    () => allData.some((r) => r.publish_date >= prevStartIso && r.publish_date <= prevEndIso),
    [allData, prevStartIso, prevEndIso],
  );

  const cms = useMemo(() => {
    const eng = (r: any) => (Number(r.view_count) || 0) + (Number(r.like_count) || 0) + (Number(r.comment_count) || 0);
    const win = cmsData.filter((r) => r.publish_date >= startDate && r.publish_date <= endDate);
    const son = win.filter((r) => r.attributed_brand === 'Sonalika');

    // SoV: COUNT DISTINCT video_id (Sonalika) / COUNT DISTINCT video_id (all attributed)
    const winUniqueIds = new Set(win.map((r: any) => r.video_id)).size;
    const sonUnique = new Set(son.map((r: any) => r.video_id)).size;
    const sov = winUniqueIds > 0 ? (sonUnique / winUniqueIds) * 100 : 0;

    const totalEng = win.reduce((a: number, r: any) => a + eng(r), 0);
    const sonEng = son.reduce((a: number, r: any) => a + eng(r), 0);
    const soe = totalEng > 0 ? (sonEng / totalEng) * 100 : 0;
    const weeksInWin = numDays / 7;
    const pubRate = weeksInWin > 0 ? sonUnique / weeksInWin : 0;

    // Brand ranking by distinct video_id count
    const brandVideoIds = new Map<string, Set<string>>();
    for (const r of win) {
      if (!brandVideoIds.has(r.attributed_brand)) brandVideoIds.set(r.attributed_brand, new Set());
      brandVideoIds.get(r.attributed_brand)!.add(r.video_id);
    }
    const brandsSorted = [...brandVideoIds.entries()].sort((a, b) => b[1].size - a[1].size);
    const sonRankIdx = brandsSorted.findIndex(([b]) => b === 'Sonalika');
    const sonRank = sonRankIdx >= 0 ? sonRankIdx + 1 : brandsSorted.length + 1;
    const topBrand = brandsSorted[0]?.[0] || '';
    const topBrandUniqueIds = brandsSorted[0]?.[1]?.size || 0;
    const topBrandSov = winUniqueIds > 0 ? (topBrandUniqueIds / winUniqueIds) * 100 : 0;
    const gapToTop = sonRank === 1 ? 0 : topBrandSov - sov;
    const numBrands = brandsSorted.length;

    const sonChMap = new Map<string, Set<string>>();
    for (const r of son) {
      const ch = r.channel_name || '';
      if (!sonChMap.has(ch)) sonChMap.set(ch, new Set());
      sonChMap.get(ch)!.add(r.video_id);
    }
    const topChEntry = [...sonChMap.entries()].sort((a, b) => b[1].size - a[1].size)[0];
    const topCh = topChEntry?.[0] || '—';
    const topChCount = topChEntry?.[1]?.size || 0;

    const allWin = allData.filter((r) => r.publish_date >= startDate && r.publish_date <= endDate);
    const tractorCount = allWin.filter((r) => r.is_tractor_content === 1).length;
    const tractorDensity = allWin.length > 0 ? (tractorCount / allWin.length) * 100 : 0;
    const activeChannelCount = new Set(allWin.map((r) => r.channel_name).filter(Boolean)).size;
    const inactiveCount = Math.max(0, 52 - activeChannelCount);

    let prevSov: number | null = null;
    let prevSoe: number | null = null;
    let prevPubRate: number | null = null;
    let prevTractorDensity: number | null = null;

    if (hasPrevData) {
      const prevWin = cmsData.filter((r) => r.publish_date >= prevStartIso && r.publish_date <= prevEndIso);
      const prevSon = prevWin.filter((r) => r.attributed_brand === 'Sonalika');
      const prevWinUniqueIds = new Set(prevWin.map((r: any) => r.video_id)).size;
      const prevSonUnique = new Set(prevSon.map((r: any) => r.video_id)).size;
      prevSov = prevWinUniqueIds > 0 ? (prevSonUnique / prevWinUniqueIds) * 100 : 0;
      const pTotalEng = prevWin.reduce((a: number, r: any) => a + eng(r), 0);
      const pSonEng = prevSon.reduce((a: number, r: any) => a + eng(r), 0);
      prevSoe = pTotalEng > 0 ? (pSonEng / pTotalEng) * 100 : 0;
      prevPubRate = weeksInWin > 0 ? prevSonUnique / weeksInWin : 0;
      const prevAllWin = allData.filter((r) => r.publish_date >= prevStartIso && r.publish_date <= prevEndIso);
      const prevTractorCount = prevAllWin.filter((r) => r.is_tractor_content === 1).length;
      prevTractorDensity = prevAllWin.length > 0 ? (prevTractorCount / prevAllWin.length) * 100 : 0;
    }

    return {
      sov, soe, pubRate, sonRank, numBrands, topBrand, gapToTop, sovSoeGap: sov - soe,
      topCh, topChCount, tractorDensity, inactiveCount,
      prevSov, prevSoe, prevPubRate, prevTractorDensity,
    };
  }, [cmsData, allData, startDate, endDate, numDays, hasPrevData, prevStartIso, prevEndIso]);

  const vs = useMemo(() => {
    const isBool = (v: any) => v === true || v === 'True' || v === 'true';
    const total = successRows.length;
    const piRows = successRows.filter((r) => isBool(r.pi_detected));
    const unRows = successRows.filter((r) => isBool(r.un_detected));
    const qsRows = successRows.filter((r) => isBool(r.qs_is_question));
    const lostSaleCount = successRows.filter((r) => isBool(r.pi_is_lost_sale)).length;

    const piRate = total > 0 ? (piRows.length / total) * 100 : 0;
    const unRate = total > 0 ? (unRows.length / total) * 100 : 0;
    const qsRate = total > 0 ? (qsRows.length / total) * 100 : 0;

    const stageCounts: Record<string, number> = {};
    for (const r of piRows) {
      const s = r.pi_stage;
      if (s && s !== 'none' && s !== '') stageCounts[s] = (stageCounts[s] || 0) + 1;
    }
    const topPiStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const qsCounts: Record<string, number> = {};
    for (const r of qsRows) {
      const q = r.qs_normalized_question;
      if (q && q !== '') qsCounts[q] = (qsCounts[q] || 0) + 1;
    }
    const topQs = Object.entries(qsCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Price';

    const unTypeCounts: Record<string, number> = {};
    for (const r of unRows) {
      const t = r.un_need_type;
      if (t && t !== 'none' && t !== '') unTypeCounts[t] = (unTypeCounts[t] || 0) + 1;
    }
    const topUnEntry = Object.entries(unTypeCounts).sort((a, b) => b[1] - a[1])[0];
    const topUn = topUnEntry?.[0] || '';
    const topUnCount = topUnEntry?.[1] || 0;

    const PI_LABELS: Record<string, string> = {
      dealer_inquiry: 'Dealer inquiry',
      consideration: 'Buying consideration',
      shortlisting: 'Shortlisting',
      post_purchase: 'Post purchase',
    };
    const topPiLabel = PI_LABELS[topPiStage] || topPiStage.replace(/_/g, ' ');

    return { piRate, unRate, qsRate, piCount: piRows.length, lostSaleCount, topPiStage, topPiLabel, topQs, topUn, topUnCount };
  }, [successRows]);

  // CMS trend data for State B
  const cmsTrend = useMemo(() => {
    if (!hasPrevData || cms.prevSov == null || cms.prevSoe == null || cms.prevPubRate == null || cms.prevTractorDensity == null) {
      return null;
    }
    const rows: { label: string; prev: number; curr: number; fmt: (v: number) => string }[] = [
      { label: 'Tractor content density', prev: cms.prevTractorDensity, curr: cms.tractorDensity, fmt: (v) => `${v.toFixed(1)}%` },
      { label: 'Sonalika content share (SoV)', prev: cms.prevSov, curr: cms.sov, fmt: (v) => `${v.toFixed(1)}%` },
      { label: 'Share of Engagement (SoE)', prev: cms.prevSoe, curr: cms.soe, fmt: (v) => `${v.toFixed(1)}%` },
      { label: 'Publish rate', prev: cms.prevPubRate, curr: cms.pubRate, fmt: (v) => `${v.toFixed(2)}/wk` },
    ];
    const withDelta = rows.map((r) => ({ ...r, delta: r.curr - r.prev }));
    const bigPos = [...withDelta].sort((a, b) => b.delta - a.delta).find((m) => m.delta > 0) || withDelta[0];
    const bigNeg = [...withDelta].sort((a, b) => a.delta - b.delta).find((m) => m.delta < 0);
    const s1 = `${bigPos.label} ${bigPos.delta > 0 ? 'improved' : 'held steady'} from ${bigPos.fmt(bigPos.prev)} to ${bigPos.fmt(bigPos.curr)}${bigPos.delta > 0 ? ' — positive momentum this period.' : '.'}`;
    const s2 = bigNeg
      ? `${bigNeg.label} declined from ${bigNeg.fmt(bigNeg.prev)} to ${bigNeg.fmt(bigNeg.curr)} — worth monitoring.`
      : 'No regressions detected — all tracked metrics improved or held steady this period.';
    return { rows: withDelta, s1, s2, s2IsNeg: !!bigNeg };
  }, [cms, hasPrevData]);

  const showCPStateB = startDate === '2026-03-09' && endDate === '2026-03-15';

  const cpTableRows: { kpi: string; prev: string; curr: string; arrow: string; color: string }[] = [
    { kpi: 'Brand mention share', prev: '22%', curr: '25%', arrow: '▲', color: '#16a34a' },
    { kpi: 'Positive sentiment', prev: '37%', curr: '16%', arrow: '▼', color: '#dc2626' },
    { kpi: 'Negative sentiment', prev: '4%', curr: '4%', arrow: '▬', color: '#94a3b8' },
    { kpi: 'Product demo count', prev: '0 videos', curr: '2 videos', arrow: '▲', color: '#16a34a' },
  ];

  const kiDivider = <div style={{ borderTop: '0.5px solid var(--color-border-tertiary, #e2e8f0)', margin: '20px 0' }} />;

  return (
    <section style={{ borderRadius: 12, border: '1px solid #e2e8f0', backgroundColor: '#ffffff', padding: 16 }}>
      <div style={{ marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, color: '#0f172a', margin: 0 }}>Key insights</h3>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0 0' }}>Auto-generated from current date window</p>
      </div>

      {/* ── CMS Module ── */}
      {cmsLoading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Loading…</p>
      ) : (
        <>
          <KiModuleHeader pillBg="#E6F1FB" pillText="#0C447C" moduleName="Content Market Share" question="How visible is Sonalika?" tabKey="market-share" setActiveTab={setActiveTab} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
            <KiMetricCard
              icon={<MegaphoneIcon size={15} />} label="SHARE OF VOICE"
              value={`${cms.sov.toFixed(1)}%`} subtitle="by unique video count"
              delta={hasPrevData && cms.prevSov != null ? cms.sov - cms.prevSov : undefined}
            />
            <KiMetricCard
              icon={<HeartHandshakeIcon size={15} />} label="SHARE OF ENGAGEMENT"
              value={`${cms.soe.toFixed(1)}%`} subtitle="views + likes + comments"
              delta={hasPrevData && cms.prevSoe != null ? cms.soe - cms.prevSoe : undefined}
            />
            <KiMetricCard
              icon={<CalendarIcon size={15} />} label="PUBLISH RATE"
              value={`${cms.pubRate.toFixed(2)}/wk`} subtitle="Sonalika videos per week"
              delta={hasPrevData && cms.prevPubRate != null ? cms.pubRate - cms.prevPubRate : undefined}
              deltaSuffix="/wk"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: cmsTrend ? 12 : 0 }}>
            <KiSignalCard
              bg="#E6F1FB" textColor="#0C447C"
              icon={<MegaphoneIcon size={14} />}
              headline={`${cms.sov.toFixed(1)}% SoV · Rank #${cms.sonRank} of ${cms.numBrands}`}
              sub={cms.sonRank === 1 ? 'Leading the category' : `${cms.gapToTop.toFixed(1)}pp gap to #1 (${cms.topBrand})`}
            />
            <KiSignalCard
              bg={cms.sovSoeGap > -2 ? '#EAF3DE' : '#FAEEDA'}
              textColor={cms.sovSoeGap > -2 ? '#085041' : '#633806'}
              icon={<HeartHandshakeIcon size={14} />}
              headline={`${cms.soe.toFixed(1)}% Share of Engagement`}
              sub={`SoV–SoE gap: ${cms.sovSoeGap >= 0 ? '+' : ''}${cms.sovSoeGap.toFixed(1)}pp`}
            />
            <KiSignalCard
              bg="#E6F1FB" textColor="#0C447C"
              icon={<VideoIcon size={14} />}
              headline={cms.topCh}
              sub={`${cms.topChCount} Sonalika video${cms.topChCount !== 1 ? 's' : ''} in window`}
            />
            <KiSignalCard
              bg="#FAEEDA" textColor="#633806"
              icon={<TractorIcon size={14} />}
              headline={`${cms.tractorDensity.toFixed(1)}% tractor content density`}
              sub={`${cms.inactiveCount} of 52 channels inactive this window`}
            />
          </div>
          {cmsTrend && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
                <thead>
                  <tr style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                    <th style={{ textAlign: 'left', fontWeight: 500, color: '#64748b', padding: '4px 0' }}>KPI</th>
                    <th style={{ textAlign: 'right', fontWeight: 500, color: '#64748b', padding: '4px 8px' }}>Baseline ({prevStartIso}–{prevEndIso})</th>
                    <th style={{ textAlign: 'right', fontWeight: 500, color: '#64748b', padding: '4px 8px' }}>This week ({startDate}–{endDate})</th>
                    <th style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '4px 0' }}>Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {cmsTrend.rows.map(({ label, prev, curr, delta, fmt }) => {
                    const arrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '▬';
                    const arrowColor = delta > 0 ? '#16a34a' : delta < 0 ? '#dc2626' : '#94a3b8';
                    return (
                      <tr key={label} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                        <td style={{ padding: '5px 0', color: '#334155' }}>{label}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b' }}>{fmt(prev)}</td>
                        <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontWeight: 500 }}>{fmt(curr)}</td>
                        <td style={{ padding: '5px 0', textAlign: 'center', color: arrowColor, fontWeight: 600 }}>{arrow}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#334155' }}>
                  <span style={{ width: 8, height: 8, minWidth: 8, borderRadius: '50%', background: '#16a34a', marginTop: 4 }} />
                  <span>{cmsTrend.s1}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#334155' }}>
                  <span style={{ width: 8, height: 8, minWidth: 8, borderRadius: '50%', background: cmsTrend.s2IsNeg ? '#dc2626' : '#94a3b8', marginTop: 4 }} />
                  <span>{cmsTrend.s2}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {kiDivider}

      {/* ── VoI Module ── */}
      <KiModuleHeader pillBg="#EEEDFE" pillText="#3C3489" moduleName="Voice of Influencer" question="How do creators talk about Sonalika?" tabKey="influencer" setActiveTab={setActiveTab} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <KiMetricCard icon={<SmileIcon size={15} />} label="POSITIVE SENTIMENT" value="73%" subtitle="creator tone on Sonalika" />
        <KiMetricCard icon={<StarIcon size={15} />} label="TOP PRAISED FEATURE" value="Price" subtitle="most mentioned in transcripts" />
        <KiMetricCard icon={<UsersIcon size={15} />} label="ACTIVE CREATORS" value="20" subtitle="creators mentioning Sonalika" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<SmileIcon size={14} />} headline="73% positive sentiment, 0% negative" sub="Strong creator affinity — no critical narratives detected" />
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<TrendingUpIcon size={14} />} headline="Price & engine most praised" sub="8 mentions for Price · 6 for Engine Performance" />
        <KiSignalCard bg="#E6F1FB" textColor="#0C447C" icon={<VideoIcon size={14} />} headline="Top creator: Amaan Mirza Rides" sub="Highest engagement score · 100% Sonalika relevance" />
        <KiSignalCard bg="#FAEEDA" textColor="#633806" icon={<MegaphoneIcon size={14} />} headline="North India dominates coverage" sub="UP, Haryana, Punjab channels highest Sonalika density" />
      </div>

      {kiDivider}

      {/* ── CP Module ── */}
      <KiModuleHeader pillBg="#FAEEDA" pillText="#633806" moduleName="Competitive Positioning" question="How does Sonalika stand vs competitors?" tabKey="positioning" setActiveTab={setActiveTab} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 12 }}>
        <KiMetricCard icon={<CrosshairIcon size={15} />} label="COMPETITOR MENTIONS" value="59" subtitle="co-mentions in Sonalika content" />
        <KiMetricCard icon={<TrophyIcon size={15} />} label="MOST MENTIONED RIVAL" value="Mahindra" subtitle="17 direct mentions" />
        <KiMetricCard icon={<BarChart3Icon size={15} />} label="BRAND MENTION SHARE" value="22%" subtitle="Sonalika vs category" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: showCPStateB ? 12 : 0 }}>
        <KiSignalCard bg="#FAEEDA" textColor="#633806" icon={<TagIcon size={14} />} headline="Mahindra most co-mentioned: 17 times" sub="28.8% of all competitor mentions" />
        <KiSignalCard bg="#E6F1FB" textColor="#0C447C" icon={<VideoIcon size={14} />} headline="Product demo is top talking point" sub="DI 55 power demos dominate Sonalika content" />
        <KiSignalCard bg="#EAF3DE" textColor="#085041" icon={<TrendingUpIcon size={14} />} headline="Price wins in direct comparisons" sub="Cited favourably vs Mahindra & Swaraj" />
        <KiSignalCard bg="#FAEEDA" textColor="#633806" icon={<TrendingDownIcon size={14} />} headline="Build quality gap vs competitors" sub="Competitors score higher on build quality in comparisons" />
      </div>
      {showCPStateB && (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10 }}>
            <thead>
              <tr style={{ borderBottom: '0.5px solid #e2e8f0' }}>
                <th style={{ textAlign: 'left', fontWeight: 500, color: '#64748b', padding: '4px 0' }}>KPI</th>
                <th style={{ textAlign: 'right', fontWeight: 500, color: '#64748b', padding: '4px 8px' }}>Baseline (Mar 01–08)</th>
                <th style={{ textAlign: 'right', fontWeight: 500, color: '#64748b', padding: '4px 8px' }}>This week (Mar 09–15)</th>
                <th style={{ textAlign: 'center', fontWeight: 500, color: '#64748b', padding: '4px 0' }}>Trend</th>
              </tr>
            </thead>
            <tbody>
              {cpTableRows.map(({ kpi, prev, curr, arrow, color }) => (
                <tr key={kpi} style={{ borderBottom: '0.5px solid #f1f5f9' }}>
                  <td style={{ padding: '5px 0', color: '#334155' }}>{kpi}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#64748b' }}>{prev}</td>
                  <td style={{ padding: '5px 8px', textAlign: 'right', color: '#0f172a', fontWeight: 500 }}>{curr}</td>
                  <td style={{ padding: '5px 0', textAlign: 'center', color, fontWeight: 600 }}>{arrow}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#334155' }}>
              <span style={{ width: 8, height: 8, minWidth: 8, borderRadius: '50%', background: '#16a34a', marginTop: 4 }} />
              <span>Brand mention share rose from 22% to 25% — Sonalika gaining relative visibility week-over-week.</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, fontSize: 12, color: '#334155' }}>
              <span style={{ width: 8, height: 8, minWidth: 8, borderRadius: '50%', background: '#dc2626', marginTop: 4 }} />
              <span>Positive sentiment dropped from 37% to 16% — creator tone may have shifted toward neutral or comparative content.</span>
            </div>
          </div>
        </>
      )}

      {kiDivider}

      {/* ── VS Module ── */}
      <KiModuleHeader pillBg="#E1F5EE" pillText="#085041" moduleName="Viewer Sentiment" question="What do viewers say in comments?" tabKey="sentiment" setActiveTab={setActiveTab} />
      {vsLoading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 4 }}>
            <KiMetricCard icon={<ShoppingCartIcon size={15} />} label="PURCHASE INTENT RATE" value={`${vs.piRate.toFixed(1)}%`} subtitle="buying / shortlist / dealer signals" />
            <KiMetricCard icon={<AlertCircleIcon size={15} />} label="UNMET NEEDS RATE" value={`${vs.unRate.toFixed(1)}%`} subtitle="product, service, pricing gaps" />
            <KiMetricCard icon={<HelpCircleIcon size={15} />} label="RECURRING QUESTIONS" value={`${vs.qsRate.toFixed(1)}%`} subtitle="questions detected in comments" />
          </div>
          <p style={{ fontSize: 11, color: '#94a3b8', margin: '0 0 12px 0', fontStyle: 'italic' }}>based on full comment corpus</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <KiSignalCard
              bg="#EAF3DE" textColor="#085041"
              icon={<ShoppingCartIcon size={14} />}
              headline={`${vs.piCount} purchase-intent comment${vs.piCount !== 1 ? 's' : ''}${vs.topPiStage === 'dealer_inquiry' ? ' · Bottom-of-funnel signal' : ''}`}
              sub={vs.topPiLabel ? `Top stage: ${vs.topPiLabel}` : 'Stage data pending'}
            />
            <KiSignalCard
              bg={vs.lostSaleCount > 0 ? '#FCEBEB' : '#EAF3DE'}
              textColor={vs.lostSaleCount > 0 ? '#991b1b' : '#085041'}
              icon={vs.lostSaleCount > 0 ? <TrendingDownIcon size={14} /> : <TrendingUpIcon size={14} />}
              headline={vs.lostSaleCount > 0 ? `${vs.lostSaleCount} lost-sale signal${vs.lostSaleCount !== 1 ? 's' : ''} detected` : 'No lost-sale signals detected'}
              sub={vs.lostSaleCount > 0 ? 'Review these comments for retention opportunities' : 'All purchase-intent comments are acquisition-positive'}
            />
            <KiSignalCard
              bg="#FAEEDA" textColor="#633806"
              icon={<MegaphoneIcon size={14} />}
              headline={`Top question: "${vs.topQs.length > 40 ? vs.topQs.slice(0, 40) + '…' : vs.topQs}"`}
              sub="Most frequently asked in comments"
            />
            <KiSignalCard
              bg="#FAEEDA" textColor="#633806"
              icon={<TagIcon size={14} />}
              headline={vs.topUn ? `Top unmet need: ${vs.topUn.replace(/_/g, ' ')}` : 'No unmet needs detected'}
              sub={vs.topUn && vs.topUnCount > 0 ? `${vs.topUnCount} comment${vs.topUnCount !== 1 ? 's' : ''} flagged this need` : ''}
            />
          </div>
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
  const { loading: vsLoading, successRows } = useVSData();

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
              label="Brands Mentioned"
              value={cmsLoading ? '…' : overviewStats.brandMentioned}
              descriptor={
                cmsLoading
                  ? 'Loading…'
                  : `${overviewStats.directVideos} direct · ${overviewStats.comparisonVideos} multi-brand`
              }
            />
          </div>

          {/* Key Insights */}
          <KeyInsightsCard
            cmsData={cmsData}
            allData={allData}
            successRows={successRows}
            startDate={startDate}
            endDate={endDate}
            cmsLoading={cmsLoading}
            vsLoading={vsLoading}
            setActiveTab={setActiveTab}
          />

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
