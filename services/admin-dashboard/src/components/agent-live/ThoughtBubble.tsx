'use client';

/**
 * Thought bubble rendered next to an agent.
 * Shows current task + animated dots + next step.
 * Uses SVG foreignObject for HTML text inside the track SVG.
 */

interface Props {
  x: number;
  y: number;
  currentTask: string | null;
  nextStep: string | null;
  isActive: boolean;
}

export function ThoughtBubble({ x, y, currentTask, nextStep, isActive }: Props) {
  if (!isActive && !currentTask) return null;

  const bubbleW = 160;
  const bubbleH = currentTask && nextStep ? 52 : 36;
  // Offset bubble above and to the right of the agent
  const bx = x + 20;
  const by = y - 55;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Connector dots (thought trail) */}
      <circle cx={x + 6} cy={y - 28} r={2} fill="var(--text-muted)" opacity={0.5} />
      <circle cx={x + 12} cy={y - 36} r={3} fill="var(--text-muted)" opacity={0.4} />

      {/* Bubble background */}
      <rect
        x={bx}
        y={by}
        width={bubbleW}
        height={bubbleH}
        rx={10}
        fill="var(--layer-2)"
        stroke="var(--border-bright)"
        strokeWidth={1}
        opacity={0.95}
      />

      {/* Content via foreignObject */}
      <foreignObject x={bx + 8} y={by + 4} width={bubbleW - 16} height={bubbleH - 8}>
        <div style={{ fontFamily: 'var(--font-mono)', lineHeight: 1.3 }}>
          {currentTask ? (
            <p style={{ margin: 0, fontSize: 9, color: 'var(--text-primary)', fontWeight: 600 }}>
              {currentTask.length > 40 ? currentTask.slice(0, 38) + '…' : currentTask}
            </p>
          ) : (
            <p style={{ margin: 0, fontSize: 9, color: 'var(--text-muted)' }}>
              Warte auf Task
              <span className="thinking-dots" style={{ letterSpacing: 2 }}>
                <span style={{ animation: 'blink 1.4s 0s infinite' }}>.</span>
                <span style={{ animation: 'blink 1.4s 0.2s infinite' }}>.</span>
                <span style={{ animation: 'blink 1.4s 0.4s infinite' }}>.</span>
              </span>
            </p>
          )}
          {nextStep && (
            <p style={{ margin: '3px 0 0', fontSize: 8, color: 'var(--text-muted)' }}>
              → {nextStep.length > 45 ? nextStep.slice(0, 43) + '…' : nextStep}
            </p>
          )}
        </div>
      </foreignObject>
    </g>
  );
}
