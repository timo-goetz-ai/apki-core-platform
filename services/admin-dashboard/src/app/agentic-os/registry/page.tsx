'use client';

import { useState, useEffect, useCallback } from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { CheckCircle, XCircle, RefreshCw, Box, Cpu, GitBranch, Container, Layers } from 'lucide-react';
import { DataTable } from '@/components/ui/data-table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import type { Resource, ResourceStatus, ResourceType } from '@/lib/nocodb';

const TYPE_ICON: Record<ResourceType, React.ElementType> = {
  docker:  Container,
  model:   Cpu,
  coolify: Layers,
  github:  GitBranch,
  mcp:     Box,
};

const TYPE_COLOR: Record<ResourceType, string> = {
  docker:  '#38bdf8',
  model:   '#a78bfa',
  coolify: '#fb923c',
  github:  '#f1f5f9',
  mcp:     '#34d399',
};

const STATUS_VARIANT: Record<ResourceStatus, 'warning' | 'success' | 'destructive'> = {
  discovered: 'warning',
  approved:   'success',
  blocked:    'destructive',
};

type FilterStatus = 'all' | ResourceStatus;

export default function RegistryPage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [updating, setUpdating] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/nocodb/resources');
      const data = await res.json();
      setResources(Array.isArray(data) ? data : (data.list ?? []));
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (id: string | number, status: ResourceStatus) => {
    setUpdating(String(id));
    // optimistic
    setResources(prev => prev.map(r => String(r.Id) === String(id) ? { ...r, status } : r));
    try {
      await fetch(`/api/nocodb/resources/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch { load(); }
    finally { setUpdating(null); }
  };

  const visible = filter === 'all' ? resources : resources.filter(r => r.status === filter);

  const counts = {
    all:        resources.length,
    discovered: resources.filter(r => r.status === 'discovered').length,
    approved:   resources.filter(r => r.status === 'approved').length,
    blocked:    resources.filter(r => r.status === 'blocked').length,
  };

  const columns: ColumnDef<Resource>[] = [
    {
      id: 'type',
      accessorKey: 'type',
      header: 'Typ',
      cell: ({ row }) => {
        const t = row.original.type as ResourceType;
        const Icon = TYPE_ICON[t] ?? Box;
        return (
          <div className="flex items-center gap-2">
            <Icon size={13} style={{ color: TYPE_COLOR[t] }} />
            <span className="text-xs font-mono uppercase tracking-wide" style={{ color: TYPE_COLOR[t] }}>{t}</span>
          </div>
        );
      },
    },
    {
      id: 'name',
      accessorKey: 'name',
      header: 'Name',
      cell: ({ row }) => (
        <span className="font-medium text-[--text-primary] font-mono text-sm">{row.original.name}</span>
      ),
    },
    {
      id: 'source',
      accessorKey: 'source',
      header: 'Quelle',
      cell: ({ row }) => (
        <span className="text-xs text-[--text-muted] font-mono">{row.original.source ?? '—'}</span>
      ),
    },
    {
      id: 'status',
      accessorKey: 'status',
      header: 'Status',
      cell: ({ row }) => {
        const s = row.original.status as ResourceStatus;
        return <Badge variant={STATUS_VARIANT[s]}>{s}</Badge>;
      },
    },
    {
      id: 'discovered_at',
      accessorKey: 'discovered_at',
      header: 'Entdeckt',
      cell: ({ row }) => {
        const d = row.original.discovered_at;
        if (!d) return <span className="text-xs text-[--text-muted]">—</span>;
        return (
          <span className="text-xs font-mono text-[--text-muted]">
            {new Date(d).toLocaleString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
          </span>
        );
      },
    },
    {
      id: 'actions',
      header: 'Aktionen',
      cell: ({ row }) => {
        const id = row.original.Id!;
        const status = row.original.status;
        const busy = updating === String(id);
        return (
          <div className="flex items-center gap-2">
            {status !== 'approved' && (
              <button
                onClick={() => updateStatus(id, 'approved')}
                disabled={busy}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[--layer-3] text-[--accent-green]"
              >
                <CheckCircle size={12} /> Approve
              </button>
            )}
            {status !== 'blocked' && (
              <button
                onClick={() => updateStatus(id, 'blocked')}
                disabled={busy}
                className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium transition-colors hover:bg-[--layer-3] text-red-400"
              >
                <XCircle size={12} /> Block
              </button>
            )}
          </div>
        );
      },
    },
  ];

  const FILTERS: { key: FilterStatus; label: string; color: string }[] = [
    { key: 'all',        label: `Alle (${counts.all})`,               color: '#94a3b8' },
    { key: 'discovered', label: `Neu (${counts.discovered})`,         color: '#fbbf24' },
    { key: 'approved',   label: `Freigegeben (${counts.approved})`,   color: '#34d399' },
    { key: 'blocked',    label: `Blockiert (${counts.blocked})`,      color: '#f87171' },
  ];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[--text-primary]">Resource Registry</h1>
          <p className="text-sm text-[--text-muted] mt-0.5">Auto-entdeckte Ressourcen — freigeben oder blockieren</p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
          Aktualisieren
        </Button>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Gesamt',       value: counts.all,        color: '#38bdf8' },
          { label: 'Neu',          value: counts.discovered, color: '#fbbf24' },
          { label: 'Freigegeben',  value: counts.approved,   color: '#34d399' },
          { label: 'Blockiert',    value: counts.blocked,    color: '#f87171' },
        ].map(({ label, value, color }) => (
          <Card key={label}>
            <CardContent className="p-4">
              <p className="text-xs text-[--text-muted] uppercase tracking-wide font-mono">{label}</p>
              <p className="text-2xl font-bold mt-1" style={{ color }}>{value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {FILTERS.map(({ key, label, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="rounded-md px-3 py-1.5 text-xs font-mono transition-all"
            style={{
              background: filter === key ? `${color}18` : 'var(--layer-2)',
              border: `1px solid ${filter === key ? color : 'var(--border)'}`,
              color: filter === key ? color : 'var(--text-muted)',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={visible}
        searchKey="name"
        searchPlaceholder="Ressource suchen…"
      />
    </div>
  );
}
