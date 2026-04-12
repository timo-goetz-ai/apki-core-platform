/**
 * Fish Audio TTS API Client
 * Docs: https://docs.fish.audio/
 */

const FISH_API = "https://api.fish.audio/v1";

function getApiKey(): string {
  const key = process.env.FISHAUDIO_API_KEY ?? process.env.FISH_AUDIO_API_KEY;
  if (!key) throw new Error("FISHAUDIO_API_KEY nicht gesetzt");
  return key;
}

export interface TTSOptions {
  voiceId?: string;       // Fish Audio voice/model ID
  speed?: number;         // 0.5 – 2.0, default 1.0
  pitch?: number;         // default 0
  format?: "mp3" | "wav" | "opus";
}

/**
 * Text → Audio Buffer (ArrayBuffer)
 */
export async function textToSpeech(
  text: string,
  opts: TTSOptions = {}
): Promise<ArrayBuffer> {
  const body = {
    text,
    reference_id: opts.voiceId ?? process.env.FISH_AUDIO_DEFAULT_VOICE ?? "",
    format: opts.format ?? "mp3",
    mp3_bitrate: 128,
    normalize: true,
    streaming: false,
    prosody: {
      speed: opts.speed ?? 1.0,
      volume: 0,
    },
  };

  const res = await fetch(`${FISH_API}/tts`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`Fish Audio TTS: ${res.status} ${await res.text()}`);
  return res.arrayBuffer();
}

/**
 * Get available voices/models
 */
export async function listVoices(): Promise<{ id: string; name: string; language: string }[]> {
  const res = await fetch(`${FISH_API}/model`, {
    headers: { Authorization: `Bearer ${getApiKey()}` },
  });
  if (!res.ok) throw new Error(`Fish Audio listVoices: ${res.status}`);
  const data = await res.json();
  return (data.items ?? []).map((m: { _id: string; title: string; languages: string[] }) => ({
    id: m._id,
    name: m.title,
    language: m.languages?.[0] ?? "unknown",
  }));
}

/**
 * Health check — prüft ob API Key gültig ist
 */
export async function checkFishAudioHealth(): Promise<{ ok: boolean; error?: string }> {
  try {
    await listVoices();
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Convert ArrayBuffer to Base64 Data URL
 */
export function audioToDataUrl(buffer: ArrayBuffer, format = "mp3"): string {
  const bytes = new Uint8Array(buffer);
  const binary = bytes.reduce((acc, b) => acc + String.fromCharCode(b), "");
  const base64 = btoa(binary);
  return `data:audio/${format};base64,${base64}`;
}
