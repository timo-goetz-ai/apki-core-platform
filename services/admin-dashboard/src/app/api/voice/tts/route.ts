export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { textToSpeech, listVoices, audioToDataUrl } from '@/lib/fishaudio';

export async function GET() {
  try {
    const voices = await listVoices();
    return NextResponse.json({ voices });
  } catch (err) {
    return NextResponse.json({ voices: [], error: String(err) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { text, voiceId, speed } = await req.json();
    if (!text) return NextResponse.json({ error: 'text required' }, { status: 400 });

    const startMs = Date.now();
    const buffer = await textToSpeech(text, { voiceId, speed });
    const durationMs = Date.now() - startMs;

    const dataUrl = audioToDataUrl(buffer, 'mp3');

    return NextResponse.json({
      audioDataUrl: dataUrl,
      durationMs,
      byteLength: buffer.byteLength,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
