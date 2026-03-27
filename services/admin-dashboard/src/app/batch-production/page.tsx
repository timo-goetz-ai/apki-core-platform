'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers, Play, RefreshCw, FileText, Image, Mic, Globe,
  CheckCircle2, Loader2, XCircle, Clock, AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { BatchJob } from '@/lib/nocodb';

// ─── Typen ───────────────────────────────────────────────────────────────────

type Step = 'blog' | 'image' | 'voice';

const STEP_META: Record<Step, { label: string; icon: React.ElementType }> = {
  blog:  { label: 'Blog-Text',  icon: FileText },
  image: { label: 'Hero-Bild',  icon: Image    },
  voice: { label: 'Voice-Over', icon: Mic      },
};

const CATEGORIES = ['KI-Tools', 'Tutorial', 'Review', 'News', 'Allgemein'];

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function BatchStatusBadge({ status }: { status: BatchJob['status'] }) {
  const map: Record<BatchJob['status'], { label: string; className: string; icon: React.ElementType }> = {
    queued:  { label: 'Queued',   className: 'bg-[--layer-3] text-[--text-muted]',   icon: Clock        },
    running: { label: 'Running',  className: 'bg-blue-500/20 text-blue-400',          icon: Loader2      },
    partial: { label: 'Partial',  className: 'bg-amber-500/20 text-amber-400',        icon: AlertCircle  },
    done:    { label: 'Done',     className: 'bg-green-500/20 text-green-400',        icon: CheckCircle2 },
    failed:  { label: 'Failed',   className: 'bg-red-500/20 text-red-400',            icon: XCircle      },
  };
  const { label, className, icon: Icon } = map[status] ?? map.queued;
  return (
    <Badge className={cn('flex items-center gap-1 text-[10px] font-mono px-1.5 py-0 rounded-sm border-0', className)}>
      <Icon className={cn('w-3 h-3', status === 'running' && 'animate-spin')} />
      {label}
    </Badge>
  );
}

// ─── BatchRow ─────────────────────────────────────────────────────────────────

function BatchRow({ job }: { job: BatchJob }) {
  const topics = JSON.parse(job.topics_json ?? '[]') as string[];
  const steps  = JSON.parse(job.steps_json  ?? '["blog","image","voice"]') as Step[];
  const pct    = job.total_count > 0 ? Math.round((job.done_count / job.total_count) * 100) : 0;

  return (
    <div className="border border-[--border] rounded-lg bg-[--layer-1] p-4 space-y-3">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <BatchStatusBadge status={job.status} />
            <span className="text-[--text-muted] text-xs font-mono">{job.batch_id?.slice(0, 8)}…</span>
            <Badge className="bg-[--layer-3] text-[--text-muted] text-[10px] border-0 px-1.5 py-0">
              {job.category}
            </Badge>
          </div>
          <p className="text-[--text-secondary] text-xs mt-1">
            {job.total_count} Topics · {job.done_count} fertig · {job.error_count} Fehler
          </p>
        </div>
        <div className="text-right text-xs text-[--text-muted] font-mono whitespace-nowrap">
          {job.created_at ? new Date(job.created_at).toLocaleString('de-DE') : '—'}
        </div>
      </div>

      {/* Fortschrittsbalken */}
      <div className="w-full bg-[--layer-3] rounded-full h-1.5">
        <div
          className={cn(
            'h-1.5 rounded-full transition-all',
            job.status === 'failed' ? 'bg-red-500' : job.status === 'done' ? 'bg-green-500' : 'bg-blue-500'
          )}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {steps.map((step) => {
          const { label, icon: Icon } = STEP_META[step] ?? { label: step, icon: Globe };
          return (
            <span
              key={step}
              className="flex items-center gap-1 text-[11px] text-[--text-muted] bg-[--layer-2] px-2 py-0.5 rounded"
            >
              <Icon className="w-3 h-3" />
              {label}
            </span>
          );
        })}
      </div>

      {/* Topics Preview */}
      <div className="flex flex-wrap gap-1">
        {topics.slice(0, 5).map((t, i) => (
          <span key={i} className="text-[10px] bg-[--layer-2] text-[--text-secondary] px-2 py-0.5 rounded truncate max-w-[200px]">
            {t}
          </span>
        ))}
        {topics.length > 5 && (
          <span className="text-[10px] text-[--text-muted]">+{topics.length - 5} mehr</span>
        )}
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function BatchProductionPage() {
  const [topicsRaw, setTopicsRaw]     = useState('');
  const [category, setCategory]       = useState('KI-Tools');
  const [steps, setSteps]             = useState<Step[]>(['blog', 'image', 'voice']);
  const [scheduledAt, setScheduledAt] = useState('');
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [jobs, setJobs]               = useState<BatchJob[]>([]);
  const [loading, setLoading]         = useState(true);

  const loadJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/content-factory/batch');
      const data = await res.json() as { jobs: BatchJob[] };
      setJobs(data.jobs ?? []);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadJobs();
    const iv = setInterval(() => void loadJobs(), 8000);
    return () => clearInterval(iv);
  }, [loadJobs]);

  const topics = topicsRaw
    .split('\n')
    .map((t) => t.trim())
    .filter(Boolean);

  const toggleStep = (s: Step) => {
    setSteps((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    );
  };

  const handleSubmit = async () => {
    if (!topics.length) { setError('Mindestens 1 Topic eingeben'); return; }
    if (topics.length > 20) { setError('Maximal 20 Topics erlaubt'); return; }
    if (!steps.length) { setError('Mindestens 1 Schritt auswählen'); return; }

    setSubmitting(true);
    setError('');
    try {
      const res = await fetch('/api/content-factory/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topics, category, steps, scheduled_at: scheduledAt || undefined }),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error ?? 'Fehler beim Starten');
      setTopicsRaw('');
      setScheduledAt('');
      await loadJobs();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler');
    } finally {
      setSubmitting(false);
    }
  };

  const running  = jobs.filter((j) => j.status === 'running').length;
  const done     = jobs.filter((j) => j.status === 'done').length;
  const queued   = jobs.filter((j) => j.status === 'queued').length;

  return (
    <div className="min-h-screen bg-[--layer-0] p-6">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Layers className="w-6 h-6 text-[--accent-blue]" />
            <div>
              <h1 className="text-xl font-semibold text-[--text-primary]">Batch Production</h1>
              <p className="text-sm text-[--text-muted]">Bis zu 20 Topics gleichzeitig produzieren</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm">
            {running > 0 && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <Loader2 className="w-3.5 h-3.5 animate-spin" /> {running} aktiv
              </span>
            )}
            {queued > 0 && <span className="text-[--text-muted]">{queued} wartend</span>}
            {done > 0   && <span className="text-green-400">{done} fertig</span>}
            <Button variant="ghost" size="sm" onClick={loadJobs}>
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Eingabe-Panel */}
        <div className="border border-[--border] rounded-xl bg-[--layer-1] p-5 space-y-4">
          <h2 className="text-sm font-medium text-[--text-primary]">Neuer Batch</h2>

          {/* Topics Textarea */}
          <div className="space-y-1.5">
            <label className="text-xs text-[--text-muted]">
              Topics <span className="text-[--text-muted]">(eine pro Zeile, max. 20)</span>
            </label>
            <textarea
              value={topicsRaw}
              onChange={(e) => setTopicsRaw(e.target.value)}
              placeholder={"ChatGPT vs Claude 2026\nLLM fine-tuning für Einsteiger\nTop 5 KI-Tools für Content Creator"}
              rows={6}
              className="w-full rounded-lg bg-[--layer-2] border border-[--border] text-[--text-primary] text-sm px-3 py-2 placeholder:text-[--text-muted] resize-none focus:outline-none focus:border-[--accent-blue] font-mono"
            />
            <p className={cn(
              'text-xs',
              topics.length > 20 ? 'text-red-400' : 'text-[--text-muted]'
            )}>
              {topics.length} / 20 Topics
            </p>
          </div>

          {/* Kategorie + Steps */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-[--text-muted]">Kategorie</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full rounded-lg bg-[--layer-2] border border-[--border] text-[--text-primary] text-sm px-3 py-2 focus:outline-none focus:border-[--accent-blue]"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-[--text-muted]">Schritte</label>
              <div className="flex gap-2 flex-wrap">
                {(Object.entries(STEP_META) as [Step, typeof STEP_META[Step]][]).map(([key, { label, icon: Icon }]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => toggleStep(key)}
                    className={cn(
                      'flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border transition-colors',
                      steps.includes(key)
                        ? 'border-[--accent-blue] text-[--accent-blue] bg-blue-500/10'
                        : 'border-[--border] text-[--text-muted] bg-[--layer-2] hover:border-[--border-bright]'
                    )}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Zeitplan (optional) */}
          <div className="space-y-1.5">
            <label className="text-xs text-[--text-muted]">Zeitplan (optional)</label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className="rounded-lg bg-[--layer-2] border border-[--border] text-[--text-primary] text-sm px-3 py-2 focus:outline-none focus:border-[--accent-blue]"
            />
          </div>

          {error && (
            <p className="flex items-center gap-2 text-sm text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </p>
          )}

          <Button
            onClick={handleSubmit}
            disabled={submitting || topics.length === 0}
            className="bg-[--accent-blue] hover:bg-blue-600 text-white gap-2"
          >
            {submitting ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Starte Batch…</>
            ) : (
              <><Play className="w-4 h-4" /> {topics.length} Topics starten</>
            )}
          </Button>
        </div>

        {/* Job-Queue */}
        <div className="space-y-3">
          <h2 className="text-sm font-medium text-[--text-primary]">
            Batch-Queue <span className="text-[--text-muted] font-normal">({jobs.length})</span>
          </h2>

          {loading ? (
            <div className="flex items-center justify-center py-12 text-[--text-muted]">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              Lade Jobs…
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-12 text-[--text-muted] border border-dashed border-[--border] rounded-xl">
              <Layers className="w-8 h-8 mx-auto mb-2 opacity-40" />
              <p>Noch keine Batch-Jobs</p>
            </div>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <BatchRow key={job.Id ?? job.batch_id} job={job} />
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
