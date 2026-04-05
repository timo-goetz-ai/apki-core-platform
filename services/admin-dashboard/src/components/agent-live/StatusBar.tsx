'use client';

import { Activity, CheckCircle, Clock } from 'lucide-react';
import type { AgentState } from './types';

interface Props {
  agents: AgentState[];
  completedToday: number;
  avgDurationSec: number;
}

export function StatusBar({ agents, completedToday, avgDurationSec }: Props) {
  const active = agents.filter(a => a.status === 'working').length;

  return (
    <div
      style={{
        background: 'var(--layer-1)',
        borderTop: '1px solid var(--border)',
        padding: '10px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Agent badges */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {agents.map(agent => {
            const isWorking = agent.status === 'working';
            return (
              <div
                key={agent.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  background: 'var(--layer-2)',
                  borderRadius: 6,
                  padding: '4px 10px 4px 8px',
                  border: `1px solid ${isWorking ? 'var(--accent-blue)' : 'var(--border)'}`,
                }}
              >
                <span
                  className={isWorking ? 'pulsing-dot' : ''}
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: isWorking ? 'var(--accent-green)' : 'var(--text-muted)',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                  {agent.name}
                </span>
                <span
                  style={{
                    fontSize: 9,
                    padding: '1px 5px',
                    borderRadius: 4,
                    background: isWorking ? 'rgba(56,189,248,0.1)' : 'var(--layer-3)',
                    color: isWorking ? 'var(--accent-blue)' : 'var(--text-muted)',
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 500,
                  }}
                >
                  {agent.status === 'working' ? 'aktiv' : agent.status === 'done' ? 'fertig' : 'idle'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Activity size={13} style={{ color: 'var(--accent-blue)' }} />
            Aktiv: <span style={{ color: 'var(--accent-blue)', fontWeight: 600 }}>{active}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={13} style={{ color: 'var(--accent-green)' }} />
            Erledigt: <span style={{ color: 'var(--accent-green)', fontWeight: 600 }}>{completedToday}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} style={{ color: 'var(--text-muted)' }} />
            Ø: <span style={{ fontWeight: 600 }}>{avgDurationSec.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
