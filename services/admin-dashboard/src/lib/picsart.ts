/**
 * Picsart Pro API Client
 * Docs: https://docs.picsart.io/
 */

const PICSART_API = "https://api.picsart.com/tools/1.0";

function getApiKey(): string {
  const key = process.env.PICSART_API_KEY;
  if (!key) throw new Error("PICSART_API_KEY not set");
  return key;
}

function headers(extra: Record<string, string> = {}): Record<string, string> {
  return { "X-Picsart-API-Key": getApiKey(), "Content-Type": "application/json", ...extra };
}

// ─── Image Generation ────────────────────────────────────────────────────────

export interface GenerateImageOptions {
  width?: number;
  height?: number;
  style?: "realistic" | "artistic" | "cartoon" | "abstract";
  quality?: "standard" | "hd";
  count?: number;
}

export async function generateImage(
  prompt: string,
  options: GenerateImageOptions = {}
): Promise<{ imageUrls: string[]; taskId: string }> {
  const res = await fetch(`${PICSART_API}/ai/generateImage`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({
      prompt,
      width: options.width ?? 1920,
      height: options.height ?? 1080,
      style: options.style ?? "realistic",
      quality: options.quality ?? "hd",
      number_of_images: options.count ?? 1,
    }),
  });
  if (!res.ok) throw new Error(`Picsart generateImage: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return {
    imageUrls: data.result.map((img: { url: string }) => img.url),
    taskId: data.task_id,
  };
}

// ─── Remove Background ───────────────────────────────────────────────────────

export async function removeBackground(imageUrl: string): Promise<string> {
  const form = new URLSearchParams({ image_url: imageUrl });
  const res = await fetch(`${PICSART_API}/remove-background`, {
    method: "POST",
    headers: { "X-Picsart-API-Key": getApiKey(), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Picsart removeBackground: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.result.url;
}

// ─── Add Text to Image ───────────────────────────────────────────────────────

export interface AddTextOptions {
  text: string;
  fontSize?: number;
  fontColor?: string;
  backgroundColor?: string;
  position?: "top" | "center" | "bottom";
}

export async function addTextToImage(imageUrl: string, opts: AddTextOptions): Promise<string> {
  const form = new URLSearchParams({
    image_url: imageUrl,
    text: opts.text,
    font_size: String(opts.fontSize ?? 48),
    font_color: opts.fontColor ?? "#FFFFFF",
    background_color: opts.backgroundColor ?? "#000000",
    position: opts.position ?? "center",
  });
  const res = await fetch(`${PICSART_API}/addtext`, {
    method: "POST",
    headers: { "X-Picsart-API-Key": getApiKey(), "Content-Type": "application/x-www-form-urlencoded" },
    body: form.toString(),
  });
  if (!res.ok) throw new Error(`Picsart addText: ${res.status} ${await res.text()}`);
  const data = await res.json();
  return data.result.url;
}

// ─── Hero Image (Blog) ───────────────────────────────────────────────────────

export async function generateHeroImage(
  title: string,
  category: string,
  opts: { style?: string; brandColor?: string } = {}
): Promise<{ imageUrl: string }> {
  const prompt = `Professional hero image for blog titled "${title}" in category "${category}". Style: ${opts.style ?? "professional"}. High quality, modern design, suitable for web header.`;
  const { imageUrls } = await generateImage(prompt, { width: 1920, height: 1080, quality: "hd" });
  const withText = await addTextToImage(imageUrls[0], {
    text: title.slice(0, 60),
    fontSize: 64,
    fontColor: "#FFFFFF",
    backgroundColor: opts.brandColor ?? "#0066FF",
    position: "center",
  });
  return { imageUrl: withText };
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
      `Social media post for ${platform}: "${title}". Professional, eye-catching, optimized for ${platform}.`,
      { width: dim.width, height: dim.height, quality: "hd" }
    );
    results[platform] = imageUrls[0];
  }
  return results;
}

// ─── YouTube Thumbnail ───────────────────────────────────────────────────────

export async function generateYouTubeThumbnail(
  title: string,
  opts: { textColor?: string; bgColor?: string } = {}
): Promise<string> {
  const { imageUrls } = await generateImage(
    `YouTube thumbnail: "${title}". Bold, eye-catching, high contrast, professional.`,
    { width: 1280, height: 720, style: "artistic", quality: "hd" }
  );
  return addTextToImage(imageUrls[0], {
    text: title.slice(0, 50),
    fontSize: 60,
    fontColor: opts.textColor ?? "#FFFFFF",
    backgroundColor: opts.bgColor ?? "#FF0000",
    position: "center",
  });
}

// ─── Enhance Image ───────────────────────────────────────────────────────────

export async function enhanceImage(imageUrl: string): Promise<string> {
  const res = await fetch(`${PICSART_API}/enhance`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify({ image_url: imageUrl, quality: "ultra" }),
  });
  if (!res.ok) throw new Error(`Picsart enhance: ${res.status}`);
  const data = await res.json();
  return data.result.url;
}
