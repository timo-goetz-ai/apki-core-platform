'use client';

import { useEffect, useState, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { Bot, Plus, RefreshCw, AlertTriangle, ExternalLink } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Agent {
  Id?: number;
  id?: string | number;
  name?: string;
  Name?: string;
  status?: string;
  Status?: string;
  description?: string;
  Description?: string;
  last_run?: string;
  provider?: string;
  model?: string;
  [key: string]: unknown;
}

function getStatus(agent: Agent) {
  return (agent.status ?? agent.Status ?? 'draft') as string;
}
function getName(agent: Agent) {
  return (agent.name ?? agent.Name ?? String(agent.id ?? agent.Id ?? '—')) as string;
}
function formatTs(ts: string | undefined) {
  if (!ts) return '—';
  try {
    return new Date(ts).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
  } catch { return ts; }
}

function StatusBadge({ status }: { status: string }) {
  const s = status.toLowerCase();
  if (s === 'active' || s === 'aktiv') return <Badge variant="success">Aktiv</Badge>;
  if (s === 'paused' || s === 'pausiert') return <Badge variant="warning">Pausiert</Badge>;
  return <Badge variant="secondary">Entwurf</Badge>;
}

const columns: ColumnDef<Agent>[] = [
  {
    accessorFn: (row) => getName(row),
    id: 'name',
    header: 'Agent',
    cell: ({ row }) => (
      <div className="flex items-center gap-2">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-[--layer-3] shrink-0">
          <Bot size={13} className="text-[--accent-blue]" />
        </div>
        <span className="font-medium text-[--text-primary]">{getName(row.original)}</span>
      </div>
    ),
  },
  {
    accessorFn: (row) => getStatus(row),
    id: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={getStatus(row.original)} />,
  },
  {
    accessorKey: 'provider',
    header: 'Provider',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[--text-muted]">{(getValue() as string) ?? '—'}</span>
    ),
  },
  {
    accessorKey: 'model',
    header: 'Modell',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[--text-muted]">{(getValue() as string) ?? '—'}</span>
    ),
  },
  {
    accessorFn: (row) => row.last_run ?? row.lastRun ?? row.last_run_at ?? '',
    id: 'last_run',
    header: 'Zuletzt aktiv',
    cell: ({ getValue }) => (
      <span className="font-mono text-xs text-[--text-muted]">{formatTs(getValue() as string)}</span>
    ),
  },
  {
    accessorFn: (row) => (row.description ?? row.Description ?? '') as string,
    id: 'description',
    header: 'Beschreibung',
    cell: ({ getValue }) => (
      <span className="text-xs text-[--text-muted] line-clamp-1 max-w-[200px]">{(getValue() as string) || '—'}</span>
    ),
  },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/nocodb/agents');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setAgents(Array.isArray(data) ? data : (data.list ?? []));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const active = agents.filter(a => ['active', 'aktiv'].includes(String(a.status ?? a.Status ?? '').toLowerCase())).length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2.5 text-xl font-bold text-[--text-primary]">
            <Bot size={20} className="text-[--accent-blue]" />
            Agenten-Fabrik
          </h1>
          <p className="mt-1 text-sm text-[--text-muted]">Verwaltung und Orchestrierung von KI-Agenten</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            Aktualisieren
          </Button>
          <Button size="sm" onClick={() => window.open('https://nocodb.automation-plus-ki.de', '_blank')}>
            <Plus size={13} />
            In NocoDB anlegen
          </Button>
        </div>
      </div>

      {/* KPI Row */}
      {!loading && agents.length > 0 && (
        <div className="grid grid-cols-3 gap-3 max-w-sm">
          {[
            { label: 'Gesamt', value: agents.length, color: 'text-[--text-primary]' },
            { label: 'Aktiv', value: active, color: 'text-[--accent-green]' },
            { label: 'Inaktiv', value: agents.length - active, color: 'text-[--text-muted]' },
          ].map(s => (
            <Card key={s.label} className="py-3 px-4">
              <p className={`text-lg font-bold font-mono ${s.color}`}>{s.value}</p>
              <p className="text-[10px] text-[--text-muted] uppercase tracking-wider">{s.label}</p>
            </Card>
          ))}
        </div>
      )}

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold text-[--text-secondary]">
            {loading ? 'Laden…' : `${agents.length} Agenten`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
              <AlertTriangle size={24} className="text-[--accent-red]" />
              <p className="text-sm text-[--text-muted]">{error}</p>
              <Button variant="outline" size="sm" onClick={load}>Erneut versuchen</Button>
            </div>
          ) : loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-10 rounded-md bg-[--layer-3] animate-pulse" />
              ))}
            </div>
          ) : agents.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-14 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[--layer-3]">
                <Bot size={22} className="text-[--text-muted]" />
              </div>
              <div>
                <p className="text-sm font-medium text-[--text-primary]">Noch keine Agenten</p>
                <p className="mt-1 text-xs text-[--text-muted]">Lege Agenten in NocoDB an — sie erscheinen hier automatisch.</p>
              </div>
              <a
                href="https://nocodb.automation-plus-ki.de"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium text-[--accent-blue] border border-[--border] hover:bg-[--layer-3] transition-colors no-underline"
              >
                <ExternalLink size={13} />
                NocoDB öffnen
              </a>
            </div>
          ) : (
            <DataTable columns={columns} data={agents} searchKey="name" searchPlaceholder="Agent suchen…" />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
