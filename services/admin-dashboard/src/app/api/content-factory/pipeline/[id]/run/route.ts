import { NextRequest, NextResponse } from 'next/server';
import { getPipelineJob, updatePipelineJob } from '@/lib/nocodb';
import { generateHeroImage } from '@/lib/picsart';
import { textToSpeech, audioToDataUrl } from '@/lib/fishaudio';

export const dynamic = 'force-dynamic';
export const maxDuration = 300;

// POST /api/content-factory/pipeline/[id]/run
// Führt alle steps sequenziell aus, updated NocoDB nach jedem Schritt.
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const jobId = Number(params.id);
  if (isNaN(jobId)) {
    return NextResponse.json({ error: 'Ungültige Job-ID' }, { status: 400 });
  }

  const job = await getPipelineJob(jobId);
  if (!job) {
    return NextResponse.json({ error: 'Job nicht gefunden' }, { status: 404 });
  }
  if (job.status === 'running') {
    return NextResponse.json({ error: 'Job läuft bereits' }, { status: 409 });
  }

  const steps: string[] = JSON.parse(job.steps_requested ?? '["blog","image","voice"]');
  const errors: Record<string, string> = {};

  // ── STEP 1: Blog-Text via OpenRouter (direkt, kein Self-Call) ──────────────
  if (steps.includes('blog')) {
    await updatePipelineJob(jobId, { stage: 'text', status: 'running' });
    try {
      const orKey = process.env.OPENROUTER_API_KEY;
      if (!orKey) throw new Error('OPENROUTER_API_KEY nicht gesetzt');

      const llmRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${orKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://aios.automation-plus-ki.de',
        },
        body: JSON.stringify({
          model: 'deepseek/deepseek-chat',
          messages: [
            {
              role: 'user',
              content: `Schreibe einen professionellen Blogpost auf Deutsch zum Thema: "${job.topic}".
Kategorie: ${job.category}

Format:
# [Titel]
## Einleitung (2-3 Sätze)
## Hauptteil (3-4 Abschnitte mit H3)
## Fazit
---
SEO-Keywords: ...
Excerpt (1 Satz): ...`,
            },
          ],
        }),
      });

      if (!llmRes.ok) throw new Error(`OpenRouter ${llmRes.status}: ${await llmRes.text()}`);

      const llmData = await llmRes.json() as { choices?: { message?: { content?: string } }[] };
      const blogContent = llmData.choices?.[0]?.message?.content ?? '';
      await updatePipelineJob(jobId, { content_text: blogContent });
    } catch (e) {
      errors.blog = String(e);
      await updatePipelineJob(jobId, {
        status: 'error',
        error_message: `Blog-Fehler: ${String(e)}`,
      });
      return NextResponse.json({ success: false, errors });
    }
  }

  // ── STEP 2: Hero Image via Picsart ─────────────────────────────────────────
  if (steps.includes('image')) {
    await updatePipelineJob(jobId, { stage: 'image', status: 'running' });
    try {
      const { imageUrl, inferenceId } = await generateHeroImage(job.topic, job.category);
      await updatePipelineJob(jobId, {
        image_url: imageUrl,
      });
    } catch (e) {
      errors.image = String(e);
      // Nicht abbrechen — weiter mit Voice
      await updatePipelineJob(jobId, {
        error_message: `Bild-Fehler: ${String(e)}`,
      });
    }
  }

  // ── STEP 3: Voice-Over via Fish Audio ──────────────────────────────────────
  if (steps.includes('voice')) {
    await updatePipelineJob(jobId, { stage: 'voice', status: 'running' });
    try {
      // Excerpt aus content_text extrahieren (letzte aktualisierte Version holen)
      const current = await getPipelineJob(jobId);
      const text = extractExcerpt(current?.content_text ?? job.topic);
      const audioBuffer = await textToSpeech(text, { speed: 1.0 });
      const audioDataUrl = audioToDataUrl(audioBuffer);
      await updatePipelineJob(jobId, { voice_url: audioDataUrl });
    } catch (e) {
      errors.voice = String(e);
      await updatePipelineJob(jobId, {
        error_message: `Voice-Fehler: ${String(e)}`,
      });
    }
  }

  // ── Fertig ─────────────────────────────────────────────────────────────────
  const finalStatus = Object.keys(errors).length > 0 ? 'error' : 'done';
  await updatePipelineJob(jobId, { stage: 'done', status: finalStatus });

  return NextResponse.json({ success: finalStatus === 'done', errors });
}

function extractExcerpt(text: string): string {
  const match = text.match(/Excerpt[^:]*:\s*(.+)/i);
  if (match?.[1]) return match[1].trim();
  // Fallback: erster nicht-leerer Satz nach Headings
  const clean = text.replace(/^#{1,3}.+$/gm, '').trim();
  return clean.slice(0, 400);
}
