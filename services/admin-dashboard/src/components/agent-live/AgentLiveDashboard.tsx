'use client';

import { Bot } from 'lucide-react';
import { InfinityTrack } from './InfinityTrack';
import { AgentOnTrack } from './AgentOnTrack';
import { StatusBar } from './StatusBar';
import { useAgentLiveData } from '@/hooks/useAgentLiveData';

export function AgentLiveDashboard() {
  const { agents, completedToday, avgDurationSec, activeCount } = useAgentLiveData();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: 'var(--layer-0)' }}>
      {/* Header */}
      <div
        style={{
          padding: '14px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--layer-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Bot size={18} style={{ color: 'var(--accent-blue)' }} />
          <h1 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)' }}>
            Agent Live Monitor
          </h1>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-green)',
              background: 'rgba(52,211,153,0.08)',
              padding: '2px 8px',
              borderRadius: 4,
              fontWeight: 500,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            <span className="pulsing-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent-green)' }} />
            LIVE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span><strong style={{ color: 'var(--text-secondary)' }}>{agents.length}</strong> Agents</span>
          <span><strong style={{ color: 'var(--accent-blue)' }}>{activeCount}</strong> aktiv</span>
        </div>
      </div>

      {/* Track area */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', padding: 16 }}>
        <InfinityTrack>
          {agents.map(agent => (
            <AgentOnTrack key={agent.id} agent={agent} />
          ))}
        </InfinityTrack>
      </div>

      {/* Status bar */}
      <StatusBar agents={agents} completedToday={completedToday} avgDurationSec={avgDurationSec} />
    </div>
  );
}
