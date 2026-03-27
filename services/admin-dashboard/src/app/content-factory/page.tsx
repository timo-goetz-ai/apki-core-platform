'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Factory, Play, RefreshCw, ChevronDown, ChevronUp,
  FileText, Image, Mic, Globe, CheckCircle2, Loader2,
  XCircle, Clock, ExternalLink,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type { PipelineJob } from '@/lib/nocodb';

// ─── Typen ───────────────────────────────────────────────────────────────────

type Step = 'blog' | 'image' | 'voice' | 'publish';

const STEP_META: Record<Step, { label: string; icon: React.ElementType }> = {
  blog:    { label: 'Blog-Text',  icon: FileText },
  image:   { label: 'Hero-Bild',  icon: Image    },
  voice:   { label: 'Voice-Over', icon: Mic      },
  publish: { label: 'Publish',    icon: Globe     },
};

const CATEGORIES = ['KI-Tools', 'Tutorial', 'Review', 'News', 'Allgemein'];

const STAGE_ORDER: PipelineJob['stage'][] = ['text', 'image', 'voice', 'publish', 'done'];

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: PipelineJob['status'] }) {
  const map: Record<PipelineJob['status'], { label: string; className: string }> = {
    idle:    { label: 'Idle',    className: 'bg-[--layer-3] text-[--text-muted]'    },
    running: { label: 'Running', className: 'bg-blue-500/20 text-blue-400'          },
    done:    { label: 'Done',    className: 'bg-green-500/20 text-green-400'        },
    error:   { label: 'Error',   className: 'bg-red-500/20 text-red-400'            },
  };
  const { label, className } = map[status] ?? map.idle;
  return (
    <Badge className={cn('text-[10px] font-mono px-1.5 py-0 rounded-sm border-0', className)}>
      {label}
    </Badge>
  );
}

// ─── StepTimeline ─────────────────────────────────────────────────────────────

function StepTimeline({ job }: { job: PipelineJob }) {
  const steps = JSON.parse(job.steps_requested ?? '["blog","image","voice"]') as Step[];
  const stageIndex = STAGE_ORDER.indexOf(job.stage);

  const stepToStage: Record<Step, PipelineJob['stage']> = {
    blog:    'text',
    image:   'image',
    voice:   'voice',
    publish: 'publish',
  };

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {steps.map((step, i) => {
        const { label, icon: Icon } = STEP_META[step];
        const stageForStep = stepToStage[step];
        const stepIdx = STAGE_ORDER.indexOf(stageForStep);
        const isActive  = job.stage === stageForStep && job.status === 'running';
        const isDone    = stageIndex > stepIdx || job.status === 'done';
        const isError   = job.status === 'error' && job.stage === stageForStep;

        return (
          <React.Fragment key={step}>
            <div
              className={cn(
                'flex items-center gap-1 px-2 py-1 rounded text-[11px] font-mono',
                isDone   && 'text-green-400',
                isActive && 'text-blue-400',
                isError  && 'text-red-400',
                !isDone && !isActive && !isError && 'text-[--text-muted]'
              )}
            >
              {isDone   && <CheckCircle2 size={11} />}
              {isActive && <Loader2 size={11} className="animate-spin" />}
              {isError  && <XCircle size={11} />}
              {!isDone && !isActive && !isError && <Clock size={11} />}
              <Icon size={11} />
              <span>{label}</span>
            </div>
            {i < steps.length - 1 && (
              <span className="text-[--text-muted] text-[10px]">→</span>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── PipelineDetail ───────────────────────────────────────────────────────────

function PipelineDetail({ job }: { job: PipelineJob }) {
  return (
    <div className="mt-3 border-t pt-3 space-y-4" style={{ borderColor: 'var(--border)' }}>
      <StepTimeline job={job} />

      {job.error_message && (
        <div className="rounded p-2 text-[11px] font-mono text-red-400 bg-red-500/10">
          {job.error_message}
        </div>
      )}

      {job.content_text && (
        <div>
          <p className="text-[10px] font-mono text-[--text-muted] mb-1 uppercase tracking-wider">Blog-Text</p>
          <div
            className="rounded p-3 text-[12px] text-[--text-secondary] max-h-48 overflow-y-auto leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--layer-3)' }}
          >
            {job.content_text.slice(0, 1200)}{job.content_text.length > 1200 ? '…' : ''}
          </div>
        </div>
      )}

      {job.image_url && (
        <div>
          <p className="text-[10px] font-mono text-[--text-muted] mb-1 uppercase tracking-wider">Hero-Bild</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={job.image_url}
            alt="Hero"
            className="rounded w-full max-h-56 object-cover"
          />
        </div>
      )}

      {job.voice_url && (
        <div>
          <p className="text-[10px] font-mono text-[--text-muted] mb-1 uppercase tracking-wider">Voice-Over</p>
          <audio controls src={job.voice_url} className="w-full h-8" />
        </div>
      )}

      {job.blog_id && (
        <a
          href={`https://blog.automation-plus-ki.de/posts/${job.blog_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-[12px] text-blue-400 hover:underline"
        >
          <ExternalLink size={12} />
          Auf Blog ansehen
        </a>
      )}
    </div>
  );
}

// ─── PipelineRow ─────────────────────────────────────────────────────────────

function PipelineRow({
  job,
  onRetry,
}: {
  job: PipelineJob;
  onRetry: (id: number) => void;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="rounded-lg border px-4 py-3"
      style={{ background: 'var(--layer-2)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <span
          className={cn(
            'h-2 w-2 rounded-full shrink-0',
            job.status === 'running' && 'bg-blue-400 animate-pulse',
            job.status === 'done'    && 'bg-green-400',
            job.status === 'error'   && 'bg-red-400',
            job.status === 'idle'    && 'bg-[--text-muted]',
          )}
        />

        <div className="flex-1 min-w-0">
          <p className="text-[13px] font-medium text-[--text-primary] truncate">{job.topic}</p>
          <p className="text-[11px] text-[--text-muted] font-mono">{job.category}</p>
        </div>

        <StatusBadge status={job.status} />

        <div className="flex items-center gap-1.5">
          {job.status === 'error' && (
            <Button
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[11px]"
              onClick={() => job.Id && onRetry(job.Id)}
            >
              <RefreshCw size={11} className="mr-1" />
              Retry
            </Button>
          )}
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[--text-muted] hover:text-[--text-primary] transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
      </div>

      {expanded && <PipelineDetail job={job} />}
    </div>
  );
}

// ─── PipelineInput ────────────────────────────────────────────────────────────

function PipelineInput({ onStarted }: { onStarted: () => void }) {
  const [topic, setTopic]       = useState('');
  const [category, setCategory] = useState('Allgemein');
  const [steps, setSteps]       = useState<Step[]>(['blog', 'image', 'voice']);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const toggleStep = (step: Step) => {
    setSteps((prev) =>
      prev.includes(step) ? prev.filter((s) => s !== step) : [...prev, step]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;
    setLoading(true);
    setError('');

    try {
      // 1. Job in NocoDB anlegen
      const res = await fetch('/api/content-factory/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic: topic.trim(), category, steps }),
      });
      const { job, error: err } = await res.json() as { job?: PipelineJob; error?: string };
      if (err || !job?.Id) throw new Error(err ?? 'Job konnte nicht angelegt werden');

      onStarted();
      setTopic('');

      // 2. Run feuern (fire-and-forget — UI pollt)
      fetch(`/api/content-factory/pipeline/${job.Id}/run`, { method: 'POST' }).catch(() => {});
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border p-5 space-y-4"
      style={{ background: 'var(--layer-2)', borderColor: 'var(--border)' }}
    >
      <h2 className="text-[13px] font-semibold text-[--text-primary]">Neue Pipeline</h2>

      <div className="space-y-2">
        <p className="text-[11px] text-[--text-muted] uppercase tracking-wider font-mono">Thema</p>
        <Input
          id="topic"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="z. B. KI-Tools für Content Creator 2026"
          className="text-[13px] h-8"
          required
        />
      </div>

      <div className="space-y-2">
        <p className="text-[11px] text-[--text-muted] uppercase tracking-wider font-mono">Kategorie</p>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="h-8 w-full rounded-md border px-2 text-[12px] bg-transparent text-[--text-primary] outline-none focus:ring-1"
          style={{ borderColor: 'var(--border)', background: 'var(--layer-3)' }}
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <p className="text-[11px] text-[--text-muted] uppercase tracking-wider font-mono">Steps</p>
        <div className="flex flex-wrap gap-3">
          {(Object.entries(STEP_META) as [Step, { label: string; icon: React.ElementType }][]).map(([step, { label, icon: Icon }]) => (
            <button
              type="button"
              key={step}
              onClick={() => toggleStep(step)}
              className={cn(
                'flex items-center gap-2 px-3 py-1.5 rounded-md border text-[12px] transition-colors',
                steps.includes(step)
                  ? 'border-blue-500 text-[--text-primary] bg-blue-500/10'
                  : 'text-[--text-muted] hover:text-[--text-primary]'
              )}
              style={{ borderColor: steps.includes(step) ? undefined : 'var(--border)' }}
            >
              <Icon size={12} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="text-[11px] text-red-400 font-mono">{error}</p>
      )}

      <Button
        type="submit"
        disabled={loading || !topic.trim() || steps.length === 0}
        className="h-8 text-[12px] gap-1.5"
      >
        {loading ? (
          <Loader2 size={12} className="animate-spin" />
        ) : (
          <Play size={12} />
        )}
        Pipeline starten
      </Button>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ContentFactoryPage() {
  const [jobs, setJobs] = useState<PipelineJob[]>([]);
  const [loading, setLoading] = useState(true);
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  const fetchJobs = useCallback(async () => {
    try {
      const res = await fetch('/api/content-factory/pipeline');
      const { jobs: j } = await res.json() as { jobs: PipelineJob[] };
      setJobs(j ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  // Poll alle 4s wenn laufende Jobs vorhanden
  useEffect(() => {
    fetchJobs();
    pollRef.current = setInterval(() => {
      fetchJobs();
    }, 4000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [fetchJobs]);

  const handleRetry = useCallback((id: number) => {
    fetch(`/api/content-factory/pipeline/${id}/run`, { method: 'POST' }).catch(() => {});
    setTimeout(fetchJobs, 1000);
  }, [fetchJobs]);

  const runningCount = jobs.filter((j) => j.status === 'running').length;
  const doneCount    = jobs.filter((j) => j.status === 'done').length;
  const errorCount   = jobs.filter((j) => j.status === 'error').length;

  return (
    <div className="mx-auto max-w-3xl px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-lg"
            style={{ background: 'var(--layer-3)', border: '1px solid var(--border-bright)' }}
          >
            <Factory size={16} style={{ color: 'var(--text-primary)' }} />
          </div>
          <div>
            <h1 className="text-[15px] font-semibold text-[--text-primary]">Content Factory</h1>
            <p className="text-[11px] font-mono text-[--text-muted]">Blog · Image · Voice · Publish</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-[11px] font-mono">
          {runningCount > 0 && (
            <span className="flex items-center gap-1 text-blue-400">
              <Loader2 size={10} className="animate-spin" />
              {runningCount} laufend
            </span>
          )}
          {doneCount > 0 && (
            <span className="text-green-400">{doneCount} fertig</span>
          )}
          {errorCount > 0 && (
            <span className="text-red-400">{errorCount} Fehler</span>
          )}
          <button
            onClick={fetchJobs}
            className="text-[--text-muted] hover:text-[--text-primary] transition-colors"
            title="Aktualisieren"
          >
            <RefreshCw size={13} />
          </button>
        </div>
      </div>

      {/* Input */}
      <PipelineInput onStarted={fetchJobs} />

      {/* Job-Liste */}
      <div className="space-y-3">
        <h2 className="text-[11px] font-mono text-[--text-muted] uppercase tracking-wider">
          Pipeline Jobs ({jobs.length})
        </h2>

        {loading && (
          <div className="flex items-center gap-2 text-[12px] text-[--text-muted]">
            <Loader2 size={12} className="animate-spin" />
            Lade Jobs…
          </div>
        )}

        {!loading && jobs.length === 0 && (
          <div
            className="rounded-lg border py-12 text-center"
            style={{ borderColor: 'var(--border)' }}
          >
            <Factory size={28} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
            <p className="text-[12px] text-[--text-muted]">Noch keine Jobs — starte deine erste Pipeline.</p>
          </div>
        )}

        {jobs.map((job) => (
          <PipelineRow key={job.Id} job={job} onRetry={handleRetry} />
        ))}
      </div>
    </div>
  );
}
