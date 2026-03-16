import { NextRequest, NextResponse } from "next/server";
import { textToSpeech, listVoices, audioToDataUrl } from "@/lib/fishaudio";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const { text, voiceId, speed, format = "mp3" } = await req.json();

  if (!process.env.FISH_AUDIO_API_KEY) {
    return NextResponse.json(
      { error: "FISH_AUDIO_API_KEY nicht gesetzt — bitte in Coolify/Docker eintragen" },
      { status: 503 }
    );
  }

  if (!text) return NextResponse.json({ error: "text erforderlich" }, { status: 400 });

  try {
    const buffer = await textToSpeech(text, { voiceId, speed, format: format as "mp3" | "wav" | "opus" });
    const dataUrl = audioToDataUrl(buffer, format);
    return NextResponse.json({ success: true, audioDataUrl: dataUrl, length: buffer.byteLength });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function GET() {
  if (!process.env.FISH_AUDIO_API_KEY) {
    return NextResponse.json({ configured: false, error: "FISH_AUDIO_API_KEY nicht gesetzt" });
  }
  try {
    const voices = await listVoices();
    return NextResponse.json({ configured: true, voices: voices.slice(0, 20) });
  } catch (err) {
    return NextResponse.json({ configured: true, error: String(err) });
  }
}
