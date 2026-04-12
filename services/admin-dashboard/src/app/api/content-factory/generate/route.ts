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

  // ── STEP 1: Blog Post via Anthropic Claude ────────────────────────────────
  if (steps.includes("blog")) {
    try {
      const anthropicKey = process.env.ANTHROPIC_API_KEY ?? "";
      if (!anthropicKey) throw new Error("ANTHROPIC_API_KEY nicht gesetzt");

      const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": anthropicKey,
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 1500,
          messages: [
            {
              role: "user",
              content: `Schreibe einen professionellen Blogpost auf Deutsch zum Thema: "${blogTitle}".
Kontext: ${blogSummary}
Keywords: ${keywords.join(", ") || "KI, Automatisierung"}

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
        signal: AbortSignal.timeout(45000),
      });

      if (!anthropicRes.ok) {
        const err = await anthropicRes.text();
        throw new Error(`Anthropic ${anthropicRes.status}: ${err.slice(0, 200)}`);
      }

      const anthropicData = await anthropicRes.json();
      const blogContent = anthropicData.content?.[0]?.text ?? "";
      const excerptMatch = blogContent.match(/Excerpt[^:]*:\s*(.+)/i);
      result.steps = {
        ...(result.steps as object),
        blog: {
          content: blogContent,
          excerpt: excerptMatch?.[1]?.trim() ?? blogContent.slice(0, 200),
          title: blogTitle,
        },
      };
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
