'use client';

import { ExternalLink, Sun, Moon } from 'lucide-react';
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

export default function SettingsPage() {
  const { model, setModel } = useLLM();
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    setIsDark(saved !== 'light');
  }, []);

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
