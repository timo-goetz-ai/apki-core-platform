'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Workflow, Users, Cpu,
  Database, Settings, ScrollText,
  Layers, CalendarDays, BarChart3,
  ChevronRight, Activity, Globe, FileText,
  Gauge, BellRing, Terminal, Mic,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';

// ── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
}

interface NavGroup {
  label: string;
  icon: React.ElementType;
  defaultOpen?: boolean;
  items: NavItem[];
}

// ── Navigation Structure ─────────────────────────────────────────────────────
const TOP_ITEMS: NavItem[] = [
  { label: 'Overview', href: '/', icon: LayoutDashboard },
];

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Agents',
    icon: Users,
    items: [
      { label: 'Teams', href: '/agents', icon: Users },
      { label: 'Live Monitor', href: '/agents/live', icon: Activity },
    ],
  },
  {
    label: 'Content',
    icon: FileText,
    items: [
      { label: 'Pipeline', href: '/content-factory', icon: FileText },
      { label: 'Planung', href: 'https://postiz.automation-plus-ki.de', icon: CalendarDays, external: true },
    ],
  },
  {
    label: 'Voice',
    icon: Mic,
    items: [
      { label: 'Debug & Latenz', href: '/monitoring/voice', icon: Mic },
    ],
  },
  {
    label: 'Monitoring',
    icon: BarChart3,
    items: [
      { label: 'System', href: '/monitoring', icon: Gauge },
      { label: 'Alerts', href: '/monitoring/grafana', icon: BellRing },
      { label: 'Logs', href: '/logs', icon: ScrollText },
    ],
  },
  {
    label: 'Workflows',
    icon: Workflow,
    items: [
      { label: 'Alle Workflows', href: '/workflows', icon: Workflow },
    ],
  },
  {
    label: 'Technik',
    icon: Cpu,
    items: [
      { label: 'Deployments', href: '/fabrik', icon: Cpu },
      { label: 'MCP Server', href: '/mcp-plattform', icon: Globe },
      { label: 'API Explorer', href: '/api-explorer', icon: Terminal },
      { label: 'Services', href: '/services', icon: Database },
    ],
  },
];

// ── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({
  item,
  isActive,
  onNavigate,
  indent = false,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
  indent?: boolean;
}) {
  const Icon = item.icon;
  const className = cn(
    'group flex min-h-[38px] items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-all duration-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-1)]',
    indent && 'pl-9',
    isActive
      ? 'text-[--text-primary] font-semibold'
      : 'text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary]'
  );
  const content = (
    <>
      <Icon
        size={14}
        className="shrink-0 transition-colors"
        style={{ color: isActive ? 'var(--accent-blue)' : undefined }}
        aria-hidden
      />
      <span className="truncate flex-1 text-[13px]">{item.label}</span>
    </>
  );
  if (item.external) {
    return (
      <a
        href={item.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        onClick={() => onNavigate?.()}
      >
        {content}
      </a>
    );
  }
  return (
    <Link href={item.href} className={className} onClick={() => onNavigate?.()}>
      {content}
    </Link>
  );
}

// ── CollapsibleNavGroup ─────────────────────────────────────────────────────
function CollapsibleNavGroup({
  group,
  isActive,
  onNavigate,
}: {
  group: NavGroup;
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  const anyActive = group.items.some(item => isActive(item.href));
  const [open, setOpen] = React.useState(group.defaultOpen || anyActive);
  const Icon = group.icon;

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'flex w-full min-h-[38px] items-center gap-2.5 rounded-md px-3 py-1.5 text-sm transition-all duration-100',
            'hover:bg-[--layer-3] hover:text-[--text-primary]',
            anyActive ? 'text-[--text-primary] font-semibold' : 'text-[--text-secondary]'
          )}
        >
          <Icon
            size={14}
            className="shrink-0"
            style={{ color: anyActive ? 'var(--accent-blue)' : undefined }}
            aria-hidden
          />
          <span className="truncate flex-1 text-left text-[13px]">{group.label}</span>
          <ChevronRight
            size={12}
            className="shrink-0 transition-transform duration-200"
            style={{ transform: open ? 'rotate(90deg)' : undefined, opacity: 0.4 }}
          />
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="space-y-0.5 pb-1">
          {group.items.map(item => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onNavigate={onNavigate}
              indent
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}

// ── SidebarPanel ────────────────────────────────────────────────────────────
function SidebarPanel({
  isActive,
  onNavigate,
}: {
  isActive: (href: string) => boolean;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div
        className="flex h-[60px] shrink-0 items-center gap-3 px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex h-9 w-9 min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-xs font-semibold"
          style={{
            background: 'var(--layer-3)',
            border: '1px solid var(--border-bright)',
            color: 'var(--text-primary)',
          }}
        >
          AI
        </div>
        <div>
          <p className="text-sm font-semibold text-[--text-primary] leading-none">AIOS</p>
          <p className="text-[11px] font-mono text-[--text-muted] leading-none mt-0.5">Command Center</p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5" aria-label="Hauptnavigation">
          {TOP_ITEMS.map(item => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}

          <div className="pt-2 space-y-0.5">
            {NAV_GROUPS.map(group => (
              <CollapsibleNavGroup
                key={group.label}
                group={group}
                isActive={isActive}
                onNavigate={onNavigate}
              />
            ))}
          </div>
        </nav>
      </ScrollArea>

      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-2 py-1.5">
          <NavLink
            item={{ label: 'Settings', href: '/settings', icon: Settings }}
            isActive={isActive('/settings')}
            onNavigate={onNavigate}
          />
        </div>
        <div
          className="flex min-h-[44px] items-center gap-2 px-4 py-2"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 live-dot"
            style={{ background: 'var(--accent-green)' }}
            aria-hidden
          />
          <span className="flex-1 text-[11px] font-mono text-[--text-muted]">system online</span>
          <span className="text-[11px] font-mono text-[--text-muted] tabular-nums">
            {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </>
  );
}

const asideStyle = { background: 'var(--layer-1)', borderRight: '1px solid var(--border)' } as const;

// ── AppSidebar ───────────────────────────────────────────────────────────────
export function AppSidebar({
  mobileOpen = false,
  onMobileClose,
}: {
  mobileOpen?: boolean;
  onMobileClose?: () => void;
} = {}) {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href.startsWith('http')) return false;
    const cleanHref = href.split('#')[0];
    return cleanHref === '/'
      ? pathname === '/'
      : pathname === cleanHref || pathname.startsWith(cleanHref + '/');
  }

  return (
    <>
      <aside
        className="fixed inset-y-0 left-0 z-40 hidden w-[240px] flex-col lg:flex"
        style={asideStyle}
        aria-hidden={false}
      >
        <SidebarPanel isActive={isActive} />
      </aside>

      {mobileOpen ? (
        <>
          <button
            type="button"
            className="fixed inset-0 z-40 bg-black/50 lg:hidden"
            aria-label="Navigation schließen"
            onClick={onMobileClose}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex w-[min(100vw,280px)] max-w-full flex-col lg:hidden shadow-xl"
            style={asideStyle}
            role="dialog"
            aria-modal="true"
            aria-label="Menü"
          >
            <SidebarPanel isActive={isActive} onNavigate={onMobileClose} />
          </aside>
        </>
      ) : null}
    </>
  );
}
