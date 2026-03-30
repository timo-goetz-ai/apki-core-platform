'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Workflow, Users, Building2,
  Database, Settings, ScrollText, Factory,
  Layers, CalendarDays,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  external?: boolean;
}

// ── Navigation Structure ─────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',          href: '/',                  icon: LayoutDashboard },
  { label: 'Workflows',         href: '/workflows',         icon: Workflow        },
  { label: 'Agents',            href: '/agents',            icon: Users           },
  { label: 'Fabrik',            href: '/fabrik',            icon: Building2       },
  { label: 'Content Factory',   href: '/content-factory',   icon: Factory         },
  { label: 'Batch Production',  href: '/batch-production',  icon: Layers          },
  { label: 'Content Planning',  href: 'https://postiz.automation-plus-ki.de', icon: CalendarDays, external: true },
  { label: 'Databases',         href: '/databases',         icon: Database        },
  { label: 'Logs',              href: '/logs',              icon: ScrollText      },
];

// ── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({
  item,
  isActive,
  onNavigate,
}: {
  item: NavItem;
  isActive: boolean;
  onNavigate?: () => void;
}) {
  const Icon = item.icon;
  const className = cn(
    'group flex min-h-[44px] items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-all duration-100',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--layer-1)]',
    isActive
      ? 'text-[--text-primary] font-semibold'
      : 'text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary]'
  );
  const content = (
    <>
      <Icon
        size={15}
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
          <p className="text-[11px] font-mono text-[--text-muted] leading-none mt-0.5">ops center</p>
        </div>
      </div>

      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5" aria-label="Hauptnavigation">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onNavigate={onNavigate}
            />
          ))}
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
    return href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/');
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
