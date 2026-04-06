'use client';

/**
 * EChartsWrapper — SSR-sicherer dynamischer Import von echarts-for-react.
 *
 * Alle Chart-Komponenten importieren diesen Wrapper statt echarts-for-react
 * direkt, damit kein `window`-Fehler im Next.js SSR aufkommt.
 *
 * Verwendung:
 *   import { EChart } from '@/components/charts/EChartsWrapper';
 *   <EChart option={...} style={{ height: 300 }} />
 */

import dynamic from 'next/dynamic';
import type { EChartsOption } from 'echarts';
import type { CSSProperties } from 'react';

// Dynamischer Import — kein SSR
const ReactECharts = dynamic(() => import('echarts-for-react'), { ssr: false });

// ── AIOS Design-Token-Farben ────────────────────────────────────────────────
// Werden als konkrete Hex-Werte übergeben, da ECharts CSS-Variablen nicht
// parsen kann. Die Werte entsprechen den globals.css Tokens im Dark-Mode.
export const CHART_COLORS = {
  blue:   '#3b82f6',
  green:  '#22c55e',
  amber:  '#f59e0b',
  red:    '#ef4444',
  purple: '#a855f7',
  cyan:   '#06b6d4',
  slate:  '#64748b',
} as const;

export const PALETTE = [
  CHART_COLORS.blue,
  CHART_COLORS.green,
  CHART_COLORS.amber,
  CHART_COLORS.purple,
  CHART_COLORS.cyan,
  CHART_COLORS.red,
  CHART_COLORS.slate,
];

// Gemeinsame Basis-Option für alle Charts (Dark-Theme)
export function baseOption(): Partial<EChartsOption> {
  return {
    backgroundColor: 'transparent',
    textStyle: {
      color: '#94a3b8',       // --text-secondary equivalent
      fontFamily: 'inherit',
      fontSize: 12,
    },
    tooltip: {
      backgroundColor: '#1e293b',
      borderColor: '#334155',
      borderWidth: 1,
      textStyle: { color: '#e2e8f0', fontSize: 12 },
      confine: true,
    },
    grid: {
      left: 40,
      right: 16,
      top: 24,
      bottom: 32,
      containLabel: false,
    },
  };
}

// ── Skeleton-Platzhalter während Lazy-Load ──────────────────────────────────
function ChartSkeleton({ style }: { style?: CSSProperties }) {
  return (
    <div
      className="rounded-md animate-pulse"
      style={{ height: 300, background: 'var(--layer-2)', ...style }}
      aria-label="Chart wird geladen…"
    />
  );
}

// ── Haupt-Export ─────────────────────────────────────────────────────────────
interface EChartProps {
  option: EChartsOption;
  style?: CSSProperties;
  className?: string;
  notMerge?: boolean;
  lazyUpdate?: boolean;
}

export function EChart({ option, style, className, notMerge = true, lazyUpdate = false }: EChartProps) {
  return (
    <ReactECharts
      option={option}
      style={{ height: 300, width: '100%', ...style }}
      className={className}
      notMerge={notMerge}
      lazyUpdate={lazyUpdate}
      opts={{ renderer: 'canvas' }}
    />
  );
}
