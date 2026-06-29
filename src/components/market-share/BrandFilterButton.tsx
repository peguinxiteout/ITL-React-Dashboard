import React, { useEffect, useRef, useState } from 'react';
import { FilterIcon } from 'lucide-react';
interface BrandItem {
  name: string;
  color: string;
  isOwn?: boolean;
}
interface BrandFilterButtonProps {
  brands: BrandItem[];
  selectedBrands: string[];
  onChange: (brands: string[]) => void;
  includeShorts: boolean;
  onShortsChange: (v: boolean) => void;
}
export function BrandFilterButton({
  brands,
  selectedBrands,
  onChange,
  includeShorts,
  onShortsChange
}: BrandFilterButtonProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);
  const allSelected = selectedBrands.length === brands.length;
  const toggle = (name: string) => {
    if (selectedBrands.includes(name)) {
      onChange(selectedBrands.filter((n) => n !== name));
    } else {
      onChange([...selectedBrands, name]);
    }
  };
  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        style={
        allSelected ?
        {
          background: '#f1f5f9',
          border: '1px solid #cbd5e1',
          color: '#475569'
        } :
        {
          background: '#EEF3FB',
          border: '1px solid #185FA5',
          color: '#185FA5'
        }
        }>

        <FilterIcon className="h-3.5 w-3.5" aria-hidden="true" />
        {allSelected ?
        'Filters' :
        `Filters · ${selectedBrands.length} of ${brands.length}`}
      </button>
      {open &&
      <div
        role="dialog"
        aria-label="Brand filter"
        className="absolute right-0 z-40 mt-1 bg-white"
        style={{
          width: 220,
          borderRadius: 8,
          border: '1px solid #e2e8f0',
          boxShadow: '0 8px 24px rgba(15, 23, 42, 0.12)',
          padding: 12
        }}>

          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-800">
              Brand filter
            </span>
            <button
            type="button"
            onClick={() => onChange(brands.map((b: BrandItem) => b.name))}
            className="text-xs font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              Reset all
            </button>
          </div>
          <ul className="space-y-1">
            {brands.map((brand: BrandItem) => {
            const isOwn = !!brand.isOwn;
            const checked = isOwn || selectedBrands.includes(brand.name);
            return (
              <li key={brand.name}>
                  <label
                  className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-sm text-slate-700 ${isOwn ? '' : 'cursor-pointer hover:bg-slate-50'}`}>

                    <input
                    type="checkbox"
                    checked={checked}
                    disabled={isOwn}
                    onChange={() => toggle(brand.name)}
                    className="h-4 w-4 accent-blue-700" />

                    <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{
                      backgroundColor: brand.color
                    }}
                    aria-hidden="true" />

                    {brand.name}
                  </label>
                </li>);

          })}
          </ul>

          {/* Shorts toggle */}
          <div style={{ borderTop: '1px solid #e2e8f0', marginTop: 8, paddingTop: 8 }}>
            <label className="flex items-start gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={includeShorts}
                onChange={(e) => onShortsChange(e.target.checked)}
                className="h-4 w-4 accent-blue-700 mt-0.5 flex-shrink-0" />
              <div>
                <span className="text-sm text-slate-700">Include YouTube Shorts</span>
                <p className="text-[10px] text-slate-400 mt-0.5 leading-tight">
                  Shorts: videos ≤60s always flagged; 61–180s flagged only if tagged #Shorts
                </p>
              </div>
            </label>
          </div>
        </div>
      }
    </div>);

}
