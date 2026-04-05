export const dynamic = 'force-dynamic';
export const maxDuration = 30;

import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, audioToDataUrl } from '@/lib/fishaudio';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const text: string = body.text ?? 'Hallo, das ist ein Latenz-Test der Voice Pipeline.';
    const speed: number = body.speed ?? 1.0;
    const voiceId: string | undefined = body.voiceId;

    const t0 = Date.now();
    const buffer = await textToSpeech(text, { speed, voiceId });
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
