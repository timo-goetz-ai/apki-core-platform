'use client';

import Link from 'next/link';
import { ExternalLink, Zap } from 'lucide-react';

export function WorkflowPulseGraph({
  activeWf,
  totalWf,
  pulseSpeedSec,
}: {
  activeWf: number;
  totalWf: number;
  pulseSpeedSec: number;
}) {
  const dur = Math.max(1.2, Math.min(3.2, pulseSpeedSec));

  const mainPath =
    'M 95 110 C 150 110, 170 110, 200 110 C 230 110, 250 110, 305 110';
  const aiToLead = 'M 95 110 Q 140 85, 200 52';
  const sysToVoice = 'M 305 110 Q 260 140, 200 168';
  const aiToContent = 'M 95 110 Q 115 145, 140 172';
  const sysToDevops = 'M 305 110 Q 285 145, 280 172';

  const paths = [mainPath, aiToLead, sysToVoice, aiToContent, sysToDevops];

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span
          style={{
            fontSize: 9,
            fontFamily: 'var(--font-mono)',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
          }}
        >
          Workflow Pulse · live
        </span>
        <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
          {activeWf} aktiv / {totalWf} gesamt
        </span>
      </div>
      <svg
        viewBox="0 0 400 200"
        width="100%"
        height={200}
        style={{ display: 'block', borderRadius: 8 }}
        aria-label="Workflow Graph"
      >
        <defs>
          <pattern id="wf-grid" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(96,165,250,0.07)" strokeWidth="0.5" />
          </pattern>
          <linearGradient id="edge-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--accent-purple)" stopOpacity="0.95" />
            <stop offset="100%" stopColor="var(--accent-blue)" stopOpacity="0.95" />
          </linearGradient>
          <filter id="pulse-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width="100%" height="100%" fill="url(#wf-grid)" opacity={0.85} />

        {paths.map((d, i) => (
          <path
            key={i}
            d={d}
            fill="none"
            stroke={i === 0 ? 'url(#edge-grad)' : 'rgba(148,163,184,0.38)'}
            strokeWidth={i === 0 ? 2 : 1}
            className={i === 0 ? 'wf-graph-edge-main' : 'wf-graph-edge-sub'}
            style={{
              animationDuration: i === 0 ? `${dur}s` : `${dur * 1.35}s`,
              animationDirection: i === 0 ? 'normal' : 'reverse',
            }}
          />
        ))}

        {paths.slice(1).map((d, i) => (
          <circle key={`p-${i}`} r={3} fill="var(--accent-purple)" filter="url(#pulse-glow)" opacity={0.85}>
            <animateMotion dur={`${dur + i * 0.25}s`} repeatCount="indefinite" path={d} />
          </circle>
        ))}
        <circle r={4} fill="var(--accent-blue)" filter="url(#pulse-glow)" opacity={0.95}>
          <animateMotion dur={`${dur}s`} repeatCount="indefinite" path={mainPath} />
        </circle>
        <circle r={2.5} fill="#e879f9" filter="url(#pulse-glow)" opacity={0.75}>
          <animateMotion dur={`${dur * 0.85}s`} repeatCount="indefinite" begin="0.45s" path={mainPath} />
        </circle>

        <g>
          <circle cx={95} cy={110} r={28} fill="rgba(167,139,250,0.12)" stroke="var(--accent-purple)" strokeWidth={1.5} />
          <text x={95} y={106} textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, fill: 'var(--accent-purple)' }}>
            AI_BRAIN
          </text>
          <text x={95} y={118} textAnchor="middle" style={{ fontSize: 7, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}>
            n8n
          </text>
        </g>
        <g>
          <circle cx={305} cy={110} r={28} fill="rgba(56,189,248,0.12)" stroke="var(--accent-blue)" strokeWidth={1.5} />
          <text x={305} y={106} textAnchor="middle" style={{ fontSize: 9, fontFamily: 'var(--font-mono)', fontWeight: 700, fill: 'var(--accent-blue)' }}>
            SYSTEM
          </text>
          <text x={305} y={118} textAnchor="middle" style={{ fontSize: 7, fontFamily: 'var(--font-mono)', fill: 'var(--text-muted)' }}>
            BRAIN
          </text>
        </g>

        <g>
          <circle cx={200} cy={52} r={22} fill="rgba(52,211,153,0.1)" stroke="var(--accent-green)" strokeWidth={1} />
          <text x={200} y={55} textAnchor="middle" style={{ fontSize: 7.5, fontFamily: 'var(--font-mono)', fill: 'var(--accent-green)' }}>
            Lead Scout
          </text>
        </g>
        <g>
          <circle cx={140} cy={172} r={20} fill="rgba(251,146,60,0.1)" stroke="var(--accent-amber)" strokeWidth={1} />
          <text x={140} y={175} textAnchor="middle" style={{ fontSize: 7.5, fontFamily: 'var(--font-mono)', fill: 'var(--accent-amber)' }}>
            Content
          </text>
        </g>
        <g>
          <circle cx={200} cy={172} r={20} fill="rgba(244,114,182,0.1)" stroke="var(--accent-purple)" strokeWidth={1} />
          <text x={200} y={175} textAnchor="middle" style={{ fontSize: 7.5, fontFamily: 'var(--font-mono)', fill: 'var(--accent-purple)' }}>
            Voice
          </text>
        </g>
        <g>
          <circle cx={280} cy={172} r={20} fill="rgba(148,163,184,0.12)" stroke="var(--text-secondary)" strokeWidth={1} />
          <text x={280} y={175} textAnchor="middle" style={{ fontSize: 7.5, fontFamily: 'var(--font-mono)', fill: 'var(--text-secondary)' }}>
            DevOps
          </text>
        </g>
      </svg>

      <div style={{ marginTop: 6, display: 'flex', justifyContent: 'flex-end' }}>
        <Link
          href="/workflows"
          style={{
            color: 'var(--text-muted)',
            textDecoration: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10,
          }}
        >
          <Zap size={10} /> alle Workflows <ExternalLink size={8} />
        </Link>
      </div>
    </div>
  );
}
