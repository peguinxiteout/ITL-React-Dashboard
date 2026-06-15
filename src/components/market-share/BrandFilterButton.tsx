import React, { useEffect, useRef, useState } from 'react';
import { FilterIcon } from 'lucide-react';
import { BRANDS, SONALIKA_ID } from '../../data/mockData';
interface BrandFilterButtonProps {
  selectedBrands: string[];
  onChange: (brands: string[]) => void;
}
export function BrandFilterButton({
  selectedBrands,
  onChange
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
  const allSelected = selectedBrands.length === BRANDS.length;
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
        `Filters · ${selectedBrands.length} of ${BRANDS.length}`}
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
            onClick={() => onChange(BRANDS.map((b) => b.name))}
            className="text-xs font-medium text-blue-700 hover:underline focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
              Reset all
            </button>
          </div>
          <ul className="space-y-1">
            {BRANDS.map((brand) => {
            const isOwn = brand.id === SONALIKA_ID;
            const checked = isOwn || selectedBrands.includes(brand.name);
            return (
              <li key={brand.id}>
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
        </div>
      }
    </div>);

}
