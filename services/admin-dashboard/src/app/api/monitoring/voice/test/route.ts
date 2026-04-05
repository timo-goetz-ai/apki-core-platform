export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, speechToText, audioToDataUrl } from '@/lib/deepgram';

/** POST — TTS test with latency measurement */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action: string = body.action ?? 'tts';

    if (action === 'stt') {
      /* ── STT: base64 audio → transcript ─────────────────────────────── */
      const audioB64: string = body.audio;
      if (!audioB64) return NextResponse.json({ error: 'No audio data' }, { status: 400 });

      const raw = Uint8Array.from(atob(audioB64), (c) => c.charCodeAt(0));
      const t0 = Date.now();
      const result = await speechToText(raw.buffer as ArrayBuffer, {
        language: body.language ?? 'de',
      });
      const sttMs = Date.now() - t0;

      return NextResponse.json({
        sttMs,
        totalMs: sttMs,
        transcript: result.transcript,
        confidence: result.confidence,
        words: result.words,
        timestamp: new Date().toISOString(),
      });
    }

    /* ── TTS: text → audio ──────────────────────────────────────────── */
    const text: string = body.text ?? 'Hallo, das ist ein Latenz-Test der Voice Pipeline.';
    const model: string | undefined = body.model;

    const t0 = Date.now();
    const buffer = await textToSpeech(text, { model });
    const ttsMs = Date.now() - t0;

    const audioDataUrl = audioToDataUrl(buffer, 'mp3');

    return NextResponse.json({
      ttsMs,
      totalMs: ttsMs,
      textLength: text.length,
      audioSize: buffer.byteLength,
      audioDataUrl,
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    return NextResponse.json(
      { error: String(e), timestamp: new Date().toISOString() },
      { status: 500 },
    );
  }
}
