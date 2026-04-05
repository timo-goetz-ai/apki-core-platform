'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  FileText, Image, Mic, Globe, CheckCircle2, XCircle, Clock,
  ExternalLink, RefreshCw, Loader2, FolderOpen,
} from 'lucide-react';

interface ContentItem {
  id: number;
  topic: string;
  category: string;
  status: string;
  stage: string;
  created_at: string;
  updated_at: string;
  content_text?: string;
  image_url?: string;
  voice_url?: string;
  blog_id?: string;
  output_url?: string;
  storage_type?: string;
}

const STATUS_CONFIG: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
  done:    { color: 'var(--accent-green)', label: 'Fertig',  icon: <CheckCircle2 size={12} /> },
  running: { color: 'var(--accent-blue)',  label: 'Läuft',   icon: <Loader2 size={12} className="animate-spin" /> },
  error:   { color: 'var(--accent-red)',   label: 'Fehler',  icon: <XCircle size={12} /> },
  idle:    { color: 'var(--text-muted)',   label: 'Wartend', icon: <Clock size={12} /> },
};

function formatDate(iso: string): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });
}

function OutputLinks({ item }: { item: ContentItem }) {
  const links: { label: string; url: string; icon: React.ReactNode }[] = [];

  if (item.output_url) {
    const isGDrive = item.output_url.includes('drive.google.com');
    const isS3 = item.output_url.includes('s3') || item.output_url.includes('hetzner');
    links.push({
      label: isGDrive ? 'Google Drive' : isS3 ? 'Hetzner S3' : 'Datei',
      url: item.output_url,
      icon: <FolderOpen size={11} />,
    });
  }
  if (item.blog_id) {
    links.push({
      label: 'Blog',
      url: `https://blog.automation-plus-ki.de/posts/${item.blog_id}`,
      icon: <Globe size={11} />,
    });
  }
  if (item.image_url) {
    links.push({ label: 'Bild', url: item.image_url, icon: <Image size={11} /> });
  }
  if (item.voice_url) {
    links.push({ label: 'Audio', url: item.voice_url, icon: <Mic size={11} /> });
  }

  if (links.length === 0) return null;

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
      {links.map((link) => (
        <a
          key={link.url}
          href={link.url}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none',
            padding: '3px 8px', borderRadius: 4,
            background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.15)',
          }}
        >
          {link.icon}
          {link.label}
          <ExternalLink size={9} />
        </a>
      ))}
    </div>
  );
}

function StageIcons({ item }: { item: ContentItem }) {
  const hasText = !!item.content_text;
  const hasImage = !!item.image_url;
  const hasVoice = !!item.voice_url;
  const hasPublish = !!item.blog_id;

  const stages = [
    { done: hasText, icon: <FileText size={11} />, label: 'Text' },
    { done: hasImage, icon: <Image size={11} />, label: 'Bild' },
    { done: hasVoice, icon: <Mic size={11} />, label: 'Voice' },
    { done: hasPublish, icon: <Globe size={11} />, label: 'Publish' },
  ];

  return (
    <div style={{ display: 'flex', gap: 4 }}>
      {stages.map((s) => (
        <span
          key={s.label}
          title={s.label}
          style={{
            color: s.done ? 'var(--accent-green)' : 'var(--text-muted)',
            opacity: s.done ? 1 : 0.3,
          }}
        >
          {s.icon}
        </span>
      ))}
    </div>
  );
}

export default function ProducedContentPage() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [source, setSource] = useState('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/content/produced');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items ?? []);
        setSource(data.source ?? '');
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  // Group by date
  const grouped = items.reduce<Record<string, ContentItem[]>>((acc, item) => {
    const date = formatDate(item.created_at);
    if (!acc[date]) acc[date] = [];
    acc[date].push(item);
    return acc;
  }, {});

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>
            Produzierte Inhalte
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Timeline — wann, was, wo, Status
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {source && (
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: 4, background: 'var(--layer-2)' }}>
              {source}
            </span>
          )}
          <button
            onClick={fetchItems}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}
          >
            <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && items.length === 0 && (
        <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)', fontSize: 13 }}>
          <Loader2 size={18} className="animate-spin" style={{ margin: '0 auto 8px' }} />
          Lade Inhalte…
        </div>
      )}

      {/* Empty */}
      {!loading && items.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 48,
          border: '1px solid var(--border)', borderRadius: 12,
          background: 'var(--layer-1)',
        }}>
          <FolderOpen size={28} style={{ color: 'var(--text-muted)', margin: '0 auto 8px' }} />
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Noch keine produzierten Inhalte.</p>
          <p style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Content wird in n8n über Workflows produziert und hier angezeigt.
          </p>
        </div>
      )}

      {/* Timeline */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {Object.entries(grouped).map(([date, dateItems]) => (
          <div key={date}>
            {/* Date header */}
            <div style={{
              fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)',
              color: 'var(--text-muted)', marginBottom: 10,
              padding: '4px 0', borderBottom: '1px solid var(--border)',
            }}>
              {date}
            </div>

            {/* Items */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingLeft: 12, borderLeft: '2px solid var(--border)' }}>
              {dateItems.map((item) => {
                const cfg = STATUS_CONFIG[item.status] ?? STATUS_CONFIG.idle;
                return (
                  <div
                    key={item.id}
                    style={{
                      background: 'var(--layer-1)', border: '1px solid var(--border)',
                      borderRadius: 8, padding: '12px 14px', position: 'relative',
                    }}
                  >
                    {/* Timeline dot */}
                    <span style={{
                      position: 'absolute', left: -19, top: 16,
                      width: 8, height: 8, borderRadius: '50%',
                      background: cfg.color, border: '2px solid var(--layer-0)',
                    }} />

                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>
                            {item.topic}
                          </span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-muted)' }}>
                          <span style={{ fontFamily: 'var(--font-mono)' }}>{formatTime(item.created_at)}</span>
                          <span style={{
                            padding: '1px 6px', borderRadius: 4,
                            background: 'var(--layer-2)', fontSize: 10,
                          }}>
                            {item.category}
                          </span>
                          <StageIcons item={item} />
                        </div>
                      </div>

                      {/* Status */}
                      <span style={{
                        display: 'flex', alignItems: 'center', gap: 4,
                        fontSize: 10, fontWeight: 500, color: cfg.color,
                        padding: '2px 8px', borderRadius: 4,
                        background: `color-mix(in srgb, ${cfg.color} 10%, transparent)`,
                        flexShrink: 0,
                      }}>
                        {cfg.icon}
                        {cfg.label}
                      </span>
                    </div>

                    {/* Preview text */}
                    {item.content_text && (
                      <p style={{
                        margin: '8px 0 0', fontSize: 11, color: 'var(--text-secondary)',
                        lineHeight: 1.5, overflow: 'hidden',
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {item.content_text.slice(0, 200)}
                      </p>
                    )}

                    <OutputLinks item={item} />
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
