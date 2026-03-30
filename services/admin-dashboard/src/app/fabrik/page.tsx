'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Factory, ChevronRight, Database, Search } from 'lucide-react';
import { toast } from '@/lib/toast-store';
import { FABRIK_STATIONS, CREW_LOADOUT } from '@/lib/fabrik-config';

function FabrikIndexPanel() {
  const [title, setTitle] = useState('');
  const [snapshotKey, setSnapshotKey] = useState('');
  const [owner, setOwner] = useState('');
  const [description, setDescription] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [last, setLast] = useState<{
    collection: string;
    point: string;
    nocoId: string;
    model: string;
    reindexed: boolean;
    nocodb_extended: boolean;
  } | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const t = title.trim();
    if (!t) {
      toast.error('Titel fehlt', 'Bitte einen Projekttitel angeben.');
      return;
    }
    setLoading(true);
    setLast(null);
    try {
      const res = await fetch('/api/fabrik/index', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: t,
          snapshot_key: snapshotKey.trim() || undefined,
          owner: owner.trim() || undefined,
          description: description.trim() || undefined,
          notes: notes.trim() || undefined,
        }),
      });
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        reindexed?: boolean;
        nocodb_extended?: boolean;
        qdrant_collection?: string;
        qdrant_point_id?: string;
        embed_model?: string;
        nocodb?: Record<string, unknown>;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || res.statusText || 'Unbekannter Fehler');
      }
      const noco = data.nocodb ?? {};
      const nocoId = String(noco.Id ?? noco.id ?? '');
      setLast({
        collection: String(data.qdrant_collection ?? ''),
        point: String(data.qdrant_point_id ?? ''),
        nocoId,
        model: String(data.embed_model ?? ''),
        reindexed: Boolean(data.reindexed),
        nocodb_extended: Boolean(data.nocodb_extended),
      });
      toast.success(
        data.reindexed ? 'Aktualisiert' : 'Indexiert',
        data.reindexed
          ? 'Gleicher snapshot_key: Qdrant + NocoDB-Zeile aktualisiert.'
          : 'Embedding in Qdrant und Zeile in NocoDB angelegt.'
      );
    } catch (err) {
      toast.error('Index fehlgeschlagen', err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overview-glass-panel overview-glitch-wrap" style={{ borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--layer-2)',
            border: '1px solid var(--border)',
          }}
        >
          <Database size={18} style={{ color: 'var(--accent-green)' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Snapshot → Vektordb + NocoDB
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', maxWidth: 720 }}>
            Ein Eintrag erzeugt ein Embedding (OpenRouter oder Gemini), speichert den Vektor in Qdrant und legt die
            Metadaten-Zeile in NocoDB an — inkl. Verweis Point-ID ↔ Zeile.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} style={{ display: 'grid', gap: 10, maxWidth: 640 }}>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Titel (Pflicht)</span>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z. B. Salon-Stack v2"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Snapshot-Key (optional, Idempotenz)</span>
          <input
            value={snapshotKey}
            onChange={(e) => setSnapshotKey(e.target.value)}
            placeholder="z. B. salon-stack-v2 — gleicher Key überschreibt Punkt + aktualisiert NocoDB-Zeile"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Owner (optional)</span>
          <input
            value={owner}
            onChange={(e) => setOwner(e.target.value)}
            placeholder="Kurzname oder E-Mail"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Beschreibung (optional)</span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            placeholder="Kurzbeschreibung des Fabrik-/Projekt-Snapshots"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </label>
        <label style={{ display: 'grid', gap: 4 }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Notizen fürs Embedding (optional)</span>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Zusätzlicher Kontext nur für den Vektor (nicht zwingend in NocoDB sichtbar außer in Meta)"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
              resize: 'vertical',
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="overview-glass-panel"
          style={{
            justifySelf: 'start',
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid var(--accent-green)',
            background: loading ? 'var(--layer-2)' : 'rgba(52, 211, 153, 0.12)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Indexiere…' : 'In Qdrant + NocoDB schreiben'}
        </button>
      </form>
      {last ? (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 10,
            background: 'var(--layer-2)',
            border: '1px solid var(--border)',
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-secondary)',
            wordBreak: 'break-all',
          }}
        >
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>collection</strong> {last.collection}
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>point_id</strong> {last.point}
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>nocodb_id</strong> {last.nocoId || '—'}
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>embed_model</strong> {last.model}
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>reindexed</strong> {last.reindexed ? 'ja (Update)' : 'nein (neu)'}
          </div>
          <div>
            <strong style={{ color: 'var(--text-muted)' }}>nocodb_extended</strong> {last.nocodb_extended ? 'ja' : 'nein'}
          </div>
        </div>
      ) : null}
    </div>
  );
}



function FabrikSearchPanel() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [collection, setCollection] = useState('');
  const [hits, setHits] = useState<
    Array<{
      id: string | number;
      score?: number;
      title?: string;
      owner?: string;
      nocodb_id?: string;
      indexed_at?: string;
    }>
  >([]);

  async function onSearch(e: React.FormEvent) {
    e.preventDefault();
    const query = q.trim();
    if (!query) {
      toast.error('Suchbegriff fehlt', 'Bitte einen Text für die semantische Suche eingeben.');
      return;
    }
    setLoading(true);
    try {
      const url = new URL('/api/fabrik/search', window.location.origin);
      url.searchParams.set('q', query);
      url.searchParams.set('limit', '10');
      const res = await fetch(url.toString());
      const data = (await res.json().catch(() => ({}))) as {
        ok?: boolean;
        error?: string;
        collection?: string;
        hits?: typeof hits;
      };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || res.statusText || 'Unbekannter Fehler');
      }
      setHits(data.hits ?? []);
      setCollection(String(data.collection ?? ''));
    } catch (err) {
      toast.error('Suche fehlgeschlagen', err instanceof Error ? err.message : String(err));
      setHits([]);
      setCollection('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="overview-glass-panel overview-glitch-wrap" style={{ borderRadius: 14, padding: 16, marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--layer-2)',
            border: '1px solid var(--border)',
          }}
        >
          <Search size={18} style={{ color: 'var(--accent-blue)' }} />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>
            Ähnliche Fabrik-Snapshots (Qdrant)
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 11, color: 'var(--text-muted)', maxWidth: 720 }}>
            Semantische Suche über indexierte Einträge (kind=fabrik_snapshot). Nutzt dasselbe Embedding-Modell wie
            der Index.
          </p>
        </div>
      </div>
      <form onSubmit={onSearch} style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'flex-end' }}>
        <label style={{ display: 'grid', gap: 4, flex: '1 1 240px' }}>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 600 }}>Suchbegriff</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="z. B. Salon Buchung Automatisierung"
            className="overview-glass-panel"
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--layer-1)',
              color: 'var(--text-primary)',
              fontSize: 13,
            }}
          />
        </label>
        <button
          type="submit"
          disabled={loading}
          className="overview-glass-panel"
          style={{
            padding: '10px 18px',
            borderRadius: 10,
            border: '1px solid var(--accent-blue)',
            background: loading ? 'var(--layer-2)' : 'rgba(96, 165, 250, 0.12)',
            color: 'var(--text-primary)',
            fontWeight: 600,
            fontSize: 13,
            cursor: loading ? 'wait' : 'pointer',
            opacity: loading ? 0.7 : 1,
          }}
        >
          {loading ? 'Suche…' : 'Suchen'}
        </button>
      </form>
      {collection ? (
        <p style={{ marginTop: 10, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          collection: {collection}
        </p>
      ) : null}
      {hits.length > 0 ? (
        <ul style={{ margin: '12px 0 0', padding: 0, listStyle: 'none', display: 'grid', gap: 8 }}>
          {hits.map((h) => (
            <li
              key={String(h.id)}
              style={{
                padding: '10px 12px',
                borderRadius: 10,
                background: 'var(--layer-2)',
                border: '1px solid var(--border)',
                fontSize: 12,
              }}
            >
              <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{h.title ?? '(ohne Titel)'}</div>
              <div style={{ marginTop: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
                score: {h.score != null ? h.score.toFixed(4) : '—'} · point: {String(h.id)}
                {h.nocodb_id ? ` · noco: ${h.nocodb_id}` : ''}
                {h.owner ? ` · owner: ${h.owner}` : ''}
              </div>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function FabrikMap() {
  const positions = [
    { x: 95, y: 70, id: 'werkzeug' },
    { x: 305, y: 70, id: 'markt' },
    { x: 95, y: 210, id: 'fabrik' },
    { x: 305, y: 210, id: 'triebwerk' },
  ];
  const edges = [
    [0, 1],
    [0, 2],
    [1, 3],
    [2, 3],
    [0, 3],
  ];

  return (
    <svg viewBox="0 0 400 290" className="w-full max-w-md mx-auto" style={{ display: 'block' }} aria-hidden>
      <defs>
        <linearGradient id="fab-edge" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-blue)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent-green)" stopOpacity="0.35" />
        </linearGradient>
      </defs>
      {edges.map(([a, b], i) => (
        <line
          key={i}
          x1={positions[a].x}
          y1={positions[a].y}
          x2={positions[b].x}
          y2={positions[b].y}
          stroke="url(#fab-edge)"
          strokeWidth={1.5}
          strokeDasharray="6 8"
        />
      ))}
      {positions.map((p) => {
        const st = FABRIK_STATIONS.find((s) => s.id === p.id)!;
        return (
          <g key={p.id}>
            <circle cx={p.x} cy={p.y} r={30} fill={`${st.accent}18`} stroke={st.accent} strokeWidth={2} />
            <text
              x={p.x}
              y={p.y + 5}
              textAnchor="middle"
              style={{ fontSize: 18, fontWeight: 800, fill: st.accent, fontFamily: 'var(--font-ui)' }}
            >
              {st.short}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default function FabrikPage() {
  return (
    <div
      className="min-h-screen overview-page-grid-bg"
      style={{ padding: '20px 24px', maxWidth: 1200, margin: '0 auto', position: 'relative', zIndex: 1 }}
    >
      <header style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
          <div
            className="overview-glass-panel"
            style={{
              width: 40,
              height: 40,
              borderRadius: 10,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Factory size={20} style={{ color: 'var(--accent-amber)' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: 'var(--text-primary)' }}>
              Agenten-Fabrik
            </h1>
            <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', maxWidth: 640 }}>
              Vier Stationen auf dem Werksgelände — jedes Crew-Mitglied lässt sich den Stations-Links und der Kit-Liste
              nach ausstatten. Später: echte «Project Initializer»-Phasen an dieselben Stationen hängen (DB, Rollen,
              Skills, Hooks …).
            </p>
          </div>
        </div>
      </header>

      <FabrikIndexPanel />
      <FabrikSearchPanel />

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(240px, 320px) 1fr',
          gap: 20,
          alignItems: 'start',
        }}
      >
        <div className="overview-glass-panel overview-glitch-wrap" style={{ borderRadius: 14, padding: 16 }}>
          <h2 style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Lageplan
          </h2>
          <FabrikMap />
          <p style={{ margin: '12px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            A Werkzeug · M Markt · F Fabrik · T Triebwerk
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {FABRIK_STATIONS.map((st) => (
            <div
              key={st.id}
              className="overview-glass-panel overview-glitch-wrap"
              style={{
                borderRadius: 14,
                padding: '16px 18px',
                borderLeft: `4px solid ${st.accent}`,
              }}
            >
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <span
                    style={{
                      display: 'inline-block',
                      fontSize: 10,
                      fontWeight: 700,
                      color: st.accent,
                      fontFamily: 'var(--font-mono)',
                      marginBottom: 4,
                    }}
                  >
                    Station {st.short}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-primary)' }}>{st.title}</h3>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: 'var(--text-secondary)', maxWidth: 520 }}>{st.metaphor}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                    {st.agentFocus.map((tag) => (
                      <span
                        key={tag}
                        style={{
                          fontSize: 10,
                          padding: '2px 8px',
                          borderRadius: 999,
                          background: `${st.accent}14`,
                          color: st.accent,
                          fontFamily: 'var(--font-mono)',
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 160 }}>
                  {st.links.map((l) =>
                    l.external ? (
                      <a
                        key={l.href}
                        href={l.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--accent-blue)',
                          textDecoration: 'none',
                        }}
                      >
                        {l.label} <ArrowRight size={12} />
                      </a>
                    ) : (
                      <Link
                        key={l.href}
                        href={l.href}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 6,
                          fontSize: 12,
                          color: 'var(--accent-blue)',
                          textDecoration: 'none',
                        }}
                      >
                        {l.label} <ChevronRight size={12} />
                      </Link>
                    )
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <section style={{ marginTop: 28 }}>
        <h2 style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 12 }}>
          Ausrüstung nach Rollen (Crew)
        </h2>
        <div
          className="overview-glass-panel"
          style={{ borderRadius: 14, overflow: 'hidden', border: '1px solid var(--border)' }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: 'var(--layer-2)', borderBottom: '1px solid var(--border)' }}>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Rolle</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Stationen</th>
                <th style={{ textAlign: 'left', padding: '10px 14px', color: 'var(--text-muted)', fontWeight: 600 }}>Kit</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(CREW_LOADOUT).map(([role, lo]) => (
                <tr key={role} style={{ borderBottom: '1px solid var(--border)' }}>
                  <td style={{ padding: '10px 14px', fontWeight: 600, color: 'var(--text-primary)', verticalAlign: 'top' }}>{role}</td>
                  <td style={{ padding: '10px 14px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {lo.stationIds.map((sid) => {
                        const st = FABRIK_STATIONS.find((s) => s.id === sid);
                        if (!st) return null;
                        return (
                          <span
                            key={sid}
                            style={{
                              fontSize: 10,
                              fontFamily: 'var(--font-mono)',
                              padding: '2px 8px',
                              borderRadius: 6,
                              background: `${st.accent}12`,
                              color: st.accent,
                              border: `1px solid ${st.accent}33`,
                            }}
                          >
                            {st.short}: {st.title.split('·')[0].trim()}
                          </span>
                        );
                      })}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: 'var(--text-secondary)', verticalAlign: 'top', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                    {lo.kit.join(' · ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p style={{ marginTop: 12, fontSize: 11, color: 'var(--text-muted)' }}>
          Operativ: Station <strong>F</strong> mit deinen echten Cursor-Rules / Skills verknüpfen; Station <strong>T</strong> mit{' '}
          <Link href="/agents" style={{ color: 'var(--accent-blue)' }}>Crew-Live</Link>. Dein «Project Initializer» aus dem Entwurf
          mappt 1:1 auf die Phasen DB → Rollen → Skills → Hooks … — die können wir als Status-Spalte oder Wizard später an
          Station F anbinden.
        </p>
      </section>
    </div>
  );
}
