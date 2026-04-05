'use client';

import { useState, useRef } from 'react';
import { useVoiceDebug } from '@/hooks/useVoiceDebug';

/* ── Helpers ─────────────────────────────────────────────────────────────────── */

function latencyColor(ms: number): string {
  if (ms > 500) return 'var(--accent-red)';
  if (ms > 200) return 'var(--accent-amber)';
  return 'var(--accent-green)';
}

function fmtTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  } catch { return iso; }
}

/* ── Sparkline ───────────────────────────────────────────────────────────────── */

function Sparkline({ values, color, width = 120, height = 28 }: {
  values: number[]; color: string; width?: number; height?: number;
}) {
  if (!values.length) return <svg width={width} height={height} />;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(values.length - 1, 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');
  return (
    <svg width={width} height={height} style={{ display: 'block', overflow: 'visible' }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5"
        strokeLinejoin="round" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

/* ── Bar ─────────────────────────────────────────────────────────────────────── */

function Bar({ pct, color }: { pct: number; color: string }) {
  return (
    <div style={{ height: 3, background: 'var(--layer-3)', borderRadius: 2, overflow: 'hidden', marginTop: 4 }}>
      <div style={{ height: '100%', width: `${Math.min(Math.max(pct, 0), 100)}%`, background: color, borderRadius: 2, transition: 'width 0.5s ease' }} />
    </div>
  );
}

/* ── Styles ───────────────────────────────────────────────────────────────────── */

const S = {
  page: { padding: '24px 28px 48px', background: 'var(--layer-0)', minHeight: '100vh', fontFamily: 'var(--font-ui)', color: 'var(--text-primary)' } as const,
  card: { background: 'var(--layer-2)', border: '1px solid var(--border)', borderRadius: 8, padding: 16 } as const,
  label: { fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.1em', color: 'var(--text-muted)' } as const,
  sectionTitle: { fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase' as const, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 } as const,
  mono: { fontFamily: 'var(--font-mono)', fontSize: 13 } as const,
  bigNum: { fontFamily: 'var(--font-mono)', fontSize: 28, fontWeight: 600, lineHeight: 1 } as const,
  btn: { padding: '8px 16px', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500, fontFamily: 'var(--font-ui)', transition: 'opacity 0.15s' } as const,
};

/* ── Page ─────────────────────────────────────────────────────────────────────── */

export default function VoiceDebugPage() {
  const { health, latencyHistory, callLog, loading, testing, lastUpdated, refresh, runTest } = useVoiceDebug(10_000);

  /* Test Console state */
  const [testText, setTestText] = useState('Hallo, das ist ein Latenz-Test der Voice Pipeline.');
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  /* Config sliders */
  const [sttTimeout, setSttTimeout] = useState(5000);
  const [llmTemp, setLlmTemp] = useState(0.7);
  const [llmMaxTokens, setLlmMaxTokens] = useState(500);
  const [ttsSpeed, setTtsSpeed] = useState(1.0);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  /* Computed latencies */
  const sttMs = latencyHistory.stt.at(-1) ?? 0;
  const llmMs = latencyHistory.llm.at(-1) ?? 0;
  const ttsMs = latencyHistory.tts.at(-1) ?? 0;
  const totalMs = sttMs + llmMs + ttsMs;

  /* ── Actions ──────────────────────────────────────────────────────────────── */

  async function handleTest() {
    const result = await runTest(testText, ttsSpeed);
    if (result?.audioDataUrl) setAudioSrc(result.audioDataUrl);
  }

  async function startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      chunksRef.current = [];
      mr.ondataavailable = (e) => chunksRef.current.push(e.data);
      mr.onstop = () => stream.getTracks().forEach((t) => t.stop());
      mr.start();
      mediaRecorderRef.current = mr;
      setRecording(true);
    } catch {
      /* microphone not available */
    }
  }

  function stopRecording() {
    mediaRecorderRef.current?.stop();
    setRecording(false);
  }

  /* ── Render ───────────────────────────────────────────────────────────────── */

  return (
    <div style={S.page}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--accent-blue)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" x2="12" y1="19" y2="22" />
        </svg>
        <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>Voice Debug</h1>

        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginLeft: 8, padding: '3px 10px', borderRadius: 20, background: 'var(--layer-3)', border: '1px solid var(--border)' }}>
          <span className="mon-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: health?.voice.ok ? 'var(--accent-green)' : 'var(--accent-red)' }} />
          <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)' }}>
            {loading ? 'LOADING' : health?.voice.ok ? 'LIVE' : 'OFFLINE'}
          </span>
        </span>

        <div style={{ flex: 1 }} />

        <button onClick={refresh} style={{ ...S.btn, background: 'var(--layer-3)', color: 'var(--text-secondary)', border: '1px solid var(--border)' }}>
          Refresh
        </button>
        {lastUpdated && (
          <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>
            {lastUpdated.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        )}
      </div>

      {/* ── Panel 1: Pipeline Latency Monitor ──────────────────────────────── */}
      <div style={S.sectionTitle}>Pipeline Latency</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: 8 }}>
        {[
          { label: 'STT', ms: sttMs, history: latencyHistory.stt },
          { label: 'LLM', ms: llmMs, history: latencyHistory.llm },
          { label: 'TTS', ms: ttsMs, history: latencyHistory.tts },
          { label: 'Total', ms: totalMs, history: latencyHistory.tts.map((_, i) => (latencyHistory.stt[i] ?? 0) + (latencyHistory.llm[i] ?? 0) + (latencyHistory.tts[i] ?? 0)) },
        ].map((m) => (
          <div key={m.label} style={S.card}>
            <div style={S.label}>{m.label}</div>
            <div style={{ ...S.bigNum, color: latencyColor(m.ms), marginTop: 6 }}>
              {m.ms.toFixed(0)}<span style={{ fontSize: 12, fontWeight: 400, opacity: 0.6 }}>ms</span>
            </div>
            <Bar pct={(m.ms / 1000) * 100} color={latencyColor(m.ms)} />
            <div style={{ marginTop: 8 }}>
              <Sparkline values={m.history} color={latencyColor(m.ms)} />
            </div>
          </div>
        ))}
      </div>

      {/* Provider status dots */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24, padding: '8px 0' }}>
        {[
          { label: 'Voice Platform', ok: health?.providers.voicePlatform },
          { label: 'Deepgram', ok: health?.providers.deepgram },
          { label: 'Deepgram STT', ok: health?.providers.stt },
          { label: 'OpenRouter', ok: health?.providers.openrouter },
        ].map((p) => (
          <span key={p.label} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: p.ok ? 'var(--accent-green)' : 'var(--accent-red)' }} />
            <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-secondary)' }}>{p.label}</span>
          </span>
        ))}
      </div>

      {/* ── Row 2: Test Console + Config ────────────────────────────────────── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>

        {/* Panel 2: Test Console */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Test Console</div>
          <textarea
            value={testText}
            onChange={(e) => setTestText(e.target.value)}
            rows={4}
            style={{
              width: '100%', background: 'var(--layer-3)', border: '1px solid var(--border)',
              borderRadius: 6, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)',
              fontSize: 13, padding: 10, resize: 'vertical', outline: 'none',
              boxSizing: 'border-box',
            }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={handleTest}
              disabled={testing}
              style={{ ...S.btn, background: 'var(--accent-blue)', color: '#fff', opacity: testing ? 0.5 : 1 }}
            >
              {testing ? 'Sending...' : 'Send TTS'}
            </button>
            <button
              onClick={recording ? stopRecording : startRecording}
              style={{
                ...S.btn,
                background: recording ? 'var(--accent-red)' : 'var(--layer-3)',
                color: recording ? '#fff' : 'var(--text-secondary)',
                border: recording ? 'none' : '1px solid var(--border)',
              }}
            >
              {recording ? 'Stop' : 'Record STT'}
            </button>
          </div>

          {audioSrc && (
            <div style={{ marginTop: 12 }}>
              <audio controls src={audioSrc} style={{ width: '100%', height: 36 }} />
            </div>
          )}

          {/* Last test result */}
          {callLog[0] && callLog[0].status === 'success' && (
            <div style={{ marginTop: 10, padding: 8, background: 'var(--layer-3)', borderRadius: 6, ...S.mono, fontSize: 11, color: 'var(--text-secondary)' }}>
              TTS: <span style={{ color: latencyColor(callLog[0].ttsMs) }}>{callLog[0].ttsMs}ms</span>
              {' | '}Total: <span style={{ color: latencyColor(callLog[0].totalMs) }}>{callLog[0].totalMs}ms</span>
            </div>
          )}
        </div>

        {/* Panel 3: Configuration */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Configuration</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'STT Timeout', value: sttTimeout, set: setSttTimeout, min: 1000, max: 10000, step: 500, unit: 'ms' },
              { label: 'LLM Temperature', value: llmTemp, set: setLlmTemp, min: 0, max: 1, step: 0.1, unit: '' },
              { label: 'LLM Max Tokens', value: llmMaxTokens, set: setLlmMaxTokens, min: 50, max: 2000, step: 50, unit: '' },
              { label: 'TTS Speed', value: ttsSpeed, set: setTtsSpeed, min: 0.5, max: 2.0, step: 0.1, unit: 'x' },
            ].map((s) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={S.label}>{s.label}</span>
                  <span style={{ ...S.mono, fontSize: 12, color: 'var(--text-primary)' }}>
                    {typeof s.value === 'number' && s.value % 1 !== 0 ? s.value.toFixed(1) : s.value}{s.unit}
                  </span>
                </div>
                <input
                  type="range"
                  min={s.min} max={s.max} step={s.step} value={s.value}
                  onChange={(e) => s.set(Number(e.target.value))}
                  style={{ width: '100%', accentColor: 'var(--accent-blue)', height: 4, background: 'var(--layer-3)' }}
                />
              </div>
            ))}

            <div>
              <span style={S.label}>Model</span>
              <select
                style={{
                  width: '100%', marginTop: 4, padding: '6px 10px', background: 'var(--layer-3)',
                  border: '1px solid var(--border)', borderRadius: 6, color: 'var(--text-primary)',
                  fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none',
                }}
                defaultValue="anthropic/claude-sonnet-4-20250514"
              >
                <option value="anthropic/claude-sonnet-4-20250514">Claude Sonnet 4</option>
                <option value="anthropic/claude-3.5-haiku">Claude 3.5 Haiku</option>
                <option value="meta-llama/llama-3.1-70b-instruct">Llama 3.1 70B</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel 4: Call Log ───────────────────────────────────────────────── */}
      <div style={S.sectionTitle}>Call Log</div>
      <div style={S.card}>
        {/* Header */}
        <div style={{
          display: 'grid', gridTemplateColumns: '100px 80px 80px 80px 80px 1fr 70px',
          gap: 4, padding: '6px 8px', borderBottom: '1px solid var(--border)',
        }}>
          {['Zeit', 'STT', 'LLM', 'TTS', 'Total', 'Text', 'Status'].map((h) => (
            <span key={h} style={S.label}>{h}</span>
          ))}
        </div>

        {callLog.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', ...S.mono, fontSize: 12 }}>
            Noch keine Tests. Klicke &quot;Send TTS&quot; um zu starten.
          </div>
        )}

        {callLog.map((entry) => (
          <div key={entry.id}>
            <div
              onClick={() => setExpandedRow(expandedRow === entry.id ? null : entry.id)}
              style={{
                display: 'grid', gridTemplateColumns: '100px 80px 80px 80px 80px 1fr 70px',
                gap: 4, padding: '8px', cursor: entry.error ? 'pointer' : 'default',
                borderBottom: '1px solid var(--border)',
                transition: 'background 0.1s',
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'var(--layer-1)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
            >
              <span style={{ ...S.mono, fontSize: 12, color: 'var(--text-muted)' }}>{fmtTime(entry.timestamp)}</span>
              <span style={{ ...S.mono, fontSize: 12, color: entry.sttMs ? latencyColor(entry.sttMs) : 'var(--text-muted)' }}>
                {entry.sttMs || '—'}
              </span>
              <span style={{ ...S.mono, fontSize: 12, color: entry.llmMs ? latencyColor(entry.llmMs) : 'var(--text-muted)' }}>
                {entry.llmMs || '—'}
              </span>
              <span style={{ ...S.mono, fontSize: 12, color: latencyColor(entry.ttsMs) }}>
                {entry.ttsMs}ms
              </span>
              <span style={{ ...S.mono, fontSize: 12, color: latencyColor(entry.totalMs) }}>
                {entry.totalMs}ms
              </span>
              <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {entry.text}
              </span>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: entry.status === 'success' ? 'var(--accent-green)' : 'var(--accent-red)' }} />
                <span style={{ ...S.mono, fontSize: 11, color: 'var(--text-muted)' }}>{entry.status}</span>
              </span>
            </div>

            {expandedRow === entry.id && entry.error && (
              <div style={{ padding: 12, background: 'var(--layer-3)', borderRadius: 6, margin: '4px 8px 8px' }}>
                <pre style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--accent-red)', whiteSpace: 'pre-wrap', margin: 0 }}>
                  {entry.error}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Pulse animation */}
      <style>{`
        @keyframes mon-pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }
        .mon-pulse { animation: mon-pulse 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
