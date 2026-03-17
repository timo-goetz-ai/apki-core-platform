'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  icon: string;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const NAV_SECTIONS: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Cockpit', href: '/', icon: '🎯' },
    ],
  },
  {
    title: 'KI-SYSTEM',
    items: [
      { label: 'Agenten-Fabrik', href: '/agents', icon: '🤖' },
      { label: 'Workflows', href: '/workflows', icon: '⚡' },
      { label: 'Tools & Skills', href: '/tools', icon: '🔧' },
    ],
  },
  {
    title: 'DATEN',
    items: [
      { label: 'Datenbanken', href: '/databases', icon: '💾' },
      { label: 'File Browser', href: '/files', icon: '📁' },
      { label: 'Logs', href: '/logs', icon: '📜' },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { label: 'Grafana', href: '/monitoring/grafana', icon: '📊' },
      { label: 'Container', href: '/monitoring/containers', icon: '🐳' },
      { label: 'Alerts', href: '/monitoring/alerts', icon: '🚨' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', href: '/settings', icon: '⚙️' },
      { label: 'MCP Platform', href: '/mcp-plattform', icon: '🔌' },
    ],
  },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-[52px] bottom-0 w-60 bg-slate-900 border-r border-slate-700/50 overflow-y-auto z-40 flex flex-col">
      <nav className="flex-1 py-3 px-2">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title} className="mb-4">
            <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest px-3 mb-1.5">
              {section.title}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors ${
                        isActive
                          ? 'bg-slate-700/60 text-white font-medium'
                          : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                      }`}
                    >
                      <span className="text-base leading-none">{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
