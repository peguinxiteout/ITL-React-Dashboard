import React from 'react';
import { ConstructionIcon } from 'lucide-react';
interface UnderDevelopmentProps {
  title: string;
}
export function UnderDevelopment({ title }: UnderDevelopmentProps) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <ConstructionIcon
        className="h-10 w-10 text-slate-400"
        aria-hidden="true" />

      <h2 className="mt-4 text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">
        This module is under development. Coming soon.
      </p>
    </div>);

}
