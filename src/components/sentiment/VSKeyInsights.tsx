import { useMemo } from 'react';
import {
  ShoppingCartIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  MegaphoneIcon,
  TagIcon,
} from 'lucide-react';
import { SectionCard } from '../SectionCard';

// Duplicated from Dashboard.tsx's KeyInsightsCard rather than imported — the
// VoI/CP modules still use their own copies there, and this component is meant
// to be self-contained (props-driven), same convention as CMSKeyInsights.
function KiSignalCard({
  bg, textColor, icon, headline, sub,
}: {
  bg: string; textColor: string; icon: React.ReactNode; headline: string; sub: string;
}) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        <span style={{ color: textColor, marginTop: 1, flexShrink: 0 }}>{icon}</span>
        <div>
          <p style={{ fontSize: 12, fontWeight: 500, color: textColor, margin: '0 0 2px 0' }}>{headline}</p>
          <p style={{ fontSize: 11, color: textColor, margin: 0, opacity: 0.75 }}>{sub}</p>
        </div>
      </div>
    </div>
  );
}

function KiStateABullets({ items }: { items: { color: string; text: string }[] }) {
  if (!items.length) return null;
  return (
    <div style={{ borderTop: '0.5px solid var(--color-border-tertiary, #e2e8f0)', marginTop: 12, paddingTop: 10 }}>
      {items.map((item, idx) => (
        <div
          key={idx}
          style={{
            display: 'flex', alignItems: 'flex-start', gap: 6,
            fontSize: 12, color: 'var(--color-text-primary, #334155)', lineHeight: 1.55,
            padding: '5px 0',
            borderBottom: idx < items.length - 1 ? '0.5px solid var(--color-border-tertiary, #e2e8f0)' : 'none',
          }}
        >
          <span style={{ width: 7, height: 7, minWidth: 7, borderRadius: '50%', background: item.color, marginTop: 4, flexShrink: 0 }} />
          <span>{item.text}</span>
        </div>
      ))}
    </div>
  );
}

export interface VSKeyInsightsProps {
  successRows: any[];
}

// "What do viewers say in comments?" key-insights module — moved here verbatim
// from Dashboard.tsx's KeyInsightsCard (formerly the "Viewer Sentiment" module
// of the Intelligence Overview tab). Computed from the raw successRows only —
// useVSData returns those rows unfiltered regardless of its brand/week options,
// so this is a fixed full-corpus snapshot: it deliberately does NOT react to
// the VS tab's Brand selector or week dropdowns below it.
export function VSKeyInsights({ successRows }: VSKeyInsightsProps) {
  const vs = useMemo(() => {
    const isBool = (v: any) => v === true || v === 'True' || v === 'true';
    const piRows = successRows.filter((r) => isBool(r.pi_detected));
    const unRows = successRows.filter((r) => isBool(r.un_detected));
    const qsRows = successRows.filter((r) => isBool(r.qs_is_question));
    const lostSaleCount = successRows.filter((r) => isBool(r.pi_is_lost_sale)).length;

    const stageCounts: Record<string, number> = {};
    for (const r of piRows) {
      const s = r.pi_stage;
      if (s && s !== 'none' && s !== '') stageCounts[s] = (stageCounts[s] || 0) + 1;
    }
    const topPiStage = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || '';

    const qsCounts: Record<string, number> = {};
    for (const r of qsRows) {
      const q = r.qs_normalized_question;
      if (q && q !== '') qsCounts[q] = (qsCounts[q] || 0) + 1;
    }
    const topQs = Object.entries(qsCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Price';

    const unTypeCounts: Record<string, number> = {};
    for (const r of unRows) {
      const t = r.un_need_type;
      if (t && t !== 'none' && t !== '') unTypeCounts[t] = (unTypeCounts[t] || 0) + 1;
    }
    const topUnEntry = Object.entries(unTypeCounts).sort((a, b) => b[1] - a[1])[0];
    const topUn = topUnEntry?.[0] || '';
    const topUnCount = topUnEntry?.[1] || 0;

    const PI_LABELS: Record<string, string> = {
      dealer_inquiry: 'Dealer inquiry',
      consideration: 'Buying consideration',
      shortlisting: 'Shortlisting',
      post_purchase: 'Post purchase',
    };
    const topPiLabel = PI_LABELS[topPiStage] || topPiStage.replace(/_/g, ' ');

    return { piCount: piRows.length, lostSaleCount, topPiStage, topPiLabel, topQs, topUn, topUnCount };
  }, [successRows]);

  const vsStateA = useMemo(() => {
    const isBoolV = (v: any) => v === true || v === 'True' || v === 'true';
    const piRows = successRows.filter((r: any) => isBoolV(r.pi_detected));
    const intentCount = piRows.length;
    const piPct = successRows.length > 0 ? (intentCount / successRows.length) * 100 : 0;
    const piDotColor = piPct >= 10 ? '#639922' : piPct >= 5 ? '#EF9F27' : '#E24B4A';

    const stageCounts: Record<string, number> = {};
    for (const r of piRows) {
      const s = r.pi_stage;
      if (s && s !== 'none' && s !== '' && s !== 'post_purchase') stageCounts[s] = (stageCounts[s] || 0) + 1;
    }
    const topStageEntry = Object.entries(stageCounts).sort((a, b) => b[1] - a[1])[0];
    const VS_PI_LABELS: Record<string, string> = { dealer_inquiry: 'Dealer inquiry', consideration: 'Buying consideration', shortlisting: 'Shortlisting' };
    const topStage = topStageEntry ? (VS_PI_LABELS[topStageEntry[0]] || topStageEntry[0].replace(/_/g, ' ')) : '';

    const lostCount = successRows.filter((r: any) => isBoolV(r.pi_is_lost_sale)).length;
    const lostDotColor = lostCount > 0 ? '#E24B4A' : '#639922';

    const unTypeCounts: Record<string, number> = {};
    for (const r of successRows) {
      if (isBoolV(r.un_detected)) {
        const t = r.un_need_type;
        if (t && t !== 'none' && t !== '') unTypeCounts[t] = (unTypeCounts[t] || 0) + 1;
      }
    }
    const topNeedEntry = Object.entries(unTypeCounts).sort((a, b) => b[1] - a[1])[0];
    const topNeedType = topNeedEntry?.[0]?.replace(/_/g, ' ') || '';
    const needCount = topNeedEntry?.[1] || 0;

    return { intentCount, topStage, piDotColor, lostCount, lostDotColor, topNeedType, needCount };
  }, [successRows]);

  const vsBullets: { color: string; text: string }[] = [
    { color: vsStateA.piDotColor, text: `${vsStateA.intentCount} buyer-intent comment${vsStateA.intentCount !== 1 ? 's' : ''} detected${vsStateA.topStage ? ` — ${vsStateA.topStage} is the dominant signal` : ''}.` },
    { color: vsStateA.lostDotColor, text: vsStateA.lostCount > 0 ? `${vsStateA.lostCount} lost-sale signal${vsStateA.lostCount !== 1 ? 's' : ''} detected — viewers citing competitor purchase decisions.` : 'No lost-sale signals detected — all purchase-intent comments are acquisition-positive.' },
    ...(vsStateA.needCount > 0 ? [{ color: '#EF9F27', text: `Top unmet need: ${vsStateA.topNeedType} — ${vsStateA.needCount} comment${vsStateA.needCount !== 1 ? 's' : ''} flagged this.` }] : []),
  ];

  return (
    <SectionCard title="What do viewers say in comments?">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <KiSignalCard
          bg="#EAF3DE" textColor="#085041"
          icon={<ShoppingCartIcon size={14} />}
          headline={`${vs.piCount} purchase-intent comment${vs.piCount !== 1 ? 's' : ''}${vs.topPiStage === 'dealer_inquiry' ? ' · Bottom-of-funnel signal' : ''}`}
          sub={vs.topPiLabel ? `Top stage: ${vs.topPiLabel}` : 'Stage data pending'}
        />
        <KiSignalCard
          bg={vs.lostSaleCount > 0 ? '#FCEBEB' : '#EAF3DE'}
          textColor={vs.lostSaleCount > 0 ? '#991b1b' : '#085041'}
          icon={vs.lostSaleCount > 0 ? <TrendingDownIcon size={14} /> : <TrendingUpIcon size={14} />}
          headline={vs.lostSaleCount > 0 ? `${vs.lostSaleCount} lost-sale signal${vs.lostSaleCount !== 1 ? 's' : ''} detected` : 'No lost-sale signals detected'}
          sub={vs.lostSaleCount > 0 ? `${vs.lostSaleCount} comment${vs.lostSaleCount === 1 ? '' : 's'} cite a competitor as the final choice` : 'All purchase-intent comments are acquisition-positive'}
        />
        <KiSignalCard
          bg="#FAEEDA" textColor="#633806"
          icon={<MegaphoneIcon size={14} />}
          headline={`Top question: "${vs.topQs.length > 40 ? vs.topQs.slice(0, 40) + '…' : vs.topQs}"`}
          sub="Most frequently asked in comments"
        />
        <KiSignalCard
          bg="#FAEEDA" textColor="#633806"
          icon={<TagIcon size={14} />}
          headline={vs.topUn ? `Top unmet need: ${vs.topUn.replace(/_/g, ' ')}` : 'No unmet needs detected'}
          sub={vs.topUn && vs.topUnCount > 0 ? `${vs.topUnCount} comment${vs.topUnCount !== 1 ? 's' : ''} flagged this need` : ''}
        />
      </div>
      <KiStateABullets items={vsBullets} />
    </SectionCard>
  );
}
