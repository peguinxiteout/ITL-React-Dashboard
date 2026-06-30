import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { SectionCard } from '../SectionCard';
import { formatNumber } from '../../data/mockData';

interface BrandSummary {
  brand: string;
  video_count: number;
  row_count: number;
  total_views: number;
  total_comments: number;
  color: string;
  isOwn: boolean;
}

export interface PeriodDeltas {
  videos: number | null;
  views: number | null;
  comments: number | null;
  prevStart: string;
  prevEnd: string;
  noData: boolean;
}

interface ShareOfVoiceChartsProps {
  summary: BrandSummary[];
  totalUniqueVideos: number;
  periodDeltas: PeriodDeltas;
}

type MetricKey = 'video_count' | 'total_views' | 'total_comments';

const METRICS: { key: MetricKey; label: string; deltaKey: keyof Pick<PeriodDeltas, 'videos' | 'views' | 'comments'> }[] = [
  { key: 'video_count',    label: 'Video Volume', deltaKey: 'videos'   },
  { key: 'total_views',    label: 'Views',        deltaKey: 'views'    },
  { key: 'total_comments', label: 'Comments',     deltaKey: 'comments' },
];

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function formatDate(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  const mi = parseInt(m, 10) - 1;
  return `${MONTHS[mi] ?? m} ${d}, ${y}`;
}

function DeltaBadge({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span style={{ background: '#f1f5f9', color: '#94a3b8', fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center' }}>
        — no prior data
      </span>
    );
  }
  const bg    = value > 0 ? '#EAF3DE' : value < 0 ? '#FCEBEB' : '#f1f5f9';
  const color = value > 0 ? '#27500A' : value < 0 ? '#A32D2D' : '#64748b';
  const text  = value > 0
    ? `▲ +${value.toFixed(1)} pp`
    : value < 0
    ? `▼ −${Math.abs(value).toFixed(1)} pp`
    : `— 0.0 pp`;
  return (
    <span style={{ background: bg, color, fontSize: 10, fontWeight: 500, padding: '2px 7px', borderRadius: 20, display: 'inline-flex', alignItems: 'center' }}>
      {text}
    </span>
  );
}

export function ShareOfVoiceCharts({ summary, totalUniqueVideos, periodDeltas }: ShareOfVoiceChartsProps) {
  const comparisonNote = `vs ${formatDate(periodDeltas.prevStart)} – ${formatDate(periodDeltas.prevEnd)}`;

  return (
    <SectionCard
      title="Share of Voice"
      subtitle="Sonalika's proportion of category video volume, views and comments">

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {METRICS.map((metric) => {
          const rawTotal = summary.reduce((acc, s) => acc + s[metric.key], 0);
          const total = metric.key === 'video_count' ? totalUniqueVideos : rawTotal;
          const sonalikaShare =
            total > 0 ? (summary.find((s) => s.isOwn)?.[metric.key] ?? 0) / total * 100 : 0;
          const data = summary.map((s) => ({
            name: s.brand,
            value: s[metric.key],
            color: s.color
          }));
          return (
            <div key={metric.key} className="flex flex-col items-center">
              <div className="relative h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={52}
                      outerRadius={72}
                      paddingAngle={2}
                      strokeWidth={0}>
                      {data.map((d) => <Cell key={d.name} fill={d.color} />)}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [formatNumber(value), name]}
                      contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-xl font-bold text-slate-900">
                    {sonalikaShare.toFixed(1)}%
                  </span>
                  <span className="text-[11px] text-slate-500">Sonalika</span>
                </div>
              </div>
              <div className="mt-1 flex items-center justify-center gap-1.5">
                <p className="text-sm font-medium text-slate-700">{metric.label}</p>
                <DeltaBadge value={periodDeltas[metric.deltaKey]} />
              </div>
              {metric.key === 'video_count' ? (
                <p className="text-xs text-slate-500">{formatNumber(totalUniqueVideos)} attributed videos</p>
              ) : (
                <p className="text-xs text-slate-500">
                  {formatNumber(total)} total in category
                </p>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-center gap-x-4 gap-y-1.5 border-t border-slate-100 pt-4">
        {summary.map((s) =>
          <span key={s.brand} className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
            {s.brand}
          </span>
        )}
      </div>

      {!periodDeltas.noData && (
        <p style={{ fontSize: 10, color: '#94a3b8', fontStyle: 'italic', marginTop: 6, textAlign: 'center' }}>
          {comparisonNote}
        </p>
      )}

      <p style={{ fontSize: 11, color: '#94a3b8', fontStyle: 'italic', marginTop: 8, textAlign: 'center' }}>
        Percentages may exceed 100% in aggregate — multi-brand videos are counted for each featured brand.
      </p>
    </SectionCard>
  );
}
