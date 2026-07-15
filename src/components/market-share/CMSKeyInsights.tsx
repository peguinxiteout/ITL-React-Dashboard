import { useMemo } from 'react';
import { MegaphoneIcon, HeartHandshakeIcon, VideoIcon, TractorIcon } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import { computeCategoryData } from '../../hooks/useCMSData.js';

const MS_PER_DAY = 86400000;

function dateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToIso(ms: number): string {
  const d = new Date(ms);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

// Duplicated from Dashboard.tsx's KeyInsightsCard rather than imported — VoI/CP/VS
// modules still use their own copies there, and this component is meant to be
// self-contained (props-driven), not tied to Dashboard.tsx internals.
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

function KiStateABullets({ items }: { items: { color: string; text: string }[] }) {
  if (!items.length) return null;
  return (
    <div style={{ borderTop: '0.5px solid var(--color-border-tertiary, #e2e8f0)', marginTop: 12, paddingTop: 10 }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            fontSize: 12, color: 'var(--color-text-primary, #334155)', lineHeight: 1.55,
            padding: '5px 0',
            borderBottom: idx < items.length - 1 ? '0.5px solid var(--color-border-tertiary, #e2e8f0)' : 'none',
          }}
        >
          <span style={{ width: 7, height: 7, minWidth: 7, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0 }} />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

export interface CMSKeyInsightsProps {
  cmsData: any[];
  allData: any[];
  startDate: string;
  endDate: string;
  loading: boolean;
  totalVideoCount: number;
  tractorVideoCount: number;
}

// "How visible is Sonalika?" key-insights module — moved here verbatim from
// Dashboard.tsx's KeyInsightsCard (formerly the "Content Market Share" module
// of the Intelligence Overview tab). Depends only on cmsData/allData/date
// range — never touched useKpiData/kpiCalculations.ts, so this move required
// no changes to the shared VoI/CP calculation files.
export function CMSKeyInsights({
  cmsData, allData, startDate, endDate, loading, totalVideoCount, tractorVideoCount,
}: CMSKeyInsightsProps) {
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
    // Dedupe by video_id — allWin is expanded with one row per detected brand for
    // multi-brand tractor videos, so raw row counts double-count those videos.
    // Mirrors computeOverviewStats() in useCMSData.js, which drives the Total
    // Videos / Tractor Videos summary cards.
    const totalVideoCountLocal = new Set(allWin.map((r) => r.video_id)).size;
    const tractorVideoCountLocal = new Set(allWin.filter((r) => r.is_tractor_content === true).map((r) => r.video_id)).size;
    const tractorDensity = totalVideoCountLocal > 0 ? (tractorVideoCountLocal / totalVideoCountLocal) * 100 : 0;
    const activeChannelCount = new Set(allWin.map((r) => r.channel_name).filter(Boolean)).size;
    const inactiveCount = Math.max(0, 52 - activeChannelCount);
    const categoryBreakdown = computeCategoryData(allData, startDate, endDate);
    const otherCategories = categoryBreakdown.filter((c) => c.category !== 'Tractor');
    const sortedCategories = [
      ...otherCategories.filter((c) => c.category !== 'Others').sort((a, b) => b.count - a.count),
      ...otherCategories.filter((c) => c.category === 'Others'),
    ];
    const densitySubtitle = sortedCategories
      .map((c) => `${c.category} ${c.percentage.toFixed(1)}%`)
      .join(' · ');

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
      const prevTotalVideoCount = new Set(prevAllWin.map((r) => r.video_id)).size;
      const prevTractorVideoCount = new Set(prevAllWin.filter((r) => r.is_tractor_content === true).map((r) => r.video_id)).size;
      prevTractorDensity = prevTotalVideoCount > 0 ? (prevTractorVideoCount / prevTotalVideoCount) * 100 : 0;
    }

    return {
      sov, soe, pubRate, sonRank, numBrands, topBrand, gapToTop, sovSoeGap: sov - soe,
      topCh, topChCount, tractorDensity, inactiveCount, densitySubtitle,
      prevSov, prevSoe, prevPubRate, prevTractorDensity,
    };
  }, [cmsData, allData, startDate, endDate, numDays, hasPrevData, prevStartIso, prevEndIso]);

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

  // ── State A bullet data ───────────────────────────────────────────────────────
  const cmsStateA = useMemo(() => {
    const allWin = allData.filter((r: any) => r.publish_date >= startDate && r.publish_date <= endDate);
    const tractorCount = new Set(allWin.filter((r: any) => r.is_tractor_content).map((r: any) => r.video_id)).size;
    const totalCount = new Set(allWin.map((r: any) => r.video_id)).size;
    const densityPct = totalCount > 0 ? ((tractorCount / totalCount) * 100).toFixed(1) : '0.0';

    // Brand SoV — read from hook's cmsData (NON_TRACTOR already excluded by useCMSData)
    const winBranded = cmsData.filter((r: any) => r.publish_date >= startDate && r.publish_date <= endDate);
    const brandVidMap = new Map<string, Set<string>>();
    for (const r of winBranded) {
      if (!brandVidMap.has(r.attributed_brand)) brandVidMap.set(r.attributed_brand, new Set());
      brandVidMap.get(r.attributed_brand)!.add(r.video_id);
    }
    const totalAttrib = new Set(winBranded.map((r: any) => r.video_id)).size;
    const brandSoVRanked = [...brandVidMap.entries()]
      .map(([brand, vids]) => ({ brand, count: vids.size, sov: totalAttrib > 0 ? (vids.size / totalAttrib) * 100 : 0 }))
      .sort((a, b) => b.count - a.count);
    const filteredBrands = brandSoVRanked.filter((b) => b.count > 1);
    const totalBrands = filteredBrands.length;
    const sonalikaSoV = (brandSoVRanked.find((b) => b.brand === 'Sonalika')?.sov ?? 0).toFixed(1);
    const sonRankIdx = filteredBrands.findIndex((b) => b.brand === 'Sonalika');
    const sonRank = sonRankIdx >= 0 ? sonRankIdx + 1 : totalBrands + 1;
    const leader = brandSoVRanked[0];
    const leaderName = leader?.brand || '';
    const leaderSoV = (leader?.sov ?? 0).toFixed(1);
    const gap = Math.abs(parseFloat(leaderSoV) - parseFloat(sonalikaSoV)).toFixed(1);
    const sonRankColor = sonRank <= 3 ? '#639922' : '#EF9F27';

    // Publishing consistency — reuses the same per-brand × per-day video counts
    // (winBranded / brandVidMap) that drive the Content Frequency heatmap footer.
    const totalWindowDays = numDays;
    const sonalikaActiveDays = new Set(
      winBranded.filter((r: any) => r.attributed_brand === 'Sonalika').map((r: any) => r.publish_date)
    ).size;
    let mostActiveCompetitor = '';
    let mostActiveRate = 0;
    for (const [brand, vids] of brandVidMap.entries()) {
      if (brand === 'Sonalika') continue;
      const rate = totalWindowDays > 0 ? vids.size / totalWindowDays : 0;
      if (rate > mostActiveRate) {
        mostActiveRate = rate;
        mostActiveCompetitor = brand;
      }
    }
    const mostActiveRateFmt = mostActiveRate.toFixed(1);

    // SubCategory still reads from allWin — attributed_brand is already set on each row
    const seenSon = new Set<string>();
    const subCats: Record<string, number> = {};
    for (const r of allWin) {
      if (r.attributed_brand !== 'Sonalika' || seenSon.has(r.video_id)) continue;
      seenSon.add(r.video_id);
      const cat = r.tractor_sub_category;
      if (cat && cat !== '') subCats[cat] = (subCats[cat] || 0) + 1;
    }
    const sonVideoCount = seenSon.size;
    const topSubCatEntry = Object.entries(subCats).sort((a, b) => b[1] - a[1])[0];
    const topSubCat = topSubCatEntry?.[0] || '';
    const topSubCatPct = sonVideoCount > 0 && topSubCatEntry ? ((topSubCatEntry[1] / sonVideoCount) * 100).toFixed(1) : '0.0';

    return {
      tractorCount, totalCount, densityPct, sonalikaSoV, sonRank, totalBrands, leaderName, leaderSoV, gap, sonRankColor,
      topSubCat, topSubCatPct,
      totalWindowDays, sonalikaActiveDays, mostActiveCompetitor, mostActiveRate: mostActiveRateFmt,
    };
  }, [cmsData, allData, startDate, endDate, numDays]);

  const cmsBullets: { color: string; text: string }[] = [
    { color: '#1D4ED8', text: `${tractorVideoCount} of ${totalVideoCount} tracked videos are tractor content in this window (${(totalVideoCount > 0 ? (tractorVideoCount / totalVideoCount) * 100 : 0).toFixed(1)}%).` },
    ...(cmsStateA.mostActiveCompetitor ? [{ color: '#1D4ED8', text: `Sonalika published on ${cmsStateA.sonalikaActiveDays} of ${cmsStateA.totalWindowDays} days this window - ${cmsStateA.mostActiveCompetitor} was most active at ${cmsStateA.mostActiveRate}/day.` }] : []),
    ...(cmsStateA.topSubCat ? [{ color: '#1D4ED8', text: `${cmsStateA.topSubCatPct}% of Sonalika's videos in this window are ${cmsStateA.topSubCat} content.` }] : []),
  ];

  return (
    <SectionCard title="How visible is Sonalika?">
      {loading ? (
        <p style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center' }}>Loading…</p>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: cmsTrend ? 12 : 0 }}>
            <KiSignalCard
              bg="#E6F1FB" textColor="#0C447C"
              icon={<MegaphoneIcon size={14} />}
              headline={`${cms.sov.toFixed(1)}% SoV · Rank #${cms.sonRank} of ${Math.min(cms.numBrands, 20)}`}
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
              sub={cms.densitySubtitle}
            />
          </div>
          <KiStateABullets items={cmsBullets} />
          {cmsTrend && (
            <>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12, marginBottom: 10, marginTop: 12 }}>
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
    </SectionCard>
  );
}
