import { useMemo } from 'react';
import { SectionCard } from '../SectionCard';
import { computeChannelCoverage, TOTAL_MONITORED_CHANNELS } from '../../hooks/useCMSData.js';

interface ChannelCoverageCardProps {
  allData: any[];
  startDate: string;
  endDate: string;
}

export function ChannelCoverageCard({ allData, startDate, endDate }: ChannelCoverageCardProps) {
  const data = useMemo(
    () => computeChannelCoverage(allData, startDate, endDate),
    [allData, startDate, endDate]
  );
  const pct = TOTAL_MONITORED_CHANNELS > 0 ? (data.tractorChannels / TOTAL_MONITORED_CHANNELS) * 100 : 0;

  return (
    <SectionCard
      title="Channel Coverage"
      subtitle="Monitored channel activity in selected date window"
    >
      <div>
        <p style={{ fontSize: 28, fontWeight: 500, color: '#0f172a', margin: '0 0 4px 0', lineHeight: 1.1 }}>
          {data.tractorChannels} of {TOTAL_MONITORED_CHANNELS} channels
        </p>
        <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
          contributed tractor content in selected window
        </p>
        <div style={{ background: '#E5E7EB', height: 6, borderRadius: 3, marginTop: 10 }}>
          <div style={{ height: 6, borderRadius: 3, width: `${pct}%`, backgroundColor: '#185FA5' }} />
        </div>
        <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', margin: '4px 0 0 0' }}>
          ({data.activeChannels} channels published any content in this window)
        </p>
      </div>
      <div style={{ borderTop: '0.5px solid #e2e8f0', margin: '14px 0' }} />
      <div>
        <p style={{ fontSize: 12, fontWeight: 500, color: '#0f172a', margin: '0 0 6px 0' }}>
          Not yet contributing tractor content:
        </p>
        <p style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6, margin: 0 }}>
          {data.inactiveChannelNames.join(', ')}
        </p>
      </div>
    </SectionCard>
  );
}
