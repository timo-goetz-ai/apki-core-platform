/**
 * Deepgram API Client — STT + TTS
 * Docs: https://developers.deepgram.com/docs
 */

const DG_API = 'https://api.deepgram.com/v1';

function getApiKey(): string {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) throw new Error('DEEPGRAM_API_KEY not set');
  return key;
}

/* ── TTS ─────────────────────────────────────────────────────────────────────── */

export interface DgTTSOptions {
  model?: string;   // 'aura-asteria-en' | 'aura-luna-en' | 'aura-stella-en' | 'aura-athena-en' | 'aura-zeus-de' etc.
  speed?: number;   // 0.5–2.0, default 1.0 (via sample_rate trick — Deepgram TTS doesn't have native speed)
}

/**
 * Text → Audio Buffer (mp3)
 */
export async function textToSpeech(
  text: string,
  opts: DgTTSOptions = {},
): Promise<ArrayBuffer> {
  const model = opts.model ?? 'aura-asteria-en';
  const res = await fetch(`${DG_API}/speak?model=${model}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) throw new Error(`Deepgram TTS: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}

/* ── STT ─────────────────────────────────────────────────────────────────────── */

export interface DgSTTOptions {
  model?: string;    // 'nova-2' | 'nova-2-general' | 'enhanced'
  language?: string; // 'de' | 'en' etc.
  punctuate?: boolean;
  smart_format?: boolean;
}

/**
 * Audio Buffer → Text transcript
 */
export async function speechToText(
  audioBuffer: ArrayBuffer,
  opts: DgSTTOptions = {},
): Promise<{ transcript: string; confidence: number; words: number }> {
  const params = new URLSearchParams({
    model: opts.model ?? 'nova-2',
    language: opts.language ?? 'de',
    punctuate: String(opts.punctuate ?? true),
    smart_format: String(opts.smart_format ?? true),
  });

  const res = await fetch(`${DG_API}/listen?${params}`, {
    method: 'POST',
    headers: {
      Authorization: `Token ${getApiKey()}`,
      'Content-Type': 'audio/webm',
    },
    body: audioBuffer,
  });

  if (!res.ok) throw new Error(`Deepgram STT: ${res.status} ${await res.text()}`);
  const data = await res.json();
  const alt = data.results?.channels?.[0]?.alternatives?.[0];
  return {
    transcript: alt?.transcript ?? '',
    confidence: alt?.confidence ?? 0,
    words: alt?.words?.length ?? 0,
  };
}

/* ── Health ───────────────────────────────────────────────────────────────────── */

export async function checkDeepgramHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${DG_API}/projects`, {
      headers: { Authorization: `Token ${getApiKey()}` },
      signal: AbortSignal.timeout(5000),
    });
    return { ok: res.ok };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* ── Voices ──────────────────────────────────────────────────────────────────── */

export function listVoices(): { id: string; name: string; language: string }[] {
  return [
    { id: 'aura-asteria-en', name: 'Asteria (EN, Female)', language: 'en' },
    { id: 'aura-luna-en', name: 'Luna (EN, Female)', language: 'en' },
    { id: 'aura-stella-en', name: 'Stella (EN, Female)', language: 'en' },
    { id: 'aura-athena-en', name: 'Athena (EN, Female)', language: 'en' },
    { id: 'aura-zeus-en', name: 'Zeus (EN, Male)', language: 'en' },
    { id: 'aura-orpheus-en', name: 'Orpheus (EN, Male)', language: 'en' },
    { id: 'aura-angus-en', name: 'Angus (EN, Male, Irish)', language: 'en' },
    { id: 'aura-helios-en', name: 'Helios (EN, Male)', language: 'en' },
  ];
}

/**
 * Convert ArrayBuffer to Base64 Data URL
 */
export function audioToDataUrl(buffer: ArrayBuffer, format = 'mp3'): string {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), '');
  const base64 = btoa(binary);
  return `data:audio/${format};base64,${base64}`;
}
