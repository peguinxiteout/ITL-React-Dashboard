import React from 'react';
import { BarChart3Icon } from 'lucide-react';
import { TabKey } from '../data/mockData';
interface DashboardHeaderProps {
  activeTab: TabKey;
  onTabChange: (tab: TabKey) => void;
}
const NAV_ITEMS: {
  key: TabKey;
  label: string;
}[] = [
{
  key: 'overview',
  label: 'Intelligence Overview'
},
{
  key: 'market-share',
  label: 'Content Market Share'
},
{
  key: 'influencer',
  label: 'Voice of Influencer'
},
{
  key: 'positioning',
  label: 'Competitive Positioning'
},
{
  key: 'sentiment',
  label: 'Viewer Sentiment'
}];

export function DashboardHeader({
  activeTab,
  onTabChange
}: DashboardHeaderProps) {
  const handleNavKeyDown = (e: React.KeyboardEvent) => {
    const idx = NAV_ITEMS.findIndex((t) => t.key === activeTab);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      onTabChange(NAV_ITEMS[(idx + 1) % NAV_ITEMS.length].key);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      onTabChange(NAV_ITEMS[(idx - 1 + NAV_ITEMS.length) % NAV_ITEMS.length].key);
    }
  };
  return (
    <header
      className="bg-white"
      style={{
        height: 68,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '0.5px solid #e2e8f0'
      }}>

      <div
        className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%'
        }}>

        {/* Logo + wordmark */}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-lg"
            style={{
              backgroundColor: '#185FA5'
            }}
            aria-hidden="true">

            <BarChart3Icon
              className="h-5 w-5"
              style={{
                color: '#E6F1FB'
              }} />

          </div>
          <div>
            <h1 className="text-lg font-bold leading-tight text-slate-900">
              Sonalika YouTube Intelligence
            </h1>
            <p className="text-xs text-slate-500">
              Competitive insights · Indian tractor category
            </p>
          </div>
        </div>

        {/* Nav buttons */}
        <nav
          role="tablist"
          aria-label="Insight categories"
          onKeyDown={handleNavKeyDown}
          style={{
            display: 'flex',
            gap: 6,
            alignItems: 'center',
            border: '0.5px solid var(--color-border-secondary, #cbd5e1)',
            borderRadius: 8,
            padding: 3,
            background: '#f8fafc'
          }}>

          {NAV_ITEMS.map((tab) => {
            const active = tab.key === activeTab;
            return (
              <button
                key={tab.key}
                role="tab"
                id={`tab-${tab.key}`}
                aria-selected={active}
                aria-controls={`panel-${tab.key}`}
                tabIndex={active ? 0 : -1}
                onClick={() => onTabChange(tab.key)}
                className="transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
                style={{
                  background: active ? '#185FA5' : 'transparent',
                  color: active ? '#ffffff' : 'var(--color-text-secondary, #64748b)',
                  borderRadius: 6,
                  border: 'none',
                  padding: '5px 12px',
                  fontWeight: active ? 500 : 400,
                  fontSize: 12,
                  whiteSpace: 'nowrap'
                }}>

                {tab.label}
              </button>);

          })}
        </nav>
      </div>
    </header>);

}
