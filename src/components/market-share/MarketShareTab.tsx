import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../SectionHeader';
import { ShareOfVoiceCharts } from './ShareOfVoiceCharts';
import { ShareOfEngagementCard } from './ShareOfEngagementCard';
import { ShareTrendCharts } from './ShareTrendCharts';
import { ContentFrequencyChart } from './ContentFrequencyChart';
import { BrandFilterButton } from './BrandFilterButton';
import { BRANDS } from '../../data/mockData';
import {
  summarizeBrands,
  buildWeeklyData,
  buildWeeklySoV,
  SONALIKA_BRAND
} from '../../hooks/useCMSData.js';
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
  setGlobalDateRange: _setGlobalDateRange,
  allData,
  cmsData,
  loading,
  error,
}: MarketShareTabProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    BRANDS.map((b) => b.name)
  );
  const [includeShorts, setIncludeShorts] = useState<boolean>(true);

  const { startDate, endDate } = globalDateRange;

  const derived = useMemo(() => {
    const baseData = includeShorts
      ? cmsData
      : cmsData.filter((r: any) => r.is_short === 0);

    // Filter by selected date range
    const windowRows = baseData.filter(
      (r: any) => r.publish_date >= startDate && r.publish_date <= endDate
    );

    const brandRows = windowRows.filter((r: any) =>
      selectedBrands.includes(r.attributed_brand)
    );
    const brandSummary = summarizeBrands(brandRows);
    const sonalika = brandSummary.find((b: any) => b.brand === SONALIKA_BRAND) ?? null;

    // Weeks present in the filtered window (for trend charts)
    const windowWeeks = [...new Set(brandRows.map((r: any) => r.publish_week))]
      .filter(Boolean)
      .sort() as string[];

    // Dates present in the filtered window (for heatmap)
    const windowDates = [...new Set(brandRows.map((r: any) => r.publish_date))]
      .filter(Boolean)
      .sort() as string[];

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
      const prevRows = baseData.filter(
        (r: any) =>
          r.publish_date >= prevStartIso &&
          r.publish_date <= prevEndIso &&
          selectedBrands.includes(r.attributed_brand)
      );
      const prevSummary = summarizeBrands(prevRows);
      const prevSon = prevSummary.find((b: any) => b.brand === SONALIKA_BRAND);
      const r1 = (n: number) => Math.round(n * 10) / 10;
      periodDeltas = {
        videos: r1((sonalika?.sov_videos ?? 0) - (prevSon?.sov_videos ?? 0)),
        views: r1((sonalika?.sov_views ?? 0) - (prevSon?.sov_views ?? 0)),
        comments: r1((sonalika?.sov_comments ?? 0) - (prevSon?.sov_comments ?? 0)),
        prevStart: prevStartIso,
        prevEnd: prevEndIso,
        noData: false,
      };
    }

    const brandWeeklyData = buildWeeklyData(brandRows);
    const brandWeeklySoV = buildWeeklySoV(brandWeeklyData);

    const ordered = [
      ...brandSummary.filter((b: any) => b.isOwn),
      ...brandSummary.filter((b: any) => !b.isOwn)
    ];
    // Daily distinct video count per brand × date for the heatmap
    const dateVideoSets = new Map<string, Set<string>>();
    for (const r of brandRows) {
      const key = `${(r as any).attributed_brand}__${(r as any).publish_date}`;
      if (!dateVideoSets.has(key)) dateVideoSets.set(key, new Set<string>());
      dateVideoSets.get(key)!.add((r as any).video_id);
    }
    const heatmapRows = ordered.map((b: any) => ({
      name: b.brand,
      isSonalika: b.isOwn,
      data: windowDates.map((d: string) => dateVideoSets.get(`${b.brand}__${d}`)?.size ?? 0)
    }));

    const videoCount = new Set(brandRows.map((r: any) => r.video_id)).size;
    const tractorRows = allData.filter(
      (r: any) => r.is_tractor_content === 1 && r.publish_date >= startDate && r.publish_date <= endDate
    );
    const channelCount = new Set(tractorRows.map((r: any) => r.channel_name)).size;
    const totalRowCount = brandRows.length;

    // Build week → minimum publish_date map for x-axis date labels in Share Trends.
    const weekFirstDates: Record<string, string> = {};
    for (const r of brandRows) {
      const week = (r as any).publish_week as string;
      const date = (r as any).publish_date as string;
      if (week && date && (!weekFirstDates[week] || date < weekFirstDates[week])) {
        weekFirstDates[week] = date;
      }
    }

    return {
      windowWeeks,
      windowDates,
      brandSummary,
      sonalika,
      brandWeeklySoV,
      heatmapRows,
      videoCount,
      totalRowCount,
      periodDeltas,
      weekFirstDates,
      dataContext: `${videoCount} attributed videos · ${channelCount} channels · ${formatDate(startDate)} – ${formatDate(endDate)}`
    };
  }, [cmsData, startDate, endDate, selectedBrands, includeShorts]);

  const trendBrands = derived.brandSummary.map((b: any) => ({
    name: b.brand,
    color: b.color,
    isOwn: b.isOwn
  }));

  const headerMeta = loading || error ? '' : derived.dataContext;

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5">

      <motion.div
        variants={item}
        className="flex items-end justify-between gap-4">

        <SectionHeader
          title="Content Market Share"
          descriptor="Organic creator content - Indian tractor market"
          meta={headerMeta} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <BrandFilterButton
            selectedBrands={selectedBrands}
            onChange={setSelectedBrands}
            includeShorts={includeShorts}
            onShortsChange={setIncludeShorts} />
        </div>
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
              totalRowCount={derived.totalRowCount}
              periodDeltas={derived.periodDeltas} />
          </motion.div>
          <motion.div variants={item}>
            <ShareOfEngagementCard
            soe={derived.sonalika?.soe ?? 0}
            sov_views={derived.sonalika?.sov_views ?? 0}
            sov_videos={derived.sonalika?.sov_videos ?? 0}
            rows={derived.brandSummary} />

          </motion.div>
          <motion.div variants={item}>
            <ShareTrendCharts
            weeks={derived.windowWeeks}
            weeklySoV={derived.brandWeeklySoV}
            brands={trendBrands}
            weekFirstDates={derived.weekFirstDates}
            startDate={startDate}
            endDate={endDate} />

          </motion.div>
          <motion.div variants={item}>
            <ContentFrequencyChart
            weeks={derived.windowDates}
            rows={derived.heatmapRows} />

          </motion.div>
        </>
      }
    </motion.div>);

}
