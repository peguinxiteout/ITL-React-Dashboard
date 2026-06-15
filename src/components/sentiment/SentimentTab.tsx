import React, { useState, Children } from 'react';
import { motion } from 'framer-motion';
import {
  SmileIcon,
  ShoppingCartIcon,
  AlertTriangleIcon,
  HelpCircleIcon,
  ChevronDownIcon,
  ThumbsUpIcon,
  CheckCircle2Icon,
  CircleAlertIcon } from
'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell } from
'recharts';
import { SectionCard } from '../SectionCard';
import { SectionHeader } from '../SectionHeader';
import {
  DateRangeKey,
  IntentSignal,
  INTENT_BASE_COUNTS,
  INTENT_COMMENTS,
  RECURRING_QUESTIONS,
  SENTIMENT_SPLIT,
  UNMET_NEEDS,
  formatNumber,
  scaleCount } from
'../../data/mockData';
interface SentimentTabProps {
  dateRange: DateRangeKey;
}
const SIGNAL_STYLES: Record<
  IntentSignal,
  {
    badge: string;
    color: string;
  }> =
{
  'Buying consideration': {
    badge: 'bg-blue-50 text-blue-700',
    color: '#1D4ED8'
  },
  Shortlisting: {
    badge: 'bg-amber-50 text-amber-700',
    color: '#D97706'
  },
  'Dealer inquiry': {
    badge: 'bg-emerald-50 text-emerald-700',
    color: '#059669'
  }
};
const SEVERITY_STYLES = {
  High: 'bg-red-50 text-red-700',
  Medium: 'bg-amber-50 text-amber-700',
  Low: 'bg-slate-100 text-slate-600'
} as const;
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
export function SentimentTab({ dateRange }: SentimentTabProps) {
  const [expandedNeed, setExpandedNeed] = useState<string | null>(null);
  const split = SENTIMENT_SPLIT[dateRange];
  const intentTotal = scaleCount(
    INTENT_BASE_COUNTS['Buying consideration'] +
    INTENT_BASE_COUNTS.Shortlisting +
    INTENT_BASE_COUNTS['Dealer inquiry'],
    dateRange
  );
  const unanswered = RECURRING_QUESTIONS.filter((q) => !q.answered).length;
  const summaryCards = [
  {
    label: 'Sentiment Split',
    icon: <SmileIcon className="h-5 w-5" aria-hidden="true" />,
    content:
    <div className="mt-3">
          <div
        className="flex h-2.5 w-full overflow-hidden rounded-full"
        role="img"
        aria-label={`${split.positive}% positive, ${split.neutral}% neutral, ${split.negative}% negative`}>
        
            <span
          style={{
            width: `${split.positive}%`
          }}
          className="bg-emerald-500" />
        
            <span
          style={{
            width: `${split.neutral}%`
          }}
          className="bg-slate-300" />
        
            <span
          style={{
            width: `${split.negative}%`
          }}
          className="bg-red-500" />
        
          </div>
          <div className="mt-2 flex gap-3 text-xs text-slate-600">
            <span>
              <span className="font-semibold text-emerald-600">
                {split.positive}%
              </span>{' '}
              Pos
            </span>
            <span>
              <span className="font-semibold text-slate-500">
                {split.neutral}%
              </span>{' '}
              Neu
            </span>
            <span>
              <span className="font-semibold text-red-600">
                {split.negative}%
              </span>{' '}
              Neg
            </span>
          </div>
        </div>

  },
  {
    label: 'Purchase-Intent Signals',
    icon: <ShoppingCartIcon className="h-5 w-5" aria-hidden="true" />,
    content:
    <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">
            {formatNumber(intentTotal)}
          </p>
          <p className="text-xs text-slate-500">
            9.8% of all analyzed comments
          </p>
        </div>

  },
  {
    label: 'Unmet Needs Identified',
    icon: <AlertTriangleIcon className="h-5 w-5" aria-hidden="true" />,
    content:
    <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">
            {UNMET_NEEDS.length}
          </p>
          <p className="text-xs text-slate-500">
            {UNMET_NEEDS.filter((n) => n.severity === 'High').length}{' '}
            high-severity content gaps
          </p>
        </div>

  },
  {
    label: 'Recurring Questions',
    icon: <HelpCircleIcon className="h-5 w-5" aria-hidden="true" />,
    content:
    <div className="mt-3">
          <p className="text-2xl font-bold text-slate-900">
            {RECURRING_QUESTIONS.length}
          </p>
          <p className="text-xs text-slate-500">
            {unanswered} still unanswered across videos
          </p>
        </div>

  }];

  const signalDist = (Object.keys(INTENT_BASE_COUNTS) as IntentSignal[]).map(
    (signal) => ({
      name: signal,
      value: scaleCount(INTENT_BASE_COUNTS[signal], dateRange),
      color: SIGNAL_STYLES[signal].color
    })
  );
  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-5">

      <motion.div variants={item}>
        <SectionHeader
          title="Viewer Sentiment"
          descriptor="Purchase intent, unmet needs, and recurring questions from viewer comments" />
      </motion.div>
      {/* Exec summary cards */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        
        {summaryCards.map((card) =>
        <div
          key={card.label}
          className="rounded-xl border border-slate-200 bg-white p-4">
          
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-700">
                {card.icon}
              </span>
              <p className="text-sm font-medium text-slate-700">{card.label}</p>
            </div>
            {card.content}
          </div>
        )}
      </motion.div>

      {/* Purchase intent */}
      <motion.div
        variants={item}
        className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        
        <div className="lg:col-span-2">
          <SectionCard
            title="Purchase Intent Signals"
            subtitle="Representative comments indicating buying consideration, shortlisting, or dealer inquiry">
            
            <ul className="space-y-3">
              {INTENT_COMMENTS.map((c) =>
              <li
                key={c.id}
                className="rounded-lg border border-slate-100 bg-slate-50 p-3.5">
                
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-slate-900">
                      {c.author}
                    </span>
                    <span
                    className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${SIGNAL_STYLES[c.signal].badge}`}>
                    
                      {c.signal}
                    </span>
                    <span className="ml-auto text-xs text-slate-400">
                      {c.daysAgo}d ago
                    </span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-slate-700">
                    {c.text}
                  </p>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <span className="truncate text-xs text-slate-500">
                      on: {c.video}
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-xs text-slate-500">
                      <ThumbsUpIcon className="h-3 w-3" aria-hidden="true" />{' '}
                      {c.likes}
                    </span>
                  </div>
                </li>
              )}
            </ul>
          </SectionCard>
        </div>
        <SectionCard
          title="Signal Distribution"
          subtitle="Intent comment volume by signal type">
          
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={signalDist}
                layout="vertical"
                margin={{
                  top: 4,
                  right: 16,
                  left: 0,
                  bottom: 0
                }}>
                
                <XAxis
                  type="number"
                  tick={{
                    fontSize: 11,
                    fill: '#64748b'
                  }}
                  tickLine={false}
                  axisLine={false} />
                
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{
                    fontSize: 11,
                    fill: '#334155'
                  }}
                  tickLine={false}
                  axisLine={false} />
                
                <Tooltip
                  formatter={(value: number) => [
                  formatNumber(value),
                  'Comments']
                  }
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e2e8f0'
                  }}
                  cursor={{
                    fill: '#f1f5f9'
                  }} />
                
                <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={22}>
                  {signalDist.map((d) =>
                  <Cell key={d.name} fill={d.color} />
                  )}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500">
            Buying-consideration signals grew fastest this period — strong
            mid-funnel demand for the Sikander range.
          </p>
        </SectionCard>
      </motion.div>

      {/* Unmet needs */}
      <motion.div variants={item}>
        <SectionCard
          title="Unmet Needs & Content Gaps"
          subtitle="Ranked viewer pain points expressed in comments — click a row for sample comments">
          
          <ul className="divide-y divide-slate-100">
            {UNMET_NEEDS.map((need, i) => {
              const expanded = expandedNeed === need.id;
              return (
                <li key={need.id}>
                  <button
                    type="button"
                    onClick={() => setExpandedNeed(expanded ? null : need.id)}
                    aria-expanded={expanded}
                    className="flex w-full items-center gap-3 py-3 text-left hover:bg-slate-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
                    
                    <span className="w-6 shrink-0 text-sm font-bold text-slate-400">
                      #{i + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-slate-900">
                        {need.title}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {need.description}
                      </span>
                    </span>
                    <span
                      className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${SEVERITY_STYLES[need.severity]}`}>
                      
                      {need.severity}
                    </span>
                    <span className="shrink-0 text-sm tabular-nums font-medium text-slate-700">
                      {scaleCount(need.frequency, dateRange)}
                      <span className="text-xs font-normal text-slate-400">
                        {' '}
                        mentions
                      </span>
                    </span>
                    <ChevronDownIcon
                      className={`h-4 w-4 shrink-0 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
                      aria-hidden="true" />
                    
                  </button>
                  {expanded &&
                  <div className="space-y-2 pb-4 pl-9 pr-4">
                      {need.samples.map((s) =>
                    <blockquote
                      key={s.author}
                      className="rounded-lg border-l-2 border-blue-700 bg-slate-50 p-3 text-sm text-slate-700">
                      
                          "{s.text}"
                          <footer className="mt-1 text-xs font-medium text-slate-500">
                            — {s.author}
                          </footer>
                        </blockquote>
                    )}
                    </div>
                  }
                </li>);

            })}
          </ul>
        </SectionCard>
      </motion.div>

      {/* Recurring questions */}
      <motion.div variants={item}>
        <SectionCard
          title="Recurring Viewer Questions"
          subtitle="Top questions raised across videos — unanswered ones are content opportunities">
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left">
                  <th
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-slate-600">
                    
                    Question
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-slate-600">
                    
                    Mentions
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-slate-600">
                    
                    # Videos Raised
                  </th>
                  <th
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-slate-600">
                    
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {RECURRING_QUESTIONS.map((q) =>
                <tr
                  key={q.id}
                  className={`border-b border-slate-100 last:border-0 ${!q.answered ? 'bg-amber-50/40' : ''}`}>
                  
                    <td className="py-3 pr-4 font-medium text-slate-900">
                      {q.question}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700">
                      {scaleCount(q.mentions, dateRange)}
                    </td>
                    <td className="py-3 pr-4 tabular-nums text-slate-700">
                      {q.videos}
                    </td>
                    <td className="py-3 pr-4">
                      {q.answered ?
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          <CheckCircle2Icon
                        className="h-3 w-3"
                        aria-hidden="true" />
                      {' '}
                          Answered
                        </span> :

                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
                          <CircleAlertIcon
                        className="h-3 w-3"
                        aria-hidden="true" />
                      {' '}
                          Unanswered
                        </span>
                    }
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </SectionCard>
      </motion.div>
    </motion.div>);

}