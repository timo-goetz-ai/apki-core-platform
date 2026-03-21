'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  FileText, Image, Youtube, Mail, Send, Plus, Copy, Check,
  ExternalLink, BookOpen, Megaphone, Download, MessageSquare,
  Palette, Package, ChevronDown, ChevronUp, Hash,
} from 'lucide-react';
import {
  extractVariables, fillTemplate, initVariableValues, isSystemVar,
  trackTemplateUse, exportTemplatesAsJson,
} from '@/lib/template-engine';

// ── Constants ──────────────────────────────────────────────────────────────────
const NOCO_URL = 'https://nocodb.automation-plus-ki.de';

// ── Types ──────────────────────────────────────────────────────────────────────
interface Template {
  Id: number;
  Name: string;
  Kategorie: string;
  Inhalt: string;
  Variablen: string;
  Beschreibung: string;
  Tags: string;
  Aktiv: boolean;
}

interface BrandItem {
  Id: number;
  Element: string;
  Wert: string;
  Kategorie: string;
  Beschreibung: string;
  Aktiv: boolean;
}

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Infografik':   <Image size={13} />,
  'Blogartikel':  <FileText size={13} />,
  'YouTube':      <Youtube size={13} />,
  'Social Media': <Megaphone size={13} />,
  'Email':        <Mail size={13} />,
  'Angebot':      <Send size={13} />,
  'Prompt':       <BookOpen size={13} />,
};

const ALL_CATEGORIES = ['Alle', 'Infografik', 'Blogartikel', 'YouTube', 'Social Media', 'Email', 'Angebot', 'Prompt'];

// ── Section label ──────────────────────────────────────────────────────────────
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p style={{
      margin: '0 0 7px', fontSize: 10, fontFamily: 'var(--font-mono)',
      color: 'var(--text-muted)', textTransform: 'uppercase',
      letterSpacing: '0.09em', fontWeight: 600,
    }}>
      {children}
    </p>
  );
}

// ── Editor panel (right side) ──────────────────────────────────────────────────
function TemplateEditor({
  template, onClose,
}: {
  template: Template;
  onClose: () => void;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const vars = extractVariables(template.Inhalt);
    setValues(initVariableValues(vars));
    setCopied(false);
  }, [template]);

  const vars   = extractVariables(template.Inhalt);
  const filled = fillTemplate(template.Inhalt, values);

  const copyToClipboard = useCallback(async () => {
    await navigator.clipboard.writeText(filled);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [filled]);

  const openInCockpit = useCallback(() => {
    localStorage.setItem('aios_template_prompt', filled);
    router.push('/');
  }, [filled, router]);

  const downloadTxt = useCallback(() => {
    const blob = new Blob([filled], { type: 'text/plain;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${template.Name}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filled, template.Name]);

  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      overflow: 'hidden', background: 'var(--layer-1)',
    }}>
      {/* Header */}
      <div style={{
        padding: '20px 28px 16px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '2px 9px', borderRadius: 20, fontSize: 11,
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)',
              }}>
                {CATEGORY_ICONS[template.Kategorie] ?? <FileText size={11} />}
                {template.Kategorie}
              </span>
              <span style={{
                fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)',
                padding: '2px 7px', borderRadius: 4,
                background: 'var(--layer-2)', border: '1px solid var(--border)',
              }}>
                <Hash size={8} style={{ display: 'inline', marginRight: 2 }} />{vars.length} Variablen
              </span>
            </div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1.25 }}>
              {template.Name}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              padding: '5px 9px', borderRadius: 7, fontSize: 11,
              background: 'var(--layer-2)', border: '1px solid var(--border)',
              color: 'var(--text-muted)', cursor: 'pointer', flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        {/* Description */}
        {template.Beschreibung && (
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
            {template.Beschreibung}
          </p>
        )}
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>

        {/* Variables */}
        {vars.length > 0 && (
          <div style={{ marginBottom: 22 }}>
            <SectionLabel>Variablen ausfüllen</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {vars.map(v => (
                <div key={v}>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    fontSize: 10, fontFamily: 'var(--font-mono)',
                    color: 'var(--text-muted)', marginBottom: 4,
                    textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    {v}
                    {isSystemVar(v) && (
                      <span style={{
                        fontSize: 8, padding: '1px 5px', borderRadius: 4,
                        background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)',
                        color: '#38bdf8',
                      }}>
                        AUTO
                      </span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={values[v] ?? ''}
                    onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
                    placeholder={v}
                    style={{
                      width: '100%', padding: '7px 10px', borderRadius: 7,
                      background: 'var(--layer-2)', border: '1px solid var(--border)',
                      color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)',
                      outline: 'none', boxSizing: 'border-box',
                    }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(56,189,248,0.35)'; }}
                    onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        <div>
          <SectionLabel>Vorschau</SectionLabel>
          <div style={{
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 9, padding: '13px 15px',
            fontFamily: 'var(--font-mono)', fontSize: 11,
            color: 'var(--text-muted)', lineHeight: 1.75,
            whiteSpace: 'pre-wrap', wordBreak: 'break-word',
            maxHeight: 320, overflowY: 'auto',
          }}>
            {filled || <span style={{ opacity: 0.4 }}>Vorschau erscheint hier…</span>}
          </div>
        </div>
      </div>

      {/* Action bar */}
      <div style={{
        padding: '12px 28px',
        borderTop: '1px solid var(--border)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <button
          onClick={copyToClipboard}
          style={{
            flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: copied ? 'rgba(52,211,153,0.1)' : 'rgba(56,189,248,0.08)',
            border: copied ? '1px solid rgba(52,211,153,0.28)' : '1px solid rgba(56,189,248,0.2)',
            color: copied ? '#34d399' : '#38bdf8',
            fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Kopiert!' : 'Kopieren'}
        </button>

        <button
          onClick={openInCockpit}
          title="Im Cockpit öffnen"
          style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)',
            color: '#a78bfa', fontSize: 12, fontWeight: 500,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <MessageSquare size={12} /> Cockpit
        </button>

        <button
          onClick={downloadTxt}
          title="Als .txt herunterladen"
          style={{
            padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-muted)', fontSize: 12,
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
          }}
        >
          <Download size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────
function EmptyEditor() {
  return (
    <div style={{
      flex: 1, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', gap: 10,
    }}>
      <FileText size={36} style={{ opacity: 0.18 }} />
      <p style={{ margin: 0, fontSize: 14, opacity: 0.5 }}>Template aus der Liste auswählen</p>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const [templates, setTemplates]           = useState<Template[]>([]);
  const [brandItems, setBrandItems]         = useState<BrandItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [selected, setSelected]             = useState<Template | null>(null);
  const [brandOpen, setBrandOpen]           = useState(false);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res  = await fetch('/api/nocodb/templates');
        const data = await res.json();
        const list: Template[] = (data.templates ?? []).filter((t: Template) => t.Aktiv !== false);
        setBrandItems(data.brandItems ?? []);
        setTemplates(list);
        if (list.length > 0) setSelected(list[0]);
      } catch (e) {
        console.error('Templates fetch error:', e);
      }
      setLoading(false);
    })();
  }, []);

  const filtered = activeCategory === 'Alle'
    ? templates
    : templates.filter(t => t.Kategorie === activeCategory);

  const countFor = (cat: string) =>
    cat === 'Alle' ? templates.length : templates.filter(t => t.Kategorie === cat).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>

      {/* ── Top bar ── */}
      <div style={{
        padding: '18px 28px 14px',
        borderBottom: '1px solid var(--border)',
        flexShrink: 0, background: 'var(--layer-1)',
      }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 19, fontWeight: 700, color: 'var(--text-primary)' }}>
              Templates &amp; Brand System
            </h1>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {templates.length} Vorlagen · {new Set(templates.map(t => t.Kategorie)).size} Kategorien
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => exportTemplatesAsJson(templates)}
              disabled={templates.length === 0}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 7, cursor: 'pointer',
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                color: 'var(--text-muted)', fontSize: 12,
                opacity: templates.length === 0 ? 0.4 : 1,
              }}
            >
              <Package size={12} /> JSON
            </button>
            <a
              href={`${NOCO_URL}/dashboard`}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 12px', borderRadius: 7,
                background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
                color: '#38bdf8', fontSize: 12, fontWeight: 500, textDecoration: 'none',
              }}
            >
              <Plus size={12} /> Neu in NocoDB <ExternalLink size={10} style={{ opacity: 0.6 }} />
            </a>
          </div>
        </div>

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {ALL_CATEGORIES.map(cat => {
            const isActive = activeCategory === cat;
            const count    = countFor(cat);
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                style={{
                  padding: '4px 10px', borderRadius: 20, fontSize: 11, cursor: 'pointer',
                  background: isActive ? 'rgba(56,189,248,0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(56,189,248,0.28)' : '1px solid transparent',
                  color: isActive ? '#38bdf8' : 'var(--text-muted)',
                  fontWeight: isActive ? 600 : 400, transition: 'all 0.1s',
                  display: 'inline-flex', alignItems: 'center', gap: 5,
                }}
              >
                {CATEGORY_ICONS[cat] && <span style={{ opacity: 0.7 }}>{CATEGORY_ICONS[cat]}</span>}
                {cat}
                {count > 0 && (
                  <span style={{
                    fontSize: 9, padding: '1px 5px', borderRadius: 999,
                    background: isActive ? 'rgba(56,189,248,0.18)' : 'rgba(148,163,184,0.08)',
                    color: isActive ? '#38bdf8' : '#475569',
                    fontFamily: 'var(--font-mono)',
                  }}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── 2-panel body ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

        {/* LEFT — Template list */}
        <div style={{
          width: 300, flexShrink: 0,
          borderRight: '1px solid var(--border)',
          overflowY: 'auto', background: 'var(--layer-0)',
          display: 'flex', flexDirection: 'column',
        }}>
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
                <div style={{ height: 12, width: '65%', borderRadius: 4, background: 'var(--layer-2)', marginBottom: 6 }} />
                <div style={{ height: 9, width: '40%', borderRadius: 4, background: 'var(--layer-2)', opacity: 0.5 }} />
              </div>
            ))
          ) : filtered.length === 0 ? (
            <div style={{ padding: '24px 16px', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
              Keine Templates in dieser Kategorie.
            </div>
          ) : (
            filtered.map(tpl => {
              const isSelected = selected?.Id === tpl.Id;
              const varCount   = extractVariables(tpl.Inhalt).length;
              return (
                <div
                  key={tpl.Id}
                  onClick={() => { setSelected(tpl); trackTemplateUse(tpl); }}
                  style={{
                    padding: '11px 16px',
                    borderBottom: '1px solid var(--border)',
                    borderLeft: `2px solid ${isSelected ? '#38bdf8' : 'transparent'}`,
                    background: isSelected ? 'rgba(56,189,248,0.05)' : 'transparent',
                    cursor: 'pointer', transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.025)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                    <span style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
                      {CATEGORY_ICONS[tpl.Kategorie] ?? <FileText size={12} />}
                    </span>
                    <span style={{
                      fontSize: 12, fontWeight: isSelected ? 600 : 500,
                      color: isSelected ? '#f1f5f9' : 'var(--text-primary)',
                      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1,
                    }}>
                      {tpl.Name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 8, marginLeft: 19 }}>
                    <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {tpl.Kategorie}
                    </span>
                    <span style={{ fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                      {varCount} Var.
                    </span>
                  </div>
                  {tpl.Beschreibung && (
                    <p style={{
                      margin: '5px 0 0 19px', fontSize: 11, color: '#475569',
                      lineHeight: 1.4, overflow: 'hidden',
                      display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    }}>
                      {tpl.Beschreibung}
                    </p>
                  )}
                </div>
              );
            })
          )}

          {/* Brand section toggle (at bottom of list) */}
          {!loading && brandItems.length > 0 && (
            <div style={{ marginTop: 'auto', borderTop: '1px solid var(--border)' }}>
              <button
                onClick={() => setBrandOpen(o => !o)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  width: '100%', padding: '10px 14px', cursor: 'pointer',
                  background: 'transparent', border: 'none',
                  color: 'var(--text-muted)', fontSize: 11, textAlign: 'left',
                }}
              >
                <Palette size={12} style={{ color: '#fbbf24' }} />
                Brand Identity ({brandItems.length})
                {brandOpen ? <ChevronUp size={11} style={{ marginLeft: 'auto' }} /> : <ChevronDown size={11} style={{ marginLeft: 'auto' }} />}
              </button>
            </div>
          )}
        </div>

        {/* RIGHT — Editor or empty */}
        {selected
          ? <TemplateEditor template={selected} onClose={() => setSelected(null)} />
          : <EmptyEditor />
        }
      </div>

      {/* Brand items drawer (full-width below, when open) */}
      {brandOpen && (
        <div style={{
          borderTop: '1px solid var(--border)',
          padding: '16px 28px',
          background: 'var(--layer-2)',
          maxHeight: 200, overflowY: 'auto', flexShrink: 0,
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 8 }}>
            {brandItems.map(item => (
              <div key={item.Id} style={{
                background: 'var(--layer-1)', border: '1px solid var(--border)',
                borderRadius: 8, padding: '10px 12px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                {item.Kategorie === 'Farbe' && (
                  <div style={{
                    width: 24, height: 24, borderRadius: 5, flexShrink: 0,
                    background: item.Wert, border: '1px solid rgba(255,255,255,0.06)',
                  }} />
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.Element}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {item.Wert}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
