import React, { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardHeader } from '../components/DashboardHeader';
import { KpiCards } from '../components/KpiCards';
import { MarketShareTab } from '../components/market-share/MarketShareTab';
import { SentimentTab } from '../components/sentiment/SentimentTab';
import { UnderDevelopment } from '../components/UnderDevelopment';
import { COMPETITORS, DateRangeKey, TabKey } from '../data/mockData';
import { useScreenInit } from '../useScreenInit.js';
const UNDER_DEV_TITLES: Partial<Record<TabKey, string>> = {
  influencer: 'Voice of Influencer',
  positioning: 'Competitive Positioning'
};
export function Dashboard() {
  const screenState = useScreenInit();
  const [activeTab, setActiveTab] = useState<TabKey>(
    screenState?.activeTab as TabKey ?? 'market-share'
  );
  const [dateRange] = useState<DateRangeKey>('30d');
  const [selectedCompetitors] = useState<string[]>(
    COMPETITORS.map((c) => c.id)
  );
  const underDevTitle = UNDER_DEV_TITLES[activeTab];
  return (
    <div className="min-h-screen w-full bg-slate-50">
      <DashboardHeader activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
        {underDevTitle ?
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}>

            <UnderDevelopment title={underDevTitle} />
          </div> :
        activeTab === 'overview' ?
        <div
          role="tabpanel"
          id={`panel-${activeTab}`}
          aria-labelledby={`tab-${activeTab}`}>

            <KpiCards
            dateRange={dateRange}
            selectedCompetitors={selectedCompetitors} />

          </div> :

        <div>
          <div
            role="tabpanel"
            id={`panel-${activeTab}`}
            aria-labelledby={`tab-${activeTab}`}
            className="pt-5">
            
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{
                  opacity: 0,
                  x: activeTab === 'sentiment' ? 16 : -16
                }}
                animate={{
                  opacity: 1,
                  x: 0
                }}
                exit={{
                  opacity: 0,
                  x: activeTab === 'sentiment' ? -16 : 16
                }}
                transition={{
                  duration: 0.2,
                  ease: 'easeOut'
                }}>
                
                {activeTab === 'market-share' ?
                <MarketShareTab
                  selectedCompetitors={selectedCompetitors} /> :


                <SentimentTab dateRange={dateRange} />
                }
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        }
      </main>
    </div>);

}