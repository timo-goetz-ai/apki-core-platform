export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';

const N8N_API = process.env.N8N_INTERNAL_URL || 'http://10.0.1.29:5678';
const N8N_KEY = process.env.N8N_API_KEY || '';
const OR_KEY  = process.env.OPENROUTER_API_KEY || '';

async function fetchOpenRouterCredits() {
  if (!OR_KEY) return { credit: null, limit: null, error: 'OPENROUTER_API_KEY nicht gesetzt' };
  try {
    const res = await fetch('https://openrouter.ai/api/v1/auth/key', {
      headers: { Authorization: `Bearer ${OR_KEY}` },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return { credit: null, limit: null, error: `HTTP ${res.status}` };
    const data = await res.json();
    return {
      credit: data?.data?.usage ?? null,
      limit:  data?.data?.limit ?? null,
      label:  data?.data?.label ?? 'OpenRouter',
      isFreeTier: data?.data?.is_free_tier ?? false,
      error:  null,
    };
  } catch {
    return { credit: null, limit: null, error: 'Timeout' };
  }
}

async function fetchN8nStats() {
  if (!N8N_KEY) return { executions24h: null, executionsTotal: null, error: 'N8N_API_KEY nicht gesetzt' };
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
    return {
      executions24h,
      executionsTotal: all?.count ?? null,
      error: null,
    };
  } catch {
    return { executions24h: null, executionsTotal: null, error: 'Timeout' };
  }
}

export async function GET() {
  const [openrouter, n8n] = await Promise.all([fetchOpenRouterCredits(), fetchN8nStats()]);
  return NextResponse.json({ openrouter, n8n, fetchedAt: new Date().toISOString() });
}
