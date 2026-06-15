import React from 'react';
interface SectionCardProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}
export function SectionCard({
  title,
  subtitle,
  children,
  actions
}: SectionCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900">{title}</h3>
          {subtitle &&
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          }
        </div>
        {actions}
      </div>
      {children}
    </section>);

}