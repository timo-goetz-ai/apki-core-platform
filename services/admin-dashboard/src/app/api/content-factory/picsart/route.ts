import { NextRequest, NextResponse } from "next/server";
import {
  generateImage,
  generateHeroImage,
  generateSocialAssets,
  generateYouTubeThumbnail,
  removeBackground,
  addTextToImage,
  enhanceImage,
} from "@/lib/picsart";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { action, ...params } = body;

  if (!process.env.PICSART_API_KEY) {
    return NextResponse.json(
      { error: "PICSART_API_KEY nicht gesetzt — bitte in Coolify/Docker eintragen" },
      { status: 503 }
    );
  }

  try {
    switch (action) {
      case "generate": {
        const result = await generateImage(params.prompt, params.options);
        return NextResponse.json({ success: true, ...result });
      }
      case "hero": {
        const result = await generateHeroImage(params.title, params.category, params.options);
        return NextResponse.json({ success: true, ...result });
      }
      case "social": {
        const assets = await generateSocialAssets(params.title, params.platforms);
        return NextResponse.json({ success: true, assets });
      }
      case "thumbnail": {
        const url = await generateYouTubeThumbnail(params.title, params.options);
        return NextResponse.json({ success: true, imageUrl: url });
      }
      case "remove-bg": {
        const url = await removeBackground(params.imageUrl);
        return NextResponse.json({ success: true, imageUrl: url });
      }
      case "add-text": {
        const url = await addTextToImage(params.imageUrl, params.options);
        return NextResponse.json({ success: true, imageUrl: url });
      }
      case "enhance": {
        const url = await enhanceImage(params.imageUrl);
        return NextResponse.json({ success: true, imageUrl: url });
      }
      default:
        return NextResponse.json({ error: `Unbekannte action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    service: "Picsart Pro API",
    configured: !!process.env.PICSART_API_KEY,
    actions: ["generate", "hero", "social", "thumbnail", "remove-bg", "add-text", "enhance"],
  });
}
