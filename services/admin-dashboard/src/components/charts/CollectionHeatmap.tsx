'use client';

import type { CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';
import { EChart, baseOption } from './EChartsWrapper';

export interface HeatmapPoint {
  date:  string;  // 'YYYY-MM-DD'
  count: number;
}

interface CollectionHeatmapProps {
  data:   HeatmapPoint[];
  title?: string;
  style?: CSSProperties;
  /** Maximaler Wert für die Farbskala (auto wenn nicht angegeben) */
  max?:   number;
}

// Wochentag-Labels (Mo–So) auf Deutsch
const DAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

export function CollectionHeatmap({ data, title, style, max }: CollectionHeatmapProps) {
  const computedMax = max ?? Math.max(1, ...data.map((d) => d.count));

  // ECharts Calendar braucht [date, value]-Paare
  const calData: [string, number][] = data.map((d) => [d.date, d.count]);

  // Zeitbereich: letztes Jahr bis heute
  const today    = new Date();
  const yearAgo  = new Date(today);
  yearAgo.setFullYear(today.getFullYear() - 1);
  const range: [string, string] = [
    yearAgo.toISOString().slice(0, 10),
    today.toISOString().slice(0, 10),
  ];

  const option: EChartsOption = {
    ...baseOption(),
    ...(title
      ? { title: { text: title, textStyle: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 }, top: 4, left: 4 } }
      : {}),
    tooltip: {
      ...(baseOption().tooltip as object),
      formatter: (params: unknown) => {
        const p = params as { data: [string, number] };
        if (!p?.data) return '';
        const [date, val] = p.data;
        return `<span style="color:#94a3b8">${date}</span><br/><b style="color:#e2e8f0">${val} Einträge</b>`;
      },
    },
    visualMap: {
      min:    0,
      max:    computedMax,
      type:   'continuous',
      orient: 'horizontal',
      left:   'center',
      bottom: 0,
      show:   true,
      inRange: {
        color: ['#0f172a', '#1d4ed8', '#3b82f6', '#93c5fd'],
      },
      textStyle: { color: '#64748b', fontSize: 10 },
    },
    calendar: {
      top:    title ? 40 : 16,
      left:   36,
      right:  12,
      bottom: 32,
      range,
      cellSize: ['auto', 14],
      splitLine: { show: true, lineStyle: { color: '#1e293b', width: 1 } },
      itemStyle: { borderColor: '#0f172a', borderWidth: 1, color: '#0f172a' },
      yearLabel: { show: true, color: '#475569', fontSize: 11 },
      monthLabel: {
        show:      true,
        color:     '#64748b',
        fontSize:  11,
        nameMap:   ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
      },
      dayLabel: {
        show:    true,
        color:   '#475569',
        fontSize: 10,
        nameMap: DAY_LABELS,
        firstDay: 1,  // Montag
      },
    },
    series: [
      {
        type:           'heatmap',
        coordinateSystem: 'calendar',
        data:           calData,
        emphasis: {
          itemStyle: { shadowBlur: 6, shadowColor: '#3b82f680' },
        },
      },
    ],
  };

  return <EChart option={option} style={{ height: 180, ...style }} />;
}
