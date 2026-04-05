import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  return NextResponse.json({
    anythingllm: !!process.env.ANYTHINGLLM_URL,
    anthropic: !!process.env.ANTHROPIC_API_KEY,
    google: !!process.env.GOOGLE_AI_API_KEY,
    n8n: !!(process.env.N8N_API_KEY && process.env.N8N_API_KEY !== 'BITTE_KONFIGURIEREN'),
    nocodb: !!process.env.NOCODB_API_TOKEN,
    coolify: !!process.env.COOLIFY_API_KEY,
    cloudflare: !!process.env.CLOUDFLARE_API_TOKEN,
  });
}
