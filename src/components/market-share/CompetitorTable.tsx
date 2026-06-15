import React, { useMemo, useState } from 'react';
import { ArrowUpDownIcon, ArrowUpIcon, ArrowDownIcon } from 'lucide-react';
import { SectionCard } from '../SectionCard';
import {
  BrandStats,
  SONALIKA_ID,
  engagementOf,
  formatNumber,
  getBrand } from
'../../data/mockData';
interface CompetitorTableProps {
  stats: BrandStats[];
}
type SortKey =
'videos' |
'views' |
'avgViews' |
'comments' |
'likes' |
'engShare' |
'publishRate';
type SortDir = 'asc' | 'desc';
interface Row {
  brandId: string;
  videos: number;
  views: number;
  avgViews: number;
  comments: number;
  likes: number;
  engShare: number;
  publishRate: number;
}
const COLUMNS: {
  key: SortKey;
  label: string;
}[] = [
{
  key: 'videos',
  label: 'Videos'
},
{
  key: 'views',
  label: 'Total Views'
},
{
  key: 'avgViews',
  label: 'Avg Views/Video'
},
{
  key: 'comments',
  label: 'Comments'
},
{
  key: 'likes',
  label: 'Likes'
},
{
  key: 'engShare',
  label: 'Engagement Share'
},
{
  key: 'publishRate',
  label: 'Publish Rate'
}];

export function CompetitorTable({ stats }: CompetitorTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('engShare');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const rows = useMemo<Row[]>(() => {
    const totalEng = stats.reduce((acc, s) => acc + engagementOf(s), 0);
    const built = stats.map((s) => ({
      brandId: s.brandId,
      videos: s.videos,
      views: s.views,
      avgViews: Math.round(s.views / s.videos),
      comments: s.comments,
      likes: s.likes,
      engShare: engagementOf(s) / totalEng * 100,
      publishRate: s.publishRate
    }));
    return built.sort((a, b) =>
    sortDir === 'desc' ? b[sortKey] - a[sortKey] : a[sortKey] - b[sortKey]
    );
  }, [stats, sortKey, sortDir]);
  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => d === 'desc' ? 'asc' : 'desc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };
  return (
    <SectionCard
      title="Competitor Breakdown"
      subtitle="Analyst drill-down — click a column to sort">
      
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-left">
              <th
                scope="col"
                className="py-2.5 pr-4 font-semibold text-slate-600">
                
                Brand
              </th>
              {COLUMNS.map((col) => {
                const active = col.key === sortKey;
                return (
                  <th
                    key={col.key}
                    scope="col"
                    className="py-2.5 pr-4 font-semibold text-slate-600">
                    
                    <button
                      type="button"
                      onClick={() => handleSort(col.key)}
                      aria-sort={
                      active ?
                      sortDir === 'desc' ?
                      'descending' :
                      'ascending' :
                      undefined
                      }
                      className={`flex items-center gap-1 hover:text-slate-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${active ? 'text-blue-700' : ''}`}>
                      
                      {col.label}
                      {active ?
                      sortDir === 'desc' ?
                      <ArrowDownIcon
                        className="h-3.5 w-3.5"
                        aria-hidden="true" /> :


                      <ArrowUpIcon
                        className="h-3.5 w-3.5"
                        aria-hidden="true" /> :



                      <ArrowUpDownIcon
                        className="h-3.5 w-3.5 text-slate-300"
                        aria-hidden="true" />

                      }
                    </button>
                  </th>);

              })}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const brand = getBrand(row.brandId);
              const isOwn = row.brandId === SONALIKA_ID;
              return (
                <tr
                  key={row.brandId}
                  className={`border-b border-slate-100 last:border-0 ${isOwn ? 'bg-blue-50/60' : 'hover:bg-slate-50'}`}>
                  
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2 font-medium text-slate-900">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{
                          backgroundColor: brand.color
                        }}
                        aria-hidden="true" />
                      
                      {brand.name}
                      {isOwn &&
                      <span className="rounded-full bg-blue-700 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
                          You
                        </span>
                      }
                    </span>
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {row.videos}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {formatNumber(row.views)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {formatNumber(row.avgViews)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {formatNumber(row.comments)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {formatNumber(row.likes)}
                  </td>
                  <td className="py-3 pr-4 tabular-nums font-medium text-slate-900">
                    {row.engShare.toFixed(1)}%
                  </td>
                  <td className="py-3 pr-4 tabular-nums text-slate-700">
                    {row.publishRate.toFixed(1)}/wk
                  </td>
                </tr>);

            })}
          </tbody>
        </table>
      </div>
    </SectionCard>);

}