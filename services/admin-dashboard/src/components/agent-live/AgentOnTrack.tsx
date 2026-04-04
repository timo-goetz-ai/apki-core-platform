'use client';

import { useEffect, useRef, useState } from 'react';
import { AgentFigure } from './AgentFigure';
import { ThoughtBubble } from './ThoughtBubble';
import type { AgentState } from './types';
import { TRACK_PATH } from './InfinityTrack';

/**
 * Positions an agent along the ∞ track path using SVG getPointAtLength.
 * Smoothly interpolates between current and target position.
 */

interface Props {
  agent: AgentState;
}

function usePathPoint(pathD: string, t: number) {
  const pathRef = useRef<SVGPathElement | null>(null);
  const [point, setPoint] = useState({ x: 450, y: 200 });

  useEffect(() => {
    if (!pathRef.current) {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', pathD);
      svg.appendChild(path);
      document.body.appendChild(svg);
      svg.style.position = 'absolute';
      svg.style.width = '0';
      svg.style.height = '0';
      svg.style.overflow = 'hidden';
      pathRef.current = path;
    }
    const path = pathRef.current;
    const len = path.getTotalLength();
    const clamped = ((t % 1) + 1) % 1; // normalise to [0,1)
    const pt = path.getPointAtLength(clamped * len);
    setPoint({ x: pt.x, y: pt.y });
  }, [pathD, t]);

  // cleanup
  useEffect(() => {
    return () => {
      const path = pathRef.current;
      if (path?.parentElement?.parentElement) {
        path.parentElement.remove();
      }
      pathRef.current = null;
    };
  }, []);

  return point;
}

/** Smooth spring-like interpolation toward target */
function useSmooth(target: number, speed = 0.02) {
  const [value, setValue] = useState(target);
  const rafRef = useRef<number>(0);
  const currentRef = useRef(target);

  useEffect(() => {
    let running = true;
    const tick = () => {
      if (!running) return;
      const diff = target - currentRef.current;
      // Handle wrap-around on [0,1)
      const shortDiff = diff > 0.5 ? diff - 1 : diff < -0.5 ? diff + 1 : diff;
      currentRef.current += shortDiff * speed;
      // Normalise
      currentRef.current = ((currentRef.current % 1) + 1) % 1;
      setValue(currentRef.current);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      running = false;
      cancelAnimationFrame(rafRef.current);
    };
  }, [target, speed]);

  return value;
}

export function AgentOnTrack({ agent }: Props) {
  const smoothT = useSmooth(agent.targetPosition, agent.status === 'working' ? 0.015 : 0.005);
  const pos = usePathPoint(TRACK_PATH, smoothT);

  return (
    <>
      <AgentFigure
        name={agent.name}
        color={agent.color}
        isActive={agent.status === 'working'}
        x={pos.x}
        y={pos.y}
      />
      {(agent.status === 'working' || agent.currentTask) && (
        <ThoughtBubble
          x={pos.x}
          y={pos.y}
          currentTask={agent.currentTask}
          nextStep={agent.nextStep}
          isActive={agent.status === 'working'}
        />
      )}
    </>
  );
}
