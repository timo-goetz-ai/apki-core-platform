/**
 * Picsart GenAI API Client
 * Text→Image: https://genai-api.picsart.io/v1/text2image (async + polling)
 * Other tools: https://api.picsart.io/tools/1.0
 */

const GENAI_API = "https://genai-api.picsart.io/v1";
const TOOLS_API = "https://api.picsart.io/tools/1.0";

function getApiKey(): string {
  const key = process.env.PICSART_API_KEY;
  if (!key) throw new Error("PICSART_API_KEY not set");
  return key;
}

// ─── Image Generation (async + polling) ──────────────────────────────────────

export interface GenerateImageOptions {
  width?: number;
  height?: number;
  count?: number;
  /** Max polling time in ms, default 90_000 */
  timeoutMs?: number;
}

/**
 * POST text2image → returns inference_id, then polls until DONE.
 * Returns image URL(s) + the inference_id (for NocoDB tracking).
 */
export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<{ imageUrls: string[]; inferenceId: string }> {
  const apiKey = getApiKey();

  // 1. Kick off async job
  const startRes = await fetch(`${GENAI_API}/text2image`, {
    method: "POST",
    headers: {
      "x-picsart-api-key": apiKey,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      prompt,
      width: options.width ?? 1920,
      height: options.height ?? 1080,
      count: options.count ?? 1,
    }),
  });

  if (!startRes.ok) {
    throw new Error(`Picsart text2image start: ${startRes.status} ${await startRes.text()}`);
  }

  const { inference_id } = await startRes.json() as { inference_id: string };
  if (!inference_id) throw new Error("Picsart: keine inference_id in Response");

  // 2. Poll until DONE or timeout
  const timeoutMs = options.timeoutMs ?? 90_000;
  const deadline = Date.now() + timeoutMs;
  const pollInterval = 3_000;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, pollInterval));

    const pollRes = await fetch(`${GENAI_API}/text2image/${inference_id}`, {
      headers: { "x-picsart-api-key": apiKey },
    });

    if (!pollRes.ok) {
      throw new Error(`Picsart polling: ${pollRes.status} ${await pollRes.text()}`);
    }

    const pollData = await pollRes.json() as {
      status: "DONE" | "IN_PROGRESS" | "FAILED";
      data?: { url: string }[];
      error?: string;
    };

    if (pollData.status === "DONE" && pollData.data?.length) {
      return {
        imageUrls: pollData.data.map((d) => d.url),
        inferenceId: inference_id,
      };
    }

    if (pollData.status === "FAILED") {
      throw new Error(`Picsart: Job fehlgeschlagen — ${pollData.error ?? "unbekannt"}`);
    }
    // IN_PROGRESS → weiter warten
  }

  throw new Error(`Picsart: Timeout nach ${timeoutMs}ms (inference_id: ${inference_id})`);
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export async function getBalance(): Promise<{ credits: number }> {
  const res = await fetch(`${TOOLS_API}/balance`, {
    headers: { "x-picsart-api-key": getApiKey() },
  });
  if (!res.ok) throw new Error(`Picsart balance: ${res.status}`);
  const data = await res.json() as { credits?: number };
  return { credits: data.credits ?? 0 };
}

// ─── Remove Background ───────────────────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<string> {
  const form = new URLSearchParams({ image_url: imageUrl });
  const res = await fetch(`${TOOLS_API}/removebg`, {
    method: "POST",
    headers: {
      "x-picsart-api-key": getApiKey(),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Picsart removeBackground: ${res.status} ${await res.text()}`);
  const data = await res.json() as { data?: { url: string } };
  return data.data?.url ?? "";
}

// ─── Hero Image (Blog) ───────────────────────────────────────────────────────

export async function generateHeroImage(
  title: string,
  category: string,
  opts: { style?: string } = {}
): Promise<{ imageUrl: string; inferenceId: string }> {
  const prompt = `Professional hero image for blog titled "${title}" in category "${category}". Style: ${opts.style ?? "professional, modern, cinematic"}. High quality, suitable for web header, no text overlays.`;
  const { imageUrls, inferenceId } = await generateImage(prompt, { width: 1920, height: 1080 });
  return { imageUrl: imageUrls[0], inferenceId };
}

// ─── Social Media Assets ─────────────────────────────────────────────────────

const SOCIAL_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1080, height: 1080 },
  facebook:  { width: 1200, height: 628  },
  twitter:   { width: 1200, height: 675  },
  linkedin:  { width: 1200, height: 627  },
};

export async function generateSocialAssets(
  title: string,
  platforms: string[] = ["instagram", "facebook", "linkedin", "twitter"]
): Promise<Record<string, string>> {
  const results: Record<string, string> = {};
  for (const platform of platforms) {
    const dim = SOCIAL_DIMENSIONS[platform] ?? SOCIAL_DIMENSIONS.instagram;
    const { imageUrls } = await generateImage(
      `Social media visual for ${platform}: "${title}". Professional, eye-catching, optimized for ${platform}.`,
      { width: dim.width, height: dim.height }
    );
    results[platform] = imageUrls[0];
  }
  return results;
}

// ─── YouTube Thumbnail ───────────────────────────────────────────────────────

export async function generateYouTubeThumbnail(title: string): Promise<string> {
  const { imageUrls } = await generateImage(
    `YouTube thumbnail: "${title}". Bold, eye-catching, high contrast, professional, no text.`,
    { width: 1280, height: 720 }
  );
  return imageUrls[0];
}
