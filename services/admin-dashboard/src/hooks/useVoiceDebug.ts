'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

export interface VoiceHealthData {
  voice: { ok: boolean; latencyMs: number; db: string };
  tts: { ok: boolean; latencyMs: number };
  providers: {
    voicePlatform: boolean;
    deepgram: boolean;
    stt: boolean;
    openrouter: boolean;
  };
  timestamp: string;
}

export interface TestResult {
  ttsMs: number;
  totalMs: number;
  textLength: number;
  audioSize: number;
  audioDataUrl: string;
  timestamp: string;
  error?: string;
}

export interface CallLogEntry {
  id: string;
  ttsMs: number;
  sttMs: number;
  llmMs: number;
  totalMs: number;
  status: 'success' | 'error';
  text: string;
  error?: string;
  timestamp: string;
}

export interface VoiceDebugState {
  health: VoiceHealthData | null;
  latencyHistory: { tts: number[]; stt: number[]; llm: number[] };
  callLog: CallLogEntry[];
  loading: boolean;
  testing: boolean;
  lastUpdated: Date | null;
}

const MAX_HISTORY = 20;

export function useVoiceDebug(intervalMs = 10_000) {
  const [state, setState] = useState<VoiceDebugState>({
    health: null,
    latencyHistory: { tts: [], stt: [], llm: [] },
    callLog: [],
    loading: true,
    testing: false,
    lastUpdated: null,
  });

  const callIdRef = useRef(0);

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/monitoring/voice');
      if (!res.ok) return;
      const data: VoiceHealthData = await res.json();
      setState((prev) => ({
        ...prev,
        health: data,
        loading: false,
        lastUpdated: new Date(),
        latencyHistory: {
          tts: [...prev.latencyHistory.tts, data.tts.latencyMs].slice(-MAX_HISTORY),
          stt: [...prev.latencyHistory.stt, data.voice.latencyMs].slice(-MAX_HISTORY),
          llm: [...prev.latencyHistory.llm, data.voice.latencyMs].slice(-MAX_HISTORY),
        },
      }));
    } catch {
      setState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const runTest = useCallback(
    async (text: string, speed = 1.0, voiceId?: string) => {
      setState((prev) => ({ ...prev, testing: true }));
      const id = `test-${++callIdRef.current}`;
      try {
        const res = await fetch('/api/monitoring/voice/test', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text, speed, voiceId }),
        });
        const data: TestResult = await res.json();

        const entry: CallLogEntry = {
          id,
          ttsMs: data.ttsMs ?? 0,
          sttMs: 0,
          llmMs: 0,
          totalMs: data.totalMs ?? 0,
          status: data.error ? 'error' : 'success',
          text: text.slice(0, 60),
          error: data.error,
          timestamp: data.timestamp ?? new Date().toISOString(),
        };

        setState((prev) => ({
          ...prev,
          testing: false,
          callLog: [entry, ...prev.callLog].slice(0, 50),
          latencyHistory: {
            ...prev.latencyHistory,
            tts: [...prev.latencyHistory.tts, data.ttsMs ?? 0].slice(-MAX_HISTORY),
          },
        }));

        return data;
      } catch (e) {
        const entry: CallLogEntry = {
          id,
          ttsMs: 0,
          sttMs: 0,
          llmMs: 0,
          totalMs: 0,
          status: 'error',
          text: text.slice(0, 60),
          error: String(e),
          timestamp: new Date().toISOString(),
        };
        setState((prev) => ({
          ...prev,
          testing: false,
          callLog: [entry, ...prev.callLog].slice(0, 50),
        }));
        return null;
      }
    },
    [],
  );

  useEffect(() => {
    fetchHealth();
    const id = setInterval(fetchHealth, intervalMs);
    return () => clearInterval(id);
  }, [fetchHealth, intervalMs]);

  return { ...state, refresh: fetchHealth, runTest };
}
