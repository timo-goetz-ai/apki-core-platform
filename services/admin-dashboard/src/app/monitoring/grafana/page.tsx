'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Puzzle, Bell, ExternalLink, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';

const GRAFANA_URL = 'https://grafana.automation-plus-ki.de';

type Tab = 'dashboards' | 'plugins' | 'prometheus';

interface GrafanaPlugin { id: string; name: string; type: string; enabled: boolean; info?: { version: string; author?: { name: string } } }
interface GrafanaDashboard { id: number; title: string; url: string; tags: string[]; type: string }
interface PrometheusTarget { labels: { job: string; instance: string }; health: string; lastScrape: string; lastError?: string }

export default function GrafanaPage() {
  const [tab, setTab] = useState<Tab>('dashboards');
  const [grafanaData, setGrafanaData] = useState<{ plugins: GrafanaPlugin[]; dashboards: GrafanaDashboard[]; alerts: unknown[] } | null>(null);
  const [promData, setPromData] = useState<{ targets: PrometheusTarget[]; alerts: unknown[]; up: unknown[] } | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [g, p] = await Promise.allSettled([
      fetch('/api/monitoring/grafana').then(r => r.json()),
      fetch('/api/monitoring/prometheus').then(r => r.json()),
    ]);
    if (g.status === 'fulfilled') setGrafanaData(g.value);
    if (p.status === 'fulfilled') setPromData(p.value);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const panel: React.CSSProperties = {
    background: 'var(--layer-1)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '16px 20px',
  };

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboards', label: 'Dashboards', icon: <BarChart3 size={14} /> },
    { id: 'plugins', label: `Plugins${grafanaData ? ` (${grafanaData.plugins.length})` : ''}`, icon: <Puzzle size={14} /> },
    { id: 'prometheus', label: `Prometheus${promData ? ` · ${promData.targets.length} Targets` : ''}`, icon: <Bell size={14} /> },
  ];

  return (
    <div style={{ padding: '24px 32px', fontFamily: 'var(--font-ui)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ color: 'var(--text-primary)', fontSize: 22, fontWeight: 600, margin: 0 }}>Grafana · Monitoring</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: 13, margin: '4px 0 0' }}>
            {grafanaData?.plugins.length ?? '–'} Plugins · {grafanaData?.dashboards.length ?? '–'} Dashboards · {promData?.targets.length ?? '–'} Prometheus Targets
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={load} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 13 }}>
            <RefreshCw size={13} /> Reload
          </button>
          <a href={GRAFANA_URL} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: 'var(--accent-blue)', color: '#fff', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>
            <ExternalLink size={13} /> Grafana öffnen
          </a>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid var(--border)', paddingBottom: 0 }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: '8px 8px 0 0',
            background: tab === t.id ? 'var(--layer-2)' : 'transparent',
            border: tab === t.id ? '1px solid var(--border)' : '1px solid transparent',
            borderBottom: tab === t.id ? '1px solid var(--layer-2)' : '1px solid transparent',
            color: tab === t.id ? 'var(--text-primary)' : 'var(--text-muted)',
            cursor: 'pointer', fontSize: 13, fontWeight: tab === t.id ? 500 : 400,
            marginBottom: -1,
          }}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ color: 'var(--text-muted)', textAlign: 'center', padding: 40 }}>Lade Daten…</div>}

      {/* Dashboards tab */}
      {!loading && tab === 'dashboards' && (
        <div>
          {/* Grafana iframe */}
          <div style={{ ...panel, marginBottom: 20, padding: 0, overflow: 'hidden', height: 500 }}>
            <iframe src={GRAFANA_URL} style={{ width: '100%', height: '100%', border: 'none' }} title="Grafana" />
          </div>
          {/* Dashboard list */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {(grafanaData?.dashboards ?? []).map(d => (
              <a key={d.id} href={`${GRAFANA_URL}${d.url}`} target="_blank" rel="noopener noreferrer" style={{ ...panel, textDecoration: 'none', display: 'block', transition: 'border-color 0.15s' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, marginBottom: 6 }}>{d.title}</div>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {d.tags.map(tag => (
                    <span key={tag} style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: 'var(--layer-3)', color: 'var(--text-muted)' }}>{tag}</span>
                  ))}
                </div>
              </a>
            ))}
            {(grafanaData?.dashboards ?? []).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Keine Dashboards gefunden (Grafana-Auth erforderlich)</div>
            )}
          </div>
        </div>
      )}

      {/* Plugins tab */}
      {!loading && tab === 'plugins' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10 }}>
            {(grafanaData?.plugins ?? []).map(p => (
              <div key={p.id} style={{ ...panel, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--layer-3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Puzzle size={14} style={{ color: 'var(--accent-blue)' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 11, marginTop: 2 }}>{p.type} · v{p.info?.version ?? '?'}</div>
                </div>
                <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(52,211,153,0.15)', color: 'var(--accent-green)', flexShrink: 0 }}>aktiv</span>
              </div>
            ))}
            {(grafanaData?.plugins ?? []).length === 0 && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, gridColumn: '1/-1' }}>
                Keine Plugins geladen — Grafana benötigt evtl. Auth für diese Ansicht.<br/>
                <a href={`${GRAFANA_URL}/plugins`} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                  Plugins direkt in Grafana ansehen →
                </a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Prometheus tab */}
      {!loading && tab === 'prometheus' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {[
              { label: 'Targets gesamt', value: promData?.targets.length ?? 0, color: 'var(--accent-blue)' },
              { label: 'Targets up', value: promData?.targets.filter(t => t.health === 'up').length ?? 0, color: 'var(--accent-green)' },
              { label: 'Targets down', value: promData?.targets.filter(t => t.health !== 'up').length ?? 0, color: 'var(--accent-red)' },
              { label: 'Aktive Alerts', value: (promData?.alerts as Array<{state: string}>)?.filter(a => a.state === 'firing').length ?? 0, color: 'var(--accent-amber)' },
            ].map(card => (
              <div key={card.label} style={{ ...panel, textAlign: 'center' }}>
                <div style={{ fontSize: 28, fontWeight: 700, color: card.color, fontFamily: 'var(--font-mono)' }}>{card.value}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{card.label}</div>
              </div>
            ))}
          </div>

          {/* Targets list */}
          <div style={{ ...panel }}>
            <h3 style={{ color: 'var(--text-primary)', fontSize: 14, fontWeight: 600, margin: '0 0 12px' }}>Scrape Targets</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {(promData?.targets ?? []).map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--layer-2)' }}>
                  {t.health === 'up'
                    ? <CheckCircle size={14} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
                    : <AlertCircle size={14} style={{ color: 'var(--accent-red)', flexShrink: 0 }} />}
                  <span style={{ color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-mono)', flex: 1 }}>{t.labels.job}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>{t.labels.instance}</span>
                  <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4,
                    background: t.health === 'up' ? 'rgba(52,211,153,0.12)' : 'rgba(248,113,113,0.12)',
                    color: t.health === 'up' ? 'var(--accent-green)' : 'var(--accent-red)' }}>
                    {t.health}
                  </span>
                </div>
              ))}
              {(promData?.targets ?? []).length === 0 && (
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>
                  Keine Targets geladen.{' '}
                  <a href="https://prometheus.automation-plus-ki.de/targets" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent-blue)' }}>
                    Prometheus öffnen →
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Quick links */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            {[
              { label: 'Prometheus UI', url: 'https://prometheus.automation-plus-ki.de', desc: 'Metrics Explorer & Queries' },
              { label: 'Alertmanager', url: 'https://alertmanager.automation-plus-ki.de', desc: 'Alert Routing & Silences' },
              { label: 'Grafana Explore', url: `${GRAFANA_URL}/explore`, desc: 'Loki Logs & PromQL' },
            ].map(link => (
              <a key={link.url} href={link.url} target="_blank" rel="noopener noreferrer" style={{ ...panel, textDecoration: 'none', display: 'block' }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'var(--accent-blue)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border)')}>
                <div style={{ color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, marginBottom: 4 }}>{link.label} ↗</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 12 }}>{link.desc}</div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
