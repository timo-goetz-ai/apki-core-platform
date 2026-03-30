'use client';

import { BarChart3, ExternalLink } from 'lucide-react';

const PANEL_URL = process.env.NEXT_PUBLIC_GRAFANA_EMBED_PANEL_URL ?? '';

/** Optional: öffentliches Grafana-Panel (d-solo) per Env einbinden — Auth über Grafana / SSO. */
export function GrafanaEmbedPanel() {
  if (!PANEL_URL) return null;

  return (
    <div className="overview-glass-panel overview-glitch-wrap" style={{ padding: 12, borderRadius: 12, marginBottom: 12, position: 'relative', overflow: 'hidden' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <BarChart3 size={12} style={{ color: 'var(--accent-amber)' }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)' }}>Grafana Panel</span>
        </div>
        <a
          href="https://grafana.automation-plus-ki.de"
          target="_blank"
          rel="noopener noreferrer"
          style={{ fontSize: 10, color: 'var(--text-muted)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}
        >
          Vollansicht <ExternalLink size={9} />
        </a>
      </div>
      <div style={{ borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--layer-1)' }}>
        <iframe
          title="Grafana embed"
          src={PANEL_URL}
          style={{ width: '100%', height: 220, border: 'none', display: 'block' }}
          sandbox="allow-same-origin allow-scripts allow-forms"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>
      <p style={{ margin: '6px 0 0', fontSize: 8, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
        NEXT_PUBLIC_GRAFANA_EMBED_PANEL_URL · kiosk / d-solo URL aus Grafana teilen
      </p>
    </div>
  );
}
