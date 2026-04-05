'use client';

/**
 * Clean, minimal agent figure for the enterprise dashboard.
 * Rendered as <g> inside the track SVG.
 */

interface Props {
  name: string;
  color: string;
  isActive: boolean;
  x: number;
  y: number;
  size?: number;
}

export function AgentFigure({ name, color, isActive, x, y, size = 1 }: Props) {
  const s = size;
  const activeColor = isActive ? color : 'var(--text-muted)';

  return (
    <g transform={`translate(${x},${y}) scale(${s})`} style={{ pointerEvents: 'none' }}>
      {/* Subtle shadow */}
      <ellipse cx={0} cy={18} rx={10} ry={3} fill="black" opacity={0.15} />

      {/* Body — simple rounded rect */}
      <rect x={-10} y={0} width={20} height={14} rx={5} fill={activeColor} opacity={0.5} />
      <rect x={-10} y={0} width={20} height={14} rx={5} fill="none" stroke={activeColor} strokeWidth={1} strokeOpacity={0.6} />

      {/* Head — clean circle */}
      <circle cx={0} cy={-8} r={12} fill="var(--layer-2)" stroke={activeColor} strokeWidth={1.5} />

      {/* Active ring — subtle pulse */}
      {isActive && (
        <circle cx={0} cy={-8} r={14} fill="none" stroke={color} strokeWidth={0.8} opacity={0.3}>
          <animate attributeName="r" values="14;17;14" dur="3s" repeatCount="indefinite" />
          <animate attributeName="opacity" values="0.3;0;0.3" dur="3s" repeatCount="indefinite" />
        </circle>
      )}

      {/* Eyes — small dots */}
      <circle cx={-4} cy={-9} r={2} fill={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'} opacity={isActive ? 0.9 : 0.4} />
      <circle cx={4} cy={-9} r={2} fill={isActive ? 'var(--accent-blue)' : 'var(--text-muted)'} opacity={isActive ? 0.9 : 0.4} />

      {/* Status indicator dot */}
      <circle cx={0} cy={-22} r={2} fill={isActive ? 'var(--accent-green)' : 'var(--text-muted)'} opacity={isActive ? 1 : 0.3}>
        {isActive && (
          <animate attributeName="opacity" values="1;0.4;1" dur="2s" repeatCount="indefinite" />
        )}
      </circle>

      {/* Name badge — clean, no heavy background */}
      <rect x={-22} y={24} width={44} height={14} rx={7} fill="var(--layer-1)" stroke="var(--border)" strokeWidth={0.5} />
      <text
        x={0}
        y={31.5}
        textAnchor="middle"
        dominantBaseline="central"
        fill="var(--text-secondary)"
        fontSize="7"
        fontFamily="var(--font-mono)"
        fontWeight="500"
      >
        {name.length > 10 ? name.slice(0, 9) + '…' : name}
      </text>
    </g>
  );
}
