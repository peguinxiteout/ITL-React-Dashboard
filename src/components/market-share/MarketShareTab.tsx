import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TabKPIHeader } from '../shared/TabKPIHeader';
import { CMSKeyInsights } from './CMSKeyInsights';
import { ShareOfVoiceCharts } from './ShareOfVoiceCharts';
import { ShareOfEngagementCard } from './ShareOfEngagementCard';
import { ShareTrendCharts } from './ShareTrendCharts';
import { ContentFrequencyChart } from './ContentFrequencyChart';
import { VSSelect, VSSelectOption } from '../sentiment/VSSelect';
import {
  summarizeBrands,
  buildWeeklyData,
  buildWeeklySoV,
  computeOverviewStats,
  SONALIKA_BRAND,
} from '../../hooks/useCMSData.js';
import { getBrandColor } from '../../utils/brandColors';
import type { GlobalDateRange } from '../../pages/Dashboard';

interface MarketShareTabProps {
  selectedCompetitors: string[];
  globalDateRange: GlobalDateRange;
  setGlobalDateRange: (value: GlobalDateRange | ((prev: GlobalDateRange) => GlobalDateRange)) => void;
  allData: any[];
  cmsData: any[];
  loading: boolean;
  error: string | null;
}

const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.07
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 14
  },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: 'easeOut'
    }
  }
};

const MONTHS = [
'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// "2026-03-06" → "Mar 06, 2026" — no Date constructor, avoids timezone drift
const formatDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mi = parseInt(m, 10) - 1;
  return `${MONTHS[mi] ?? m} ${d}, ${y}`;
};

// ISO date string arithmetic using UTC epoch to avoid timezone issues
function dateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y, m - 1, d);
}

function utcMsToIso(ms: number): string {
  const d = new Date(ms);
  const y = d.getUTCFullYear();
  const mo = String(d.getUTCMonth() + 1).padStart(2, '0');
  const da = String(d.getUTCDate()).padStart(2, '0');
  return `${y}-${mo}-${da}`;
}

const MS_PER_DAY = 86400000;

export function MarketShareTab({
  selectedCompetitors: _selectedCompetitors,
  globalDateRange,
  setGlobalDateRange,
  allData,
  cmsData,
  loading,
  error,
}: MarketShareTabProps) {
  // "Home" brand every own-vs-rest visual keys off; every isOwn flag below
  // derives from this instead of the static CMS_BRAND_META table.
  const [ownBrand, setOwnBrand] = useState<string>(SONALIKA_BRAND);

  const { startDate, endDate } = globalDateRange;

  // Same COUNT DISTINCT video_id stats IO's header cards show, so the two tabs
  // never disagree on Total Videos / Tractor Videos / Brand Mentioned for a
  // given date range.
  const overviewStats = useMemo(
    () => computeOverviewStats(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  // All attributed tractor rows in the current date window — shorts and
  // long-form alike; the tab has no brand/shorts filtering.
  const windowBrandedRows = useMemo(() =>
    cmsData.filter(
      (r: any) => r.publish_date >= startDate && r.publish_date <= endDate
    ),
    [cmsData, startDate, endDate]
  );

  // Every brand attributed to at least one video in the window — no minimum-video
  // threshold; own brand pinned first, rest alphabetical
  const availableBrands = useMemo(() => {
    const brands = new Set<string>(
      windowBrandedRows.map((r: any) => r.attributed_brand)
    );
    return [...brands].sort((a: string, b: string) => {
      if (a === ownBrand) return -1;
      if (b === ownBrand) return 1;
      return a.localeCompare(b);
    });
  }, [windowBrandedRows, ownBrand]);

  // If a date-window change drops the selected own brand out of the list,
  // fall back to the default rather than pointing every chart at a ghost brand.
  useEffect(() => {
    if (availableBrands.length > 0 && !availableBrands.includes(ownBrand)) {
      setOwnBrand(SONALIKA_BRAND);
    }
  }, [availableBrands, ownBrand]);

  // Shape for BrandFilterButton — name + color + isOwn flag
  const brandItems = useMemo(() =>
    availableBrands.map((name: string) => ({
      name,
      isOwn: name === ownBrand,
      color: getBrandColor(name),
    })),
    [availableBrands, ownBrand]
  );

  // Options for the own-brand dropdown; falls back to the current selection
  // while data is still loading so VSSelect never renders with zero options.
  const ownBrandOptions = useMemo<VSSelectOption[]>(() => {
    const opts = availableBrands.map((name: string) => ({
      value: name,
      label: name,
      color: getBrandColor(name),
    }));
    return opts.length > 0
      ? opts
      : [{ value: ownBrand, label: ownBrand, color: getBrandColor(ownBrand) }];
  }, [availableBrands, ownBrand]);

  const derived = useMemo(() => {
    const windowRows = windowBrandedRows;

    // isOwn is recomputed against ownBrand — the static flag the hook attaches
    // from CMS_BRAND_META is import-time and ignores the dropdown selection.
    const brandSummary = summarizeBrands(windowRows).map((b: any) => ({
      ...b,
      isOwn: b.brand === ownBrand,
    }));
    const own = brandSummary.find((b: any) => b.isOwn) ?? null;

    // Dates present in the window (for trend charts)
    const windowWeeks = [...new Set(windowRows.map((r: any) => r.publish_date))]
      .filter(Boolean)
      .sort() as string[];

    // Every date from startDate to endDate inclusive, regardless of data (for heatmap columns)
    const windowDatesStartMs = dateToUtcMs(startDate);
    const windowDatesEndMs = dateToUtcMs(endDate);
    const windowDatesCount = Math.round((windowDatesEndMs - windowDatesStartMs) / MS_PER_DAY) + 1;
    const windowDates = Array.from({ length: windowDatesCount }, (_, i) =>
      utcMsToIso(windowDatesStartMs + i * MS_PER_DAY)
    );

    // ── Period delta computation ──────────────────────────────────────────────
    // Period length = endDate − startDate (day difference, not inclusive count)
    const startMs = dateToUtcMs(startDate);
    const endMs = dateToUtcMs(endDate);
    const periodDays = Math.round((endMs - startMs) / MS_PER_DAY);
    const prevEndMs = startMs - MS_PER_DAY;          // day before startDate
    const prevStartMs = prevEndMs - periodDays * MS_PER_DAY;
    const prevStartIso = utcMsToIso(prevStartMs);
    const prevEndIso = utcMsToIso(prevEndMs);
    const noData = prevStartIso < '2026-03-01';

    let periodDeltas: {
      videos: number | null;
      views: number | null;
      comments: number | null;
      prevStart: string;
      prevEnd: string;
      noData: boolean;
    };

    if (noData) {
      periodDeltas = {
        videos: null,
        views: null,
        comments: null,
        prevStart: prevStartIso,
        prevEnd: prevEndIso,
        noData: true,
      };
    } else {
      const prevRows = cmsData.filter(
        (r: any) =>
          r.publish_date >= prevStartIso && r.publish_date <= prevEndIso
      );
      const prevSummary = summarizeBrands(prevRows);
      const prevOwn = prevSummary.find((b: any) => b.brand === ownBrand);
      const r1 = (n: number) => Math.round(n * 10) / 10;
      periodDeltas = {
        videos: r1((own?.sov_videos ?? 0) - (prevOwn?.sov_videos ?? 0)),
        views: r1((own?.sov_views ?? 0) - (prevOwn?.sov_views ?? 0)),
        comments: r1((own?.sov_comments ?? 0) - (prevOwn?.sov_comments ?? 0)),
        prevStart: prevStartIso,
        prevEnd: prevEndIso,
        noData: false,
      };
    }

    const brandWeeklyData = buildWeeklyData(windowRows);
    const brandWeeklySoV = buildWeeklySoV(brandWeeklyData);

    const ordered = [
      ...brandSummary.filter((b: any) => b.isOwn),
      ...brandSummary.filter((b: any) => !b.isOwn)
    ];
    // Daily distinct video count per brand × date for the heatmap
    const dateVideoSets = new Map<string, Set<string>>();
    for (const r of windowRows) {
      const key = `${(r as any).attributed_brand}__${(r as any).publish_date}`;
      if (!dateVideoSets.has(key)) dateVideoSets.set(key, new Set<string>());
      dateVideoSets.get(key)!.add((r as any).video_id);
    }
    const heatmapRows = ordered.map((b: any) => ({
      name: b.brand,
      isSonalika: b.isOwn,
      data: windowDates.map((d: string) => dateVideoSets.get(`${b.brand}__${d}`)?.size ?? 0)
    }));

    // Count all attributed unique videos in the window (denominator for context line)
    const videoCount = new Set(windowRows.map((r: any) => r.video_id)).size;
    const tractorRows = allData.filter(
      (r: any) => r.is_tractor_content === true && r.publish_date >= startDate && r.publish_date <= endDate
    );
    const channelCount = new Set(tractorRows.map((r: any) => r.channel_name)).size;
    const totalRowCount = windowRows.length;

    // Build date → date identity map for x-axis labels in Share Trends (key is now publish_date).
    const weekFirstDates: Record<string, string> = {};
    for (const r of windowRows) {
      const date = (r as any).publish_date as string;
      if (date) weekFirstDates[date] = date;
    }

    return {
      windowWeeks,
      windowDates,
      brandSummary,
      own,
      brandWeeklySoV,
      heatmapRows,
      videoCount,
      totalRowCount,
      periodDeltas,
      weekFirstDates,
      dataContext: `${videoCount} attributed videos · ${channelCount} channels · ${formatDate(startDate)} – ${formatDate(endDate)}`
    };
  }, [cmsData, windowBrandedRows, startDate, endDate, ownBrand]);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5">

      <motion.div variants={item}>
        <TabKPIHeader
          title="Content Market Share"
          subtitle="Organic creator content - Indian tractor market"
          startDate={startDate}
          endDate={endDate}
          onDateChange={setGlobalDateRange}
          stats={overviewStats}
          loading={loading} />
      </motion.div>

      {/* Control bar — same placement pattern as Viewer Sentiment's Brand row */}
      <motion.div variants={item}>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-medium text-slate-400">Brand</span>
          <VSSelect
            size="lg"
            value={ownBrand}
            options={ownBrandOptions}
            onChange={setOwnBrand}
            ariaLabel="Own brand" />
        </div>
      </motion.div>

      <motion.div variants={item}>
        <CMSKeyInsights
          cmsData={cmsData}
          allData={allData}
          startDate={startDate}
          endDate={endDate}
          loading={loading}
          totalVideoCount={overviewStats.totalVideos}
          tractorVideoCount={overviewStats.tractorVideos}
          ownBrand={ownBrand}
        />
      </motion.div>

      {loading ?
      <div className="flex items-center justify-center py-24">
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Loading data...</span>
        </div> :
      error ?
      <div className="flex items-center justify-center py-24">
          <span style={{ fontSize: 13, color: '#94a3b8' }}>Failed to load data</span>
        </div> :

      <>
          <motion.div variants={item}>
            <ShareOfVoiceCharts
              summary={derived.brandSummary}
              totalUniqueVideos={derived.videoCount}
              periodDeltas={derived.periodDeltas}
              ownBrand={ownBrand} />
          </motion.div>
          <motion.div variants={item}>
            <ShareOfEngagementCard
            soe={derived.own?.soe ?? 0}
            sov_views={derived.own?.sov_views ?? 0}
            sov_videos={derived.own?.sov_videos ?? 0}
            rows={derived.brandSummary}
            ownBrand={ownBrand} />

          </motion.div>
          <motion.div variants={item}>
            <ShareTrendCharts
            weeks={derived.windowWeeks}
            weeklySoV={derived.brandWeeklySoV}
            brands={brandItems}
            ownBrand={ownBrand}
            weekFirstDates={derived.weekFirstDates}
            startDate={startDate}
            endDate={endDate} />

          </motion.div>
          <motion.div variants={item}>
            <ContentFrequencyChart
            weeks={derived.windowDates}
            rows={derived.heatmapRows}
            ownBrand={ownBrand} />

          </motion.div>
        </>
      }
    </motion.div>);

}
