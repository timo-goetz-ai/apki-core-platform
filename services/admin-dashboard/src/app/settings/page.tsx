'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ExternalLink, CheckCircle2, AlertCircle, RefreshCw, Sun, Moon,
  Cpu, Server, Plug, Mail, LayoutDashboard, Loader2,
} from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useLLM, LLM_MODELS } from '@/lib/llm-context';

// ── Data ──────────────────────────────────────────────────────────────────────

const AI_PROVIDERS = [
  { key: 'openrouter', label: 'OpenRouter',     envVar: 'OPENROUTER_API_KEY',   desc: 'Free-Tier + Paid Modelle', color: '#38bdf8' },
  { key: 'anthropic',  label: 'Anthropic',      envVar: 'ANTHROPIC_API_KEY',    desc: 'Claude Abo direkt',       color: '#a78bfa' },
  { key: 'google',     label: 'Google AI Studio', envVar: 'GOOGLE_AI_API_KEY',  desc: 'Gemini direkt',           color: '#34d399' },
];

const SERVICES = [
  { id: 'n8n',        label: 'n8n Workflows',   url: 'https://n8n.automation-plus-ki.de',         desc: 'Workflow Automation',    color: '#f97316' },
  { id: 'nocodb',     label: 'NocoDB',          url: 'https://nocodb.automation-plus-ki.de',      desc: 'Datenbank UI',           color: '#38bdf8' },
  { id: 'grafana',    label: 'Grafana',         url: 'https://grafana.automation-plus-ki.de',     desc: 'Monitoring & Dashboards',color: '#f97316' },
  { id: 'prometheus', label: 'Prometheus',      url: 'https://prometheus.automation-plus-ki.de',  desc: 'Metriken & Alerting',    color: '#e2574c' },
  { id: 'coolify',    label: 'Coolify',         url: 'https://coolify.automation-plus-ki.de',     desc: 'Deployment Plattform',   color: '#7c3aed' },
  { id: 'authentik',  label: 'Authentik SSO',   url: 'https://auth.automation-plus-ki.de',        desc: 'SSO & Identity Provider',color: '#34d399' },
  { id: 'qdrant',     label: 'Qdrant',          url: 'https://qdrant.automation-plus-ki.de',      desc: 'Vector Database',        color: '#a78bfa' },
  { id: 'mailpit',    label: 'Mailpit',         url: 'https://mail.automation-plus-ki.de',        desc: 'SMTP Catcher / Testing', color: '#34d399' },
  { id: 'traefik',    label: 'Traefik',         url: 'https://traefik.automation-plus-ki.de',     desc: 'Reverse Proxy',          color: '#38bdf8' },
];

const INTEGRATIONS = [
  { key: 'github',     label: 'GitHub',             envVar: 'GITHUB_TOKEN',          desc: 'Repository Stats & Ops',   icon: '🐙' },
  { key: 'telegram',   label: 'Telegram Bot',        envVar: 'TELEGRAM_BOT_TOKEN',    desc: 'Notifications & Alerts',   icon: '✈️' },
  { key: 'cloudflare', label: 'Cloudflare',          envVar: 'CLOUDFLARE_API_TOKEN',  desc: 'DNS & Tunnels',            icon: '☁️' },
  { key: 'n8n',        label: 'n8n API',             envVar: 'N8N_API_KEY',           desc: 'Workflow Automation',      icon: '⚙️' },
  { key: 'nocodb',     label: 'NocoDB',              envVar: 'NOCODB_API_TOKEN',      desc: 'Datenbank-Backend',        icon: '🗄️' },
  { key: 'coolify',    label: 'Coolify',             envVar: 'COOLIFY_API_KEY',       desc: 'Deployment-Plattform',     icon: '🚀' },
  { key: 's3',         label: 'Hetzner S3 Storage',  envVar: 'S3_ACCESS_KEY',         desc: 'Object Storage Bucket',    icon: '🪣' },
  { key: 'mailtrap',   label: 'Mailtrap / Mailpit',  envVar: 'MAILTRAP_API_TOKEN',    desc: 'E-Mail Testing & Sending', icon: '📧' },
  { key: 'picsart',    label: 'PicsArt AI',          envVar: 'PICSART_API_KEY',       desc: 'Bildgenerierung',          icon: '🎨' },
  { key: 'fishaudio',  label: 'Fish Audio',          envVar: 'FISHAUDIO_API_KEY',     desc: 'Text-to-Speech',           icon: '🔊' },
];

// ── Sub-Components ─────────────────────────────────────────────────────────────

function ConfigRow({
  label, envVar, desc, icon, configured, loading,
}: {
  label: string; envVar: string; desc: string; icon?: string; configured?: boolean; loading: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[--border] bg-[--layer-2] px-4 py-3">
      <div className="flex items-center gap-3">
        {icon && <span className="text-base leading-none">{icon}</span>}
        <div>
          <p className="text-sm font-medium text-[--text-primary]">{label}</p>
          <p className="text-[11px] text-[--text-muted] mt-0.5">
            <span className="font-mono text-[--text-muted]">{envVar}</span>
            <span className="mx-1.5">·</span>
            {desc}
          </p>
        </div>
      </div>
      <div className="shrink-0">
        {loading ? (
          <Loader2 size={13} className="animate-spin text-[--text-muted]" />
        ) : configured ? (
          <Badge variant="success" className="gap-1">
            <CheckCircle2 size={10} />
            Konfiguriert
          </Badge>
        ) : (
          <Badge variant="warning" className="gap-1">
            <AlertCircle size={10} />
            Nicht gesetzt
          </Badge>
        )}
      </div>
    </div>
  );
}

function ServiceRow({ service, status, pinging }: {
  service: typeof SERVICES[0];
  status?: 'online' | 'offline' | 'unknown';
  pinging: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-[--border] bg-[--layer-2] px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{
            background: status === 'online' ? 'var(--accent-green)' : status === 'offline' ? 'var(--accent-red)' : 'var(--text-muted)',
            boxShadow: status === 'online' ? '0 0 6px var(--accent-green)' : 'none',
          }}
        />
        <div>
          <p className="text-sm font-medium text-[--text-primary]">{service.label}</p>
          <p className="text-[11px] text-[--text-muted] font-mono mt-0.5">{service.url}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {pinging ? (
          <Loader2 size={12} className="animate-spin text-[--text-muted]" />
        ) : status === 'online' ? (
          <Badge variant="success">Online</Badge>
        ) : status === 'offline' ? (
          <Badge variant="destructive">Offline</Badge>
        ) : (
          <Badge variant="secondary">Unbekannt</Badge>
        )}
        <a href={service.url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-7 w-7 text-[--text-muted] hover:text-[--text-primary]">
            <ExternalLink size={12} />
          </Button>
        </a>
      </div>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { model, setModel } = useLLM();
  const [isDark, setIsDark] = useState(true);
  const [configStatus, setConfigStatus] = useState<Record<string, boolean> | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [serviceStatus, setServiceStatus] = useState<Record<string, 'online' | 'offline' | 'unknown'>>({});
  const [servicePinging, setServicePinging] = useState(false);

  useEffect(() => {
    setIsDark(localStorage.getItem('theme') !== 'light');
  }, []);

  const loadConfigStatus = useCallback(async () => {
    setConfigLoading(true);
    try {
      const res = await fetch('/api/config-status');
      if (res.ok) setConfigStatus(await res.json());
    } catch { /* silent */ }
    finally { setConfigLoading(false); }
  }, []);

  const pingServices = useCallback(async () => {
    setServicePinging(true);
    try {
      const res = await fetch('/api/services');
      if (res.ok) {
        const data = await res.json();
        const mapped: Record<string, 'online' | 'offline' | 'unknown'> = {};
        for (const [k, v] of Object.entries(data)) {
          mapped[k] = (v as { status: string }).status === 'online' ? 'online' : 'offline';
        }
        setServiceStatus(mapped);
      }
    } catch { /* silent */ }
    finally { setServicePinging(false); }
  }, []);

  useEffect(() => { loadConfigStatus(); pingServices(); }, [loadConfigStatus, pingServices]);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    localStorage.setItem('theme', next ? 'dark' : 'light');
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div>
        <h1 className="text-xl font-bold text-[--text-primary]">Einstellungen</h1>
        <p className="mt-1 text-sm text-[--text-muted]">API-Keys, Services, Integrationen und Dashboard-Konfiguration</p>
      </div>

      <Tabs defaultValue="models">
        <TabsList className="mb-4">
          <TabsTrigger value="models" className="gap-1.5"><Cpu size={13} />Modelle</TabsTrigger>
          <TabsTrigger value="services" className="gap-1.5"><Server size={13} />Services</TabsTrigger>
          <TabsTrigger value="integrations" className="gap-1.5"><Plug size={13} />Integrationen</TabsTrigger>
          <TabsTrigger value="email" className="gap-1.5"><Mail size={13} />E-Mail</TabsTrigger>
          <TabsTrigger value="dashboard" className="gap-1.5"><LayoutDashboard size={13} />Dashboard</TabsTrigger>
        </TabsList>

        {/* ── Tab: Modelle ── */}
        <TabsContent value="models">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">AI Provider & Konfiguration</CardTitle>
              <CardDescription>API-Keys der konfigurierten AI-Anbieter. Gesetzte Schlüssel werden automatisch erkannt.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {AI_PROVIDERS.map(p => (
                <ConfigRow
                  key={p.key}
                  label={p.label}
                  envVar={p.envVar}
                  desc={p.desc}
                  configured={configStatus?.[p.key]}
                  loading={configLoading}
                />
              ))}
              <div className="pt-2 flex justify-end">
                <Button variant="outline" size="sm" onClick={loadConfigStatus} disabled={configLoading}>
                  <RefreshCw size={12} className={configLoading ? 'animate-spin' : ''} />
                  Neu prüfen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <CardTitle className="text-sm">Standard-Modell</CardTitle>
              <CardDescription>Wird als Fallback verwendet wenn kein Modell explizit gewählt ist.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-1.5">
              {LLM_MODELS.map(m => (
                <button
                  key={m.id}
                  onClick={() => setModel(m.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition-colors text-left border ${
                    m.id === model
                      ? 'bg-[--accent-blue]/10 border-[--accent-blue]/30 text-[--accent-blue]'
                      : 'bg-[--layer-2] border-[--border] text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary]'
                  }`}
                >
                  <span className="font-medium">{m.label}</span>
                  <span className={`text-xs font-mono ${m.id === model ? 'opacity-80' : 'text-[--text-muted]'}`}>{m.provider}</span>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Services ── */}
        <TabsContent value="services">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">Service-Status</CardTitle>
                <CardDescription>Live-Status aller Services auf dem Hetzner-Server.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={pingServices} disabled={servicePinging}>
                <RefreshCw size={12} className={servicePinging ? 'animate-spin' : ''} />
                Alle pingen
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {SERVICES.map(svc => (
                <ServiceRow
                  key={svc.id}
                  service={svc}
                  status={serviceStatus[svc.id]}
                  pinging={servicePinging}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Integrationen ── */}
        <TabsContent value="integrations">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm">API-Integrationen</CardTitle>
                <CardDescription>Konfigurierte Services und deren API-Keys (via .env).</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={loadConfigStatus} disabled={configLoading}>
                <RefreshCw size={12} className={configLoading ? 'animate-spin' : ''} />
                Prüfen
              </Button>
            </CardHeader>
            <CardContent className="space-y-2">
              {INTEGRATIONS.map(int => (
                <ConfigRow
                  key={int.key}
                  label={int.label}
                  envVar={int.envVar}
                  desc={int.desc}
                  icon={int.icon}
                  configured={configStatus?.[int.key]}
                  loading={configLoading}
                />
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: E-Mail ── */}
        <TabsContent value="email">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Mailtrap / Mailpit</CardTitle>
              <CardDescription>E-Mail Testing und transaktionale Mails. Service läuft unter mail.automation-plus-ki.de</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between rounded-lg border border-[--border] bg-[--layer-2] px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-[--text-primary]">Mailpit Service</p>
                  <p className="text-[11px] text-[--text-muted] font-mono mt-0.5">mail.automation-plus-ki.de</p>
                </div>
                <div className="flex items-center gap-2">
                  {serviceStatus['mailpit'] === 'online' ? (
                    <Badge variant="success">Online</Badge>
                  ) : (
                    <Badge variant="secondary">Status unbekannt</Badge>
                  )}
                  <a href="https://mail.automation-plus-ki.de" target="_blank" rel="noopener noreferrer">
                    <Button variant="ghost" size="sm" className="gap-1.5 text-[--accent-blue]">
                      <ExternalLink size={12} />
                      Öffnen
                    </Button>
                  </a>
                </div>
              </div>

              {/* Config info */}
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">SMTP Konfiguration</p>
                {[
                  { label: 'SMTP Host',  value: 'mail.automation-plus-ki.de' },
                  { label: 'SMTP Port',  value: '1025 (unverschlüsselt) / 465 (TLS)' },
                  { label: 'Auth',       value: 'Keine (intern) oder API-Token' },
                  { label: 'Web UI',     value: 'Port 8025 (via Traefik)' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3 text-sm">
                    <span className="w-28 shrink-0 text-[--text-muted] text-xs">{row.label}</span>
                    <span className="font-mono text-xs text-[--text-secondary]">{row.value}</span>
                  </div>
                ))}
              </div>

              {/* ENV Vars */}
              <div className="space-y-1.5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[--text-muted]">Env Variables</p>
                <ConfigRow
                  label="Mailtrap API Token"
                  envVar="MAILTRAP_API_TOKEN"
                  desc="Für programmtischen Zugriff"
                  configured={configStatus?.['mailtrap']}
                  loading={configLoading}
                />
                <ConfigRow
                  label="E-Mail Sender"
                  envVar="EMAIL_FROM"
                  desc="Absender-Adresse für System-E-Mails"
                  configured={configStatus?.['email_from']}
                  loading={configLoading}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Tab: Dashboard ── */}
        <TabsContent value="dashboard">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Erscheinungsbild</CardTitle>
              </CardHeader>
              <CardContent>
                <button
                  onClick={toggleTheme}
                  className="flex items-center gap-3 rounded-lg border border-[--border] bg-[--layer-2] px-4 py-2.5 text-sm text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary] transition-colors"
                >
                  {isDark ? <Moon size={14} className="text-[--accent-blue]" /> : <Sun size={14} className="text-[--accent-amber]" />}
                  {isDark ? 'Dark Mode aktiv' : 'Light Mode aktiv'}
                </button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">System-Info</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { label: 'Framework',  value: 'Next.js 14.2 · App Router' },
                  { label: 'UI',         value: 'shadcn/ui + Tailwind CSS 3.4' },
                  { label: 'Server',     value: 'Hetzner CPX42 · 46.224.145.109' },
                  { label: 'Domain',     value: '*.automation-plus-ki.de' },
                  { label: 'MCP Server', value: '19 aktive MCP-Verbindungen' },
                ].map(row => (
                  <div key={row.label} className="flex items-center gap-3">
                    <span className="w-24 shrink-0 text-xs text-[--text-muted]">{row.label}</span>
                    <span className="text-xs font-mono text-[--text-secondary]">{row.value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
