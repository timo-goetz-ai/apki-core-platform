'use client';

import { STATIONS } from './types';

/**
 * The ∞-shaped SVG lemniscate track with 5 stations.
 * Children (agents) are rendered on top of the track.
 */

/** Clean lemniscate bezier — wide horizontal ∞ */
export const TRACK_PATH =
  'M 450,200 C 450,80 750,80 750,200 C 750,320 450,320 450,200 C 450,80 150,80 150,200 C 150,320 450,320 450,200';

/** Station positions (pre-calculated on the path) */
const STATION_COORDS: Record<string, { x: number; y: number }> = {
  analyse:   { x: 150, y: 130 },
  research:  { x: 150, y: 270 },
  uebergabe: { x: 450, y: 200 },
  content:   { x: 750, y: 130 },
  export:    { x: 750, y: 270 },
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
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="track-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="trackGrad" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--accent-blue)" />
          <stop offset="25%" stopColor="var(--accent-purple)" />
          <stop offset="50%" stopColor="var(--accent-amber)" />
          <stop offset="75%" stopColor="var(--accent-green)" />
          <stop offset="100%" stopColor="var(--accent-blue)" />
        </linearGradient>
      </defs>

      {/* Wide dark track background */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth="56"
        strokeLinecap="round"
      />

      {/* Dashed lane markers */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="2"
        strokeDasharray="12 24"
        strokeLinecap="round"
      />

      {/* Glowing centre line */}
      <path
        d={TRACK_PATH}
        fill="none"
        stroke="url(#trackGrad)"
        strokeWidth="3"
        strokeLinecap="round"
        filter="url(#track-glow)"
        opacity={0.7}
      />

      {/* Stations */}
      {STATIONS.map((s) => {
        const pos = STATION_COORDS[s.id];
        if (!pos) return null;
        return (
          <g key={s.id}>
            {/* Outer pulse ring */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="28"
              fill="none"
              stroke={s.color}
              strokeWidth="2"
              opacity={0.3}
            >
              <animate
                attributeName="r"
                values="28;38;28"
                dur="3s"
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.3;0;0.3"
                dur="3s"
                repeatCount="indefinite"
              />
            </circle>

            {/* Station circle */}
            <circle
              cx={pos.x}
              cy={pos.y}
              r="24"
              fill={s.color}
              opacity={0.15}
              stroke={s.color}
              strokeWidth="2"
              filter="url(#station-glow)"
            />

            {/* Icon */}
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize="18"
              style={{ pointerEvents: 'none' }}
            >
              {s.icon}
            </text>

            {/* Label */}
            <text
              x={pos.x}
              y={pos.y + 46}
              textAnchor="middle"
              fill="var(--text-secondary)"
              fontSize="11"
              fontFamily="var(--font-mono)"
              fontWeight="600"
              style={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}
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
