'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';
import type { AgentState, LiveDashboardData } from '@/components/agent-live/types';

const CREWS_POLL_MS = 10_000;
const WORKFLOWS_POLL_MS = 30_000;

/** Agent colours by crew type / workflow group */
const AGENT_COLORS: Record<string, string> = {
  content: 'var(--accent-purple)',
  research: 'var(--accent-blue)',
  niche: 'var(--accent-green)',
  forecast: 'var(--accent-amber)',
  multichannel: 'var(--accent-red)',
  red_team: '#f87171',
  market: 'var(--accent-blue)',
  director: 'var(--accent-amber)',
  quick: 'var(--accent-green)',
  xai: '#a78bfa',
};

function colorForCrew(id: string): string {
  for (const [key, color] of Object.entries(AGENT_COLORS)) {
    if (id.includes(key)) return color;
  }
  return 'var(--accent-blue)';
}

/** Map a crew index to a base track position so idle agents spread along the track */
function idlePosition(index: number, total: number): number {
  if (total <= 1) return 0;
  return (index / total) % 1;
}

/** Map station IDs to track t-values */
const STATION_T: Record<string, number> = {
  analyse: 0.0,
  research: 0.2,
  uebergabe: 0.5,
  content: 0.7,
  export: 0.9,
};

function stationForCrew(id: string): string {
  if (/research|niche|forecast|market|deep/.test(id)) return 'research';
  if (/content|multichannel|xai/.test(id)) return 'content';
  if (/red_team|director/.test(id)) return 'analyse';
  return 'uebergabe';
}

interface CrewData {
  id: string;
  name: string;
  agents: number;
  tasks: number;
}

export function useAgentLiveData(): LiveDashboardData {
  const [agents, setAgents] = useState<AgentState[]>([]);
  const [completedToday, setCompletedToday] = useState(0);
  const mountedRef = useRef(true);

  const fetchCrews = useCallback(async () => {
    try {
      const res = await fetch('/api/crews', { headers: { ...dashboardApiAuthHeaders() } });
      if (!res.ok) return;
      const data = await res.json();
      const crews: CrewData[] = data.crews ?? [];
      if (!mountedRef.current) return;

      setAgents(prev => {
        return crews.map((crew, i): AgentState => {
          const existing = prev.find(a => a.id === crew.id);
          const station = stationForCrew(crew.id);
          const baseT = STATION_T[station] ?? idlePosition(i, crews.length);
          return {
            id: crew.id,
            name: crew.name.replace(/ Crew$/, ''),
            color: colorForCrew(crew.id),
            trackPosition: existing?.trackPosition ?? baseT,
            targetPosition: existing?.status === 'working'
              ? existing.targetPosition
              : baseT + (Math.sin(Date.now() / 8000 + i * 1.7) * 0.04), // gentle idle drift
            status: existing?.status ?? 'idle',
            currentTask: existing?.currentTask ?? null,
            nextStep: existing?.nextStep ?? null,
            stationId: station,
          };
        });
      });
      setCompletedToday(data.total_pieces ?? 0);
    } catch {
      // ignore
    }
  }, []);

  const fetchWorkflows = useCallback(async () => {
    try {
      const res = await fetch('/api/nocodb/workflows', { headers: { ...dashboardApiAuthHeaders() } });
      if (!res.ok) return;
      const data = await res.json();
      const workflows = data.list ?? [];
      // Count active scheduled workflows
      const activeScheduled = workflows.filter(
        (w: Record<string, unknown>) => w.Status === 'aktiv' && w.Schedule && w.Schedule !== 'on_demand'
      ).length;
      void activeScheduled; // available for future use
    } catch {
      // ignore
    }
  }, []);

  // Idle animation — slowly move idle agents
  useEffect(() => {
    const id = setInterval(() => {
      if (!mountedRef.current) return;
      setAgents(prev =>
        prev.map((a, i) => {
          if (a.status === 'working') return a;
          const station = STATION_T[a.stationId] ?? 0;
          return {
            ...a,
            targetPosition: station + Math.sin(Date.now() / 8000 + i * 1.7) * 0.04,
          };
        })
      );
    }, 2000);
    return () => clearInterval(id);
  }, []);

  // Polling
  useEffect(() => {
    mountedRef.current = true;
    fetchCrews();
    fetchWorkflows();
    const crewsId = setInterval(fetchCrews, CREWS_POLL_MS);
    const wfId = setInterval(fetchWorkflows, WORKFLOWS_POLL_MS);
    return () => {
      mountedRef.current = false;
      clearInterval(crewsId);
      clearInterval(wfId);
    };
  }, [fetchCrews, fetchWorkflows]);

  const activeCount = agents.filter(a => a.status === 'working').length;

  return {
    agents,
    activeCount,
    completedToday,
    avgDurationSec: completedToday > 0 ? 2.3 : 0,
  };
}
