'use client';

/**
 * Inline SVG robot agent — inspired by the design mockups.
 * Parametrisable: name, color, size, active state.
 * Rendered as <g> to be placed inside the track SVG.
 */

interface Props {
  name: string;
  color: string;
  isActive: boolean;
  /** Centre position */
  x: number;
  y: number;
  size?: number;
}

export function AgentFigure({ name, color, isActive, x, y, size = 1 }: Props) {
  const s = size;
  return (
    <g transform={`translate(${x},${y}) scale(${s})`} style={{ pointerEvents: 'none' }}>
      {/* Shadow */}
      <ellipse cx={0} cy={22} rx={14} ry={4} fill="black" opacity={0.25} />

      {/* Body */}
      <rect x={-12} y={2} width={24} height={18} rx={6} fill={color} opacity={0.7} />
      <rect x={-12} y={2} width={24} height={18} rx={6} fill="none" stroke={color} strokeWidth={1.5} />

      {/* Head */}
      <circle cx={0} cy={-6} r={16} fill="#1e293b" stroke={color} strokeWidth={2} />
      {isActive && (
        <circle cx={0} cy={-6} r={18} fill="none" stroke={color} strokeWidth={1} opacity={0.4}>
          <animate attributeName="r" values="18;22;18" dur="2s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.4;0;0.4" dur="2s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Visor / face plate */}
      <rect x={-11} y={-14} width={22} height={12} rx={5} fill="#0f172a" stroke={color} strokeWidth={0.8} opacity={0.8} />

      {/* Eyes — glowing cyan ovals */}
      <ellipse cx={-5} cy={-9} rx={3.5} ry={4} fill="#22d3ee" opacity={isActive ? 1 : 0.5}>
        {isActive && (
          <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
        )}
      </ellipse>
      <ellipse cx={5} cy={-9} rx={3.5} ry={4} fill="#22d3ee" opacity={isActive ? 1 : 0.5}>
        {isActive && (
          <animate attributeName="opacity" values="1;0.6;1" dur="1.5s" repeatCount="indefinite" />
        )}
      </ellipse>

      {/* Eye glow */}
      {isActive && (
        <>
          <ellipse cx={-5} cy={-9} rx={5} ry={5.5} fill="#22d3ee" opacity={0.15} />
          <ellipse cx={5} cy={-9} rx={5} ry={5.5} fill="#22d3ee" opacity={0.15} />
        </>
      )}

      {/* Antenna */}
      <line x1={0} y1={-22} x2={0} y2={-28} stroke={color} strokeWidth={1.5} strokeLinecap="round" />
      <circle cx={0} cy={-30} r={2.5} fill={isActive ? '#22d3ee' : color} opacity={isActive ? 1 : 0.5}>
        {isActive && (
          <animate attributeName="opacity" values="1;0.3;1" dur="1s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Ear pieces */}
      <rect x={-19} y={-12} width={6} height={10} rx={3} fill="#334155" stroke={color} strokeWidth={0.8} />
      <rect x={13} y={-12} width={6} height={10} rx={3} fill="#334155" stroke={color} strokeWidth={0.8} />

      {/* Name badge */}
      <rect x={-24} y={30} width={48} height={16} rx={8} fill="rgba(0,0,0,0.7)" />
      <text
        x={0}
        y={39}
        textAnchor="middle"
        dominantBaseline="central"
        fill="white"
        fontSize="8"
        fontFamily="var(--font-mono)"
        fontWeight="600"
      >
        {name.length > 10 ? name.slice(0, 9) + '…' : name}
      </text>
    </g>
  );
}
