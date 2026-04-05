export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { checkFishAudioHealth } from '@/lib/fishaudio';

const VOICE_API =
  process.env.VOICE_API_BASE_URL ??
  'http://voice-api-ckgw404o88ow0ccs00cow8k8:8000';

export async function GET() {
  const t0 = Date.now();

  const [healthRes, fishRes] = await Promise.allSettled([
    fetch(`${VOICE_API}/health`, { signal: AbortSignal.timeout(6000) }),
    checkFishAudioHealth(),
  ]);

  const voiceLatency = Date.now() - t0;

  const voiceHealth =
    healthRes.status === 'fulfilled' && healthRes.value.ok
      ? await healthRes.value.json()
      : null;

  const fishHealth =
    fishRes.status === 'fulfilled' ? fishRes.value : { ok: false };

  return NextResponse.json({
    voice: {
      ok: !!voiceHealth,
      latencyMs: voiceLatency,
      db: voiceHealth?.db ?? 'unknown',
    },
    tts: {
      ok: (fishHealth as { ok: boolean }).ok,
      latencyMs: voiceLatency,
    },
    providers: {
      voicePlatform: !!voiceHealth,
      fishAudio: (fishHealth as { ok: boolean }).ok,
      whisper: !!voiceHealth, // STT available if platform is up
      openrouter: !!voiceHealth, // LLM available if platform is up
    },
    timestamp: new Date().toISOString(),
  });
}
