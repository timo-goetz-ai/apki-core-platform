'use client';

import { useState } from 'react';
import { Container, RefreshCw } from 'lucide-react';
import { DockerControlWidget } from '@/components/DockerControlWidget';

export default function ContainersPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  function handleRefresh() {
    setRefreshKey(k => k + 1);
    setLastUpdated(new Date());
  }

  return (
    <div style={{ padding: '24px 32px', minHeight: '100vh', fontFamily: 'var(--font-ui, inherit)' }}>
      {/* Header bar */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: 20,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <Container size={22} color="var(--accent-blue, #3b82f6)" />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary, #f1f5f9)' }}>
              Container · Docker
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-secondary, #94a3b8)' }}>
              Docker Container-Verwaltung und Monitoring
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 11, color: 'var(--text-secondary, #64748b)', fontFamily: 'var(--font-mono, monospace)' }}>
            Aktualisiert: {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
          <button
            onClick={handleRefresh}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '7px 12px', borderRadius: 8, fontSize: 12,
              background: 'var(--layer-2, #1e2535)',
              border: '1px solid var(--border, #2d3748)',
              color: 'var(--text-secondary, #94a3b8)', cursor: 'pointer',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'var(--layer-3, #2a3347)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'var(--layer-2, #1e2535)')}
          >
            <RefreshCw size={13} />
            Aktualisieren
          </button>
        </div>
      </div>

      {/* Docker Widget — full width */}
      <div key={refreshKey} style={{ width: '100%' }}>
        <DockerControlWidget />
      </div>
    </div>
  );
}
