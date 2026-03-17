'use client';

import { ExternalLink, Sun, Moon, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';

const EXTERNAL_TOOLS = [
  { label: 'Coolify',     href: 'https://coolify.automation-plus-ki.de',    desc: 'Deployment & Container Management' },
  { label: 'Authentik',   href: 'https://auth.automation-plus-ki.de',        desc: 'SSO & Identity Provider' },
  { label: 'Grafana',     href: 'https://grafana.automation-plus-ki.de',     desc: 'Monitoring & Dashboards' },
  { label: 'Prometheus',  href: 'https://prometheus.automation-plus-ki.de',  desc: 'Metriken & Alerting' },
  { label: 'NocoDB',      href: 'https://nocodb.automation-plus-ki.de',      desc: 'Datenbank UI' },
  { label: 'n8n',         href: 'https://n8n.automation-plus-ki.de',         desc: 'Workflow Automation' },
  { label: 'Qdrant',      href: 'https://qdrant.automation-plus-ki.de',      desc: 'Vector Database' },
  { label: 'Mailpit',     href: 'https://mail.automation-plus-ki.de',        desc: 'SMTP Testing' },
];

const API_CONNECTIONS = [
  { key: 'openrouter', label: 'OpenRouter',    envVar: 'OPENROUTER_API_KEY',  desc: 'Free-Tier Modelle' },
  { key: 'anthropic',  label: 'Anthropic',     envVar: 'ANTHROPIC_API_KEY',   desc: 'Claude-Abo direkt' },
  { key: 'google',     label: 'Google AI Studio', envVar: 'GOOGLE_AI_API_KEY', desc: 'Gemini direkt' },
  { key: 'n8n',        label: 'n8n API',       envVar: 'N8N_API_KEY',         desc: 'Workflow-Automatisierung' },
  { key: 'nocodb',     label: 'NocoDB',        envVar: 'NOCODB_API_TOKEN',    desc: 'Datenbank-Backend' },
  { key: 'coolify',    label: 'Coolify',       envVar: 'COOLIFY_API_KEY',     desc: 'Deployment-Plattform' },
  { key: 'cloudflare', label: 'Cloudflare',    envVar: 'CLOUDFLARE_API_TOKEN', desc: 'DNS & Routing' },
];

type ConfigStatus = Record<string, boolean>;

export default function SettingsPage() {
  const { model, setModel } = useLLM();
  const [isDark, setIsDark] = useState(true);
  const [configStatus, setConfigStatus] = useState<ConfigStatus | null>(null);
  const [configLoading, setConfigLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDark(saved !== 'light');
  }, []);

  async function loadConfigStatus() {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) setConfigStatus(await res.json());
    } catch {
      // silently fail
    } finally {
      setConfigLoading(false);
    }
  }

  useEffect(() => { loadConfigStatus(); }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight mb-1.5 flex items-center gap-2.5">
          <span className="text-2xl">⚙️</span> Settings
        </h1>
        <p className="text-sm text-slate-400">Einstellungen und externe Tools</p>
      </div>

      <div className="grid gap-5 max-w-2xl">
        {/* LLM Model */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-100 mb-3">Standard LLM-Modell</p>
          <div className="grid gap-1.5">
            {LLM_MODELS.map((m) => (
              <button
                key={m.id}
                onClick={() => setModel(m.id)}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left ${
                  m.id === model
                    ? 'bg-blue-500/15 border border-blue-500/30 text-blue-300'
                    : 'bg-slate-800 border border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100'
                }`}
              >
                <span className="font-medium">{m.label}</span>
                <span className={`text-xs ${m.id === model ? 'text-blue-500' : 'text-slate-500'}`}>{m.provider}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Theme */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-100 mb-3">Erscheinungsbild</p>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-700/50 text-slate-300 hover:bg-slate-700 hover:text-slate-100 transition-colors"
          >
            {isDark ? <Moon size={14} className="text-blue-400" /> : <Sun size={14} className="text-amber-400" />}
            <span className="text-sm">{isDark ? 'Dark Mode aktiv' : 'Light Mode aktiv'}</span>
          </button>
        </div>

        {/* API Verbindungen */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-100">API Verbindungen</p>
            <button
              onClick={loadConfigStatus}
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                padding: '4px 8px', borderRadius: 6, fontSize: 11,
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.08)',
                color: '#94a3b8', cursor: 'pointer',
              }}
            >
              <RefreshCw size={11} />
              Prüfen
            </button>
          </div>
          <div className="grid gap-1.5">
            {API_CONNECTIONS.map(conn => {
              const configured = configStatus?.[conn.key];
              return (
                <div
                  key={conn.key}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '10px 12px', borderRadius: 8,
                    background: 'rgba(15,22,36,0.6)',
                    border: '1px solid rgba(45,55,72,0.6)',
                  }}
                >
                  <div>
                    <p style={{ margin: 0, fontSize: 13, fontWeight: 500, color: '#f1f5f9' }}>{conn.label}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 11, color: '#64748b' }}>
                      <span style={{ fontFamily: 'monospace', color: '#475569' }}>{conn.envVar}</span>
                      <span style={{ marginLeft: 6 }}>· {conn.desc}</span>
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexShrink: 0 }}>
                    {configLoading ? (
                      <span style={{ fontSize: 11, color: '#64748b' }}>…</span>
                    ) : configured ? (
                      <>
                        <CheckCircle2 size={14} color="#22c55e" />
                        <span style={{ fontSize: 11, color: '#22c55e' }}>Konfiguriert</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle size={14} color="#f59e0b" />
                        <span style={{ fontSize: 11, color: '#f59e0b' }}>Nicht gesetzt</span>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* External tools */}
        <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700/50 rounded-xl p-5">
          <p className="text-sm font-semibold text-slate-100 mb-3">Externe Admin-Tools</p>
          <div className="grid gap-1.5">
            {EXTERNAL_TOOLS.map((tool) => (
              <a
                key={tool.label}
                href={tool.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700/50 hover:bg-slate-700 hover:border-slate-600 transition-colors no-underline group"
              >
                <div>
                  <p className="text-sm font-medium text-slate-200 m-0">{tool.label}</p>
                  <p className="text-xs text-slate-500 m-0 mt-0.5">{tool.desc}</p>
                </div>
                <ExternalLink size={13} className="text-slate-600 group-hover:text-slate-400 transition-colors flex-shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
