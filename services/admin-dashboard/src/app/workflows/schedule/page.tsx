'use client';

import { useEffect, useState, useCallback } from 'react';
import { Clock, RefreshCw, Loader2, CalendarDays, Zap, Calendar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { WORKFLOW_CATALOG } from '@/lib/workflow-categories';

/* ── Types ────────────────────────────────────────────────────────────────── */

interface LiveWorkflow {
  id: string;
  displayName: string;
  active: boolean;
  categoryEmoji: string;
  categoryLabel: string;
  scheduleTag: string;
  schedule: string;
  savesHoursPerWeek: number;
  priority: string;
  inDevelopment: boolean;
  n8nUrl: string;
}

interface LiveData {
  workflows: LiveWorkflow[];
  stats: { total: number; active: number };
}

interface PostizPost {
  id: string;
  content?: string;
  publishDate?: string;
  status?: string;
  integration?: { name?: string; identifier?: string };
}

interface ScheduleEntry {
  time: string;
  days: number[]; // 0=Mo … 6=So
  wf: LiveWorkflow & { runFrequency: string };
}

/* ── Parse helpers ────────────────────────────────────────────────────────── */

const DAY_ABR: Record<string, number> = { Mo: 0, Di: 1, Mi: 2, Do: 3, Fr: 4, Sa: 5, So: 6 };

function parseFreq(freq: string, tag: string): { type: 'timed'; time: string; days: number[] } | { type: 'other' } {
  if (!freq || freq === 'on_demand' || tag === 'RT' || tag === 'MAN') return { type: 'other' };
  if (tag === 'MON') return { type: 'other' };

  const daily = freq.match(/^tägl\.\s*(\d{2}:\d{2})$/);
  if (daily) return { type: 'timed', time: daily[1], days: [0, 1, 2, 3, 4, 5, 6] };

  const weekday = freq.match(/^(\w{2})\.\s*(\d{2}:\d{2})$/);
  if (weekday && weekday[1] in DAY_ABR) return { type: 'timed', time: weekday[2], days: [DAY_ABR[weekday[1]]] };

  return { type: 'other' };
}

function buildEntries(workflows: LiveWorkflow[]): ScheduleEntry[] {
  const entries: ScheduleEntry[] = [];
  for (const wf of workflows) {
    const cat = WORKFLOW_CATALOG.find(c => c.n8nId === wf.id || c.newId === (wf as unknown as Record<string,string>).newId);
    const freq = cat?.runFrequency ?? wf.schedule ?? '';
    const tag  = cat?.scheduleKey ?? wf.scheduleTag ?? '';
    const parsed = parseFreq(freq, tag);
    if (parsed.type === 'timed') {
      entries.push({ time: parsed.time, days: parsed.days, wf: { ...wf, runFrequency: freq } });
    }
  }
  return entries.sort((a, b) => a.time.localeCompare(b.time));
}

/* ── Styles ───────────────────────────────────────────────────────────────── */

const S = {
  page:  { padding: '24px 28px 60px', background: 'var(--layer-0)', minHeight: '100vh', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' } as const,
  card:  { background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8 } as const,
  mono:  { fontFamily: 'var(--font-mono)' } as const,
  label: { fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-muted)' } as const,
};

function dot(active: boolean) {
  return (
    <span style={{ width: 7, height: 7, borderRadius: '50%', flexShrink: 0, display: 'inline-block',
      background: active ? 'var(--accent-green)' : 'var(--text-muted)' }} />
  );
}

function priorityColor(p: string) {
  if (p === 'kritisch') return 'var(--accent-red)';
  if (p === 'hoch') return 'var(--accent-amber)';
  if (p === 'mittel') return 'var(--accent-blue)';
  return 'var(--text-muted)';
}

/* ── Tagesplan ────────────────────────────────────────────────────────────── */

function TagesplanView({ entries }: { entries: ScheduleEntry[] }) {
  const byTime = new Map<string, ScheduleEntry[]>();
  for (const e of entries) {
    byTime.set(e.time, [...(byTime.get(e.time) ?? []), e]);
  }
  const times = Array.from(byTime.keys()).sort();

  if (times.length === 0) return (
    <div style={{ ...S.card, padding: 32, textAlign: 'center', color: 'var(--text-muted)', marginTop: 16 }}>
      <Clock style={{ margin: '0 auto 8px', opacity: 0.3, width: 32, height: 32 }} />
      <p style={S.mono}>Keine geplanten Zeitslots gefunden</p>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 16 }}>
      {times.map(time => (
        <div key={time} style={{ ...S.card, display: 'flex', alignItems: 'flex-start', gap: 16, padding: '12px 16px' }}>
          <span style={{ ...S.mono, fontSize: 15, fontWeight: 700, color: 'var(--accent-amber)', minWidth: 52, paddingTop: 2 }}>
            {time}
          </span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, flex: 1 }}>
            {(byTime.get(time) ?? []).map(e => {
              const dayLabel = e.days.length === 7 ? 'tägl.' : e.days.map(d => Object.keys(DAY_ABR)[d]).join(', ');
              return (
                <div key={e.wf.id} style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '6px 12px', borderRadius: 6,
                  background: 'var(--layer-3)', border: '1px solid var(--border)',
                }}>
                  {dot(e.wf.active)}
                  <span style={{ fontSize: 13, color: 'var(--text-primary)' }}>{e.wf.displayName}</span>
                  <span style={{ ...S.mono, fontSize: 10, color: 'var(--text-muted)', background: 'var(--layer-1)', padding: '1px 6px', borderRadius: 4 }}>
                    {dayLabel}
                  </span>
                  {e.wf.inDevelopment && (
                    <span style={{ ...S.mono, fontSize: 9, color: 'var(--accent-amber)' }}>DEV</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── Wochenplan ───────────────────────────────────────────────────────────── */

const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

function todayIndex() {
  const d = new Date().getDay();
  return d === 0 ? 6 : d - 1;
}

interface PostizPostWithDate extends PostizPost {
  dayIndex?: number;
}

function WochenplanView({ entries, posts }: { entries: ScheduleEntry[]; posts: PostizPost[] }) {
  const today = todayIndex();

  // Map Postiz posts to day index
  const postsByDay = new Map<number, PostizPostWithDate[]>();
  for (const p of posts) {
    if (!p.publishDate) continue;
    const d = new Date(p.publishDate).getDay();
    const idx = d === 0 ? 6 : d - 1;
    postsByDay.set(idx, [...(postsByDay.get(idx) ?? []), { ...p, dayIndex: idx }]);
  }

  return (
    <div style={{ marginTop: 16, overflowX: 'auto' }}>
      <div style={{ display: 'flex', gap: 10, minWidth: 700, ...S.card, padding: 16 }}>
        {DAY_NAMES.map((day, idx) => {
          const dayEntries = entries.filter(e => e.days.includes(idx)).sort((a, b) => a.time.localeCompare(b.time));
          const dayPosts   = postsByDay.get(idx) ?? [];
          const isToday    = idx === today;

          return (
            <div key={day} style={{ flex: 1, minWidth: 0 }}>
              {/* Header */}
              <div style={{
                textAlign: 'center', paddingBottom: 8, marginBottom: 8,
                borderBottom: `2px solid ${isToday ? 'var(--accent-blue)' : 'var(--border)'}`,
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: isToday ? 'var(--accent-blue)' : 'var(--text-muted)' }}>
                  {day}
                </span>
              </div>

              {/* Workflow cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, minHeight: 60 }}>
                {dayEntries.map(e => (
                  <div key={e.wf.id} style={{
                    borderRadius: 5, border: `1px solid ${e.wf.active ? 'var(--border)' : 'var(--border)'}`,
                    background: 'var(--layer-2)', padding: '5px 7px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      {dot(e.wf.active)}
                      <span style={{ ...S.mono, fontSize: 10, color: 'var(--accent-amber)' }}>{e.time}</span>
                    </div>
                    <p style={{ fontSize: 11, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                      {e.wf.displayName}
                    </p>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {e.wf.categoryEmoji} {e.wf.categoryLabel}
                    </span>
                  </div>
                ))}

                {/* Postiz posts */}
                {dayPosts.map(p => (
                  <div key={p.id} style={{
                    borderRadius: 5, border: '1px dashed var(--accent-blue)',
                    background: 'rgba(59,130,246,0.05)', padding: '5px 7px',
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
                      <CalendarDays style={{ width: 8, height: 8, color: 'var(--accent-blue)', flexShrink: 0 }} />
                      <span style={{ ...S.mono, fontSize: 10, color: 'var(--accent-blue)' }}>
                        {p.publishDate ? new Date(p.publishDate).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' }) : '?'}
                      </span>
                    </div>
                    <p style={{ fontSize: 10, color: 'var(--text-secondary)', margin: 0, lineHeight: 1.3 }} className="line-clamp-2">
                      {(p.content ?? '').slice(0, 60) || '(kein Text)'}
                    </p>
                    {p.integration?.name && (
                      <span style={{ fontSize: 9, color: 'var(--accent-blue)' }}>{p.integration.name}</span>
                    )}
                  </div>
                ))}

                {dayEntries.length === 0 && dayPosts.length === 0 && (
                  <span style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', paddingTop: 8, display: 'block' }}>—</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginTop: 10, padding: '0 4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {dot(true)}
          <span style={{ ...S.label }}>aktiver Workflow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          {dot(false)}
          <span style={{ ...S.label }}>inaktiver Workflow</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <CalendarDays style={{ width: 8, height: 8, color: 'var(--accent-blue)' }} />
          <span style={{ ...S.label }}>Postiz geplant</span>
        </div>
      </div>
    </div>
  );
}

/* ── Monatsplan ───────────────────────────────────────────────────────────── */

function MonatsplanView({ workflows }: { workflows: LiveWorkflow[] }) {
  const monthly  = WORKFLOW_CATALOG.filter(c => c.scheduleKey === 'MON');
  const onDemand = workflows.filter(wf => {
    const cat = WORKFLOW_CATALOG.find(c => c.n8nId === wf.id);
    return !cat || cat.scheduleKey === 'RT' || cat.scheduleKey === 'MAN';
  });

  const MONATLICH_STATIC = [
    { label: '1. Montag im Monat', name: 'Nischen Scanner', desc: '19_010_ENRICH — manuell ~11:00', color: 'var(--accent-amber)' },
    { label: 'Letzter Freitag', name: 'Content-Pipeline Review', desc: 'manuell — Was hat funktioniert?', color: 'var(--accent-blue)' },
  ];

  return (
    <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Monatliche Aktionen */}
      <div>
        <p style={S.label}>Monatliche Aktionen</p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
          {MONATLICH_STATIC.map(item => (
            <div key={item.name} style={{ ...S.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar style={{ width: 16, height: 16, color: item.color, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>{item.name}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', ...S.mono }}>{item.desc}</p>
              </div>
              <span style={{ ...S.mono, fontSize: 11, color: item.color, background: 'var(--layer-3)', padding: '3px 10px', borderRadius: 12 }}>
                {item.label}
              </span>
            </div>
          ))}
          {monthly.map(c => (
            <div key={c.n8nId} style={{ ...S.card, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Calendar style={{ width: 16, height: 16, color: 'var(--text-muted)', flexShrink: 0 }} />
              <div>
                <p style={{ margin: 0, fontSize: 13, fontWeight: 600 }}>{c.displayName}</p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--text-muted)', ...S.mono }}>{c.runFrequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Auf Abruf */}
      <div>
        <p style={S.label}>Auf Abruf (On-Demand)</p>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
          {onDemand.map(wf => (
            <div key={wf.id} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '6px 12px', borderRadius: 6, background: 'var(--layer-2)', border: '1px solid var(--border)' }}>
              {dot(wf.active)}
              <span style={{ fontSize: 12 }}>{wf.displayName}</span>
            </div>
          ))}
          {onDemand.length === 0 && (
            <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>—</span>
          )}
        </div>
      </div>

      {/* Zeitaufwand Info */}
      <div style={{ ...S.card, padding: '14px 18px', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div>
          <p style={S.label}>Manuell / Monat</p>
          <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-amber)', ...S.mono }}>~2h</p>
        </div>
        <div>
          <p style={S.label}>Automatisch / Monat</p>
          <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-green)', ...S.mono }}>~186h</p>
        </div>
        <div>
          <p style={S.label}>Effizienz-Faktor</p>
          <p style={{ margin: '4px 0 0', fontSize: 20, fontWeight: 700, color: 'var(--accent-blue)', ...S.mono }}>93×</p>
        </div>
      </div>
    </div>
  );
}

/* ── Optimierungs-Tabelle ─────────────────────────────────────────────────── */

function OptimierungsTable({ workflows }: { workflows: LiveWorkflow[] }) {
  const sorted = [...workflows]
    .filter(w => w.savesHoursPerWeek > 0)
    .sort((a, b) => b.savesHoursPerWeek - a.savesHoursPerWeek)
    .slice(0, 12);

  if (sorted.length === 0) return null;

  return (
    <div style={{ marginTop: 32 }}>
      <p style={S.label}>Top Workflows — nach Zeitersparnis/Woche</p>
      <div style={{ overflowX: 'auto', marginTop: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {['Prio', 'Workflow', 'h/Woche', 'Status', 'n8n'].map(h => (
                <th key={h} style={{ textAlign: 'left', padding: '6px 10px', ...S.label }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map(wf => (
              <tr key={wf.id} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ ...S.mono, fontSize: 11, color: priorityColor(wf.priority) }}>{wf.priority}</span>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ fontWeight: 500 }}>{wf.displayName}</span>
                  {wf.inDevelopment && <span style={{ ...S.mono, marginLeft: 6, fontSize: 9, color: 'var(--accent-amber)' }}>DEV</span>}
                </td>
                <td style={{ padding: '8px 10px', ...S.mono, color: 'var(--accent-green)' }}>{wf.savesHoursPerWeek}h</td>
                <td style={{ padding: '8px 10px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                    {dot(wf.active)}
                    <span style={{ ...S.mono, fontSize: 11, color: wf.active ? 'var(--accent-green)' : 'var(--text-muted)' }}>
                      {wf.active ? 'aktiv' : 'inaktiv'}
                    </span>
                  </span>
                </td>
                <td style={{ padding: '8px 10px' }}>
                  <a href={wf.n8nUrl} target="_blank" rel="noopener noreferrer"
                    style={{ ...S.mono, fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none' }}>↗</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function SchedulePage() {
  const [data,        setData]        = useState<LiveData | null>(null);
  const [posts,       setPosts]       = useState<PostizPost[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [liveRes, postizRes] = await Promise.allSettled([
        fetch('/api/n8n/live'),
        fetch('/api/postiz/posts'),
      ]);

      if (liveRes.status === 'fulfilled' && liveRes.value.ok) {
        setData(await liveRes.value.json());
      }
      if (postizRes.status === 'fulfilled' && postizRes.value.ok) {
        const d = await postizRes.value.json();
        setPosts(d.posts ?? []);
      }
      setLastUpdated(new Date());
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
    const id = setInterval(fetchData, 60_000);
    return () => clearInterval(id);
  }, [fetchData]);

  const entries    = data ? buildEntries(data.workflows) : [];
  const workflows  = data?.workflows ?? [];
  const isLive     = !loading && !!data;

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        <Clock style={{ color: 'var(--accent-blue)', width: 20, height: 20, flexShrink: 0 }} />
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Automatisierungs-Zeitplan</h1>
          <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0, ...S.mono }}>
            AIOS — Workflow Schedule &amp; Content Calendar
          </p>
        </div>

        {/* Live badge */}
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'var(--layer-3)', border: '1px solid var(--border)' }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: isLive ? 'var(--accent-green)' : 'var(--text-muted)' }} />
          <span style={{ ...S.mono, fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            {loading ? 'LOADING' : 'LIVE'}
          </span>
        </span>

        {/* Postiz posts badge */}
        {posts.length > 0 && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '3px 10px', borderRadius: 20, background: 'rgba(59,130,246,0.08)', border: '1px solid var(--accent-blue)' }}>
            <CalendarDays style={{ width: 10, height: 10, color: 'var(--accent-blue)' }} />
            <span style={{ ...S.mono, fontSize: 10, color: 'var(--accent-blue)' }}>{posts.length} Postiz Posts</span>
          </span>
        )}

        {/* Stats */}
        {data && (
          <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
            {data.stats.active}/{data.stats.total} aktiv
          </span>
        )}

        <div style={{ flex: 1 }} />

        {lastUpdated && (
          <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
        <Button variant="ghost" size="sm" onClick={fetchData} disabled={loading}>
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
        </Button>
      </div>

      {loading && !data ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, padding: 60, color: 'var(--text-muted)' }}>
          <Loader2 className="w-5 h-5 animate-spin" />
          <span style={S.mono}>Lade Zeitplan…</span>
        </div>
      ) : (
        <>
          <Tabs defaultValue="tagesplan">
            <TabsList>
              <TabsTrigger value="tagesplan">
                <Clock className="w-3.5 h-3.5 mr-1.5" />Tagesplan
              </TabsTrigger>
              <TabsTrigger value="wochenplan">
                <CalendarDays className="w-3.5 h-3.5 mr-1.5" />Wochenplan
                {posts.length > 0 && (
                  <span style={{ marginLeft: 6, background: 'var(--accent-blue)', color: '#fff', borderRadius: 8, padding: '0 5px', fontSize: 9, ...S.mono }}>
                    +{posts.length}
                  </span>
                )}
              </TabsTrigger>
              <TabsTrigger value="monatsplan">
                <Zap className="w-3.5 h-3.5 mr-1.5" />Monatsplan
              </TabsTrigger>
            </TabsList>

            <TabsContent value="tagesplan">
              <TagesplanView entries={entries} />
            </TabsContent>

            <TabsContent value="wochenplan">
              <WochenplanView entries={entries} posts={posts} />
            </TabsContent>

            <TabsContent value="monatsplan">
              <MonatsplanView workflows={workflows} />
            </TabsContent>
          </Tabs>

          <OptimierungsTable workflows={workflows} />
        </>
      )}
    </div>
  );
}
