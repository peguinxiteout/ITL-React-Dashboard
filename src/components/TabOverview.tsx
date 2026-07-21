import type { ReactNode } from 'react';

export interface TabKpiCard {
  label: string;
  value: ReactNode;
  descriptor: ReactNode;
  icon?: ReactNode;
}

export interface TabInsightCard {
  headline: ReactNode;
  detail: ReactNode;
  icon?: ReactNode;
  tone?: 'blue' | 'green' | 'amber' | 'red';
}

const toneStyles: Record<NonNullable<TabInsightCard['tone']>, string> = {
  blue: 'border-blue-100 bg-blue-50 text-blue-900',
  green: 'border-emerald-100 bg-emerald-50 text-emerald-900',
  amber: 'border-amber-100 bg-amber-50 text-amber-900',
  red: 'border-red-100 bg-red-50 text-red-900',
};

export function TabOverviewCards({ cards }: { cards: TabKpiCard[] }) {
  return (
    <div
      className="grid gap-4 overflow-x-auto pb-1"
      style={{ gridTemplateColumns: `repeat(${cards.length}, minmax(220px, 1fr))` }}
    >
      {cards.map((card) => (
        <div key={card.label} className="min-h-[132px] rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.07em] text-slate-400">
            {card.icon ? <span className="flex text-slate-400">{card.icon}</span> : null}
            <span>{card.label}</span>
          </div>
          <div className="mt-3 text-3xl font-semibold leading-none text-slate-950">{card.value}</div>
          <div className="mt-2 text-xs text-slate-400">{card.descriptor}</div>
        </div>
      ))}
    </div>
  );
}

export function TabInsights({
  title,
  question,
  cards,
}: {
  title?: string;
  question: string;
  cards: TabInsightCard[];
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {title ? (
          <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-800">{title}</span>
        ) : null}
        <h2 className="text-base font-semibold text-slate-950">{question}</h2>
      </div>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        {cards.map((card, index) => (
          <div
            key={`${index}-${String(card.headline)}`}
            className={`rounded-xl border p-4 ${toneStyles[card.tone || 'blue']}`}
          >
            <div className="flex items-start gap-3">
              {card.icon ? <span className="mt-0.5 flex shrink-0">{card.icon}</span> : null}
              <div>
                <p className="text-sm font-bold">{card.headline}</p>
                <p className="mt-1 text-xs opacity-75">{card.detail}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

    </section>
  );
}
