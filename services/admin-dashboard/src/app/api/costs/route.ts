export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const N8N_API         = process.env.N8N_INTERNAL_URL    || 'http://10.0.1.16:5678';
const N8N_KEY         = process.env.N8N_API_KEY          || '';
const ANYTHINGLLM_URL = process.env.ANYTHINGLLM_URL      || 'http://localhost:3003';
const ANYTHINGLLM_KEY = process.env.ANYTHINGLLM_API_KEY  || '';
const ANTHROPIC_KEY   = process.env.ANTHROPIC_API_KEY    || '';
const GEMINI_KEY      = process.env.GOOGLE_AI_API_KEY    || '';

async function fetchAnythingLLMStatus() {
  try {
    const res = await fetch(`${ANYTHINGLLM_URL}/api/health`, {
      headers: ANYTHINGLLM_KEY ? { Authorization: `Bearer ${ANYTHINGLLM_KEY}` } : {},
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) return { online: false, url: ANYTHINGLLM_URL, workspaces: null, error: `HTTP ${res.status}` };
    const workspacesRes = await fetch(`${ANYTHINGLLM_URL}/api/v1/workspaces`, {
      headers: ANYTHINGLLM_KEY ? { Authorization: `Bearer ${ANYTHINGLLM_KEY}` } : {},
      signal: AbortSignal.timeout(4000),
    }).catch(() => null);
    const wsData = workspacesRes?.ok ? await workspacesRes.json().catch(() => null) : null;
    const workspaceCount = wsData?.workspaces?.length ?? null;
    return { online: true, url: ANYTHINGLLM_URL, workspaces: workspaceCount, error: null };
  } catch {
    return { online: false, url: ANYTHINGLLM_URL, workspaces: null, error: 'Nicht erreichbar' };
  }
}

async function checkAnthropicKey() {
  if (!ANTHROPIC_KEY) return { valid: false, model: null, error: 'Key fehlt' };
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: { 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { valid: false, model: null, error: `HTTP ${res.status}` };
    const data = await res.json();
    const latest = data?.data?.[0]?.id ?? 'claude';
    return { valid: true, model: latest, error: null };
  } catch {
    return { valid: false, model: null, error: 'Timeout' };
  }
}

async function checkGeminiKey() {
  if (!GEMINI_KEY) return { valid: false, model: null, error: 'Key fehlt' };
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${GEMINI_KEY}`,
      { signal: AbortSignal.timeout(5000) }
    );
    if (!res.ok) return { valid: false, model: null, error: `HTTP ${res.status}` };
    const data = await res.json();
    const latest = data?.models?.[0]?.name?.replace('models/', '') ?? 'gemini';
    return { valid: true, model: latest, error: null };
  } catch {
    return { valid: false, model: null, error: 'Timeout' };
  }
}

async function fetchN8nStats() {
  if (!N8N_KEY) return { executions24h: null, executionsTotal: null, error: 'Key fehlt' };
  try {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const [all, recent] = await Promise.all([
      fetch(`${N8N_API}/api/v1/executions?limit=1`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.json()),
      fetch(`${N8N_API}/api/v1/executions?limit=100`, {
        headers: { 'X-N8N-API-KEY': N8N_KEY },
        signal: AbortSignal.timeout(5000),
      }).then(r => r.json()),
    ]);
    const executions24h = (recent?.data ?? []).filter(
      (e: { startedAt: string }) => new Date(e.startedAt) > new Date(since)
    ).length;
    return { executions24h, executionsTotal: all?.count ?? null, error: null };
  } catch {
    return { executions24h: null, executionsTotal: null, error: 'Timeout' };
  }
}

export async function GET() {
  const [anythingllm, anthropic, gemini, n8n] = await Promise.all([
    fetchAnythingLLMStatus(),
    checkAnthropicKey(),
    checkGeminiKey(),
    fetchN8nStats(),
  ]);
  return NextResponse.json({
    anythingllm,
    anthropic,
    gemini,
    n8n,
    fetchedAt: new Date().toISOString(),
  });
}
