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
        background: 'rgba(0,0,0,0.5)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid var(--border)',
        padding: '12px 24px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        {/* Agent badges */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {agents.map(agent => (
            <div
              key={agent.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: 'var(--layer-2)',
                borderRadius: 20,
                padding: '5px 14px 5px 10px',
                border: `1px solid ${agent.status === 'working' ? agent.color : 'var(--border)'}`,
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: agent.status === 'working' ? agent.color : 'var(--text-muted)',
                  boxShadow: agent.status === 'working' ? `0 0 8px ${agent.color}` : 'none',
                  transition: 'all 0.3s',
                }}
              />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
                {agent.name}
              </span>
              <span
                style={{
                  fontSize: 9,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: agent.status === 'working' ? `${agent.color}20` : 'var(--layer-3)',
                  color: agent.status === 'working' ? agent.color : 'var(--text-muted)',
                  fontFamily: 'var(--font-mono)',
                  fontWeight: 500,
                }}
              >
                {agent.status === 'working' ? 'aktiv' : agent.status === 'done' ? 'fertig' : 'idle'}
              </span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div style={{ display: 'flex', gap: 20, fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Activity size={13} style={{ color: 'var(--accent-blue)' }} />
            Aktiv: <span style={{ color: 'var(--accent-blue)', fontWeight: 700 }}>{active}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <CheckCircle size={13} style={{ color: 'var(--accent-green)' }} />
            Erledigt: <span style={{ color: 'var(--accent-green)', fontWeight: 700 }}>{completedToday}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <Clock size={13} style={{ color: 'var(--accent-amber)' }} />
            Ø: <span style={{ color: 'var(--accent-amber)', fontWeight: 700 }}>{avgDurationSec.toFixed(1)}s</span>
          </div>
        </div>
      </div>
    </div>
  );
}
