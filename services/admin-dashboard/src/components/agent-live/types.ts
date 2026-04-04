/** Agent Live Dashboard — Shared Types */

export interface TrackStation {
  id: string;
  label: string;
  icon: string;
  /** Normalised position on the track path (0–1) */
  t: number;
  color: string;
}

export type AgentStatus = 'idle' | 'working' | 'done' | 'error';

export interface AgentState {
  id: string;
  name: string;
  color: string;
  /** Current normalised position on the track (0–1) */
  trackPosition: number;
  /** Target position the agent is moving towards */
  targetPosition: number;
  status: AgentStatus;
  currentTask: string | null;
  nextStep: string | null;
  /** Station the agent is currently at or heading to */
  stationId: string;
}

export interface LiveDashboardData {
  agents: AgentState[];
  activeCount: number;
  completedToday: number;
  avgDurationSec: number;
}

/** The 5 stations on the ∞-track */
export const STATIONS: TrackStation[] = [
  { id: 'analyse',   label: 'Analyse',    icon: '📊', t: 0.00, color: 'var(--accent-blue)' },
  { id: 'research',  label: 'Research',   icon: '🔍', t: 0.20, color: 'var(--accent-purple)' },
  { id: 'uebergabe', label: 'Übergabe',   icon: '🔄', t: 0.50, color: 'var(--accent-amber)' },
  { id: 'content',   label: 'Content',    icon: '✍️',  t: 0.70, color: 'var(--accent-green)' },
  { id: 'export',    label: 'Export',     icon: '📤', t: 0.90, color: 'var(--accent-red)' },
];
