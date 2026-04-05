import { NextRequest, NextResponse } from "next/server";
import { generateHeroImage, generateSocialAssets, generateYouTubeThumbnail } from "@/lib/picsart";
import { textToSpeech, audioToDataUrl } from "@/lib/fishaudio";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// ─── POST /api/content-factory/generate ─────────────────────────────────────
// Orchestriert: Blog (LLM) + Hero Image + Social Assets + Voice-Over
export async function POST(req: NextRequest) {
  const { topic, title, summary, keywords = [], category = "Allgemein", steps = ["blog", "hero", "social", "voice"] } =
    await req.json();

  if (!topic && !title) {
    return NextResponse.json({ error: "topic oder title erforderlich" }, { status: 400 });
  }

  const blogTitle = title ?? topic;
  const blogSummary = summary ?? topic;

  const result: Record<string, unknown> = { title: blogTitle, category, steps: {} };
  const errors: Record<string, string> = {};

  // ── STEP 1: Blog Post via LLM (AnythingLLM) ───────────────────────────────
  if (steps.includes("blog")) {
    try {
      const llmRes = await fetch(
        `${process.env.INTERNAL_BASE_URL ?? "http://localhost:3000"}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            modelKey: "allm-aios",
            messages: [
              {
                role: "user",
                content: `Schreibe einen professionellen Blogpost auf Deutsch zum Thema: "${blogTitle}".
Kontext: ${blogSummary}
Keywords: ${keywords.join(", ")}

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
        }
      );

      if (llmRes.ok) {
        // Read SSE stream
        const reader = llmRes.body?.getReader();
        let blogContent = "";
        const decoder = new TextDecoder();
        if (reader) {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value);
            const lines = chunk.split("\n");
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const json = JSON.parse(line.slice(6));
                  if (json.content) blogContent += json.content;
                } catch {}
              }
            }
          }
        }
        const excerptMatch = blogContent.match(/Excerpt[^:]*:\s*(.+)/i);
        result.steps = {
          ...(result.steps as object),
          blog: {
            content: blogContent,
            excerpt: excerptMatch?.[1]?.trim() ?? blogContent.slice(0, 160),
            title: blogTitle,
          },
        };
      }
    } catch (e) {
      errors.blog = String(e);
    }
  }

  // ── STEP 2: Hero Image via Picsart ─────────────────────────────────────────
  if (steps.includes("hero") && process.env.PICSART_API_KEY) {
    try {
      const hero = await generateHeroImage(blogTitle, category);
      result.steps = { ...(result.steps as object), hero };
    } catch (e) {
      errors.hero = String(e);
    }
  } else if (steps.includes("hero")) {
    errors.hero = "PICSART_API_KEY nicht gesetzt";
  }

  // ── STEP 3: Social Media Assets via Picsart ────────────────────────────────
  if (steps.includes("social") && process.env.PICSART_API_KEY) {
    try {
      const social = await generateSocialAssets(blogTitle, ["instagram", "facebook", "linkedin", "twitter"]);
      result.steps = { ...(result.steps as object), social };
    } catch (e) {
      errors.social = String(e);
    }
  } else if (steps.includes("social")) {
    errors.social = "PICSART_API_KEY nicht gesetzt";
  }

  // ── STEP 4: YouTube Thumbnail ─────────────────────────────────────────────
  if (steps.includes("thumbnail") && process.env.PICSART_API_KEY) {
    try {
      const thumbnail = await generateYouTubeThumbnail(blogTitle);
      result.steps = { ...(result.steps as object), thumbnail };
    } catch (e) {
      errors.thumbnail = String(e);
    }
  }

  // ── STEP 5: Voice-Over via Fish Audio ─────────────────────────────────────
  if (steps.includes("voice") && process.env.FISH_AUDIO_API_KEY) {
    try {
      const stepsResult = result.steps as Record<string, { excerpt?: string }>;
      const text =
        stepsResult.blog?.excerpt ?? blogSummary;
      const audioBuffer = await textToSpeech(text, { speed: 1.0 });
      const audioDataUrl = audioToDataUrl(audioBuffer);
      result.steps = { ...(result.steps as object), voice: { audioDataUrl, text } };
    } catch (e) {
      errors.voice = String(e);
    }
  } else if (steps.includes("voice")) {
    errors.voice = "FISH_AUDIO_API_KEY nicht gesetzt";
  }

  return NextResponse.json({
    success: true,
    title: blogTitle,
    category,
    result: result.steps,
    errors: Object.keys(errors).length ? errors : undefined,
  });
}
