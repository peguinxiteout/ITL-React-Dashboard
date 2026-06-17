import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../SectionHeader';
import { ShareOfVoiceCharts } from './ShareOfVoiceCharts';
import { ShareOfEngagementCard } from './ShareOfEngagementCard';
import { ShareTrendCharts } from './ShareTrendCharts';
import { ContentFrequencyChart } from './ContentFrequencyChart';
import { BrandFilterButton } from './BrandFilterButton';
import { WeekPresetSelector } from './WeekPresetSelector';
import { BRANDS, WeekPreset } from '../../data/mockData';
import {
  useCMSData,
  summarizeBrands,
  buildWeeklyData,
  buildWeeklySoV,
  recentWeeks,
  SONALIKA_BRAND
} from '../../hooks/useCMSData.js';
interface MarketShareTabProps {
  selectedCompetitors: string[];
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

// "2026-03-06" → "Mar 06, 2026" (no timezone math — parsed straight from the string)
const formatDate = (iso: string): string => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mi = parseInt(m, 10) - 1;
  return `${MONTHS[mi] ?? m} ${d}, ${y}`;
};

export function MarketShareTab({ selectedCompetitors: _selectedCompetitors }: MarketShareTabProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    BRANDS.map((b) => b.name)
  );
  const [selectedWeeks, setSelectedWeeks] = useState<WeekPreset>(12);
  const [includeShorts, setIncludeShorts] = useState<boolean>(false);

  const { loading, error, cmsData, weeks } = useCMSData();

  const derived = useMemo(() => {
    // Exclude Shorts (is_short === 1) by default; toggle re-includes them.
    const baseData = includeShorts
      ? cmsData
      : cmsData.filter((r: any) => r.is_short === 0);

    // Most recent N weeks present in the real data — never hardcoded.
    const windowWeeks = recentWeeks(weeks, selectedWeeks);
    const windowWeekSet = new Set(windowWeeks);
    const windowRows = baseData.filter((r: any) => windowWeekSet.has(r.publish_week));

    // All charts, donuts, KPIs, and the data context line use only the
    // selectedBrands subset — shares re-base to the filtered set.
    const brandRows = windowRows.filter((r: any) =>
      selectedBrands.includes(r.attributed_brand)
    );
    const brandSummary = summarizeBrands(brandRows);
    const sonalika = brandSummary.find((b: any) => b.brand === SONALIKA_BRAND) ?? null;

    const brandWeeklyData = buildWeeklyData(brandRows);
    const brandWeeklySoV = buildWeeklySoV(brandWeeklyData);

    // Heatmap matrix: Sonalika first, then remaining selected brands by SoV.
    const ordered = [
      ...brandSummary.filter((b: any) => b.isOwn),
      ...brandSummary.filter((b: any) => !b.isOwn)
    ];
    const countByKey = new Map<string, number>();
    brandWeeklyData.forEach((d: any) => {
      countByKey.set(`${d.brand}__${d.week}`, d.video_count);
    });
    const heatmapRows = ordered.map((b: any) => ({
      name: b.brand,
      isSonalika: b.isOwn,
      data: windowWeeks.map((w: string) => countByKey.get(`${b.brand}__${w}`) ?? 0)
    }));

    // Data context line — counts from the brand-filtered window only.
    const videoCount = new Set(brandRows.map((r: any) => r.video_id)).size;
    const channelCount = new Set(brandRows.map((r: any) => r.channel_name)).size;
    const dates = brandRows.map((r: any) => r.publish_date).filter(Boolean).sort();
    const dateRange =
      dates.length > 0
        ? `${formatDate(dates[0])} – ${formatDate(dates[dates.length - 1])}`
        : '';

    return {
      windowWeeks,
      brandSummary,
      sonalika,
      brandWeeklySoV,
      heatmapRows,
      dataContext: `${videoCount} attributed videos · ${channelCount} channels · ${dateRange}`
    };
  }, [cmsData, weeks, selectedWeeks, selectedBrands, includeShorts]);

  // Brand list (with colors) for the trend chart legend/lines — selected only.
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
          <WeekPresetSelector
            value={selectedWeeks}
            onChange={setSelectedWeeks} />

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
            <ShareOfVoiceCharts summary={derived.brandSummary} />
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
            brands={trendBrands} />

          </motion.div>
          <motion.div variants={item}>
            <ContentFrequencyChart
            weeks={derived.windowWeeks}
            rows={derived.heatmapRows} />

          </motion.div>
        </>
      }
    </motion.div>);

}
