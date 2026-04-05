/**
 * Text-Embeddings für Qdrant — AnythingLLM (OpenAI-kompatibel) oder Google text-embedding-004.
 * Keine Keys im Client; nur serverseitig aufrufen.
 */

const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL ?? 'http://localhost:3003';
const ANYTHINGLLM_KEY = process.env.ANYTHINGLLM_API_KEY ?? '';
const GOOGLE_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';

const EMBED_MODEL = process.env.FABRIK_EMBED_MODEL ?? 'text-embedding-3-small';

export async function embedText(text: string): Promise<{ vector: number[]; model: string }> {
  const trimmed = text.trim().slice(0, 12000);
  if (!trimmed) {
    throw new Error('embedText: leerer Text');
  }

  if (ANYTHINGLLM_URL) {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (ANYTHINGLLM_KEY) headers['Authorization'] = `Bearer ${ANYTHINGLLM_KEY}`;
    const res = await fetch(`${ANYTHINGLLM_URL}/api/openai/embeddings`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ model: EMBED_MODEL, input: trimmed }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`AnythingLLM embeddings ${res.status}: ${err.slice(0, 500)}`);
    }
    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const vec = data.data?.[0]?.embedding;
    if (!vec?.length) throw new Error('AnythingLLM: keine Embedding-Dimension');
    return { vector: vec, model: EMBED_MODEL };
  }

  if (GOOGLE_KEY) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${encodeURIComponent(GOOGLE_KEY)}`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: { parts: [{ text: trimmed }] } }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Google embed ${res.status}: ${err.slice(0, 500)}`);
    }
    const data = (await res.json()) as { embedding?: { values?: number[] } };
    const vec = data.embedding?.values;
    if (!vec?.length) throw new Error('Google: keine Embedding-Werte');
    return { vector: vec, model: 'text-embedding-004' };
  }

  throw new Error('Kein Embedding-Provider: ANYTHINGLLM_URL oder GOOGLE_AI_API_KEY setzen');
}
