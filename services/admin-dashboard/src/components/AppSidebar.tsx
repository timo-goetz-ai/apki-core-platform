'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Workflow, Users,
  Database, Settings, ScrollText, Factory,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

// ── Types ───────────────────────────────────────────────────────────────────
interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
}

// ── Navigation Structure ─────────────────────────────────────────────────────
const NAV_ITEMS: NavItem[] = [
  { label: 'Overview',        href: '/',                icon: LayoutDashboard },
  { label: 'Workflows',       href: '/workflows',       icon: Workflow        },
  { label: 'Agents',          href: '/agents',          icon: Users           },
  { label: 'Content Factory', href: '/content-factory', icon: Factory         },
  { label: 'Databases',       href: '/databases',       icon: Database        },
  { label: 'Logs',            href: '/logs',            icon: ScrollText      },
];

// ── NavLink ──────────────────────────────────────────────────────────────────
function NavLink({ item, isActive }: { item: NavItem; isActive: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'group flex items-center gap-2.5 rounded-md px-3 py-[7px] text-sm transition-all duration-100',
        isActive
          ? 'text-[--text-primary] font-semibold'
          : 'text-[--text-secondary] hover:bg-[--layer-3] hover:text-[--text-primary]'
      )}
    >
      <Icon
        size={13}
        className="shrink-0 transition-colors"
        style={{ color: isActive ? 'var(--accent-blue)' : undefined }}
      />
      <span className="truncate flex-1 text-[12.5px]">{item.label}</span>
    </Link>
  );
}

// ── AppSidebar ───────────────────────────────────────────────────────────────
export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === '/'
      ? pathname === '/'
      : pathname === href || pathname.startsWith(href + '/');
  }

  return (
    <aside
      className="fixed inset-y-0 left-0 z-40 flex w-[240px] flex-col"
      style={{ background: 'var(--layer-1)', borderRight: '1px solid var(--border)' }}
    >
      {/* Brand */}
      <div
        className="flex h-[60px] shrink-0 items-center gap-3 px-4"
        style={{ borderBottom: '1px solid var(--border)' }}
      >
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg text-xs font-semibold"
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
          <p className="text-[10px] font-mono text-[--text-muted] leading-none mt-0.5">ops center</p>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1 py-3">
        <nav className="px-2 space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} isActive={isActive(item.href)} />
          ))}
        </nav>
      </ScrollArea>

      {/* Footer: Settings + Status */}
      <div style={{ borderTop: '1px solid var(--border)' }}>
        <div className="px-2 py-1.5">
          <NavLink
            item={{ label: 'Settings', href: '/settings', icon: Settings }}
            isActive={isActive('/settings')}
          />
        </div>
        <div
          className="flex items-center gap-2 px-4 py-2.5"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <span
            className="h-1.5 w-1.5 rounded-full shrink-0 live-dot"
            style={{ background: 'var(--accent-green)' }}
          />
          <span className="flex-1 text-[10px] font-mono text-[--text-muted]">system online</span>
          <span className="text-[10px] font-mono text-[--text-muted] tabular-nums">
            {new Date().toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </aside>
  );
}
