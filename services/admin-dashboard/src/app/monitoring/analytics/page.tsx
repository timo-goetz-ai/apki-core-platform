'use client';

import { useState, useEffect, useCallback } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TimeSeriesChart, type TimeSeriesPoint } from '@/components/charts/TimeSeriesChart';
import { DistributionChart } from '@/components/charts/DistributionChart';
import { CollectionHeatmap, type HeatmapPoint } from '@/components/charts/CollectionHeatmap';
import { TrendingUp, TrendingDown, Database, BarChart3, Calendar, PieChart } from 'lucide-react';

// ── Collection-Liste (spiegelt src/lib/nocodb.ts `C`) ───────────────────────
const COLLECTIONS = [
  { key: '100_workflows',             label: 'Workflows' },
  { key: '110_agents',                label: 'Agents' },
  { key: '120_subagents',             label: 'Subagents' },
  { key: '130_agent_runs',            label: 'Agent Runs' },
  { key: '200_prompts',               label: 'Prompts' },
  { key: '210_rules',                 label: 'Rules' },
  { key: '220_skills',                label: 'Skills' },
  { key: '230_hooks',                 label: 'Hooks' },
  { key: '240_mcp_configs',           label: 'MCP Configs' },
  { key: '250_plugins',               label: 'Plugins' },
  { key: '260_cursor_configs',        label: 'Cursor Configs' },
  { key: '300_trends',                label: 'Trends' },
  { key: '310_sentiment',             label: 'Sentiment' },
  { key: '320_content_opportunities', label: 'Content Opp.' },
  { key: '330_knowledge_items',       label: 'Knowledge' },
  { key: '340_regulatory',            label: 'Regulatory' },
  { key: '350_tools',                 label: 'Tools' },
  { key: '360_social_proof',          label: 'Social Proof' },
  { key: '400_content_pipeline',      label: 'Content Pipeline' },
  { key: '410_templates',             label: 'Templates' },
  { key: '420_media_assets',          label: 'Media Assets' },
  { key: '430_brand_identity',        label: 'Brand Identity' },
  { key: '440_publish_log',           label: 'Publish Log' },
  { key: '500_clients',               label: 'Clients' },
  { key: '510_tasks',                 label: 'Tasks' },
  { key: '520_mobile_ingest',         label: 'Mobile Ingest' },
] as const;

// Felder, die sich für Verteilungs-Charts eignen (je Collection)
const DISTRIBUTION_FIELDS: Record<string, string[]> = {
  '100_workflows': ['status', 'layer'],
  '110_agents':    ['status', 'layer', 'phase'],
  '130_agent_runs':['status'],
  '300_trends':    ['category', 'status'],
  '310_sentiment': ['direction', 'category'],
  '320_content_opportunities': ['status', 'category'],
  '400_content_pipeline':      ['status', 'type'],
  '420_media_assets':          ['status', 'type'],
  '440_publish_log':           ['status', 'platform'],
  '500_clients':               ['status'],
  '510_tasks':                 ['status', 'priority'],
};

// ── Types ────────────────────────────────────────────────────────────────────
interface OverviewItem {
  collection: string;
  label:      string;
  total:      number;
  weekCount:  number;
  lastUpdated: string;
}

interface OverviewResponse {
  data: OverviewItem[];
  meta: { grandTotal: number; weekTotal: number; collectionCount: number };
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: 'var(--layer-2)' }}
    />
  );
}

function formatDate(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: '2-digit' });
}

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KPICard({ item }: { item: OverviewItem }) {
  const growth = item.weekCount;
  const hasGrowth = growth > 0;

  return (
    <div
      className="rounded-lg p-3 flex flex-col gap-1.5"
      style={{ background: 'var(--layer-1)', border: '1px solid var(--border)' }}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="text-[11px] font-mono truncate" style={{ color: 'var(--text-muted)' }}>
          {item.label}
        </span>
        {growth > 0 && (
          <span className="flex items-center gap-0.5 text-[10px] shrink-0" style={{ color: 'var(--accent-green)' }}>
            <TrendingUp size={10} />
            +{growth}
          </span>
        )}
        {growth === 0 && item.total > 0 && (
          <span className="text-[10px] shrink-0" style={{ color: 'var(--text-muted)' }}>—</span>
        )}
      </div>
      <span className="text-2xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
        {item.total.toLocaleString('de-DE')}
      </span>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        Zuletzt: {formatDate(item.lastUpdated)}
      </span>
    </div>
  );
}

// ── CollectionSelect ─────────────────────────────────────────────────────────
function CollectionSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-md px-3 py-1.5 text-sm outline-none"
      style={{
        background:   'var(--layer-2)',
        border:       '1px solid var(--border)',
        color:        'var(--text-primary)',
        fontFamily:   'var(--font-mono)',
      }}
    >
      {COLLECTIONS.map((c) => (
        <option key={c.key} value={c.key}>{c.label}</option>
      ))}
    </select>
  );
}

// ── Tab: Übersicht ───────────────────────────────────────────────────────────
function TabOverview() {
  const [data, setData]     = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]   = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/stats/overview')
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d: OverviewResponse) => {
        if (!d?.data || !d?.meta) throw new Error('Unerwartetes Antwortformat');
        setData(d);
        setLoading(false);
      })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false); });
  }, []);

  if (loading) return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
      {Array.from({ length: 20 }).map((_, i) => (
        <Skeleton key={i} className="h-20" />
      ))}
    </div>
  );

  if (error || !data) return (
    <p className="text-sm" style={{ color: 'var(--accent-red)' }}>
      Fehler beim Laden: {error || 'Keine Daten'}
    </p>
  );

  return (
    <div className="space-y-4">
      {/* Gesamt-KPIs */}
      <div className="flex flex-wrap gap-4">
        {[
          { label: 'Einträge gesamt', value: data.meta.grandTotal.toLocaleString('de-DE'), icon: Database },
          { label: 'Diese Woche neu', value: data.meta.weekTotal.toLocaleString('de-DE'), icon: TrendingUp },
          { label: 'Collections', value: String(data.meta.collectionCount), icon: BarChart3 },
        ].map(({ label, value, icon: Icon }) => (
          <div
            key={label}
            className="flex items-center gap-3 rounded-lg px-4 py-3"
            style={{ background: 'var(--layer-1)', border: '1px solid var(--border-bright)' }}
          >
            <Icon size={18} style={{ color: 'var(--accent-blue)' }} />
            <div>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{label}</p>
              <p className="text-xl font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>{value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Collection-Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
        {data.data.map((item) => (
          <KPICard key={item.collection} item={item} />
        ))}
      </div>
    </div>
  );
}

// ── Tab: Zeitreihen ──────────────────────────────────────────────────────────
function TabTimeseries() {
  const [collection, setCollection] = useState('300_trends');
  const [limit, setLimit]           = useState(30);
  const [data, setData]             = useState<TimeSeriesPoint[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/stats/timeseries/${collection}?limit=${limit}`)
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d) => { setData(d.data ?? []); setLoading(false); })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false); });
  }, [collection, limit]);

  useEffect(() => { load(); }, [load]);

  const label = COLLECTIONS.find((c) => c.key === collection)?.label ?? collection;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CollectionSelect value={collection} onChange={setCollection} />
        <select
          value={limit}
          onChange={(e) => setLimit(Number(e.target.value))}
          className="rounded-md px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {[14, 30, 60, 90].map((n) => (
            <option key={n} value={n}>Letzte {n} Tage</option>
          ))}
        </select>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--layer-1)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <Skeleton className="h-[300px]" />
        ) : error ? (
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Fehler: {error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-center py-20" style={{ color: 'var(--text-muted)' }}>
            Keine Zeitreihen-Daten für <b>{label}</b>
          </p>
        ) : (
          <TimeSeriesChart
            data={data}
            title={`${label} — Erstellungen pro Tag`}
            style={{ height: 300 }}
          />
        )}
      </div>

      {data.length > 0 && (
        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
          {data.length} Datenpunkte · Gesamt:{' '}
          <b style={{ color: 'var(--text-secondary)' }}>
            {data.reduce((s, d) => s + d.count, 0).toLocaleString('de-DE')}
          </b>
        </p>
      )}
    </div>
  );
}

// ── Tab: Verteilung ──────────────────────────────────────────────────────────
function TabDistribution() {
  const [collection, setCollection] = useState('110_agents');
  const [field, setField]           = useState('status');
  const [chartType, setChartType]   = useState<'bar' | 'pie' | 'donut'>('bar');
  const [labels, setLabels]         = useState<string[]>([]);
  const [values, setValues]         = useState<number[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const availableFields = DISTRIBUTION_FIELDS[collection] ?? ['status'];

  // Reset field wenn Collection wechselt und altes Feld nicht verfügbar
  useEffect(() => {
    if (!availableFields.includes(field)) {
      setField(availableFields[0] ?? 'status');
    }
  }, [collection, availableFields, field]);

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/stats/distribution/${collection}/${field}`)
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d) => {
        setLabels(d.labels ?? []);
        setValues(d.values ?? []);
        setLoading(false);
      })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false); });
  }, [collection, field]);

  useEffect(() => { load(); }, [load]);

  const label = COLLECTIONS.find((c) => c.key === collection)?.label ?? collection;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CollectionSelect value={collection} onChange={setCollection} />
        <select
          value={field}
          onChange={(e) => setField(e.target.value)}
          className="rounded-md px-3 py-1.5 text-sm outline-none"
          style={{ background: 'var(--layer-2)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
        >
          {availableFields.map((f) => (
            <option key={f} value={f}>{f}</option>
          ))}
        </select>
        <div className="flex rounded-md overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {(['bar', 'pie', 'donut'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className="px-3 py-1.5 text-xs transition-colors"
              style={{
                background: chartType === t ? 'var(--accent-blue)' : 'var(--layer-2)',
                color: chartType === t ? '#fff' : 'var(--text-secondary)',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--layer-1)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <Skeleton className="h-[300px]" />
        ) : error ? (
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Fehler: {error}</p>
        ) : labels.length === 0 ? (
          <p className="text-sm text-center py-20" style={{ color: 'var(--text-muted)' }}>
            Keine Verteilungsdaten für <b>{label}.{field}</b>
          </p>
        ) : (
          <DistributionChart
            labels={labels}
            values={values}
            type={chartType}
            title={`${label} — nach ${field}`}
            style={{ height: 300 }}
          />
        )}
      </div>
    </div>
  );
}

// ── Tab: Heatmap ─────────────────────────────────────────────────────────────
function TabHeatmap() {
  const [collection, setCollection] = useState('300_trends');
  const [data, setData]             = useState<HeatmapPoint[]>([]);
  const [max, setMax]               = useState(0);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setError('');
    fetch(`/api/stats/heatmap/${collection}?days=365`)
      .then((r) => { if (!r.ok) throw new Error(`API ${r.status}`); return r.json(); })
      .then((d) => {
        setData(d.data ?? []);
        setMax(d.meta?.max ?? 0);
        setLoading(false);
      })
      .catch((e: unknown) => { setError(e instanceof Error ? e.message : String(e)); setLoading(false); });
  }, [collection]);

  useEffect(() => { load(); }, [load]);

  const label = COLLECTIONS.find((c) => c.key === collection)?.label ?? collection;
  const total = data.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <CollectionSelect value={collection} onChange={setCollection} />
        {total > 0 && (
          <span className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>
            {total.toLocaleString('de-DE')} Einträge im letzten Jahr
          </span>
        )}
      </div>

      <div
        className="rounded-lg p-4"
        style={{ background: 'var(--layer-1)', border: '1px solid var(--border)' }}
      >
        {loading ? (
          <Skeleton className="h-[180px]" />
        ) : error ? (
          <p className="text-sm" style={{ color: 'var(--accent-red)' }}>Fehler: {error}</p>
        ) : data.length === 0 ? (
          <p className="text-sm text-center py-10" style={{ color: 'var(--text-muted)' }}>
            Keine Aktivität für <b>{label}</b> im letzten Jahr
          </p>
        ) : (
          <CollectionHeatmap
            data={data}
            max={max || undefined}
            title={`${label} — Aktivitätsheatmap`}
            style={{ height: 200 }}
          />
        )}
      </div>
    </div>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
          Directus Analytics
        </h1>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>
          Aggregierte Statistiken über alle 26 Collections
        </p>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="overview">
        <TabsList
          className="gap-1 p-1 rounded-lg"
          style={{ background: 'var(--layer-1)', border: '1px solid var(--border)' }}
        >
          <TabsTrigger value="overview" className="flex items-center gap-1.5 text-xs">
            <Database size={13} /> Übersicht
          </TabsTrigger>
          <TabsTrigger value="timeseries" className="flex items-center gap-1.5 text-xs">
            <BarChart3 size={13} /> Zeitreihen
          </TabsTrigger>
          <TabsTrigger value="distribution" className="flex items-center gap-1.5 text-xs">
            <PieChart size={13} /> Verteilung
          </TabsTrigger>
          <TabsTrigger value="heatmap" className="flex items-center gap-1.5 text-xs">
            <Calendar size={13} /> Heatmap
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview"     className="mt-4"><TabOverview /></TabsContent>
        <TabsContent value="timeseries"   className="mt-4"><TabTimeseries /></TabsContent>
        <TabsContent value="distribution" className="mt-4"><TabDistribution /></TabsContent>
        <TabsContent value="heatmap"      className="mt-4"><TabHeatmap /></TabsContent>
      </Tabs>
    </div>
  );
}
