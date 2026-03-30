'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Bot, Workflow, Database, BarChart2, Bell,
  Settings, Activity, Server, Code2, FileText, BookOpen, Container,
  Layers, Zap, HardDrive, GitBranch, Terminal, Cpu,
  Rocket, RefreshCw, FlaskConical, ExternalLink, Play,
  Search, ChevronRight, Kanban,
} from 'lucide-react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { dashboardApiAuthHeaders } from '@/lib/dashboard-auth-headers';

// ── Types ──────────────────────────────────────────────────────────────────────
type CommandType = 'nav' | 'action' | 'external';

interface CommandEntry {
  label: string;
  description?: string;
  keywords?: string;
  href?: string;
  action?: () => void | Promise<void>;
  icon: React.ElementType;
  group: string;
  type: CommandType;
}

// ── Data ───────────────────────────────────────────────────────────────────────
function buildCommands(
  router: ReturnType<typeof useRouter>,
  close: () => void
): CommandEntry[] {
  return [
    // ── Navigation
    {
      label: 'Overview',
      description: 'KPIs, Service Health, Deployments',
      keywords: 'cockpit dashboard home status',
      href: '/', icon: LayoutDashboard, group: 'Navigation', type: 'nav',
    },
    {
      label: 'Playground',
      description: 'Claude Workspace · LLM Testing',
      keywords: 'claude ai chat llm test',
      href: '/claude-workspace', icon: FlaskConical, group: 'Navigation', type: 'nav',
    },
    {
      label: 'Workflows',
      description: 'n8n Automatisierungen',
      keywords: 'n8n automation flows trigger',
      href: '/workflows', icon: Workflow, group: 'Navigation', type: 'nav',
    },
    {
      label: 'Deployments',
      description: 'Coolify · Hetzner Services',
      keywords: 'deploy coolify docker container',
      href: '/deployments', icon: Rocket, group: 'Navigation', type: 'nav',
    },
    {
      label: 'Analytics',
      description: 'Grafana · Prometheus Metriken',
      keywords: 'grafana prometheus metrics monitoring',
      href: '/analytics', icon: BarChart2, group: 'Navigation', type: 'nav',
    },

    // ── AI Workspace
    {
      label: 'Agents',
      description: 'AI Agents Engine',
      keywords: 'agent crew bot automation',
      href: '/agentic-os/engine-room/agents', icon: Bot, group: 'AI Workspace', type: 'nav',
    },
    {
      label: 'Prompt Library',
      description: 'Gespeicherte Prompts & Templates',
      keywords: 'prompt template library',
      href: '/agentic-os/knowledge/prompts', icon: Terminal, group: 'AI Workspace', type: 'nav',
    },
    {
      label: 'Templates',
      description: 'Brand & Content Templates',
      keywords: 'template brand content factory',
      href: '/templates', icon: FileText, group: 'AI Workspace', type: 'nav',
    },
    {
      label: 'Content Kanban',
      description: 'Content Pipeline · Idee → Veröffentlicht',
      keywords: 'kanban content pipeline status board',
      href: '/kanban', icon: Kanban, group: 'AI Workspace', type: 'nav',
    },
    {
      label: 'Active Projects',
      description: 'Laufende Projekte & Aufgaben',
      keywords: 'project task kanban active',
      href: '/agentic-os/management/active-projects', icon: GitBranch, group: 'AI Workspace', type: 'nav',
    },
    {
      label: 'Registry',
      description: 'Agentic OS Registry',
      keywords: 'registry agent resource',
      href: '/agentic-os/registry', icon: Layers, group: 'AI Workspace', type: 'nav',
    },

    // ── Infrastructure
    {
      label: 'Services',
      description: 'Service Health & Endpoints',
      keywords: 'service health status endpoint',
      href: '/services', icon: Server, group: 'Infrastruktur', type: 'nav',
    },
    {
      label: 'MCP Platform',
      description: 'MCP Dienste & Verbindungen',
      keywords: 'mcp model context protocol tools',
      href: '/mcp-plattform', icon: Cpu, group: 'Infrastruktur', type: 'nav',
    },
    {
      label: 'Datenbanken',
      description: 'NocoDB · PostgreSQL · Redis',
      keywords: 'database nocodb postgres redis sql',
      href: '/databases', icon: Database, group: 'Infrastruktur', type: 'nav',
    },
    {
      label: 'API Explorer',
      description: 'API Routes testen',
      keywords: 'api explorer test endpoint rest',
      href: '/api-explorer', icon: Code2, group: 'Infrastruktur', type: 'nav',
    },
    {
      label: 'Files',
      description: 'S3 · Dateisystem',
      keywords: 'files s3 storage filesystem',
      href: '/files', icon: HardDrive, group: 'Infrastruktur', type: 'nav',
    },

    // ── Monitor
    {
      label: 'Metrics',
      description: 'Prometheus Metriken',
      keywords: 'prometheus metrics cpu memory',
      href: '/monitoring/metrics', icon: BarChart2, group: 'Monitor', type: 'nav',
    },
    {
      label: 'Logs',
      description: 'System & Error Logs',
      keywords: 'logs errors warnings system',
      href: '/logs', icon: FileText, group: 'Monitor', type: 'nav',
    },
    {
      label: 'Alerts',
      description: 'Aktive Alerts & Incidents',
      keywords: 'alert incident warning critical',
      href: '/monitoring/alerts', icon: Bell, group: 'Monitor', type: 'nav',
    },
    {
      label: 'Aktivität',
      description: 'System Activity Feed',
      keywords: 'activity feed events recent',
      href: '/activity', icon: Activity, group: 'Monitor', type: 'nav',
    },

    // ── Commands (Actions)
    {
      label: 'Services neu laden',
      description: 'Alle Service-Statuses aktualisieren',
      keywords: 'refresh reload services status',
      action: async () => {
        await fetch('/api/services/refresh', { method: 'POST' });
        close();
        router.refresh();
      },
      icon: RefreshCw, group: 'Befehle', type: 'action',
    },
    {
      label: 'n8n Workflows sync',
      description: 'Workflow-Liste mit n8n abgleichen',
      keywords: 'n8n sync workflows update',
      action: async () => {
        await fetch('/api/n8n/sync', { method: 'POST' });
        close();
      },
      icon: Play, group: 'Befehle', type: 'action',
    },
    {
      label: '▶ 11_TREND_MONITOR starten',
      description: 'Trend-Research Workflow sofort ausführen',
      keywords: 'trigger trend monitor n8n research run',
      action: async () => {
        await fetch('/api/n8n/trigger/fEYWN4pWhRcG2tLg', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() } });
        close();
      },
      icon: Zap, group: 'Befehle', type: 'action',
    },
    {
      label: '▶ 12_SENTIMENT_TRACKER starten',
      description: 'Sentiment-Analyse Workflow sofort ausführen',
      keywords: 'trigger sentiment tracker n8n research run',
      action: async () => {
        await fetch('/api/n8n/trigger/Vx1Aea5glbogJxg6', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() } });
        close();
      },
      icon: Zap, group: 'Befehle', type: 'action',
    },
    {
      label: '▶ 13_CONTENT_OPPORTUNITY starten',
      description: 'Content-Chancen Workflow sofort ausführen',
      keywords: 'trigger content opportunity n8n research run',
      action: async () => {
        await fetch('/api/n8n/trigger/I6LcxlyMM8TU7A7V', { method: 'POST', body: '{}', headers: { 'Content-Type': 'application/json', ...dashboardApiAuthHeaders() } });
        close();
      },
      icon: Zap, group: 'Befehle', type: 'action',
    },
    {
      label: 'Einstellungen',
      description: 'Dashboard Konfiguration',
      keywords: 'settings config preferences',
      href: '/settings', icon: Settings, group: 'Befehle', type: 'nav',
    },
    {
      label: 'Knowledge Base',
      description: 'Wissens-Ressourcen verwalten',
      keywords: 'knowledge base wiki docs',
      href: '/knowledge', icon: BookOpen, group: 'Befehle', type: 'nav',
    },

    // ── External Links
    {
      label: 'Raycast AI',
      description: 'AI Chat direkt in Raycast',
      keywords: 'raycast ai chat external',
      href: 'raycast://extensions/raycast/raycast-ai/ai-chat',
      icon: Zap, group: 'Extern', type: 'external',
    },
    {
      label: 'n8n Editor',
      description: 'Workflow Editor öffnen',
      keywords: 'n8n editor workflow external',
      href: 'https://n8n.automation-plus-ki.de',
      icon: Workflow, group: 'Extern', type: 'external',
    },
    {
      label: 'Grafana',
      description: 'Monitoring Dashboards',
      keywords: 'grafana monitoring dashboard metrics',
      href: 'https://grafana.automation-plus-ki.de',
      icon: BarChart2, group: 'Extern', type: 'external',
    },
    {
      label: 'Coolify',
      description: 'Deployment Management',
      keywords: 'coolify deploy docker server',
      href: 'https://coolify.automation-plus-ki.de',
      icon: Rocket, group: 'Extern', type: 'external',
    },
  ];
}

const GROUPS = ['Navigation', 'AI Workspace', 'Infrastruktur', 'Monitor', 'Befehle', 'Extern'];

const TYPE_HINT: Record<CommandType, { label: string; color: string }> = {
  nav:      { label: '↗',    color: 'var(--text-muted)' },
  action:   { label: '⚡',   color: 'var(--accent-amber)' },
  external: { label: '↗ ext', color: 'var(--text-muted)' },
};

// ── Component ──────────────────────────────────────────────────────────────────
interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();
  const [running, setRunning] = useState<string | null>(null);

  const close = useCallback(() => onOpenChange(false), [onOpenChange]);

  const COMMANDS = buildCommands(router, close);

  const handleSelect = useCallback(
    async (cmd: CommandEntry) => {
      if (cmd.type === 'external' && cmd.href) {
        close();
        window.open(cmd.href, '_blank', 'noopener noreferrer');
        return;
      }
      if (cmd.type === 'action' && cmd.action) {
        setRunning(cmd.label);
        try { await cmd.action(); } catch { /* silent */ }
        setRunning(null);
        return;
      }
      if (cmd.href) {
        close();
        router.push(cmd.href);
      }
    },
    [close, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput
        placeholder="Navigieren, suchen, Befehle ausführen..."
        className="text-[--text-primary] placeholder:text-[--text-muted]"
      />
      <CommandList>
        <CommandEmpty>
          <span style={{ color: 'var(--text-muted)', fontSize: 13 }}>
            Keine Ergebnisse — versuche einen anderen Begriff.
          </span>
        </CommandEmpty>

        {GROUPS.map((group, i) => {
          const items = COMMANDS.filter(c => c.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map(cmd => {
                  const Icon = cmd.icon;
                  const isRunning = running === cmd.label;
                  const hint = TYPE_HINT[cmd.type];
                  return (
                    <CommandItem
                      key={`${cmd.group}:${cmd.label}`}
                      value={`${cmd.label} ${cmd.description ?? ''} ${cmd.keywords ?? ''}`}
                      onSelect={() => handleSelect(cmd)}
                      disabled={isRunning}
                    >
                      <Icon
                        className="mr-2 shrink-0"
                        size={14}
                        style={{ color: 'var(--text-muted)' }}
                      />
                      <span style={{ flex: 1 }}>
                        <span style={{ color: 'var(--text-primary)', fontSize: 13 }}>
                          {cmd.label}
                        </span>
                        {cmd.description && (
                          <span style={{
                            marginLeft: 8, fontSize: 11,
                            color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                          }}>
                            {isRunning ? '…lädt' : cmd.description}
                          </span>
                        )}
                      </span>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        color: hint.color, flexShrink: 0, marginLeft: 8,
                      }}>
                        {hint.label}
                      </span>
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            </div>
          );
        })}
      </CommandList>
    </CommandDialog>
  );
}
