'use client';

import type { CSSProperties } from 'react';
import type { EChartsOption } from 'echarts';
import { EChart, baseOption, PALETTE } from './EChartsWrapper';

interface DistributionChartProps {
  labels: string[];
  values: number[];
  type?: 'bar' | 'pie' | 'donut';
  title?: string;
  style?: CSSProperties;
}

export function DistributionChart({
  labels,
  values,
  type = 'bar',
  title,
  style,
}: DistributionChartProps) {
  const titleObj = title
    ? { title: { text: title, textStyle: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 }, top: 4, left: 4 } }
    : {};

  // ── Bar Chart ──────────────────────────────────────────────────────────────
  if (type === 'bar') {
    const option: EChartsOption = {
      ...baseOption(),
      ...titleObj,
      xAxis: {
        type: 'category',
        data: labels,
        axisLine:  { lineStyle: { color: '#1e293b' } },
        axisTick:  { show: false },
        axisLabel: {
          color: '#64748b',
          fontSize: 11,
          rotate: labels.length > 6 ? 30 : 0,
          overflow: 'truncate',
          width: 80,
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
          type: 'bar',
          data: values.map((v, i) => ({
            value: v,
            itemStyle: { color: PALETTE[i % PALETTE.length] },
          })),
          barMaxWidth: 48,
          label: {
            show: values.length <= 10,
            position: 'top',
            color: '#94a3b8',
            fontSize: 11,
          },
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

  // ── Pie / Donut Chart ──────────────────────────────────────────────────────
  const pieData = labels.map((l, i) => ({
    name:  l,
    value: values[i],
    itemStyle: { color: PALETTE[i % PALETTE.length] },
  }));

  const option: EChartsOption = {
    ...baseOption(),
    ...titleObj,
    legend: {
      orient: 'vertical',
      right: 8,
      top: 'center',
      textStyle: { color: '#94a3b8', fontSize: 11 },
      icon: 'circle',
    },
    series: [
      {
        type: 'pie',
        radius: type === 'donut' ? ['40%', '68%'] : '65%',
        center: ['38%', '50%'],
        data: pieData,
        label: {
          show: type !== 'donut',
          color: '#94a3b8',
          fontSize: 11,
          formatter: '{b}: {d}%',
        },
        labelLine: { lineStyle: { color: '#334155' } },
        emphasis: {
          itemStyle: { shadowBlur: 8, shadowColor: 'rgba(0,0,0,0.3)' },
        },
      },
    ],
    tooltip: {
      ...(baseOption().tooltip as object),
      trigger: 'item',
      formatter: '{b}: <b>{c}</b> ({d}%)',
    },
  };

  return <EChart option={option} style={style} />;
}
