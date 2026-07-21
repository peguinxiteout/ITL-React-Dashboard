import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

import { DashboardHeader } from '../components/DashboardHeader';
import { MarketShareTab } from '../components/market-share/MarketShareTab';
import { SentimentTab } from '../components/sentiment/SentimentTab';
import { COMPETITORS, DateRangeKey, TabKey } from '../data/mockData';
import VoiceInfluencerTab from '../components/influencer/VoiceInfluencerTab';
import CompetitivePositioningTab from '../components/positioning/CompetitivePositioningTab';
import { useScreenInit } from '../useScreenInit';
import { useCMSData } from '../hooks/useCMSData.js';

export interface GlobalDateRange {
  startDate: string;
  endDate: string;
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export function Dashboard() {
  const screenState = useScreenInit();

  const [activeTab, setActiveTab] = useState<TabKey>(
    (screenState?.activeTab as TabKey) ?? 'market-share'
  );

  // Brand currently selected on whichever of CMS/VS/VoI/CP is active — mirrored
  // into the header title.
  const [activeTabBrandName, setActiveTabBrandName] = useState<string | null>(null);

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

  const { allData, cmsData, loading: cmsLoading, error: cmsError } = useCMSData();

  const renderActiveTab = () => {
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
