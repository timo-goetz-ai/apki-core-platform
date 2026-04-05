'use client';

import { useState, useEffect } from 'react';
import { Mic, Play, Loader2, Volume2, Phone, RefreshCw, ExternalLink } from 'lucide-react';

interface Voice {
  id: string;
  name: string;
  language: string;
}

export default function VoiceStudioPage() {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState('');
  const [text, setText] = useState('Hallo, ich bin die KI-Assistentin von Automation+KI.');
  const [speed, setSpeed] = useState(1.0);
  const [loading, setLoading] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [lastDuration, setLastDuration] = useState<number | null>(null);
  const [voicesLoading, setVoicesLoading] = useState(true);
  const [assistantInfo, setAssistantInfo] = useState<{ status: string; description: string } | null>(null);

  // Load voices
  useEffect(() => {
    fetch('/api/voice/tts')
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        setVoices(d?.voices ?? []);
        if (d?.voices?.[0]) setSelectedVoice(d.voices[0].id);
      })
      .catch(() => {})
      .finally(() => setVoicesLoading(false));
  }, []);

  // Load assistant info
  useEffect(() => {
    fetch('/api/voice/assistant')
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setAssistantInfo(d); })
      .catch(() => {});
  }, []);

  async function handleTTS() {
    if (!text.trim()) return;
    setLoading(true);
    setAudioSrc(null);
    try {
      const res = await fetch('/api/voice/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voiceId: selectedVoice, speed }),
      });
      const data = await res.json();
      if (data.audioDataUrl) {
        setAudioSrc(data.audioDataUrl);
        setLastDuration(data.durationMs);
      }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  const panel: React.CSSProperties = {
    background: 'var(--layer-1)', border: '1px solid var(--border)',
    borderRadius: 10, padding: '16px 20px',
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Volume2 size={20} style={{ color: 'var(--accent-blue)' }} />
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: 'var(--text-primary)' }}>Voice Studio</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
            Fish Audio TTS · Voice Cloning · Deepgram STT
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Fish Audio TTS */}
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Mic size={14} style={{ color: 'var(--accent-blue)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>Fish Audio TTS</span>
          </div>

          {/* Voice selector */}
          <div style={{ marginBottom: 12 }}>
            <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Stimme
            </label>
            <select
              value={selectedVoice}
              onChange={e => setSelectedVoice(e.target.value)}
              style={{
                width: '100%', marginTop: 4, padding: '6px 10px',
                background: 'var(--layer-2)', border: '1px solid var(--border)',
                borderRadius: 6, color: 'var(--text-primary)',
                fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
              }}
            >
              {voicesLoading ? (
                <option>Laden…</option>
              ) : voices.length === 0 ? (
                <option>Keine Stimmen (API Key prüfen)</option>
              ) : (
                voices.map(v => (
                  <option key={v.id} value={v.id}>{v.name} ({v.language})</option>
                ))
              )}
            </select>
          </div>

          {/* Speed */}
          <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <label style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Speed</label>
              <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{speed.toFixed(1)}x</span>
            </div>
            <input
              type="range" min={0.5} max={2.0} step={0.1} value={speed}
              onChange={e => setSpeed(Number(e.target.value))}
              style={{ width: '100%', accentColor: 'var(--accent-blue)' }}
            />
          </div>

          {/* Text input */}
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={3}
            placeholder="Text zum Vorlesen eingeben..."
            style={{
              width: '100%', background: 'var(--layer-2)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-ui)',
              fontSize: 13, padding: 10, resize: 'vertical', outline: 'none', boxSizing: 'border-box',
            }}
          />

          {/* Generate button */}
          <button
            onClick={handleTTS}
            disabled={loading || !text.trim()}
            style={{
              marginTop: 10, display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 6, border: 'none',
              background: 'var(--accent-blue)', color: '#fff', fontSize: 13,
              fontWeight: 500, cursor: loading ? 'wait' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            Generieren
          </button>

          {/* Audio output */}
          {audioSrc && (
            <div style={{ marginTop: 12 }}>
              <audio controls src={audioSrc} style={{ width: '100%', height: 36 }} />
              {lastDuration && (
                <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', marginTop: 4, display: 'block' }}>
                  Generiert in {lastDuration}ms
                </span>
              )}
            </div>
          )}
        </div>

        {/* KI-Influencerin / AI Assistentin */}
        <div style={panel}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Phone size={14} style={{ color: 'var(--accent-green)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)' }}>KI-Influencerin</span>
            <span style={{
              fontSize: 10, padding: '2px 6px', borderRadius: 4,
              background: 'rgba(52,211,153,0.1)', color: 'var(--accent-green)',
              fontFamily: 'var(--font-mono)',
            }}>
              Demo
            </span>
          </div>

          <p style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 14 }}>
            AI Telefonassistentin — empfängt Anrufe via Webhook, antwortet mit KI-generierter Sprache.
          </p>

          {/* Webhook info */}
          <div style={{ background: 'var(--layer-2)', borderRadius: 6, padding: 12, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
              Webhook Endpoint
            </div>
            <code style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--accent-blue)' }}>
              POST /api/voice/assistant
            </code>
          </div>

          {/* Status */}
          {assistantInfo && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
              <span className="pulsing-dot" style={{
                width: 6, height: 6, borderRadius: '50%',
                background: assistantInfo.status === 'active' ? 'var(--accent-green)' : 'var(--text-muted)',
              }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>
                {assistantInfo.status === 'active' ? 'Aktiv' : 'Inaktiv'}
              </span>
            </div>
          )}

          {/* Capabilities */}
          <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>
            Fähigkeiten
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
            {['Begrüßung', 'TTS Response', 'Call Routing'].map(cap => (
              <span key={cap} style={{
                fontSize: 10, padding: '3px 8px', borderRadius: 4,
                background: 'var(--layer-2)', color: 'var(--text-secondary)',
                border: '1px solid var(--border)',
              }}>
                {cap}
              </span>
            ))}
          </div>

          {/* Links */}
          <div style={{ display: 'flex', gap: 8 }}>
            <a
              href="/monitoring/voice"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none',
              }}
            >
              <RefreshCw size={10} /> Voice Debug
            </a>
            <a
              href="https://voice.automation-plus-ki.de"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'flex', alignItems: 'center', gap: 4,
                fontSize: 11, color: 'var(--accent-blue)', textDecoration: 'none',
              }}
            >
              <ExternalLink size={10} /> Voice Platform
            </a>
          </div>
        </div>
      </div>

      {/* Deepgram STT link */}
      <div style={{ ...panel, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Mic size={14} style={{ color: 'var(--accent-green)' }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-primary)' }}>Deepgram STT Monitoring</span>
        </div>
        <a
          href="/monitoring/voice"
          style={{
            display: 'flex', alignItems: 'center', gap: 4,
            fontSize: 12, color: 'var(--accent-blue)', textDecoration: 'none',
            padding: '6px 12px', borderRadius: 6,
            background: 'rgba(56,189,248,0.08)',
          }}
        >
          Latenz-Dashboard öffnen →
        </a>
      </div>
    </div>
  );
}
