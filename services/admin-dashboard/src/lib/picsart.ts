/**
 * Image Generation Client
 * Primary:  Pollinations.ai — kostenlos, kein API-Key (https://image.pollinations.ai)
 * Fallback: Picsart GenAI API (falls PICSART_API_KEY gesetzt und Credits vorhanden)
 */

// ─── Pollinations.ai (primary, free) ─────────────────────────────────────────

const POLLINATIONS_API = "https://image.pollinations.ai/prompt";

async function generateImagePollinations(
  prompt: string,
  options: { width?: number; height?: number } = {}
): Promise<{ imageUrls: string[]; inferenceId: string }> {
  const w = options.width ?? 1024;
  const h = options.height ?? 1024;
  const encoded = encodeURIComponent(prompt);
  const seed = Math.floor(Math.random() * 99999);
  const url = `${POLLINATIONS_API}/${encoded}?width=${w}&height=${h}&seed=${seed}&nologo=true`;

  // Pollinations returns the image directly — verify it responds with 200
  const res = await fetch(url, { signal: AbortSignal.timeout(45_000) });
  if (!res.ok) throw new Error(`Pollinations: ${res.status}`);

  return { imageUrls: [url], inferenceId: `pollinations-${seed}` };
}

// ─── Picsart GenAI (fallback when key + credits available) ───────────────────

const GENAI_API = "https://genai-api.picsart.io/v1";
const TOOLS_API = "https://api.picsart.io/tools/1.0";

function getApiKey(): string {
  const key = process.env.PICSART_API_KEY;
  if (!key) throw new Error("PICSART_API_KEY not set");
  return key;
}

export interface GenerateImageOptions {
  width?: number;
  height?: number;
  count?: number;
  timeoutMs?: number;
}

async function generateImagePicsart(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<{ imageUrls: string[]; inferenceId: string }> {
  const apiKey = getApiKey();

  const startRes = await fetch(`${GENAI_API}/text2image`, {
    method: "POST",
    headers: { "x-picsart-api-key": apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      width: options.width ?? 1024,
      height: options.height ?? 1024,
      count: options.count ?? 1,
    }),
  });

  if (!startRes.ok) {
    throw new Error(`Picsart text2image start: ${startRes.status} ${await startRes.text()}`);
  }

  const { inference_id } = await startRes.json() as { inference_id: string };
  if (!inference_id) throw new Error("Picsart: keine inference_id in Response");

  const timeoutMs = options.timeoutMs ?? 90_000;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    await new Promise((r) => setTimeout(r, 3_000));
    const pollRes = await fetch(`${GENAI_API}/text2image/inferences/${inference_id}`, {
      headers: { "x-picsart-api-key": apiKey },
    });
    if (!pollRes.ok) throw new Error(`Picsart polling: ${pollRes.status}`);
    const pollData = await pollRes.json() as {
      status: "success" | "processing" | "queued" | "failed";
      data?: { url: string }[];
      error?: string;
    };
    if (pollData.status === "success" && pollData.data?.length) {
      return { imageUrls: pollData.data.map((d) => d.url), inferenceId: inference_id };
    }
    if (pollData.status === "failed") {
      throw new Error(`Picsart: Job fehlgeschlagen — ${pollData.error ?? "unbekannt"}`);
    }
  }
  throw new Error(`Picsart: Timeout nach ${timeoutMs}ms`);
}

/**
 * Generate image — Pollinations first, Picsart as fallback
 */
export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<{ imageUrls: string[]; inferenceId: string }> {
  return generateImagePollinations(prompt, options);
}

// ─── Balance ─────────────────────────────────────────────────────────────────

export async function getBalance(): Promise<{ credits: number }> {
  if (!process.env.PICSART_API_KEY) return { credits: -1 };
  try {
    const res = await fetch(`${TOOLS_API}/balance`, {
      headers: { "x-picsart-api-key": getApiKey() },
    });
    if (!res.ok) return { credits: 0 };
    const data = await res.json() as { credits?: number };
    return { credits: data.credits ?? 0 };
  } catch {
    return { credits: 0 };
  }
}

// ─── Remove Background (Picsart only) ────────────────────────────────────────

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

// ─── Hero Image ───────────────────────────────────────────────────────────────

export async function generateHeroImage(
  title: string,
  category: string,
  opts: { style?: string } = {}
): Promise<{ imageUrl: string; inferenceId: string }> {
  const prompt = `Professional hero image for blog titled "${title}" in category "${category}". Style: ${opts.style ?? "professional, modern, cinematic"}. High quality, suitable for web header, no text overlays.`;
  const { imageUrls, inferenceId } = await generateImage(prompt, { width: 1024, height: 1024 });
  return { imageUrl: imageUrls[0], inferenceId };
}

// ─── Social Media Assets ──────────────────────────────────────────────────────

const SOCIAL_DIMENSIONS: Record<string, { width: number; height: number }> = {
  instagram: { width: 1024, height: 1024 },
  facebook:  { width: 1024, height: 536  },
  twitter:   { width: 1024, height: 576  },
  linkedin:  { width: 1024, height: 536  },
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

// ─── YouTube Thumbnail ────────────────────────────────────────────────────────

export async function generateYouTubeThumbnail(title: string): Promise<string> {
  const { imageUrls } = await generateImage(
    `YouTube thumbnail: "${title}". Bold, eye-catching, high contrast, professional, no text.`,
    { width: 1024, height: 576 }
  );
  return imageUrls[0];
}
