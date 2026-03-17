'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Bot, Workflow, Wrench,
  Database, FolderOpen, ScrollText,
  BarChart2, Container, Bell,
  Settings, Plug, ChevronRight, Activity,
} from 'lucide-react';

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
  ready: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Cockpit',       href: '/',                    icon: <LayoutDashboard size={14} />, ready: true },
    ],
  },
  {
    title: 'KI-SYSTEM',
    items: [
      { label: 'Agenten-Fabrik',href: '/agents',              icon: <Bot size={14} />,             ready: true },
      { label: 'Workflows',     href: '/workflows',           icon: <Workflow size={14} />,         ready: true },
      { label: 'Tools & Skills',href: '/tools',               icon: <Wrench size={14} />,           ready: true },
    ],
  },
  {
    title: 'DATEN',
    items: [
      { label: 'Datenbanken',   href: '/databases',           icon: <Database size={14} />,         ready: true },
      { label: 'File Browser',  href: '/files',               icon: <FolderOpen size={14} />,       ready: true },
      { label: 'Logs',          href: '/logs',                icon: <ScrollText size={14} />,       ready: true },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { label: 'Grafana',       href: '/monitoring/grafana',  icon: <BarChart2 size={14} />,        ready: true },
      { label: 'Container',     href: '/monitoring/containers',icon: <Container size={14} />,       ready: true },
      { label: 'Alerts',        href: '/monitoring/alerts',   icon: <Bell size={14} />,             ready: true },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'MCP Platform',  href: '/mcp-plattform',       icon: <Plug size={14} />,            ready: true },
      { label: 'Settings',      href: '/settings',            icon: <Settings size={14} />,         ready: true },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside style={{
      position: 'fixed',
      top: 0,
      left: 0,
      bottom: 0,
      width: 240,
      zIndex: 40,
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--layer-1)',
      borderRight: '1px solid var(--border)',
      paddingTop: 90,
    }}>

      {/* Nav */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 10px 16px' }}>
        {NAV.map((section) => (
          <div key={section.title} style={{ marginBottom: 22 }}>

            {/* Section label */}
            <p style={{
              fontSize: 9,
              fontFamily: 'var(--font-mono)',
              fontWeight: 500,
              letterSpacing: '0.12em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              padding: '0 10px',
              marginBottom: 3,
            }}>
              {section.title}
            </p>

            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== '/' && pathname.startsWith(item.href));

              if (!item.ready) {
                return (
                  <div
                    key={item.href}
                    title="Coming soon"
                    style={{
                      display: 'flex', alignItems: 'center', gap: 9,
                      padding: '7px 10px', borderRadius: 8, marginBottom: 1,
                      opacity: 0.35, cursor: 'not-allowed',
                      color: 'var(--text-muted)', fontSize: 13,
                    }}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                    <span style={{
                      marginLeft: 'auto', fontSize: 8,
                      fontFamily: 'var(--font-mono)', letterSpacing: '0.05em',
                      padding: '1px 5px', borderRadius: 3,
                      background: 'rgba(148,163,184,0.07)',
                      color: 'var(--text-muted)',
                    }}>soon</span>
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    padding: '7px 10px',
                    borderRadius: 8,
                    marginBottom: 1,
                    textDecoration: 'none',
                    fontSize: 13,
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                    background: isActive ? 'rgba(56,189,248,0.08)' : 'transparent',
                    borderLeft: isActive
                      ? '2px solid var(--accent-blue)'
                      : '2px solid transparent',
                    transition: 'all 0.12s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = 'var(--layer-2)';
                      el.style.color = 'var(--text-primary)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      const el = e.currentTarget as HTMLAnchorElement;
                      el.style.background = 'transparent';
                      el.style.color = 'var(--text-secondary)';
                    }
                  }}
                >
                  <span style={{ color: isActive ? 'var(--accent-blue)' : 'inherit', flexShrink: 0 }}>
                    {item.icon}
                  </span>
                  <span style={{ flex: 1 }}>{item.label}</span>
                  {isActive && (
                    <ChevronRight size={10} style={{ color: 'var(--accent-blue)', flexShrink: 0 }} />
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom: system status */}
      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
      }}>
        <Activity size={11} style={{ color: 'var(--accent-green)', flexShrink: 0 }} />
        <span style={{
          fontSize: 10,
          fontFamily: 'var(--font-mono)',
          color: 'var(--text-muted)',
          flex: 1,
        }}>
          system online
        </span>
        <span style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: 'var(--accent-green)',
          flexShrink: 0,
          animation: 'glow-pulse 2s ease-in-out infinite',
        }} />
      </div>
    </aside>
  );
}
