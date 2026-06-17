import React, { useEffect, useRef, useState } from 'react';
import { ChevronDownIcon } from 'lucide-react';

export interface VSSelectOption {
  value: string;
  label: string;
  color?: string;
}

interface VSSelectProps {
  value: string;
  options: VSSelectOption[];
  onChange: (value: string) => void;
  size?: 'lg' | 'sm';
  ariaLabel?: string;
}

// Custom dropdown so we can render a colored dot before a brand name — native
// <select> options can't be styled with a swatch reliably across browsers.
export function VSSelect({
  value,
  options,
  onChange,
  size = 'lg',
  ariaLabel
}: VSSelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  const selected = options.find((o) => o.value === value) ?? options[0];

  const lg = size === 'lg';
  const triggerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    justifyContent: 'space-between',
    background: 'white',
    border: '0.5px solid #cbd5e1',
    borderRadius: 6,
    fontSize: lg ? 13 : 11,
    padding: lg ? '6px 12px' : '3px 8px',
    minWidth: lg ? 180 : 120,
    color: '#334155',
    cursor: 'pointer',
    lineHeight: 1.2
  };

  const dot = (color?: string) =>
  color ?
  <span
    style={{
      display: 'inline-block',
      width: lg ? 8 : 7,
      height: lg ? 8 : 7,
      borderRadius: '50%',
      backgroundColor: color,
      flexShrink: 0
    }} /> :


  null;

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        style={triggerStyle}>

        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>

          {dot(selected.color)}
          {selected.label}
        </span>
        <ChevronDownIcon
          className={`h-3.5 w-3.5 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          aria-hidden="true" />

      </button>

      {open &&
      <ul
        role="listbox"
        style={{
          position: 'absolute',
          zIndex: 30,
          top: 'calc(100% + 4px)',
          left: 0,
          minWidth: '100%',
          maxHeight: 280,
          overflowY: 'auto',
          background: 'white',
          border: '0.5px solid #cbd5e1',
          borderRadius: 6,
          boxShadow: '0 8px 24px rgba(15,23,42,0.12)',
          padding: 4,
          margin: 0,
          listStyle: 'none'
        }}>

          {options.map((o) => {
          const active = o.value === value;
          return (
            <li
              key={o.value}
              role="option"
              aria-selected={active}
              onClick={() => {
                onChange(o.value);
                setOpen(false);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: lg ? '6px 10px' : '4px 8px',
                fontSize: lg ? 13 : 11,
                borderRadius: 4,
                cursor: 'pointer',
                color: '#334155',
                background: active ? '#f1f5f9' : 'transparent',
                fontWeight: active ? 600 : 400,
                whiteSpace: 'nowrap'
              }}
              onMouseEnter={(e) =>
              e.currentTarget.style.background = '#f8fafc'}
              onMouseLeave={(e) =>
              e.currentTarget.style.background = active ?
              '#f1f5f9' :
              'transparent'}>

                {dot(o.color)}
                {o.label}
              </li>);

        })}
        </ul>
      }
    </div>);

}
