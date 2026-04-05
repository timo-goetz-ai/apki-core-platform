/**
 * POST /api/n8n/summary
 *
 * Baut einen Workflow-Status-Report und sendet ihn an:
 *   • Discord  → DISCORD_WEBHOOK_URL (env)
 *   • Telegram → TELEGRAM_BOT_TOKEN + TELEGRAM_CHAT_ID (env)
 *
 * Kann auch manuell per Button im Operations Center ausgelöst werden.
 */

export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { WORKFLOW_CATALOG } from '@/lib/workflow-categories';

const DX_BASE  = (process.env.DIRECTUS_URL  ?? '').replace(/\/$/, '');
const DX_TOKEN = process.env.DIRECTUS_TOKEN ?? '';
const N8N_BASE = process.env.N8N_INTERNAL_URL ?? 'http://10.0.1.16:5678';
const N8N_KEY  = process.env.N8N_API_KEY ?? process.env.N8N_SELF_API_KEY ?? '';

const DISCORD_WEBHOOK  = process.env.DISCORD_WEBHOOK_URL ?? '';
const TG_BOT_TOKEN     = process.env.TELEGRAM_BOT_TOKEN  ?? '';
const TG_CHAT_ID       = process.env.TELEGRAM_CHAT_ID    ?? '';

/* ── helpers ─────────────────────────────────────────────────────────────── */

interface N8nWf { id: string; name: string; active: boolean; }
interface DxWf  { n8n_id?: string; status?: string; intervall?: string; kategorie?: string; }

async function fetchWorkflowStatus(): Promise<{ wf: N8nWf; dx?: DxWf }[]> {
  const headers = { 'X-N8N-API-KEY': N8N_KEY };

  const [n8nRes, dxRes] = await Promise.allSettled([
    fetch(`${N8N_BASE}/api/v1/workflows?limit=100`, { headers, signal: AbortSignal.timeout(8000) }),
    DX_BASE && DX_TOKEN
      ? fetch(`${DX_BASE}/items/100_workflows?limit=-1&fields=n8n_id,status,intervall,kategorie`, {
          headers: { Authorization: `Bearer ${DX_TOKEN}` },
          signal: AbortSignal.timeout(6000),
        })
      : Promise.resolve(null),
  ]);

  const n8nWfs: N8nWf[] =
    n8nRes.status === 'fulfilled' && n8nRes.value?.ok
      ? ((await n8nRes.value.json()).data ?? [])
      : [];

  let dxWfs: DxWf[] = [];
  if (dxRes.status === 'fulfilled' && dxRes.value && 'ok' in dxRes.value && (dxRes.value as Response).ok) {
    dxWfs = ((await (dxRes.value as Response).json()).data ?? []) as DxWf[];
  }

  const dxMap = new Map<string, DxWf>();
  for (const d of dxWfs) if (d.n8n_id) dxMap.set(d.n8n_id, d);

  return n8nWfs.map((wf) => ({ wf, dx: dxMap.get(wf.id) }));
}

/* ── build report text ───────────────────────────────────────────────────── */

function buildReport(rows: { wf: N8nWf; dx?: DxWf }[]): { plain: string; discord: object } {
  const now   = new Date();
  const date  = now.toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' });
  const time  = now.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' });

  const active   = rows.filter((r) => r.wf.active);
  const inactive = rows.filter((r) => !r.wf.active);

  // Total time savings from catalog
  const totalSaves = WORKFLOW_CATALOG.reduce((s, e) => s + e.savesHoursPerWeek, 0);

  // Scheduled today (DAY = täglich)
  const scheduledToday = WORKFLOW_CATALOG
    .filter((e) => e.scheduleKey === 'DAY')
    .map((e) => `${e.runFrequency}  ${e.newId}  ${e.displayName}`);

  // Scheduled this week (WEEK)
  const scheduledWeek = WORKFLOW_CATALOG
    .filter((e) => e.scheduleKey === 'WEEK')
    .map((e) => `${e.runFrequency}  ${e.newId}  ${e.displayName}`);

  // Active workflows with new IDs
  const activeLines = active
    .map((r) => {
      const cat = WORKFLOW_CATALOG.find((e) => e.n8nId === r.wf.id);
      const id  = cat?.newId ?? '';
      return `✅  ${id ? id + '  ' : ''}${cat?.displayName ?? r.wf.name}`;
    })
    .join('\n');

  const inactiveLines = inactive
    .map((r) => {
      const cat = WORKFLOW_CATALOG.find((e) => e.n8nId === r.wf.id);
      const id  = cat?.newId ?? '';
      return `⚪  ${id ? id + '  ' : ''}${cat?.displayName ?? r.wf.name}`;
    })
    .join('\n');

  /* Plain text (Telegram — MarkdownV2 escaped) */
  const plain = [
    `🤖 *AIOS Workflow Report*`,
    `📅 ${date}  🕐 ${time}`,
    ``,
    `📊 Gesamt: ${rows.length}  |  ✅ Aktiv: ${active.length}  |  ⚪ Inaktiv: ${inactive.length}`,
    `⏱ Automatisierung spart ~${totalSaves}h/Woche`,
    ``,
    `── AKTIVE WORKFLOWS ──`,
    activeLines || '(keine)',
    ``,
    inactive.length > 0 ? `── INAKTIV ──\n${inactiveLines}\n` : '',
    `── HEUTE GEPLANT ──`,
    scheduledToday.length > 0 ? scheduledToday.join('\n') : '(keine)',
    ``,
    `── DIESE WOCHE ──`,
    scheduledWeek.length > 0 ? scheduledWeek.join('\n') : '(keine)',
    ``,
    `🔗 Dashboard: https://admin.automation-plus-ki.de/workflows`,
  ].filter(Boolean).join('\n');

  /* Discord embed */
  const discord = {
    embeds: [
      {
        title: '🤖 AIOS Workflow Report',
        description: `**${date}** — ${time}`,
        color: 0x22c55e,
        fields: [
          {
            name: '📊 Status',
            value: `Gesamt: **${rows.length}** | ✅ Aktiv: **${active.length}** | ⚪ Inaktiv: **${inactive.length}**\n⏱ Spart ~**${totalSaves}h/Woche**`,
            inline: false,
          },
          {
            name: '✅ Aktive Workflows',
            value: active
              .map((r) => {
                const cat = WORKFLOW_CATALOG.find((e) => e.n8nId === r.wf.id);
                return `\`${cat?.newId ?? '—'}\` ${cat?.displayName ?? r.wf.name}`;
              })
              .join('\n') || '—',
            inline: false,
          },
          ...(inactive.length > 0
            ? [{
                name: '⚪ Inaktiv',
                value: inactive
                  .map((r) => {
                    const cat = WORKFLOW_CATALOG.find((e) => e.n8nId === r.wf.id);
                    return `\`${cat?.newId ?? '—'}\` ${cat?.displayName ?? r.wf.name}`;
                  })
                  .join('\n'),
                inline: false,
              }]
            : []),
          {
            name: '📅 Heute geplant',
            value: scheduledToday.join('\n') || '(keine)',
            inline: true,
          },
          {
            name: '📆 Diese Woche',
            value: scheduledWeek.join('\n') || '(keine)',
            inline: true,
          },
        ],
        footer: { text: 'AIOS Operations Center' },
        timestamp: now.toISOString(),
      },
    ],
  };

  return { plain, discord };
}

/* ── POST handler ────────────────────────────────────────────────────────── */

export async function POST() {
  try {
    const rows      = await fetchWorkflowStatus();
    const { plain, discord } = buildReport(rows);

    const results: string[] = [];

    /* Send to Discord */
    if (DISCORD_WEBHOOK) {
      try {
        const res = await fetch(DISCORD_WEBHOOK, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(discord),
          signal: AbortSignal.timeout(8000),
        });
        results.push(res.ok ? 'Discord ✅' : `Discord ❌ (${res.status})`);
      } catch (e) {
        results.push(`Discord ❌ (${e instanceof Error ? e.message : 'Fehler'})`);
      }
    } else {
      results.push('Discord ⚠️ (DISCORD_WEBHOOK_URL nicht gesetzt)');
    }

    /* Send to Telegram */
    if (TG_BOT_TOKEN && TG_CHAT_ID) {
      try {
        const tgRes = await fetch(
          `https://api.telegram.org/bot${TG_BOT_TOKEN}/sendMessage`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: TG_CHAT_ID,
              text: plain,
              parse_mode: 'Markdown',
              disable_web_page_preview: true,
            }),
            signal: AbortSignal.timeout(8000),
          },
        );
        const tgJson = await tgRes.json();
        results.push(tgRes.ok ? 'Telegram ✅' : `Telegram ❌ ${tgJson.description ?? ''}`);
      } catch (e) {
        results.push(`Telegram ❌ (${e instanceof Error ? e.message : 'Fehler'})`);
      }
    } else {
      results.push('Telegram ⚠️ (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID nicht gesetzt)');
    }

    return NextResponse.json({
      ok: true,
      message: results.join(' · '),
      workflowCount: rows.length,
      active: rows.filter((r) => r.wf.active).length,
    });

  } catch (err) {
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : 'Unbekannter Fehler' },
      { status: 500 },
    );
  }
}
