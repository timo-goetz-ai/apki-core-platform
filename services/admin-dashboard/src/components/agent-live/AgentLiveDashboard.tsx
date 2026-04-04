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
          padding: '16px 24px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--layer-1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Bot size={20} style={{ color: 'var(--accent-blue)' }} />
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)' }}>
            Agent Live Monitor
          </h1>
          <span
            style={{
              fontSize: 10,
              fontFamily: 'var(--font-mono)',
              color: 'var(--accent-green)',
              background: 'rgba(52,211,153,0.1)',
              padding: '2px 8px',
              borderRadius: 10,
              fontWeight: 600,
            }}
          >
            <span className="live-dot" style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'var(--accent-green)', marginRight: 5 }} />
            LIVE
          </span>
        </div>
        <div style={{ display: 'flex', gap: 16, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <span>{agents.length} Agents geladen</span>
          <span>{activeCount} aktiv</span>
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

      {/* Blink animation for thought dots */}
      <style>{`
        @keyframes blink {
          0%, 20% { opacity: 0; }
          50% { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
