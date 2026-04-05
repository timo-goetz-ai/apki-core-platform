export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkDeepgramHealth } from '@/lib/deepgram';

const VOICE_API =
  process.env.VOICE_API_BASE_URL ??
  'http://voice-api-ckgw404o88ow0ccs00cow8k8:8000';

export async function GET() {
  const t0 = Date.now();

  const [healthRes, dgRes] = await Promise.allSettled([
    fetch(`${VOICE_API}/health`, { signal: AbortSignal.timeout(6000) }),
    checkDeepgramHealth(),
  ]);

  const voiceLatency = Date.now() - t0;

  const voiceHealth =
    healthRes.status === 'fulfilled' && healthRes.value.ok
      ? await healthRes.value.json()
      : null;

  const dgHealth =
    dgRes.status === 'fulfilled' ? dgRes.value : { ok: false };

  return NextResponse.json({
    voice: {
      ok: !!voiceHealth,
      latencyMs: voiceLatency,
      db: voiceHealth?.db ?? 'unknown',
    },
    tts: {
      ok: (dgHealth as { ok: boolean }).ok,
      latencyMs: voiceLatency,
    },
    providers: {
      voicePlatform: !!voiceHealth,
      deepgram: (dgHealth as { ok: boolean }).ok,
      stt: (dgHealth as { ok: boolean }).ok,
      openrouter: !!voiceHealth,
    },
    timestamp: new Date().toISOString(),
  });
}
