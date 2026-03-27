'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, RefreshCw,
  FileText, Image, Mic, Globe, Clock, CheckCircle2,
  Loader2, Plus,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentPiece, ContentStatus } from '@/lib/nocodb';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getWeekDays(monday: Date): Date[] {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

function getMondayOf(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  d.setHours(0, 0, 0, 0);
  return d;
}

function toDateStr(d: Date): string {
  return d.toISOString().split('T')[0];
}

const DAY_NAMES = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

// ─── Status + Kategorie Meta ──────────────────────────────────────────────────

const STATUS_META: Record<ContentStatus, { label: string; color: string }> = {
  idea:      { label: 'Idee',       color: 'text-[--text-muted] bg-[--layer-3]'        },
  research:  { label: 'Research',   color: 'text-amber-400 bg-amber-500/10'             },
  draft:     { label: 'Draft',      color: 'text-blue-400 bg-blue-500/10'               },
  review:    { label: 'Review',     color: 'text-purple-400 bg-purple-500/10'           },
  approved:  { label: 'Approved',   color: 'text-green-400 bg-green-500/10'             },
  published: { label: 'Published',  color: 'text-green-500 bg-green-500/20'             },
  archived:  { label: 'Archiviert', color: 'text-[--text-muted] bg-[--layer-2] opacity-60' },
};

const PLATFORM_ICONS: Record<string, React.ElementType> = {
  blog:      FileText,
  instagram: Image,
  linkedin:  Globe,
  tiktok:    Mic,
};

// ─── PieceCard ────────────────────────────────────────────────────────────────

function PieceCard({
  piece,
  onStatusChange,
}: {
  piece: ContentPiece;
  onStatusChange: (id: number, status: ContentStatus) => void;
}) {
  const [editing, setEditing] = useState(false);
  const meta = STATUS_META[piece.status] ?? STATUS_META.idea;
  const platforms = (piece.target_platforms ?? '').split(',').filter(Boolean);

  return (
    <div
      className={cn(
        'group relative rounded-lg border border-[--border] bg-[--layer-1] p-2.5 text-left cursor-pointer',
        'hover:border-[--border-bright] transition-colors space-y-1.5'
      )}
      onClick={() => setEditing((v) => !v)}
    >
      {/* Status Badge */}
      <Badge className={cn('text-[9px] px-1 py-0 border-0 rounded-sm font-mono', meta.color)}>
        {meta.label}
      </Badge>

      {/* Titel */}
      <p className="text-xs text-[--text-primary] font-medium line-clamp-2 leading-snug">
        {piece.title || piece.topic || '(Kein Titel)'}
      </p>

      {/* Plattform-Icons */}
      {platforms.length > 0 && (
        <div className="flex gap-1">
          {platforms.slice(0, 4).map((p) => {
            const Icon = PLATFORM_ICONS[p] ?? Globe;
            return <Icon key={p} className="w-3 h-3 text-[--text-muted]" />;
          })}
        </div>
      )}

      {/* Status-Änderung (inline) */}
      {editing && (
        <div
          className="absolute top-full left-0 z-10 mt-1 bg-[--layer-2] border border-[--border] rounded-lg shadow-xl p-2 space-y-1 min-w-[140px]"
          onClick={(e) => e.stopPropagation()}
        >
          {(Object.entries(STATUS_META) as [ContentStatus, typeof STATUS_META[ContentStatus]][]).map(([s, m]) => (
            <button
              key={s}
              onClick={() => {
                if (piece.Id) onStatusChange(piece.Id, s);
                setEditing(false);
              }}
              className={cn(
                'w-full text-left text-xs px-2 py-1 rounded flex items-center gap-2',
                piece.status === s
                  ? 'bg-[--layer-3] text-[--text-primary]'
                  : 'text-[--text-secondary] hover:bg-[--layer-3]'
              )}
            >
              {piece.status === s && <CheckCircle2 className="w-3 h-3 flex-shrink-0" />}
              {piece.status !== s && <span className="w-3" />}
              <span className={cn('text-[9px] px-1 rounded', m.color)}>{m.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── DayColumn ────────────────────────────────────────────────────────────────

function DayColumn({
  date,
  pieces,
  isToday,
  onStatusChange,
}: {
  date: Date;
  pieces: ContentPiece[];
  isToday: boolean;
  onStatusChange: (id: number, status: ContentStatus) => void;
}) {
  const dayLabel = DAY_NAMES[date.getDay() === 0 ? 6 : date.getDay() - 1];
  const dateNum  = date.getDate();
  const monthAbbr = date.toLocaleString('de-DE', { month: 'short' });

  return (
    <div className="flex-1 min-w-0">
      {/* Day Header */}
      <div
        className={cn(
          'text-center pb-2 mb-2 border-b border-[--border]',
          isToday && 'border-[--accent-blue]'
        )}
      >
        <span className={cn('text-xs text-[--text-muted]', isToday && 'text-[--accent-blue]')}>
          {dayLabel}
        </span>
        <div
          className={cn(
            'mx-auto mt-0.5 w-7 h-7 rounded-full flex items-center justify-center text-sm font-semibold',
            isToday
              ? 'bg-[--accent-blue] text-white'
              : 'text-[--text-primary]'
          )}
        >
          {dateNum}
        </div>
        {isToday && <span className="text-[9px] text-[--accent-blue] font-mono">{monthAbbr}</span>}
      </div>

      {/* Pieces */}
      <div className="space-y-1.5 min-h-[100px]">
        {pieces.map((p) => (
          <PieceCard
            key={p.Id ?? p.piece_id}
            piece={p}
            onStatusChange={onStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Hauptseite ───────────────────────────────────────────────────────────────

export default function ContentPlanningPage() {
  const [monday, setMonday]     = useState<Date>(() => getMondayOf(new Date()));
  const [pieces, setPieces]     = useState<ContentPiece[]>([]);
  const [loading, setLoading]   = useState(true);
  const today = toDateStr(new Date());

  const days = getWeekDays(monday);
  const from = toDateStr(days[0]);
  const to   = toDateStr(days[6]);

  const loadPieces = useCallback(async (f: string, t: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/content-planning/pieces?from=${f}&to=${t}`);
      const data = await res.json() as { pieces: ContentPiece[] };
      setPieces(data.pieces ?? []);
    } catch {
      setPieces([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void loadPieces(from, to); }, [from, to, loadPieces]);

  const handleStatusChange = async (id: number, status: ContentStatus) => {
    // Optimistic update
    setPieces((prev) => prev.map((p) => p.Id === id ? { ...p, status } : p));
    try {
      await fetch(`/api/content-planning/pieces?id=${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
    } catch {
      // revert on failure
      void loadPieces(from, to);
    }
  };

  const prevWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() - 7);
    setMonday(d);
  };
  const nextWeek = () => {
    const d = new Date(monday);
    d.setDate(d.getDate() + 7);
    setMonday(d);
  };
  const goToday = () => setMonday(getMondayOf(new Date()));

  // Pieces per day
  const piecesByDay = days.reduce<Record<string, ContentPiece[]>>((acc, d) => {
    const key = toDateStr(d);
    acc[key] = pieces.filter((p) => {
      const s = p.scheduled_at?.split('T')[0];
      return s === key;
    });
    return acc;
  }, {});

  const unscheduled = pieces.filter((p) => !p.scheduled_at);

  // Stats
  const statusCounts = pieces.reduce<Partial<Record<ContentStatus, number>>>((acc, p) => {
    acc[p.status] = (acc[p.status] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[--layer-0] p-6 space-y-5">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-[--accent-blue]" />
          <div>
            <h1 className="text-xl font-semibold text-[--text-primary]">Content Planning</h1>
            <p className="text-sm text-[--text-muted]">Redaktionsplanung & Status-Übersicht</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Status-Schnellübersicht */}
          {Object.entries(statusCounts).map(([s, count]) => {
            const m = STATUS_META[s as ContentStatus];
            if (!m || !count) return null;
            return (
              <Badge key={s} className={cn('text-[10px] border-0 px-2 py-0.5', m.color)}>
                {m.label} {count}
              </Badge>
            );
          })}
          <Button variant="ghost" size="sm" onClick={() => void loadPieces(from, to)}>
            <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
          </Button>
        </div>
      </div>

      {/* Kalender-Navigation */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={prevWeek}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <button
          onClick={goToday}
          className="text-sm text-[--text-secondary] hover:text-[--text-primary] font-mono px-2"
        >
          {days[0].toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
          {' – '}
          {days[6].toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
        </button>
        <Button variant="ghost" size="sm" onClick={nextWeek}>
          <ChevronRight className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="sm" onClick={goToday} className="text-[--accent-blue] text-xs ml-2">
          Heute
        </Button>
      </div>

      {/* Kalender-Raster */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-[--text-muted]">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Lade Kalender…
        </div>
      ) : (
        <div className="border border-[--border] rounded-xl bg-[--layer-1] p-4 overflow-x-auto">
          <div className="flex gap-3 min-w-[700px]">
            {days.map((d) => {
              const key = toDateStr(d);
              return (
                <DayColumn
                  key={key}
                  date={d}
                  pieces={piecesByDay[key] ?? []}
                  isToday={key === today}
                  onStatusChange={handleStatusChange}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Ungeplante Pieces */}
      {unscheduled.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-[--text-muted]" />
            <h2 className="text-sm font-medium text-[--text-primary]">
              Ungeplant <span className="text-[--text-muted] font-normal">({unscheduled.length})</span>
            </h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {unscheduled.map((p) => (
              <PieceCard
                key={p.Id ?? p.piece_id}
                piece={p}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        </div>
      )}

      {/* Leer-State */}
      {!loading && pieces.length === 0 && (
        <div className="text-center py-16 text-[--text-muted] border border-dashed border-[--border] rounded-xl">
          <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Keine Content-Pieces für diese Woche</p>
          <p className="text-xs mt-1 opacity-70">
            Starte einen Job in der{' '}
            <a href="/content-factory" className="text-[--accent-blue] hover:underline">
              Content Factory
            </a>
            {' '}oder dem{' '}
            <a href="/batch-production" className="text-[--accent-blue] hover:underline">
              Batch Production
            </a>
          </p>
        </div>
      )}

      {/* Legende */}
      <div className="flex flex-wrap gap-3 pt-2 border-t border-[--border]">
        <span className="text-xs text-[--text-muted]">Status:</span>
        {(Object.entries(STATUS_META) as [ContentStatus, typeof STATUS_META[ContentStatus]][]).map(([s, m]) => (
          <span key={s} className={cn('flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded', m.color)}>
            {m.label}
          </span>
        ))}
      </div>
    </div>
  );
}
