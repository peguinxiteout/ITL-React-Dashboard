import React, { Children } from 'react';
import { motion } from 'framer-motion';
import {
  MegaphoneIcon,
  HeartHandshakeIcon,
  CalendarClockIcon,
  SmileIcon,
  ShoppingCartIcon,
  TrendingUpIcon,
  TrendingDownIcon } from
'lucide-react';
import {
  DateRangeKey,
  KPI_META,
  INTENT_BASE_COUNTS,
  SONALIKA_ID,
  engagementOf,
  formatNumber,
  getBrandStats,
  scaleCount } from
'../data/mockData';
interface KpiCardsProps {
  dateRange: DateRangeKey;
  selectedCompetitors: string[];
}
interface Kpi {
  label: string;
  value: string;
  delta: number;
  deltaSuffix: string;
  icon: React.ReactNode;
  caption: string;
}
const container = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.06
    }
  }
};
const item = {
  hidden: {
    opacity: 0,
    y: 12
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
export function KpiCards({ dateRange, selectedCompetitors }: KpiCardsProps) {
  const stats = getBrandStats(dateRange).filter(
    (s) => s.brandId === SONALIKA_ID || selectedCompetitors.includes(s.brandId)
  );
  const sonalika = stats.find((s) => s.brandId === SONALIKA_ID)!;
  const meta = KPI_META[dateRange];
  const totalVideos = stats.reduce((acc, s) => acc + s.videos, 0);
  const totalEngagement = stats.reduce((acc, s) => acc + engagementOf(s), 0);
  const sov = sonalika.videos / totalVideos * 100;
  const soe = engagementOf(sonalika) / totalEngagement * 100;
  const categoryAvgRate =
  stats.
  filter((s) => s.brandId !== SONALIKA_ID).
  reduce((acc, s) => acc + s.publishRate, 0) /
  Math.max(stats.length - 1, 1);
  const intentVolume = scaleCount(
    INTENT_BASE_COUNTS['Buying consideration'] +
    INTENT_BASE_COUNTS.Shortlisting +
    INTENT_BASE_COUNTS['Dealer inquiry'],
    dateRange
  );
  const kpis: Kpi[] = [
  {
    label: 'Share of Voice',
    value: `${sov.toFixed(1)}%`,
    delta: meta.sovDelta,
    deltaSuffix: ' pts',
    icon: <MegaphoneIcon className="h-5 w-5" aria-hidden="true" />,
    caption: 'of category video volume'
  },
  {
    label: 'Share of Engagement',
    value: `${soe.toFixed(1)}%`,
    delta: meta.soeDelta,
    deltaSuffix: ' pts',
    icon: <HeartHandshakeIcon className="h-5 w-5" aria-hidden="true" />,
    caption: 'views + likes + comments'
  },
  {
    label: 'Publish Rate',
    value: `${sonalika.publishRate.toFixed(1)}/wk`,
    delta: meta.freqDelta,
    deltaSuffix: '/wk',
    icon: <CalendarClockIcon className="h-5 w-5" aria-hidden="true" />,
    caption: `vs ${categoryAvgRate.toFixed(1)}/wk category avg`
  },
  {
    label: 'Sentiment Score',
    value: `${meta.sentimentScore}`,
    delta: meta.sentimentDelta,
    deltaSuffix: ' pts',
    icon: <SmileIcon className="h-5 w-5" aria-hidden="true" />,
    caption: 'out of 100, comment-based'
  },
  {
    label: 'Purchase-Intent Comments',
    value: formatNumber(intentVolume),
    delta: meta.intentDelta,
    deltaSuffix: '%',
    icon: <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />,
    caption: 'buying / shortlist / dealer signals'
  }];

  return (
    <motion.section
      aria-label="Key performance indicators"
      variants={container}
      initial="hidden"
      animate="show"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      
      {kpis.map((kpi) => {
        const positive = kpi.delta >= 0;
        return (
          <motion.div
            key={kpi.label}
            variants={item}
            className="rounded-xl border border-slate-200 bg-white p-4">
            
            <div className="flex items-center justify-between">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                {kpi.icon}
              </span>
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${positive ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'}`}>
                
                {positive ?
                <TrendingUpIcon className="h-3 w-3" aria-hidden="true" /> :

                <TrendingDownIcon className="h-3 w-3" aria-hidden="true" />
                }
                {positive ? '+' : ''}
                {kpi.delta}
                {kpi.deltaSuffix}
              </span>
            </div>
            <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
              {kpi.value}
            </p>
            <p className="text-sm font-medium text-slate-700">{kpi.label}</p>
            <p className="mt-0.5 text-xs text-slate-500">{kpi.caption}</p>
          </motion.div>);

      })}
    </motion.section>);

}