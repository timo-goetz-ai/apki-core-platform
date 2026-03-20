'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import {
  FileText, Image, Youtube, Mail, Send, Plus, Copy, Check,
  ExternalLink, X, BookOpen, Megaphone, ChevronDown, ChevronUp,
  Download, MessageSquare, Palette, Package,
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

// re-exported from template-engine for legacy inline use
function initValues(vars: string[]): Record<string, string> {
  return initVariableValues(vars);
}

// ── Category config ────────────────────────────────────────────────────────────
const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  'Infografik':   <Image size={15} />,
  'Blogartikel':  <FileText size={15} />,
  'YouTube':      <Youtube size={15} />,
  'Social Media': <Megaphone size={15} />,
  'Email':        <Mail size={15} />,
  'Angebot':      <Send size={15} />,
  'Prompt':       <BookOpen size={15} />,
};

const CATEGORY_COLORS: Record<string, string> = {
  'Infografik':   '#38bdf8',
  'Blogartikel':  '#34d399',
  'YouTube':      '#f87171',
  'Social Media': '#fbbf24',
  'Email':        '#a78bfa',
  'Angebot':      '#fb923c',
  'Prompt':       '#94a3b8',
};

const ALL_CATEGORIES = ['Alle', 'Infografik', 'Blogartikel', 'YouTube', 'Social Media', 'Email', 'Angebot', 'Prompt'];

// ── Animation variants ─────────────────────────────────────────────────────────
const containerVariants = { hidden: {}, show: { transition: { staggerChildren: 0.05 } } };
const cardVariants = { hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } };

// ── Sub-components ─────────────────────────────────────────────────────────────
function CategoryBadge({ kategorie }: { kategorie: string }) {
  const color = CATEGORY_COLORS[kategorie] ?? '#94a3b8';
  const icon  = CATEGORY_ICONS[kategorie] ?? <FileText size={12} />;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', borderRadius: 999,
      background: `${color}15`, border: `1px solid ${color}30`,
      color, fontSize: 10, fontFamily: 'var(--font-mono)',
    }}>
      {icon} {kategorie}
    </span>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function TemplatesPage() {
  const router = useRouter();

  const [templates, setTemplates]           = useState<Template[]>([]);
  const [brandItems, setBrandItems]         = useState<BrandItem[]>([]);
  const [loading, setLoading]               = useState(true);
  const [activeCategory, setActiveCategory] = useState('Alle');
  const [selected, setSelected]             = useState<Template | null>(null);
  const [values, setValues]                 = useState<Record<string, string>>({});
  const [copied, setCopied]                 = useState(false);
  const [brandOpen, setBrandOpen]           = useState(false);

  // ── Fetch templates ──
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res  = await fetch('/api/nocodb/templates');
        const data = await res.json();
        setTemplates((data.templates ?? []).filter((t: Template) => t.Aktiv !== false));
        setBrandItems(data.brandItems ?? []);
      } catch (e) {
        console.error('Templates fetch error:', e);
      }
      setLoading(false);
    }
    load();
  }, []);

  // ── Select template → init variables ──
  const openTemplate = useCallback((tpl: Template) => {
    const vars = extractVariables(tpl.Inhalt);
    setValues(initValues(vars));
    setSelected(tpl);
    setCopied(false);
    trackTemplateUse(tpl);
  }, []);

  const closeTemplate = useCallback(() => setSelected(null), []);

  // ── Derived ──
  const filtered = activeCategory === 'Alle'
    ? templates
    : templates.filter(t => t.Kategorie === activeCategory);

  const countFor = (cat: string) =>
    cat === 'Alle' ? templates.length : templates.filter(t => t.Kategorie === cat).length;

  const filled = selected ? fillTemplate(selected.Inhalt, values) : '';
  const vars   = selected ? extractVariables(selected.Inhalt) : [];

  // ── Actions ──
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
    a.download = `${selected?.Name ?? 'template'}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }, [filled, selected]);

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{ padding: '28px 28px 48px', position: 'relative', zIndex: 1 }}
    >
      {/* ── Header ── */}
      <div style={{ marginBottom: 28, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: 'linear-gradient(135deg, rgba(56,189,248,0.2), rgba(52,211,153,0.15))',
            border: '1px solid rgba(56,189,248,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <FileText size={17} style={{ color: '#38bdf8' }} />
          </div>
          <div>
            <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
              Templates &amp; Brand System
            </h1>
            <p style={{ margin: 0, fontSize: 12, color: '#475569', fontFamily: 'var(--font-mono)' }}>
              Deine Vorlagen, Markenmuster und Inhaltsstrukturen
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => exportTemplatesAsJson(templates)}
            disabled={templates.length === 0}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)',
              color: '#94a3b8', fontSize: 12, fontWeight: 500,
              transition: 'all 0.12s', opacity: templates.length === 0 ? 0.4 : 1,
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#f1f5f9'; el.style.borderColor = 'rgba(148,163,184,0.22)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#94a3b8'; el.style.borderColor = 'rgba(148,163,184,0.12)'; }}
          >
            <Package size={13} /> JSON Export
          </button>
          <a
            href={`${NOCO_URL}/dashboard`}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '7px 14px', borderRadius: 8, cursor: 'pointer',
              background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.2)',
              color: '#38bdf8', fontSize: 12, fontWeight: 500, textDecoration: 'none',
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(56,189,248,0.15)'; el.style.borderColor = 'rgba(56,189,248,0.35)'; }}
            onMouseLeave={e => { const el = e.currentTarget as HTMLAnchorElement; el.style.background = 'rgba(56,189,248,0.08)'; el.style.borderColor = 'rgba(56,189,248,0.2)'; }}
          >
            <Plus size={13} /> Neu in NocoDB
            <ExternalLink size={11} style={{ opacity: 0.6 }} />
          </a>
        </div>
      </div>

      {/* ── Stats bar ── */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {[
          { label: 'Gesamt',     value: templates.length,                              color: '#38bdf8' },
          { label: 'Aktiv',      value: templates.filter(t => t.Aktiv).length,         color: '#34d399' },
          { label: 'Kategorien', value: new Set(templates.map(t => t.Kategorie)).size, color: '#a78bfa' },
          { label: 'Brand Items',value: brandItems.length,                             color: '#fbbf24' },
        ].map(stat => (
          <div key={stat.label} style={{
            flex: 1, background: 'var(--layer-2)', border: '1px solid var(--border)',
            borderRadius: 10, padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 4,
          }}>
            <span style={{ fontSize: 9, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</span>
            <span style={{ fontSize: 20, fontWeight: 700, fontFamily: 'var(--font-mono)', color: stat.color }}>{stat.value}</span>
          </div>
        ))}
      </div>

      {/* ── Category filter tabs ── */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
        {ALL_CATEGORIES.map(cat => {
          const isActive = activeCategory === cat;
          const count    = countFor(cat);
          return (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: '5px 12px', borderRadius: 999, cursor: 'pointer',
                border: isActive ? '1px solid rgba(56,189,248,0.35)' : '1px solid rgba(148,163,184,0.1)',
                background: isActive ? 'var(--accent-blue)/10' : 'transparent',
                color: isActive ? '#38bdf8' : '#94a3b8',
                fontSize: 12, fontWeight: isActive ? 600 : 400,
                display: 'inline-flex', alignItems: 'center', gap: 5,
                transition: 'all 0.12s',
              }}
              onMouseEnter={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.2)'; el.style.color = '#f1f5f9'; } }}
              onMouseLeave={e => { if (!isActive) { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = 'rgba(148,163,184,0.1)'; el.style.color = '#94a3b8'; } }}
            >
              {cat}
              {count > 0 && (
                <span style={{
                  fontSize: 9, fontFamily: 'var(--font-mono)',
                  padding: '1px 5px', borderRadius: 999,
                  background: isActive ? 'rgba(56,189,248,0.2)' : 'rgba(148,163,184,0.1)',
                  color: isActive ? '#38bdf8' : '#64748b',
                }}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Template grid + Editor panel (side by side when editor open) ── */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>

        {/* Grid */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Lade Templates…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: '#475569', fontFamily: 'var(--font-mono)', fontSize: 13 }}>
              Keine Templates in dieser Kategorie.
            </div>
          ) : (
            <motion.div
              key={activeCategory}
              variants={containerVariants}
              initial="hidden"
              animate="show"
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}
            >
              {filtered.map(tpl => {
                const color    = CATEGORY_COLORS[tpl.Kategorie] ?? '#94a3b8';
                const icon     = CATEGORY_ICONS[tpl.Kategorie]  ?? <FileText size={15} />;
                const varCount = extractVariables(tpl.Inhalt).length;
                const isOpen   = selected?.Id === tpl.Id;
                return (
                  <motion.div
                    key={tpl.Id}
                    variants={cardVariants}
                    onClick={() => isOpen ? closeTemplate() : openTemplate(tpl)}
                    style={{
                      background: isOpen ? 'var(--layer-3)' : 'var(--layer-1)',
                      border: isOpen ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(148,163,184,0.08)',
                      borderRadius: 12, padding: '18px 20px',
                      position: 'relative', overflow: 'hidden',
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                    whileHover={{ borderColor: isOpen ? 'rgba(56,189,248,0.4)' : 'rgba(148,163,184,0.18)' }}
                  >
                    {/* Top accent line */}
                    <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${color}50, transparent)` }} />

                    {/* Card header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8,
                        background: `${color}18`, border: `1px solid ${color}30`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color, flexShrink: 0,
                      }}>
                        {icon}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {tpl.Name}
                        </p>
                        <CategoryBadge kategorie={tpl.Kategorie} />
                      </div>
                    </div>

                    {/* Description */}
                    {tpl.Beschreibung && (
                      <p style={{
                        margin: '0 0 10px', fontSize: 11, color: '#64748b', lineHeight: 1.5,
                        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}>
                        {tpl.Beschreibung}
                      </p>
                    )}

                    {/* Footer */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 4 }}>
                      <span style={{
                        fontSize: 10, fontFamily: 'var(--font-mono)', color: '#475569',
                        padding: '2px 7px', borderRadius: 999,
                        background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)',
                      }}>
                        {varCount} {varCount === 1 ? 'Variable' : 'Variablen'}
                      </span>
                      <span style={{
                        fontSize: 11, fontWeight: 500,
                        color: isOpen ? '#38bdf8' : color,
                        display: 'flex', alignItems: 'center', gap: 3,
                      }}>
                        {isOpen ? 'Aktiv' : 'Verwenden'}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </div>

        {/* ── Editor panel ── */}
        <AnimatePresence>
          {selected && (
            <motion.div
              initial={{ opacity: 0, x: 40, width: 0 }}
              animate={{ opacity: 1, x: 0, width: 420 }}
              exit={{ opacity: 0, x: 40, width: 0 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              style={{
                flexShrink: 0, width: 420,
                background: 'var(--layer-2)',
                border: '1px solid var(--border)',
                borderRadius: 14, overflow: 'hidden',
                position: 'sticky', top: 28,
                maxHeight: 'calc(100vh - 120px)',
                display: 'flex', flexDirection: 'column',
              }}
            >
              {/* Panel header */}
              <div style={{
                padding: '16px 20px',
                borderBottom: '1px solid rgba(148,163,184,0.08)',
                display: 'flex', alignItems: 'center', gap: 10,
                flexShrink: 0,
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 7,
                  background: `${CATEGORY_COLORS[selected.Kategorie] ?? '#38bdf8'}18`,
                  border: `1px solid ${CATEGORY_COLORS[selected.Kategorie] ?? '#38bdf8'}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: CATEGORY_COLORS[selected.Kategorie] ?? '#38bdf8', flexShrink: 0,
                }}>
                  {CATEGORY_ICONS[selected.Kategorie] ?? <FileText size={13} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {selected.Name}
                  </p>
                  <p style={{ margin: 0, fontSize: 10, color: '#475569', fontFamily: 'var(--font-mono)' }}>
                    {vars.length} Variablen
                  </p>
                </div>
                <button
                  onClick={closeTemplate}
                  style={{
                    width: 26, height: 26, borderRadius: 6,
                    background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.1)',
                    color: '#64748b', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0, transition: 'all 0.1s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#f1f5f9'; el.style.borderColor = 'rgba(148,163,184,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#64748b'; el.style.borderColor = 'rgba(148,163,184,0.1)'; }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* Scrollable body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>

                {/* Variables */}
                {vars.length > 0 && (
                  <div style={{ marginBottom: 20 }}>
                    <p style={{ margin: '0 0 10px', fontSize: 10, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Variablen ausfüllen
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {vars.map(v => (
                        <div key={v}>
                          <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748b', marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            {v}
                            {isSystemVar(v) && (
                              <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 4, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)', color: '#38bdf8', letterSpacing: '0.04em' }}>AUTO</span>
                            )}
                          </label>
                          <input
                            type="text"
                            value={values[v] ?? ''}
                            onChange={e => setValues(prev => ({ ...prev, [v]: e.target.value }))}
                            placeholder={v}
                            style={{
                              width: '100%', padding: '7px 10px', borderRadius: 7,
                              background: 'var(--layer-1)', border: '1px solid var(--border)',
                              color: 'var(--text-primary)', fontSize: 12, fontFamily: 'var(--font-mono)',
                              outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.12s',
                            }}
                            onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'rgba(56,189,248,0.35)'; }}
                            onBlur={e  => { (e.target as HTMLInputElement).style.borderColor = 'rgba(148,163,184,0.12)'; }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview */}
                <div style={{ marginBottom: 16 }}>
                  <p style={{ margin: '0 0 8px', fontSize: 10, fontFamily: 'var(--font-mono)', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    Vorschau
                  </p>
                  <div style={{
                    background: 'var(--layer-1)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '12px 14px',
                    fontFamily: 'var(--font-mono)', fontSize: 11,
                    color: 'var(--text-muted)', lineHeight: 1.7,
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    maxHeight: 280, overflowY: 'auto',
                  }}>
                    {filled}
                  </div>
                </div>
              </div>

              {/* Action bar */}
              <div style={{
                padding: '12px 20px',
                borderTop: '1px solid rgba(148,163,184,0.08)',
                display: 'flex', gap: 8, flexShrink: 0,
              }}>
                <button
                  onClick={copyToClipboard}
                  style={{
                    flex: 1, padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    background: copied ? 'rgba(52,211,153,0.12)' : 'rgba(56,189,248,0.1)',
                    border: copied ? '1px solid rgba(52,211,153,0.3)' : '1px solid rgba(56,189,248,0.2)',
                    color: copied ? '#34d399' : '#38bdf8',
                    fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
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
                    background: 'rgba(167,139,250,0.1)', border: '1px solid rgba(167,139,250,0.2)',
                    color: '#a78bfa', fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'rgba(167,139,250,0.18)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.background = 'rgba(167,139,250,0.1)'; }}
                >
                  <MessageSquare size={12} /> Cockpit
                </button>

                <button
                  onClick={downloadTxt}
                  title="Als .txt herunterladen"
                  style={{
                    padding: '8px 12px', borderRadius: 8, cursor: 'pointer',
                    background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)',
                    color: '#64748b', fontSize: 12, fontWeight: 500,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#f1f5f9'; el.style.borderColor = 'rgba(148,163,184,0.2)'; }}
                  onMouseLeave={e => { const el = e.currentTarget as HTMLButtonElement; el.style.color = '#64748b'; el.style.borderColor = 'rgba(148,163,184,0.12)'; }}
                >
                  <Download size={12} />
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Brand Identity section ── */}
      <div style={{ marginTop: 40 }}>
        <button
          onClick={() => setBrandOpen(o => !o)}
          style={{
            display: 'flex', alignItems: 'center', gap: 8,
            width: '100%', padding: '12px 16px', borderRadius: 10, cursor: 'pointer',
            background: 'var(--layer-2)', border: '1px solid var(--border)',
            color: 'var(--text-primary)', fontSize: 13, fontWeight: 500, textAlign: 'left',
            transition: 'border-color 0.12s',
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.16)'; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(148,163,184,0.08)'; }}
        >
          <div style={{
            width: 26, height: 26, borderRadius: 6,
            background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#fbbf24', flexShrink: 0,
          }}>
            <Palette size={13} />
          </div>
          <span style={{ flex: 1 }}>Brand Identity — {brandItems.length} Elemente</span>
          {brandOpen ? <ChevronUp size={14} style={{ color: '#64748b' }} /> : <ChevronDown size={14} style={{ color: '#64748b' }} />}
        </button>

        <AnimatePresence>
          {brandOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{
                marginTop: 10,
                display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10,
              }}>
                {brandItems.map(item => {
                  const isFarbe = item.Kategorie === 'Farbe';
                  return (
                    <div
                      key={item.Id}
                      style={{
                        background: 'var(--layer-2)', border: '1px solid var(--border)',
                        borderRadius: 10, padding: '12px 14px',
                        display: 'flex', alignItems: 'center', gap: 10,
                      }}
                    >
                      {isFarbe && (
                        <div style={{
                          width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                          background: item.Wert,
                          border: '1px solid rgba(255,255,255,0.08)',
                        }} />
                      )}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: '#f1f5f9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.Element}
                        </p>
                        <p style={{ margin: 0, fontSize: 10, fontFamily: 'var(--font-mono)', color: '#64748b', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {item.Wert}
                        </p>
                        {item.Beschreibung && (
                          <p style={{ margin: 0, fontSize: 9, color: '#475569', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {item.Beschreibung}
                          </p>
                        )}
                      </div>
                      <span style={{
                        fontSize: 8, fontFamily: 'var(--font-mono)', color: '#475569',
                        padding: '1px 5px', borderRadius: 4,
                        background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.08)',
                        flexShrink: 0, textTransform: 'uppercase', letterSpacing: '0.06em',
                      }}>
                        {item.Kategorie}
                      </span>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
