'use client';

import { STATIONS } from './types';

/**
 * The ∞-shaped SVG lemniscate track with 5 stations.
 * Diagonal orientation for a more dynamic, enterprise look.
 * Children (agents) are rendered on top of the track.
 */

/** Diagonal lemniscate — rotated ~20° for a more dynamic feel */
export const TRACK_PATH =
  'M 450,200 C 380,60 700,60 680,180 C 660,300 500,340 450,200 C 400,60 240,20 220,180 C 200,340 520,340 450,200';

/** Station positions (pre-calculated on the diagonal path) */
const STATION_COORDS: Record<string, { x: number; y: number }> = {
  analyse:   { x: 220, y: 140 },
  research:  { x: 280, y: 300 },
  uebergabe: { x: 450, y: 200 },
  content:   { x: 620, y: 100 },
  export:    { x: 680, y: 260 },
};

export function InfinityTrack({ children }: { children?: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 900 400"
      className="w-full h-full"
      preserveAspectRatio="xMidYMid meet"
      aria-label="Agent Infinity Track"
    >
      <defs>
        <filter id="station-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.6" />
          <stop offset="50%" stopColor="var(--text-muted)" stopOpacity="0.3" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Track background — subtle */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.04)"
        strokeWidth="48"
        strokeLinecap="round"
      />

      {/* Dashed lane markers — subtle */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.08)"
        strokeWidth="1"
        strokeDasharray="8 20"
        strokeLinecap="round"
      />

      {/* Centre line — monochrome gradient */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="url(#trackGrad)"
        strokeWidth="2"
        strokeLinecap="round"
        opacity={0.8}
      />

      {/* Stations */}
      {STATIONS.map((s) => {
        const pos = STATION_COORDS[s.id];
        if (!pos) return null;
        return (
          <g key={s.id}>
            {/* Subtle pulse ring */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="22"
              fill="none"
              stroke={s.color}
              strokeWidth="1"
              opacity={0.2}
            >
              <animate
                attributeName="r"
                values="22;28;22"
                dur="4s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.2;0;0.2"
                dur="4s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Station circle — clean, flat */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="20"
              fill={s.color}
              opacity={0.08}
              stroke={s.color}
              strokeWidth="1.5"
              strokeOpacity={0.4}
            />

            {/* Icon */}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="15"
              style={{ pointerEvents: 'none' }}
            >
              {s.icon}
            </text>

            {/* Label — larger, cleaner */}
            <text
              x={pos.x}
              y={pos.y + 38}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="10"
              fontFamily="var(--font-ui)"
              fontWeight="500"
              letterSpacing="0.04em"
            >
              {s.label}
            </text>
          </g>
        );
      })}

      {/* Agents rendered on top */}
      {children}
    </svg>
  );
}
