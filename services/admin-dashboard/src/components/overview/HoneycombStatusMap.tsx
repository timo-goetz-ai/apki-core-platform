'use client';

import { useMemo } from 'react';

export type ServiceStatus = 'online' | 'degraded' | 'offline' | 'unknown';

const STATUS_COLOR: Record<ServiceStatus, string> = {
  online: 'var(--accent-green)',
  degraded: 'var(--accent-amber)',
  offline: 'var(--accent-red)',
  unknown: 'var(--text-muted)',
};

export interface HoneyService {
  id: string;
  name: string;
  status: ServiceStatus;
  latency?: string | number;
  promGlow: number;
}

function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 6 + (i * Math.PI) / 3;
    pts.push(`${cx + r * Math.cos(a)},${cy + r * Math.sin(a)}`);
  }
  return pts.join(' ');
}

export function HoneycombStatusMap({
  services,
  onlineCount,
  totalCount,
  onlinePct,
}: {
  services: HoneyService[];
  onlineCount: number;
  totalCount: number;
  onlinePct: number;
}) {
  const pad = 10;
  const hexR = 22;

  const { width, height, cells } = useMemo(() => {
    const r = 22;
    const dx = Math.sqrt(3) * r;
    const dy = 1.5 * r;
    const n = services.length;
    if (n === 0) {
      return { width: 200, height: 100, cells: [] as { svc: HoneyService; cx: number; cy: number }[] };
    }
    const cols = Math.max(3, Math.ceil(Math.sqrt(n * 1.1)));
    const rows = Math.ceil(n / cols);
    const list: { svc: HoneyService; cx: number; cy: number }[] = [];
    for (let i = 0; i < n; i++) {
      const row = Math.floor(i / cols);
      const col = i % cols;
      const rowOffset = row % 2 === 1 ? dx / 2 : 0;
      const cx = pad + rowOffset + col * dx + r;
      const cy = pad + row * dy + r;
      list.push({ svc: services[i], cx, cy });
    }
    const maxX = Math.max(...list.map((c) => c.cx)) + r + pad;
    const maxY = Math.max(...list.map((c) => c.cy)) + r + pad;
    return { width: maxX, height: maxY, cells: list };
  }, [services]);

  return (
    <div style={{ position: 'relative' }}>
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        style={{ display: 'block', overflow: 'visible' }}
        aria-label="Service Honeycomb Status"
      >
        <defs>
          <filter id="hex-glow" x="-80%" y="-80%" width="260%" height="260%">
            <feGaussianBlur stdDeviation="2.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {cells.map(({ svc, cx, cy }) => {
          const base = STATUS_COLOR[svc.status];
          const healthBoost =
            svc.status === 'online' ? 0.55 : svc.status === 'degraded' ? 0.3 : svc.status === 'offline' ? 0.08 : 0.22;
          const glow = Math.min(1, healthBoost + svc.promGlow * 0.55);
          const fillAlpha = 0.12 + glow * 0.35;
          const strokeW = 1 + glow * 1.8;
          const lat =
            svc.latency !== undefined && svc.latency !== ''
              ? typeof svc.latency === 'number'
                ? `${svc.latency}ms`
                : String(svc.latency)
              : svc.status;
          return (
            <g key={svc.id} style={{ cursor: 'default' }}>
              <title>{`${svc.name} · ${svc.id} · ${svc.status}`}</title>
              <polygon
                points={hexPoints(cx, cy, hexR)}
                fill={base}
                fillOpacity={fillAlpha}
                stroke={base}
                strokeOpacity={0.35 + glow * 0.55}
                strokeWidth={strokeW}
                filter={glow > 0.35 ? 'url(#hex-glow)' : undefined}
                style={{
                  transition: 'fill-opacity 0.4s ease, stroke-width 0.4s ease',
                }}
              />
              <text
                x={cx}
                y={cy - 5}
                textAnchor="middle"
                style={{
                  fontSize: 8,
                  fontFamily: 'var(--font-ui)',
                  fontWeight: 600,
                  fill: 'var(--text-primary)',
                }}
              >
                {svc.name.length > 10 ? `${svc.name.slice(0, 9)}…` : svc.name}
              </text>
              <text
                x={cx}
                y={cy + 8}
                textAnchor="middle"
                style={{
                  fontSize: 7,
                  fontFamily: 'var(--font-mono)',
                  fill: 'var(--text-muted)',
                }}
              >
                {lat}
              </text>
            </g>
          );
        })}
      </svg>
      <div
        style={{
          marginTop: 8,
          borderTop: '1px solid var(--border)',
          paddingTop: 8,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>UPTIME</span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: onlinePct >= 90 ? 'var(--accent-green)' : 'var(--accent-amber)' }}>
          {onlineCount}/{totalCount} · {onlinePct}%
        </span>
      </div>
    </div>
  );
}
