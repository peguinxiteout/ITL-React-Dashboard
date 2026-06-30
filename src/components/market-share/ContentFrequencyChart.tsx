import React, { useState, useRef } from 'react';
import { SectionCard } from '../SectionCard';

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function formatDayLabel(isoDate: string): string {
  const [, m, d] = isoDate.split('-');
  return `${d} ${MONTHS[parseInt(m, 10) - 1]}`;
}

interface HeatmapRow {
  name: string;
  isSonalika: boolean;
  data: number[];
}
interface ContentFrequencyChartProps {
  weeks: string[];
  rows: HeatmapRow[];
}

interface TooltipState {
  visible: boolean;
  weekIdx: number;
  week: string;
  brandName: string;
  value: number;
  prevValue: number | null;
  isSonalika: boolean;
  position: { top: number; left: number; above: boolean };
}

function interpolateColor(value: number, min: number, max: number): string {
  if (max === min) return '#E6F1FB';
  const normalized = (value - min) / (max - min);
  const light = [230, 241, 251];
  const dark = [12, 68, 124];
  const r = Math.round(light[0] + (dark[0] - light[0]) * normalized);
  const g = Math.round(light[1] + (dark[1] - light[1]) * normalized);
  const b = Math.round(light[2] + (dark[2] - light[2]) * normalized);
  return `rgb(${r}, ${g}, ${b})`;
}

function getTextColor(bgColor: string): string {
  const match = bgColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return '#334155';

  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  const luminance = (r * 299 + g * 587 + b * 114) / 1000;

  return luminance > 127.5 ? '#1f2937' : '#ffffff';
}

export function ContentFrequencyChart({
  weeks,
  rows
}: ContentFrequencyChartProps) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);

  const numWeeks = weeks.length;
  const isNarrow = numWeeks > 8;

  const allValues = rows.flatMap((r) => r.data);
  const maxVal = allValues.length > 0 ? Math.max(...allValues) : 0;

  const sonalikaRow = rows.find((r) => r.isSonalika);
  const sonalikaActiveWeeks = sonalikaRow ?
  sonalikaRow.data.filter((v) => v > 0).length :
  0;
  const sonalikaTotalWeeks = sonalikaRow ? sonalikaRow.data.length : 0;
  const sonalikaAvg = sonalikaRow && sonalikaTotalWeeks > 0 ?
  sonalikaRow.data.reduce((a, v) => a + v, 0) / sonalikaTotalWeeks :
  0;

  const competitorRows = rows.filter((r) => !r.isSonalika);
  let mostActiveCompetitor = competitorRows[0];
  if (competitorRows.length > 0) {
    competitorRows.forEach((r) => {
      const avg = r.data.reduce((a, v) => a + v, 0) / r.data.length;
      const mostActiveAvg =
      mostActiveCompetitor.data.reduce((a, v) => a + v, 0) /
      mostActiveCompetitor.data.length;
      if (avg > mostActiveAvg) {
        mostActiveCompetitor = r;
      }
    });
  }

  const mostActiveAvg = mostActiveCompetitor ?
  mostActiveCompetitor.data.reduce((a, v) => a + v, 0) /
  mostActiveCompetitor.data.length :
  0;

  const handleCellHover = (
  e: React.MouseEvent<HTMLTableCellElement>,
  weekIdx: number,
  week: string,
  brandName: string,
  value: number,
  prevValue: number | null,
  isSonalika: boolean) =>
  {
    if (!tableRef.current) return;

    const cell = e.currentTarget;
    const rect = cell.getBoundingClientRect();
    const tableRect = tableRef.current.getBoundingClientRect();

    // Position tooltip above cell by default, below if near top
    const above = rect.top - tableRect.top > 140;
    const top = above ? rect.top - tableRect.top - 10 : rect.bottom - tableRect.top + 10;
    let left = rect.left - tableRect.left + rect.width / 2;

    // Clamp left/right to stay within card
    const tooltipWidth = 200; // Approximate tooltip width
    const cardWidth = tableRect.width;
    if (left < tooltipWidth / 2) {
      left = tooltipWidth / 2;
    } else if (left > cardWidth - tooltipWidth / 2) {
      left = cardWidth - tooltipWidth / 2;
    }

    setTooltip({
      visible: true,
      weekIdx,
      week,
      brandName,
      value,
      prevValue,
      isSonalika,
      position: { top, left, above }
    });
  };

  const handleCellLeave = () => {
    setTooltip(null);
  };

  const colWidth = `calc((100% - 160px) / ${numWeeks})`;

  return (
    <SectionCard
      title="Content Frequency"
      subtitle="Unique videos per brand per day — creator coverage across the monitored period">

      <div ref={tableRef} style={{ position: 'relative' }}>
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            tableLayout: 'fixed'
          }}>

          <colgroup>
            <col style={{ width: '110px' }} />
            {weeks.map((w) =>
            <col key={w} style={{ width: colWidth }} />
            )}
            <col style={{ width: '50px' }} />
          </colgroup>
          <thead>
            <tr>
              <th style={{ width: '110px', textAlign: 'right', paddingRight: '12px', fontWeight: 500, fontSize: '12px', color: '#64748b', height: '44px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }} />
              {weeks.map((w) =>
              <th
                key={w}
                style={{
                  width: colWidth,
                  textAlign: 'center',
                  fontWeight: 500,
                  fontSize: '11px',
                  color: '#64748b',
                  height: '44px',
                  verticalAlign: 'middle',
                  borderBottom: '1px solid #e2e8f0',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}>

                {formatDayLabel(w)}
                </th>
              )}
              <th style={{ width: '50px', textAlign: 'center', fontWeight: 600, fontSize: '11px', color: '#334155', height: '44px', verticalAlign: 'middle', borderBottom: '1px solid #e2e8f0' }}>Videos</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const isSonalika = row.isSonalika;
              return (
                <tr key={row.name} style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <td
                    style={{
                      width: '110px',
                      textAlign: 'right',
                      paddingRight: '12px',
                      fontWeight: isSonalika ? 600 : 400,
                      fontSize: '12px',
                      color: '#334155',
                      height: '44px',
                      verticalAlign: 'middle',
                      backgroundColor: 'transparent'
                    }}>

                    {row.name}
                  </td>
                  {row.data.map((value, colIdx) => {
                    const week = weeks[colIdx];
                    const bgColor = isSonalika && value === 0 ?
                    '#F3F4F6' :
                    interpolateColor(value, 0, maxVal);
                    const textColor = getTextColor(bgColor);
                    const prevValue = colIdx > 0 ? row.data[colIdx - 1] : null;
                    const delta = colIdx > 0 ? value - prevValue! : null;

                    return (
                      <td
                        key={colIdx}
                        style={{
                          width: colWidth,
                          height: '44px',
                          backgroundColor: bgColor,
                          color: textColor,
                          textAlign: 'center',
                          verticalAlign: 'middle',
                          padding: '0 4px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          cursor: 'pointer'
                        }}
                        onMouseEnter={(e) =>
                        handleCellHover(
                          e,
                          colIdx,
                          week,
                          row.name,
                          value,
                          prevValue,
                          isSonalika
                        )
                        }
                        onMouseLeave={handleCellLeave}>

                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <div
                            style={{
                              fontSize: isNarrow ? '12px' : '14px',
                              fontWeight: 500,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>

                            {isSonalika && value === 0 ? '—' : value}
                          </div>
                          {delta !== null && delta !== 0 &&
                          <div
                            style={{
                              fontSize: isNarrow ? '9px' : '10px',
                              color: delta > 0 ? '#16a34a' : '#dc2626',
                              marginTop: 2,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>

                              {delta > 0 ? '▲' : '▼'}
                              {Math.abs(delta)}
                            </div>
                          }
                          {isSonalika && value === 0 &&
                          <div
                            style={{
                              fontSize: '9px',
                              color: '#D85A30',
                              marginTop: 1,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis'
                            }}>

                              gap
                            </div>
                          }
                        </div>
                      </td>);

                  })}
                  {/* Legend column marker */}
                  <td
                    style={{
                      width: '50px',
                      height: '44px',
                      backgroundColor: 'transparent'
                    }} />

                </tr>);

            })}
          </tbody>
        </table>

        {/* Legend outside table on right */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '50px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            paddingTop: '44px'
          }}>

          <div style={{ position: 'relative', height: '120px', width: '36px' }}>
            {/* Gradient bar */}
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '14px',
                background: 'linear-gradient(to bottom, rgb(12, 68, 124), rgb(230, 241, 251))',
                borderRadius: '3px'
              }} />

            {/* Max label */}
            <span style={{ position: 'absolute', left: '18px', top: 0, fontSize: '10px', color: '#64748b', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {maxVal}
            </span>
            {/* Mid label */}
            <span style={{ position: 'absolute', left: '18px', top: '56px', fontSize: '10px', color: '#94a3b8', lineHeight: 1, whiteSpace: 'nowrap' }}>
              {Math.round(maxVal / 2)}
            </span>
            {/* Min label */}
            <span style={{ position: 'absolute', left: '18px', bottom: 0, fontSize: '10px', color: '#94a3b8', lineHeight: 1, whiteSpace: 'nowrap' }}>
              0
            </span>
          </div>
        </div>

        {/* Tooltip */}
        {tooltip?.visible &&
        <div
          style={{
            position: 'absolute',
            backgroundColor: '#1a1a2e',
            color: 'white',
            fontSize: '12px',
            borderRadius: '6px',
            padding: '8px 12px',
            zIndex: 1000,
            pointerEvents: 'none',
            left: `${tooltip.position.left}px`,
            top: `${tooltip.position.top}px`,
            transform: 'translate(-50%, ' + (tooltip.position.above ? '-100%' : '0') + ')',
            whiteSpace: 'nowrap'
          }}>

            <div style={{ fontWeight: 500 }}>Date: {formatDayLabel(tooltip.week)}</div>
            <div>Brand: {tooltip.brandName}</div>
            <div>{tooltip.value} videos published</div>
            {tooltip.weekIdx > 0 &&
          <div>
                {tooltip.prevValue === tooltip.value ?
            '— No change' :
            tooltip.value > tooltip.prevValue! ?
            `▲ Increased by ${tooltip.value - tooltip.prevValue!}` :
            `▼ Decreased by ${Math.abs(tooltip.value - tooltip.prevValue!)}`}{' '}
                vs previous day
              </div>
          }
            {tooltip.isSonalika && tooltip.value === 0 &&
          <div>Coverage gap — no creator published Sonalika content this day</div>
          }
          </div>
        }
      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid #e2e8f0', margin: '1.25rem 0' }} />

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, fontSize: 12, color: 'var(--color-text-secondary)' }}>
        <span>Sonalika active days: {sonalikaActiveWeeks} of {sonalikaTotalWeeks}</span>
        <span>·</span>
        <span>Sonalika avg videos/day: {sonalikaAvg.toFixed(1)}</span>
        <span>·</span>
        <span>
          Most active competitor: {mostActiveCompetitor?.name} ({mostActiveAvg.toFixed(1)}/day)
        </span>
      </div>

      {/* Footer caption */}
      <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', marginTop: 8 }}>
        Unique videos per brand per day. Amber-outlined Sonalika row highlights coverage gaps (—) where no creator published Sonalika content that day.
      </div>
    </SectionCard>);

}
