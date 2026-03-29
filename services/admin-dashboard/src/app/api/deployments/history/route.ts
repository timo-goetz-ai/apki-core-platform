export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';

const GITHUB_TOKEN = process.env.GITHUB_TOKEN ?? process.env.GITHUB_PAT ?? '';
const REPO         = 'TimoGoetz1988/aios';

export interface DeploymentEntry {
  id: string;
  sha: string;
  message: string;
  author: string;
  ts: string;
  branch: string;
  status: 'success' | 'building' | 'failed' | 'unknown';
  services: string[];
}

function detectServices(message: string): string[] {
  const msg = message.toLowerCase();
  const services: string[] = [];
  if (msg.includes('dashboard') || msg.includes('admin'))      services.push('admin-dashboard');
  if (msg.includes('telegram') || msg.includes('bot'))         services.push('telegram-bot');
  if (msg.includes('aios-core'))                             services.push('aios-core');
  if (msg.includes('crew') || msg.includes('crew-api'))        services.push('crew-api');
  if (msg.includes('landing'))                                  services.push('landing-page');
  if (msg.includes('n8n') || msg.includes('workflow'))         services.push('n8n');
  if (msg.includes('nocodb'))                                   services.push('nocodb');
  if (msg.includes('infra') || msg.includes('docker') || msg.includes('ci')) services.push('infra');
  return services.length > 0 ? services : ['all'];
}

export async function GET() {
  if (!GITHUB_TOKEN) {
    return NextResponse.json({ error: 'GITHUB_TOKEN not set', commits: [] }, { status: 200 });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${REPO}/commits?per_page=20&sha=main`,
      {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'X-GitHub-Api-Version': '2022-11-28',
        },
        signal: AbortSignal.timeout(10_000),
      }
    );

    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: `GitHub API ${res.status}: ${text}`, commits: [] }, { status: 200 });
    }

    type GitHubCommit = {
      sha: string;
      commit: {
        message: string;
        author: { name: string; date: string } | null;
      };
    };

    const raw: GitHubCommit[] = await res.json();

    const commits: DeploymentEntry[] = raw.map((c) => {
      const fullMsg   = c.commit.message ?? '';
      const firstLine = fullMsg.split('\n')[0] ?? '';
      return {
        id:       c.sha,
        sha:      c.sha.slice(0, 7),
        message:  firstLine,
        author:   c.commit.author?.name ?? 'unknown',
        ts:       c.commit.author?.date ?? '',
        branch:   'main',
        status:   'success' as const,   // GitHub commits that landed on main are considered deployed
        services: detectServices(firstLine),
      };
    });

    return NextResponse.json({ commits });
  } catch (e) {
    return NextResponse.json({ error: String(e), commits: [] }, { status: 200 });
  }
}
