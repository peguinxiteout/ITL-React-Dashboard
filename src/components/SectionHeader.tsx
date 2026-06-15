import React from 'react';
interface SectionHeaderProps {
  title: string;
  descriptor: string;
  meta?: string;
}
export function SectionHeader({ title, descriptor, meta }: SectionHeaderProps) {
  return (
    <div>
      <h2
        className="text-slate-900"
        style={{
          fontSize: 22,
          fontWeight: 500
        }}>

        {title}
      </h2>
      <p
        className="mt-0.5 text-slate-500"
        style={{
          fontSize: 13
        }}>

        {descriptor}
      </p>
      {meta &&
      <p
        className="mt-1.5 inline-block rounded bg-slate-100 px-2 py-0.5 tracking-wide text-slate-400"
        style={{
          fontSize: 12
        }}>

          {meta}
        </p>
      }
    </div>);

}
