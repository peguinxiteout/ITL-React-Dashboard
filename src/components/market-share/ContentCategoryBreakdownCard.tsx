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
import { computeCategoryData, type CategoryItem } from '../../hooks/useCMSData.js';
import { getBrandColor } from '../../utils/brandColors';

// Duplicated from Dashboard.tsx's CategoryVideosCard rather than imported — this
// component must stay decoupled from IO's Dashboard.tsx file. Keep in sync with
// Dashboard.tsx's CATEGORY_COLOR_MAP / EXTRA_CATEGORY_COLORS if either changes.
const CATEGORY_COLOR_MAP: Record<string, string> = {
  Tractor: '#185FA5',
  'Non-Tractor': '#9CA3AF',
};
const EXTRA_CATEGORY_COLORS = ['#1D9E75', '#EF9F27', '#AFA9EC', '#F0997B', '#ED93B1'];

function categoryColor(name: string, index: number): string {
  return CATEGORY_COLOR_MAP[name] ?? EXTRA_CATEGORY_COLORS[index] ?? '#94a3b8';
}

// kpiCalculations.ts's normalizeTractorSubCategory (not exported, so not imported —
// see rowMentionsBrand note below) does three things: (1) generic text cleanup —
// trim + collapse internal whitespace; (2) build a lowercase/dash/slash-unified "key"
// purely so (3) can look that key up in a hardcoded 6-entry categoryMap and return a
// fixed Title-Case label, or '' if the key isn't in the map. (2) and (3) exist only to
// force raw values onto VoI's fixed 6-category enum — that's exactly the fixed-enum,
// silent-drop behavior this panel no longer wants. Only (1) is genuine, reusable
// cleanup, so only (1) is kept here (renamed since it no longer canonicalizes/maps
// anything) — categories are now whatever distinct cleaned values actually occur,
// same convention as the left panel's computeCategoryData.
//
// rowMentionsBrand from kpiCalculations.ts was deliberately NOT reused here: it does
// keyword/regex matching over raw transcript text for useKpiData's row shape, while
// CMS rows already carry a trustworthy per-row `attributed_brand` (set by
// useCMSData.js's own JSON-array expansion) — using that field directly is simpler
// and consistent with the rest of the CMS tab (see CMSKeyInsights.tsx).
function cleanTractorSubCategoryLabel(value: unknown): string {
  return String(value || '')
    .trim()
    .replace(/\s+/g, ' ');
}

const NEUTRAL_TOTAL_COLOR = '#94a3b8';

function formatCountLabel(value: unknown): string {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n.toLocaleString() : '';
}

// Both panels render as horizontal bars — the Y-axis needs enough width to fit
// each category label in full (some right-panel sub-category names run long,
// e.g. "Product Review & Field Experience"). Estimated from label length rather
// than hardcoded, since both category lists are dynamic.
function estimateYAxisWidth(labels: string[], min: number, max: number): number {
  const longest = labels.reduce((m, l) => Math.max(m, l.length), 0);
  return Math.min(max, Math.max(min, Math.round(longest * 6.4) + 16));
}

const CHART_ROW_HEIGHT = 40;
const CHART_BASE_HEIGHT = 48;
const CHART_MIN_HEIGHT = 220;

function estimateChartHeight(rowCount: number): number {
  return Math.max(CHART_MIN_HEIGHT, rowCount * CHART_ROW_HEIGHT + CHART_BASE_HEIGHT);
}

interface SubCategoryRow {
  category: string;
  Total: number;
  OwnBrand: number;
}

interface ContentCategoryBreakdownCardProps {
  allData: any[];
  startDate: string;
  endDate: string;
  ownBrand: string;
}

export function ContentCategoryBreakdownCard({
  allData,
  startDate,
  endDate,
  ownBrand,
}: ContentCategoryBreakdownCardProps) {
  // Brand-agnostic — same data IO's "Total Category Videos" reads, so the two
  // tabs never disagree on category counts for a given date window.
  const categoryData: CategoryItem[] = useMemo(
    () => computeCategoryData(allData, startDate, endDate),
    [allData, startDate, endDate]
  );

  const { subCategoryData, unlabeledVideoCount } = useMemo(() => {
    const inWindowTractor = allData.filter(
      (r: any) =>
        r.is_tractor_content === true &&
        r.publish_date >= startDate &&
        r.publish_date <= endDate
    );

    // allData is expanded one-row-per-attributed-brand-per-video — dedupe by
    // video_id before tallying so multi-brand videos aren't double-counted.
    const subCategoryByVideo = new Map<string, string>();
    const brandsByVideo = new Map<string, Set<string>>();
    for (const r of inWindowTractor) {
      if (!subCategoryByVideo.has(r.video_id)) {
        subCategoryByVideo.set(r.video_id, r.tractor_sub_category);
      }
      if (!brandsByVideo.has(r.video_id)) brandsByVideo.set(r.video_id, new Set());
      if (r.attributed_brand && r.attributed_brand !== 'unattributed') {
        brandsByVideo.get(r.video_id)!.add(r.attributed_brand);
      }
    }

    // Dynamic grouping — a bar per distinct cleaned value that actually occurs,
    // same convention as the left panel's computeCategoryData. Nothing is mapped
    // onto a fixed enum, so nothing gets silently dropped for being "unrecognized".
    const totalCounts = new Map<string, number>();
    const ownCounts = new Map<string, number>();
    let unlabeled = 0;

    for (const [videoId, rawSubCat] of subCategoryByVideo.entries()) {
      const category = cleanTractorSubCategoryLabel(rawSubCat);
      if (!category) {
        unlabeled++;
        continue;
      }
      totalCounts.set(category, (totalCounts.get(category) ?? 0) + 1);
      if (brandsByVideo.get(videoId)?.has(ownBrand)) {
        ownCounts.set(category, (ownCounts.get(category) ?? 0) + 1);
      }
    }

    const data: SubCategoryRow[] = [...totalCounts.entries()]
      .map(([category, total]) => ({
        category,
        Total: total,
        OwnBrand: ownCounts.get(category) ?? 0,
      }))
      .sort((a, b) => b.Total - a.Total);

    return { subCategoryData: data, unlabeledVideoCount: unlabeled };
  }, [allData, startDate, endDate, ownBrand]);

  // Right-panel color is per-series (Total vs ownBrand), not per-category, so going
  // dynamic doesn't introduce a "palette runs out" risk the way the left panel's
  // one-bar-per-category chart does. ownBrandColor already reuses this tab's
  // existing extensible brand-color assignment (getBrandColor's map + neutral
  // FALLBACK_BRAND_COLOR) — no separate category palette is needed here.
  const ownBrandColor = getBrandColor(ownBrand);

  const leftYAxisWidth = useMemo(
    () => estimateYAxisWidth(categoryData.map((d) => d.category), 80, 170),
    [categoryData]
  );
  const rightYAxisWidth = useMemo(
    () => estimateYAxisWidth(subCategoryData.map((d) => d.category), 110, 250),
    [subCategoryData]
  );
  const leftChartHeight = estimateChartHeight(categoryData.length);
  const rightChartHeight = estimateChartHeight(subCategoryData.length);

  return (
    <SectionCard title="Content Category Breakdown">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_auto_1fr] lg:gap-5">
        {/* Left panel: all-content category mix */}
        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Total Category Videos</h4>
          <p className="mb-3 text-xs text-slate-500">
            Content breakdown by category across all monitored videos in this window
          </p>
          <div style={{ height: leftChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={categoryData}
                layout="vertical"
                margin={{ top: 8, right: 40, left: 0, bottom: 8 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={leftYAxisWidth}
                  tick={{ fontSize: 12, fill: '#334155' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip
                  formatter={(value: number, _name: string, entry: any) => [
                    `${value.toLocaleString()} (${(entry?.payload?.percentage ?? 0).toFixed(1)}%)`,
                    'Videos',
                  ]}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" name="Videos" radius={[0, 4, 4, 0]} barSize={22}>
                  {categoryData.map((item, i) => (
                    <Cell key={item.category} fill={categoryColor(item.category, i)} />
                  ))}
                  <LabelList dataKey="count" position="right" formatter={formatCountLabel} fill="#334155" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Vertical divider — same pattern as ShareTrendCharts */}
        <div
          className="hidden self-stretch lg:block"
          style={{ width: '0.5px', background: '#e2e8f0' }}
          aria-hidden="true"
        />

        {/* Right panel: tractor-only sub-category split, Total vs ownBrand */}
        <div>
          <h4 className="mb-1 text-sm font-semibold text-slate-800">Tractor Category Split</h4>
          <p className="mb-3 text-xs text-slate-500">
            Within tractor content only — {ownBrand} vs. category total
          </p>
          <div style={{ height: rightChartHeight }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={subCategoryData}
                layout="vertical"
                margin={{ top: 8, right: 40, left: 0, bottom: 8 }}
                barGap={4}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="category"
                  width={rightYAxisWidth}
                  tick={{ fontSize: 11, fill: '#334155' }}
                  tickLine={false}
                  axisLine={{ stroke: '#e2e8f0' }}
                />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="Total" name="Total" fill={NEUTRAL_TOTAL_COLOR} radius={[0, 4, 4, 0]} barSize={22}>
                  <LabelList dataKey="Total" position="right" formatter={formatCountLabel} fill="#334155" fontSize={11} />
                </Bar>
                <Bar dataKey="OwnBrand" name={ownBrand} fill={ownBrandColor} radius={[0, 4, 4, 0]} barSize={22}>
                  <LabelList dataKey="OwnBrand" position="right" formatter={formatCountLabel} fill="#334155" fontSize={11} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs">
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: NEUTRAL_TOTAL_COLOR }}
              />
              Total
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-600">
              <span
                className="inline-block h-2.5 w-2.5 rounded-sm"
                style={{ backgroundColor: ownBrandColor }}
              />
              {ownBrand}
            </span>
          </div>
          {unlabeledVideoCount > 0 && (
            <p className="mt-2 text-[11px] italic text-slate-400">
              {unlabeledVideoCount} in-window tractor video{unlabeledVideoCount !== 1 ? 's' : ''} with no
              recorded sub-category value {unlabeledVideoCount !== 1 ? 'are' : 'is'} not shown above.
            </p>
          )}
        </div>
      </div>
    </SectionCard>
  );
}
