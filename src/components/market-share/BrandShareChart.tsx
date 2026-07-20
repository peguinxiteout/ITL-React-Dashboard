import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  ResponsiveContainer,
} from 'recharts';
import { SectionCard } from '../SectionCard';
import { computeBrandDirectCounts, type BrandDirectCount } from '../../hooks/useCMSData.js';
import { getBrandColor } from '../../utils/brandColors';

// Neutral, grayscale accent for the "Others" bar — deliberately not part of
// the brand palette so it always reads as categorically different from
// individual brand bars rather than as "just another brand". Reuses the same
// neutral family as ContentCategoryBreakdownCard's NEUTRAL_TOTAL_COLOR
// (#94a3b8) for consistency within this tab.
const OTHERS_COLOR = '#94A3B8';

// Up to 10 individual brand bars (including the pinned own brand), then
// Others — 11 bars total.
const MAX_INDIVIDUAL_BRANDS = 10;

type BarKind = 'brand' | 'others';

interface BrandShareBar {
  name: string;
  value: number;
  color: string;
  kind: BarKind;
  tooltipNote: string;
}

interface BrandShareChartProps {
  allData: any[];
  startDate: string;
  endDate: string;
  ownBrand: string;
}

function formatValueLabel(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString() : '';
}

export function BrandShareChart({ allData, startDate, endDate, ownBrand }: BrandShareChartProps) {
  const { bars, othersBrandCount, ownBrandZeroDirect } = useMemo(() => {
    const { directCounts } = computeBrandDirectCounts(allData, startDate, endDate);

    // Own brand pinned first among individual bars, matching the same
    // own-brand-first convention as the Content Frequency heatmap and the SoV/SoE
    // dumbbell chart's collapsed view. If ownBrand has zero direct mentions in
    // this window, don't force a zero-value bar to the front — fall back to pure
    // count-based ordering instead.
    const ownIndex = directCounts.findIndex((d: BrandDirectCount) => d.brand === ownBrand);
    const ownEntry = ownIndex >= 0 ? directCounts[ownIndex] : null;
    const rest = ownEntry ? directCounts.filter((_: BrandDirectCount, i: number) => i !== ownIndex) : directCounts;

    const individual = ownEntry
      ? [ownEntry, ...rest.slice(0, MAX_INDIVIDUAL_BRANDS - 1)]
      : rest.slice(0, MAX_INDIVIDUAL_BRANDS);
    const overflow = ownEntry
      ? rest.slice(MAX_INDIVIDUAL_BRANDS - 1)
      : rest.slice(MAX_INDIVIDUAL_BRANDS);

    const barList: BrandShareBar[] = individual.map((d: BrandDirectCount) => ({
      name: d.brand,
      value: d.count,
      color: getBrandColor(d.brand),
      kind: 'brand',
      tooltipNote: `Videos mentioning only ${d.brand} (no other brand attributed)`,
    }));

    // Omit Others entirely when it'd be zero-height rather than showing an
    // empty placeholder bar.
    const othersTotal = overflow.reduce((sum: number, d: BrandDirectCount) => sum + d.count, 0);
    if (othersTotal > 0) {
      barList.push({
        name: 'Others',
        value: othersTotal,
        color: OTHERS_COLOR,
        kind: 'others',
        tooltipNote: `Combined direct mentions across ${overflow.length} brand${overflow.length !== 1 ? 's' : ''} not shown individually`,
      });
    }

    return {
      bars: barList,
      othersBrandCount: overflow.length,
      ownBrandZeroDirect: !ownEntry,
    };
  }, [allData, startDate, endDate, ownBrand]);

  return (
    <SectionCard
      title="Brand Share"
      subtitle="Videos mentioning exactly one brand, by brand - plus a long-tail aggregate"
    >
      <div style={{ height: 360 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={bars} margin={{ top: 24, right: 16, left: 0, bottom: 56 }} barCategoryGap="24%">
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
            <XAxis
              dataKey="name"
              interval={0}
              angle={-30}
              textAnchor="end"
              height={80}
              tick={{ fontSize: 11, fill: '#334155' }}
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
            />
            <YAxis
              type="number"
              allowDecimals={false}
              tick={{ fontSize: 12, fill: '#64748b' }}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip
              formatter={(value: number, _name: string, entry: any) => [
                value.toLocaleString(),
                entry?.payload?.tooltipNote ?? entry?.payload?.name,
              ]}
              contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="value" name="Videos" radius={[4, 4, 0, 0]} barSize={36}>
              {bars.map((b) => (
                <Cell key={b.name} fill={b.color} />
              ))}
              <LabelList dataKey="value" position="top" formatter={formatValueLabel} fill="#334155" fontSize={11} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      {othersBrandCount > 0 && (
        <p className="mt-2 text-[11px] italic text-slate-400">
          "Others" combines direct mentions across {othersBrandCount} additional brand
          {othersBrandCount !== 1 ? 's' : ''} not shown individually.
        </p>
      )}
      {ownBrandZeroDirect && (
        <p className="mt-1 text-[11px] italic text-slate-400">
          {ownBrand} had no single-brand-mention videos in this window, so it isn't pinned first above.
        </p>
      )}
    </SectionCard>
  );
}
