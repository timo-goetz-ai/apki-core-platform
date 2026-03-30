'use client';

import { useEffect, useState } from 'react';
import {
  BarChart2, RefreshCw, ExternalLink, AlertCircle, CheckCircle,
  Activity, Database, LayoutDashboard, Layers,
} from 'lucide-react';

interface GrafanaDashboard { id: number; title: string; url: string; tags: string[]; type: string }
interface PrometheusTarget { labels: { job: string; instance: string }; health: string; lastScrape: string; lastError?: string }
interface GrafanaData {
  dashboards: GrafanaDashboard[];
  plugins: Array<{ id: string; name: string; type: string; enabled: boolean }>;
  datasources?: Array<{ id: number; name: string; type: string; url: string; isDefault: boolean }>;
}
interface PrometheusData {
  targets: PrometheusTarget[];
  byJob?: Record<string, PrometheusTarget[]>;
}

const GRAFANA_URL = 'https://grafana.automation-plus-ki.de';

type Tab = 'overview' | 'dashboards' | 'prometheus' | 'datasources';

// ── Quick-link card ────────────────────────────────────────────────────────────
function QuickLink({ href, label, desc, color }: { href: string; label: string; desc: string; color: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        display: 'block', textDecoration: 'none', padding: '14px 16px',
        background: 'var(--layer-2)', border: '1px solid var(--border)',
        borderRadius: 10, transition: 'border-color 0.12s',
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = color + '55'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{label}</span>
        <ExternalLink size={11} style={{ color: 'var(--text-muted)' }} />
      </div>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)' }}>{desc}</p>
    </a>
  );
}

export default function AnalyticsPage() {
  const [tab, setTab]               = useState<Tab>('overview');
  const [grafana, setGrafana]       = useState<GrafanaData | null>(null);
  const [prom, setProm]             = useState<PrometheusData | null>(null);
  const [loading, setLoading]       = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    setRefreshing(true);
    const [g, p] = await Promise.allSettled([
      fetch('/api/monitoring/grafana').then(r => r.json()),
      fetch('/api/monitoring/prometheus').then(r => r.json()),
    ]);
    if (g.status === 'fulfilled') setGrafana(g.value);
    if (p.status === 'fulfilled') setProm(p.value);
    setLoading(false);
    setTimeout(() => setRefreshing(false), 600);
  };

  useEffect(() => { load(); }, []);

  const upTargets   = prom?.targets.filter(t => t.health === 'up').length ?? 0;
  const downTargets = prom?.targets.filter(t => t.health !== 'up').length ?? 0;
  const jobs        = Object.keys(prom?.byJob ?? {}).length;

  const TABS: { id: Tab; label: string }[] = [
    { id: 'overview',    label: 'Übersicht'    },
    { id: 'dashboards',  label: 'Dashboards'   },
    { id: 'prometheus',  label: 'Prometheus'   },
    { id: 'datasources', label: 'Datasources'  },
  ];

  return (
    <div style={{ padding: '24px 28px', maxWidth: 1400, margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <BarChart2 size={20} style={{ color: 'var(--accent-purple)' }} />
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>Analytics</h1>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              Grafana · Prometheus · {prom?.targets.length ?? '…'} Targets
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={load} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-secondary)', cursor: 'pointer', fontSize: 12,
          }}>
            <RefreshCw size={12} style={{ animation: refreshing ? 'spin 0.7s linear infinite' : 'none' }} />
            Refresh
          </button>
          <a href={GRAFANA_URL} target="_blank" rel="noopener noreferrer" style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8,
            background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)',
            color: 'var(--accent-amber)', fontSize: 12, fontWeight: 600, textDecoration: 'none',
          }}>
            Grafana öffnen <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Dashboards',   value: grafana?.dashboards.length ?? '…', color: 'var(--accent-amber)',              icon: <LayoutDashboard size={14} /> },
          { label: 'Targets UP',   value: upTargets || '…',                  color: 'var(--accent-green)',              icon: <CheckCircle size={14} /> },
          { label: 'Targets DOWN', value: downTargets,                        color: downTargets > 0 ? 'var(--accent-red)' : 'var(--text-muted)', icon: <AlertCircle size={14} /> },
          { label: 'Jobs',         value: jobs || '…',                        color: 'var(--accent-purple)',              icon: <Activity size={14} /> },
        ].map(stat => (
          <div key={stat.label} style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 12, padding: '16px 20px',
            display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <span style={{ color: stat.color, opacity: 0.8 }}>{stat.icon}</span>
            <div>
              <p style={{ margin: 0, fontSize: 24, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color, lineHeight: 1 }}>
                {loading ? '…' : stat.value}
              </p>
              <p style={{ margin: 0, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 3 }}>
                {stat.label}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 2, marginBottom: 20, borderBottom: '1px solid var(--border)' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{
            padding: '8px 16px', fontSize: 12, fontWeight: 500, cursor: 'pointer',
            background: 'none', border: 'none',
            borderBottom: `2px solid ${tab === t.id ? 'var(--accent-purple)' : 'transparent'}`,
            color: tab === t.id ? 'var(--accent-purple)' : 'var(--text-muted)',
            transition: 'all 0.12s', marginBottom: -1,
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

          {/* Grafana access card — native, no iFrame */}
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9,
                background: 'rgba(249,115,22,0.1)', border: '1px solid rgba(249,115,22,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <BarChart2 size={16} style={{ color: 'var(--accent-amber)' }} />
              </div>
              <div>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>Grafana</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  {grafana?.dashboards.length ?? '…'} Dashboards · {grafana?.plugins.length ?? '…'} Plugins
                </p>
              </div>
              <a
                href={GRAFANA_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5,
                  padding: '6px 12px', borderRadius: 7,
                  background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.2)',
                  color: 'var(--accent-amber)', fontSize: 11, fontWeight: 600, textDecoration: 'none',
                }}
              >
                Öffnen <ExternalLink size={10} />
              </a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Grafana Home',      url: GRAFANA_URL,                          desc: 'Dashboard-Übersicht'       },
                { label: 'Explore (PromQL)',  url: `${GRAFANA_URL}/explore`,             desc: 'Metriken & Log-Abfragen'   },
                { label: 'Alerting',          url: `${GRAFANA_URL}/alerting`,            desc: 'Alert-Regeln & Status'     },
                { label: 'Datasources',       url: `${GRAFANA_URL}/connections/datasources`, desc: 'Datenquellen-Verwaltung' },
              ].map(link => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--layer-1)', border: '1px solid var(--border)',
                    textDecoration: 'none', transition: 'border-color 0.1s',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'rgba(249,115,22,0.3)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.borderColor = 'var(--border)'; }}
                >
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-primary)' }}>{link.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{link.desc}</span>
                  </div>
                  <ExternalLink size={10} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                </a>
              ))}
            </div>
          </div>

          {/* Prometheus jobs */}
          <div style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 12, padding: '20px 24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <Activity size={14} style={{ color: 'var(--accent-purple)' }} />
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
                Prometheus Jobs
              </p>
              <a
                href="https://prometheus.automation-plus-ki.de"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)',
                  textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                UI öffnen <ExternalLink size={10} />
              </a>
            </div>
            {loading ? (
              <div style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Lade…</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {Object.entries(prom?.byJob ?? {}).slice(0, 14).map(([job, targets]) => {
                  const up    = targets.filter(t => t.health === 'up').length;
                  const total = targets.length;
                  const allUp = up === total;
                  return (
                    <div key={job} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '6px 10px', borderRadius: 7,
                      background: allUp ? 'rgba(52,211,153,0.04)' : 'rgba(248,113,113,0.04)',
                    }}>
                      <span style={{
                        width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                        background: allUp ? 'var(--accent-green)' : 'var(--accent-red)',
                        boxShadow: allUp ? '0 0 4px var(--accent-green)80' : 'none',
                      }} />
                      <span style={{
                        flex: 1, fontSize: 11, fontFamily: 'var(--font-mono)',
                        color: 'var(--text-secondary)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {job}
                      </span>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        color: allUp ? 'var(--accent-green)' : 'var(--accent-red)', flexShrink: 0,
                      }}>
                        {up}/{total}
                      </span>
                    </div>
                  );
                })}
                {Object.keys(prom?.byJob ?? {}).length === 0 && (
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    Keine Prometheus-Daten verfügbar.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Dashboards ── */}
      {tab === 'dashboards' && (
        <div>
          <div style={{ marginBottom: 14 }}>
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>
              {grafana?.dashboards.length ?? 0} Dashboards · direkt in Grafana öffnen
            </p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} style={{ height: 90, borderRadius: 10, background: 'var(--layer-2)', border: '1px solid var(--border)' }} />
              ))
            ) : grafana?.dashboards.map(db => (
              <a key={db.id} href={`${GRAFANA_URL}${db.url}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
                <div
                  style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'all 0.12s' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(249,115,22,0.35)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(249,115,22,0.03)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)'; (e.currentTarget as HTMLDivElement).style.background = 'var(--layer-2)'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', lineHeight: 1.4 }}>{db.title}</p>
                    <ExternalLink size={11} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                    {db.tags.slice(0, 4).map(tag => (
                      <span key={tag} style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: 'rgba(249,115,22,0.1)', color: 'var(--accent-amber)', border: '1px solid rgba(249,115,22,0.18)' }}>{tag}</span>
                    ))}
                  </div>
                </div>
              </a>
            ))}
            {!loading && !grafana?.dashboards.length && (
              <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
                Keine Dashboards — Grafana-Auth erforderlich.
              </p>
            )}
          </div>
        </div>
      )}

      {/* ── Prometheus ── */}
      {tab === 'prometheus' && (
        <div>
          {loading ? (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Lade…</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {prom?.targets.map((target, i) => {
                const isUp = target.health === 'up';
                return (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '8px 12px', borderRadius: 8,
                    background: 'var(--layer-2)', border: '1px solid var(--border)',
                  }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, background: isUp ? 'var(--accent-green)' : 'var(--accent-red)', boxShadow: isUp ? '0 0 4px var(--accent-green)80' : 'none' }} />
                    <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)', flex: 1 }}>{target.labels.job}</span>
                    <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', flex: 2 }}>{target.labels.instance}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isUp ? 'var(--accent-green)' : 'var(--accent-red)' }}>{target.health}</span>
                    {target.lastError && (
                      <span style={{ fontSize: 9, color: 'var(--accent-red)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{target.lastError}</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Datasources ── */}
      {tab === 'datasources' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} style={{ height: 80, borderRadius: 10, background: 'var(--layer-2)', border: '1px solid var(--border)' }} />
            ))
          ) : grafana?.datasources?.map(ds => (
            <div key={ds.id} style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Database size={13} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{ds.name}</span>
                {ds.isDefault && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 3, background: 'rgba(167,139,250,0.15)', color: 'var(--accent-purple)' }}>DEFAULT</span>}
              </div>
              <p style={{ margin: '6px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{ds.type}</p>
              {ds.url && <p style={{ margin: '2px 0 0', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ds.url}</p>}
            </div>
          ))}
          {!loading && !grafana?.datasources?.length && (
            <p style={{ color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>Keine Datasources.</p>
          )}
        </div>
      )}

      {/* ── Quick links (always visible at bottom of overview) ── */}
      {tab === 'overview' && (
        <div style={{ marginTop: 20 }}>
          <p style={{ margin: '0 0 10px', fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.09em' }}>
            Weitere Monitoring-Tools
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
            <QuickLink href="https://prometheus.automation-plus-ki.de/targets" label="Prometheus Targets" desc="Health-Status aller Scrape-Ziele" color="var(--accent-amber)" />
            <QuickLink href="https://alertmanager.automation-plus-ki.de" label="Alertmanager" desc="Alert Routing & Silences" color="var(--accent-red)" />
            <QuickLink href={`${GRAFANA_URL}/explore`} label="Grafana Explore" desc="PromQL & Loki Log-Abfragen" color="var(--accent-purple)" />
          </div>
        </div>
      )}
    </div>
  );
}
