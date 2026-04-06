'use client';

import type { CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';
import { EChart, baseOption, CHART_COLORS } from './EChartsWrapper';

export interface TimeSeriesPoint {
  date: string;   // 'YYYY-MM-DD'
  count: number;
}

interface TimeSeriesChartProps {
  data: TimeSeriesPoint[];
  title?: string;
  color?: string;
  style?: CSSProperties;
  /** Zeige Area-Fill (default: true) */
  area?: boolean;
}

export function TimeSeriesChart({
  data,
  title,
  color = CHART_COLORS.blue,
  style,
  area = true,
}: TimeSeriesChartProps) {
  const dates  = data.map((d) => d.date);
  const counts = data.map((d) => d.count);

  const option: EChartsOption = {
    ...baseOption(),
    ...(title ? { title: { text: title, textStyle: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 }, top: 4, left: 4 } } : {}),
    xAxis: {
      type: 'category',
      data: dates,
      axisLine:      { lineStyle: { color: '#1e293b' } },
      axisTick:      { show: false },
      axisLabel: {
        color: '#64748b',
        fontSize: 11,
        rotate: dates.length > 20 ? 30 : 0,
        formatter: (val: string) => {
          const d = new Date(val);
          return `${d.getDate()}.${d.getMonth() + 1}.`;
        },
      },
      splitLine: { show: false },
    },
    yAxis: {
      type: 'value',
      minInterval: 1,
      axisLine:  { show: false },
      axisTick:  { show: false },
      axisLabel: { color: '#64748b', fontSize: 11 },
      splitLine: { lineStyle: { color: '#1e293b', type: 'dashed' } },
    },
    series: [
      {
        type: 'line',
        data: counts,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        lineStyle: { color, width: 2 },
        itemStyle: { color },
        ...(area
          ? {
              areaStyle: {
                color: {
                  type: 'linear',
                  x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: color + '40' },
                    { offset: 1, color: color + '05' },
                  ],
                },
              },
            }
          : {}),
      },
    ],
    tooltip: {
      ...(baseOption().tooltip as object),
      trigger: 'axis',
      formatter: (params: unknown) => {
        const p = (params as { name: string; value: number }[])[0];
        return `<span style="color:#94a3b8">${p.name}</span><br/><b style="color:#e2e8f0">${p.value}</b>`;
      },
    },
  };

  return <EChart option={option} style={style} />;
}
