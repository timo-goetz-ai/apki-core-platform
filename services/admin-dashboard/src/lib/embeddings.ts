/**
 * Text-Embeddings für Qdrant — OpenRouter (OpenAI-kompatibel) oder Google text-embedding-004.
 * Keine Keys im Client; nur serverseitig aufrufen.
 */

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY ?? '';
const GOOGLE_KEY = process.env.GOOGLE_AI_API_KEY ?? process.env.GEMINI_API_KEY ?? '';

const OPENROUTER_EMBED_MODEL = process.env.FABRIK_EMBED_MODEL ?? 'openai/text-embedding-3-small';

export async function embedText(text: string): Promise<{ vector: number[]; model: string }> {
  const trimmed = text.trim().slice(0, 12000);
  if (!trimmed) {
    throw new Error('embedText: leerer Text');
  }

  if (OPENROUTER_KEY) {
    const res = await fetch('https://openrouter.ai/api/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://aios.automation-plus-ki.de',
        'X-Title': 'AIOS Fabrik Index',
      },
      body: JSON.stringify({ model: OPENROUTER_EMBED_MODEL, input: trimmed }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`OpenRouter embeddings ${res.status}: ${err.slice(0, 500)}`);
    }
    const data = (await res.json()) as { data?: Array<{ embedding: number[] }> };
    const vec = data.data?.[0]?.embedding;
    if (!vec?.length) throw new Error('OpenRouter: keine Embedding-Dimension');
    return { vector: vec, model: OPENROUTER_EMBED_MODEL };
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

  throw new Error('Kein Embedding-Provider: OPENROUTER_API_KEY oder GOOGLE_AI_API_KEY setzen');
}
