'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard, Bot, Workflow, Database, BarChart2, Monitor, Bell,
  Settings, Activity, Server, Code2, FileText, BookOpen, Container,
  Layers, Zap, Shield, HardDrive, GitBranch, Terminal, Cpu,
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

interface CommandEntry {
  label: string;
  href: string;
  icon: React.ElementType;
  group: string;
}

const COMMANDS: CommandEntry[] = [
  // Overview
  { label: 'Cockpit',        href: '/',                                      icon: LayoutDashboard, group: 'Overview' },
  { label: 'Services',       href: '/services',                              icon: Server,          group: 'Overview' },
  { label: 'API Explorer',   href: '/api-explorer',                          icon: Code2,           group: 'Overview' },
  { label: 'Aktivität',     href: '/activity',                              icon: Activity,        group: 'Overview' },
  // KI-System
  { label: 'Agenten',        href: '/agents',                                icon: Bot,             group: 'KI-System' },
  { label: 'Workflows',      href: '/workflows',                             icon: Workflow,        group: 'KI-System' },
  { label: 'Datenbanken',    href: '/databases',                             icon: Database,        group: 'KI-System' },
  { label: 'Knowledge Base', href: '/knowledge',                             icon: BookOpen,        group: 'KI-System' },
  { label: 'Templates',      href: '/templates',                             icon: FileText,        group: 'KI-System' },
  { label: 'Tools',          href: '/tools',                                 icon: Zap,             group: 'KI-System' },
  // Agentic OS
  { label: 'Active Projects', href: '/agentic-os/management/active-projects', icon: GitBranch,      group: 'Agentic OS' },
  { label: 'AI Ops',          href: '/agentic-os/management/ai-ops',          icon: Cpu,            group: 'Agentic OS' },
  { label: 'Agents Engine',   href: '/agentic-os/engine-room/agents',         icon: Bot,            group: 'Agentic OS' },
  { label: 'Prompt Library',  href: '/agentic-os/knowledge/prompts',          icon: Terminal,       group: 'Agentic OS' },
  // Monitoring
  { label: 'Container',      href: '/monitoring/containers',                 icon: Container,       group: 'Monitoring' },
  { label: 'Metrics',        href: '/monitoring/metrics',                    icon: BarChart2,       group: 'Monitoring' },
  { label: 'Grafana',        href: '/monitoring/grafana',                    icon: BarChart2,       group: 'Monitoring' },
  { label: 'Logs',           href: '/logs',                                  icon: FileText,        group: 'Monitoring' },
  { label: 'Alerts',         href: '/monitoring/alerts',                     icon: Bell,            group: 'Monitoring' },
  // Platform
  { label: 'MCP Platform',   href: '/mcp-plattform',                        icon: Layers,          group: 'Platform' },
  { label: 'Files',          href: '/files',                                 icon: HardDrive,       group: 'Platform' },
  { label: 'Einstellungen',  href: '/settings',                              icon: Settings,        group: 'Platform' },
];

const GROUPS = ['Overview', 'KI-System', 'Agentic OS', 'Monitoring', 'Platform'];

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CommandPalette({ open, onOpenChange }: CommandPaletteProps) {
  const router = useRouter();

  const handleSelect = useCallback(
    (href: string) => {
      onOpenChange(false);
      router.push(href);
    },
    [onOpenChange, router]
  );

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Navigation, Seite suchen..." />
      <CommandList>
        <CommandEmpty>Keine Ergebnisse gefunden.</CommandEmpty>
        {GROUPS.map((group, i) => {
          const items = COMMANDS.filter((c) => c.group === group);
          return (
            <div key={group}>
              {i > 0 && <CommandSeparator />}
              <CommandGroup heading={group}>
                {items.map((cmd) => {
                  const Icon = cmd.icon;
                  return (
                    <CommandItem
                      key={cmd.href}
                      value={`${cmd.label} ${cmd.group}`}
                      onSelect={() => handleSelect(cmd.href)}
                    >
                      <Icon className="mr-2 h-4 w-4 text-[--text-muted]" />
                      {cmd.label}
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
