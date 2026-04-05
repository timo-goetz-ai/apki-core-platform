export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';

/**
 * KI-Influencerin / AI Telefonassistentin — Webhook Endpoint
 * Receives incoming call webhooks and routes to voice pipeline.
 * In production: n8n webhook → this endpoint → TTS response
 */

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { caller, message, callId } = body;

    // Log the incoming call
    console.log(`[AI-Assistant] Call ${callId} from ${caller}: ${message}`);

    // For demo: respond with a greeting using Fish Audio TTS
    const greeting = message
      ? `Ich habe verstanden: "${message}". Wie kann ich Ihnen weiterhelfen?`
      : 'Hallo! Ich bin die KI-Assistentin von Automation+KI. Wie kann ich Ihnen helfen?';

    return NextResponse.json({
      response: greeting,
      callId: callId ?? `demo-${Date.now()}`,
      status: 'ok',
      // In production: ttsUrl would point to generated audio
      ttsUrl: null,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err), status: 'error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: 'KI-Influencerin / AI Telefonassistentin',
    status: 'active',
    webhook: '/api/voice/assistant',
    capabilities: ['greeting', 'tts-response', 'call-routing'],
    description: 'Webhook-Endpoint für eingehende Anrufe. Antwortet mit KI-generiertem Text, der via Fish Audio TTS in Sprache umgewandelt wird.',
  });
}
