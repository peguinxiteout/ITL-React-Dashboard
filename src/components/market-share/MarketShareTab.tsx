import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { SectionHeader } from '../SectionHeader';
import { ShareOfVoiceCharts } from './ShareOfVoiceCharts';
import { ShareOfEngagementCard } from './ShareOfEngagementCard';
import { ShareTrendCharts } from './ShareTrendCharts';
import { ContentFrequencyChart } from './ContentFrequencyChart';
import { BrandFilterButton } from './BrandFilterButton';
import { WeekPresetSelector } from './WeekPresetSelector';
import {
  BRANDS,
  SONALIKA_ID,
  WeekPreset,
  getBrand,
  getWeekPreset,
  getWeeklyBrandStats
} from
  '../../data/mockData';
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
export function MarketShareTab({ selectedCompetitors }: MarketShareTabProps) {
  const [selectedBrands, setSelectedBrands] = useState<string[]>(
    BRANDS.map((b) => b.name)
  );
  const [selectedWeeks, setSelectedWeeks] = useState<WeekPreset>(12);
  const preset = getWeekPreset(selectedWeeks);
  const dataContext = `${preset.videos} attributed videos · ${preset.channels} channels · ${preset.window}`;
  const stats = getWeeklyBrandStats(selectedWeeks).filter(
    (s) => s.brandId === SONALIKA_ID || selectedCompetitors.includes(s.brandId)
  );
  // Brand pill filter applies to line charts, bar chart, and table rows —
  // the donut charts intentionally keep the full competitor set.
  const brandFilteredStats = stats.filter((s) =>
    selectedBrands.includes(getBrand(s.brandId).name)
  );
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
          meta={dataContext} />

        <div className="flex flex-wrap items-center justify-end gap-2">
          <WeekPresetSelector
            value={selectedWeeks}
            onChange={setSelectedWeeks} />

          <BrandFilterButton
            selectedBrands={selectedBrands}
            onChange={setSelectedBrands} />
        </div>
      </motion.div>
      <motion.div variants={item}>
        <ShareOfVoiceCharts stats={stats} />
      </motion.div>
      <motion.div variants={item}>
        <ShareOfEngagementCard
          selectedWeeks={selectedWeeks}
          selectedBrands={selectedBrands} />
      </motion.div>
      <motion.div variants={item}>
        <ShareTrendCharts
          weeks={selectedWeeks}
          selectedBrands={selectedBrands} />
      </motion.div>
      <motion.div variants={item}>
        <ContentFrequencyChart
          selectedWeeks={selectedWeeks}
          selectedBrands={selectedBrands} />
      </motion.div>
    </motion.div>);

}
