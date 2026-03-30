'use client';

import Link from 'next/link';
import { ExternalLink, TrendingUp, Activity } from 'lucide-react';

interface TrendRow {
  Id?: number;
  Thema?: string;
  Score?: number;
  Sentiment?: string;
  Wachstum_Prozent?: number;
}

interface SentimentRow {
  Id?: number;
  Thema?: string;
  Sentiment?: string;
  Score?: number;
  Quelle?: string;
}

function hashSeed(parts: (string | number | undefined)[]): number {
  const s = parts.join('|');
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h) || 1;
}

/** Deterministische 24-Punkt-Serie (Platzhalter für echte Zeitreihen / später Prometheus). */
function series24(seed: number, score?: number): number[] {
  const base = 40 + Math.min(40, (score ?? 50) * 0.35);
  const out: number[] = [];
  let v = base;
  for (let i = 0; i < 24; i++) {
    const r = Math.sin(seed * 0.001 + i * 0.55) * 12 + Math.cos(i * 0.31 + seed * 0.002) * 7;
    v = Math.max(10, Math.min(95, v + r * 0.28));
    out.push(v);
  }
  return out;
}

function areaPath(values: number[], w: number, h: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1 || 1);
  const pts = values.map((v, i) => {
    const x = i * step;
    const y = h - ((v - min) / span) * (h - 6) - 3;
    return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
  });
  return `${pts.join(' ')} L ${w} ${h} L 0 ${h} Z`;
}

function linePath(values: number[], w: number, h: number): string {
  if (values.length === 0) return '';
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const step = w / (values.length - 1 || 1);
  return values
    .map((v, i) => {
      const x = i * step;
      const y = h - ((v - min) / span) * (h - 4) - 2;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(' ');
}

function SparkGrid({
  values,
  stroke,
  fillId,
  glow,
}: {
  values: number[];
  stroke: string;
  fillId: string;
  glow: string;
}) {
  const w = 120;
  const h = 40;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block' }} aria-hidden>
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.45" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
        <filter id={glow} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="1.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path d={`M 0 ${h} L 0 0 L ${w} 0 L ${w} ${h} Z`} fill="rgba(96,165,250,0.04)" />
      {[0, 0.25, 0.5, 0.75, 1].map((t) => (
        <line
          key={t}
          x1={0}
          x2={w}
          y1={3 + t * (h - 6)}
          y2={3 + t * (h - 6)}
          stroke="rgba(148,163,184,0.12)"
          strokeWidth={0.5}
          strokeDasharray="3 4"
        />
      ))}
      <path d={areaPath(values, w, h)} fill={`url(#${fillId})`} stroke="none" />
      <path
        d={linePath(values, w, h)}
        fill="none"
        stroke={stroke}
        strokeWidth={1.4}
        filter={`url(#${glow})`}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MiniSpark({ values, color }: { values: number[]; color: string }) {
  const w = 56;
  const h = 18;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', flexShrink: 0 }} aria-hidden>
      <path
        d={linePath(values, w, h)}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
        strokeLinecap="round"
        opacity={0.95}
      />
    </svg>
  );
}

export function TrendSentimentViz({
  trends,
  sentiments,
}: {
  trends: TrendRow[];
  sentiments: SentimentRow[];
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
      <div className="overview-glass-panel overview-glitch-wrap" style={{ padding: '14px 16px', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <TrendingUp size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Top Trends</span>
          </div>
          <Link href="/workflows" style={{ color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3, fontSize: 9 }}>
            n8n <ExternalLink size={8} />
          </Link>
        </div>
        {trends.length === 0 ? (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Noch keine Daten — Workflow läuft täglich um 07:00
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {trends.map((t, i) => {
              const seed = hashSeed([t.Id, t.Thema, i]);
              const vals = series24(seed, t.Score);
              const sent = (t.Sentiment ?? '').toLowerCase();
              const stroke = sent.includes('positiv') ? 'var(--accent-green)' : sent.includes('negativ') ? 'var(--accent-red)' : 'var(--accent-amber)';
              const fillId = `trend-fill-${t.Id ?? i}`;
              const glowId = `trend-glow-${t.Id ?? i}`;
              return (
                <div
                  key={t.Id ?? i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    alignItems: 'center',
                    paddingBottom: 8,
                    borderBottom: i < trends.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', width: 14, textAlign: 'right' }}>
                        {i + 1}
                      </span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 11,
                          color: 'var(--text-primary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={t.Thema}
                      >
                        {t.Thema ?? '—'}
                      </span>
                      {t.Wachstum_Prozent != null && (
                        <span
                          style={{
                            fontSize: 9,
                            fontFamily: 'var(--font-mono)',
                            color: t.Wachstum_Prozent > 0 ? 'var(--accent-green)' : 'var(--accent-red)',
                          }}
                        >
                          {t.Wachstum_Prozent > 0 ? '+' : ''}
                          {t.Wachstum_Prozent}%
                        </span>
                      )}
                      <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, color: stroke }}>{t.Score ?? '—'}</span>
                    </div>
                    <SparkGrid values={vals} stroke={stroke} fillId={fillId} glow={glowId} />
                  </div>
                  <MiniSpark values={vals} color={stroke} />
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="overview-glass-panel overview-glitch-wrap" style={{ padding: '14px 16px', borderRadius: 12, position: 'relative', overflow: 'hidden' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Activity size={12} style={{ color: 'var(--text-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.02em' }}>Sentiment-Ticker</span>
          </div>
          <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>alle 4h</span>
        </div>
        {sentiments.length === 0 ? (
          <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', margin: 0 }}>
            Noch keine Daten — Workflow läuft alle 4 Stunden
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sentiments.map((s, i) => {
              const sent = (s.Sentiment ?? '').toLowerCase();
              const color = sent.includes('positiv') ? 'var(--accent-green)' : sent.includes('negativ') ? 'var(--accent-red)' : 'var(--accent-amber)';
              const label = sent.includes('positiv') ? '↑' : sent.includes('negativ') ? '↓' : '→';
              const seed = hashSeed([s.Id, s.Thema, 'sent', i]);
              const vals = series24(seed, s.Score);
              const fillId = `sent-fill-${s.Id ?? i}`;
              const glowId = `sent-glow-${s.Id ?? i}`;
              return (
                <div
                  key={s.Id ?? i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr auto',
                    gap: 8,
                    alignItems: 'center',
                    paddingBottom: 8,
                    borderBottom: i < sentiments.length - 1 ? '1px solid var(--border)' : 'none',
                  }}
                >
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontSize: 12, color, width: 12, textAlign: 'center' }}>{label}</span>
                      <span
                        style={{
                          flex: 1,
                          fontSize: 10.5,
                          color: 'var(--text-secondary)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={s.Thema}
                      >
                        {s.Thema ?? '—'}
                      </span>
                      {s.Quelle && (
                        <span
                          style={{
                            fontSize: 8.5,
                            fontFamily: 'var(--font-mono)',
                            color: 'var(--text-muted)',
                            background: 'var(--layer-3)',
                            padding: '1px 4px',
                            borderRadius: 3,
                          }}
                        >
                          {s.Quelle}
                        </span>
                      )}
                    </div>
                    <SparkGrid values={vals} stroke={color} fillId={fillId} glow={glowId} />
                  </div>
                  <MiniSpark values={vals} color={color} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
