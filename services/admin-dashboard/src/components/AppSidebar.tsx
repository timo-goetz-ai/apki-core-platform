'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bot, Workflow, Database, BarChart2, Monitor, Bell,
  Settings, Activity, Server, Code2, FileText, BookOpen, Container,
  Layers, Zap, Shield, HardDrive, GitBranch, Terminal, Cpu, FolderPlus,
  ChevronDown, ChevronRight, ScanSearch, ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

interface NavSection {
  title: string;
  icon?: React.ElementType;
  items: NavItem[];
  collapsible?: boolean;
}

const NAV: NavSection[] = [
  {
    title: 'Overview',
    collapsible: false,
    items: [
      { label: 'Cockpit',      href: '/',             icon: LayoutDashboard },
      { label: 'Services',     href: '/services',     icon: Server },
      { label: 'API Explorer', href: '/api-explorer', icon: Code2 },
      { label: 'Aktivität',   href: '/activity',     icon: Activity },
    ],
  },
  {
    title: 'KI-System',
    icon: Cpu,
    collapsible: true,
    items: [
      { label: 'Agenten',       href: '/agents',     icon: Bot },
      { label: 'Workflows',     href: '/workflows',  icon: Workflow },
      { label: 'Datenbanken',   href: '/databases',  icon: Database },
      { label: 'Knowledge Base',href: '/knowledge',  icon: BookOpen },
      { label: 'Templates',     href: '/templates',  icon: FileText },
      { label: 'Tools',         href: '/tools',      icon: Zap },
    ],
  },
  {
    title: 'Agentic OS',
    icon: Layers,
    collapsible: true,
    items: [
      { label: 'Active Projects', href: '/agentic-os/management/active-projects', icon: GitBranch },
      { label: 'Neues Projekt',   href: '/agentic-os/management/new-project',     icon: FolderPlus },
      { label: 'AI Ops',          href: '/agentic-os/management/ai-ops',          icon: Cpu },
      { label: 'Agents Engine',   href: '/agentic-os/engine-room/agents',         icon: Bot },
      { label: 'Prompt Library',  href: '/agentic-os/knowledge/prompts',          icon: Terminal },
      { label: 'Registry',        href: '/agentic-os/registry',                   icon: ScanSearch },
      { label: 'Error Logs',      href: '/agentic-os/logs',                       icon: ScrollText },
    ],
  },
  {
    title: 'Monitoring',
    icon: Monitor,
    collapsible: true,
    items: [
      { label: 'Container',  href: '/monitoring/containers', icon: Container },
      { label: 'Metrics',    href: '/monitoring/metrics',    icon: BarChart2 },
      { label: 'Grafana',    href: '/monitoring/grafana',    icon: BarChart2 },
      { label: 'Logs',       href: '/logs',                  icon: FileText },
      { label: 'Alerts',     href: '/monitoring/alerts',     icon: Bell },
    ],
  },
  {
    title: 'Platform',
    icon: HardDrive,
    collapsible: true,
    items: [
      { label: 'MCP Platform', href: '/mcp-plattform', icon: Layers },
      { label: 'Files',        href: '/files',          icon: HardDrive },
      { label: 'Security',     href: '/settings',       icon: Shield },
    ],
  },
];

function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-100',
        isActive
          ? 'bg-[--accent-blue]/10 text-[--accent-blue] font-medium border-l-2 border-[--accent-blue] pl-[10px]'
          : 'text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary] border-l-2 border-transparent pl-[10px]'
      )}
    >
      <Icon
        size={15}
        className={cn(
          'shrink-0 transition-colors',
          isActive ? 'text-[--accent-blue]' : 'text-[--text-muted] group-hover:text-[--text-secondary]'
        )}
      />
      <span className="truncate">{item.label}</span>
    </Link>
  );
}

function SidebarSection({ section, pathname }: { section: NavSection; pathname: string }) {
  const hasActive = section.items.some(
    (item) => pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
  );
  const [open, setOpen] = React.useState(hasActive || !section.collapsible);

  if (!section.collapsible) {
    return (
      <div className="space-y-0.5">
        {section.items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return <NavLink key={item.href} item={item} isActive={isActive} />;
        })}
      </div>
    );
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-[--text-muted] hover:text-[--text-secondary] transition-colors">
        <span>{section.title}</span>
        <ChevronDown
          size={12}
          className={cn('transition-transform duration-200', open && 'rotate-180')}
        />
      </CollapsibleTrigger>
      <CollapsibleContent className="space-y-0.5 pt-1">
        {section.items.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
          return <NavLink key={item.href} item={item} isActive={isActive} />;
        })}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <TooltipProvider delayDuration={300}>
      <aside
        className="fixed inset-y-0 left-0 z-40 flex w-[220px] flex-col"
        style={{
          background: 'var(--layer-1)',
          borderRight: '1px solid var(--border)',
        }}
      >
        {/* Logo / Brand */}
        <div
          className="flex h-[60px] shrink-0 items-center gap-3 px-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-bold"
            style={{ background: 'var(--accent-blue)', color: 'var(--layer-0)' }}
          >
            AI
          </div>
          <div>
            <p className="text-sm font-semibold text-[--text-primary] leading-none">AIOS</p>
            <p className="text-[10px] font-mono text-[--text-muted] leading-none mt-0.5">ops center</p>
          </div>
        </div>

        {/* Navigation */}
        <ScrollArea className="flex-1 py-3">
          <nav className="space-y-4 px-2">
            {NAV.map((section) => (
              <div key={section.title}>
                {section.collapsible ? (
                  <SidebarSection section={section} pathname={pathname} />
                ) : (
                  <>
                    <p className="mb-1 px-3 text-[10px] font-mono font-medium uppercase tracking-[0.12em] text-[--text-muted]">
                      {section.title}
                    </p>
                    <div className="space-y-0.5">
                      {section.items.map((item) => {
                        const isActive =
                          pathname === item.href ||
                          (item.href !== '/' && pathname.startsWith(item.href));
                        return <NavLink key={item.href} item={item} isActive={isActive} />;
                      })}
                    </div>
                  </>
                )}
              </div>
            ))}
          </nav>
        </ScrollArea>

        {/* Footer status */}
        <div
          className="flex items-center gap-2 px-4 py-3"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0"
            style={{ background: 'var(--accent-green)', boxShadow: '0 0 6px var(--accent-green)' }}
          />
          <span className="flex-1 text-[10px] font-mono text-[--text-muted]">system online</span>
          <span className="text-[10px] font-mono text-[--text-muted] tabular-nums">
            {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </aside>
    </TooltipProvider>
  );
}
