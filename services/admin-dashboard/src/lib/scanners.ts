/**
 * Knowledge Base Scanners — shared logic used by individual scanner routes
 * and the /api/scanner/run orchestrator.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GithubRepo {
  name: string;
  fullName: string;
  url: string;
  pushedAt: string;
  language: string | null;
  hasClaudeMd: boolean;
  hasReadme: boolean;
  skills: string[];
}

export interface N8nWorkflow {
  id: string;
  name: string;
  active: boolean;
  updatedAt: string;
  triggerType: string;
  nodeCount: number;
  nodeTypes: string[];
  tags: string[];
}

export interface NocoTable {
  id: string;
  name: string;
  type: string;
  fieldCount: number;
  fields: { name: string; type: string }[];
}

export interface RssFeed {
  id: string;
  name: string;
  ok: boolean;
  error?: string;
  items: { title: string; link: string; pubDate: string }[];
}

// ── GitHub Scanner ─────────────────────────────────────────────────────────────

export async function runGithubScan(): Promise<{ repos: GithubRepo[]; scannedAt: string; error?: string }> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return { repos: [], scannedAt: new Date().toISOString(), error: 'GITHUB_TOKEN not set' };

  const ghFetch = async (path: string) => {
    const res = await fetch(`https://api.github.com${path}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      },
      signal: AbortSignal.timeout(10000),
      next: { revalidate: 0 },
    });
    if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
    return res.json();
  };

  try {
    const rawRepos = await ghFetch('/user/repos?sort=pushed&per_page=20&type=owner');

    const scanned = await Promise.allSettled(
      rawRepos.slice(0, 12).map(async (repo: {
        name: string; full_name: string; html_url: string;
        pushed_at: string; language: string | null;
      }): Promise<GithubRepo> => {
        const files = await ghFetch(`/repos/${repo.full_name}/contents/`).catch(() => []);
        const fileNames: string[] = Array.isArray(files) ? files.map((f: { name: string }) => f.name) : [];

        const hasClaudeMd = fileNames.includes('CLAUDE.md');
        const hasReadme = fileNames.some(f => f.toLowerCase().startsWith('readme'));

        let skills: string[] = [];
        if (hasClaudeMd) {
          try {
            const cf = await ghFetch(`/repos/${repo.full_name}/contents/CLAUDE.md`);
            const content = Buffer.from(cf.content, 'base64').toString('utf-8');
            const match = content.match(/##\s*[Ss]kills[\s\S]*?(?=##|$)/);
            if (match) {
              skills = (match[0].match(/[-*]\s+(.+)/g) ?? [])
                .map(s => s.replace(/^[-*]\s+/, '').trim())
                .slice(0, 5);
            }
          } catch { /* ignore */ }
        }

        return {
          name: repo.name,
          fullName: repo.full_name,
          url: repo.html_url,
          pushedAt: repo.pushed_at,
          language: repo.language,
          hasClaudeMd,
          hasReadme,
          skills,
        };
      })
    );

    const repos = scanned
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<GithubRepo>).value);

    return { repos, scannedAt: new Date().toISOString() };
  } catch (e) {
    return { repos: [], scannedAt: new Date().toISOString(), error: String(e) };
  }
}

// ── n8n Scanner ────────────────────────────────────────────────────────────────

export async function runN8nScan(): Promise<{ workflows: N8nWorkflow[]; scannedAt: string; error?: string }> {
  const base = process.env.N8N_BASE_URL ?? 'https://n8n.automation-plus-ki.de';
  const apiKey = process.env.N8N_API_KEY;
  if (!apiKey) return { workflows: [], scannedAt: new Date().toISOString(), error: 'N8N_API_KEY not set' };

  try {
    const res = await fetch(`${base}/api/v1/workflows?limit=100`, {
      headers: { 'X-N8N-API-KEY': apiKey },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`n8n API ${res.status}`);

    const data = await res.json();
    const workflows: N8nWorkflow[] = (data.data ?? data ?? []).map((wf: {
      id: string; name: string; active: boolean; updatedAt: string;
      nodes?: { type: string }[];
      tags?: { name: string }[];
    }) => {
      const nodes = wf.nodes ?? [];
      const triggerNode = nodes.find(n =>
        n.type.toLowerCase().includes('trigger') || n.type.toLowerCase().includes('webhook')
      );
      const nodeTypes = Array.from(new Set(nodes.map(n => n.type.split('.').pop() ?? n.type)));
      return {
        id: wf.id,
        name: wf.name,
        active: wf.active,
        updatedAt: wf.updatedAt,
        triggerType: triggerNode?.type.split('.').pop() ?? 'unknown',
        nodeCount: nodes.length,
        nodeTypes: nodeTypes.slice(0, 5) as string[],
        tags: (wf.tags ?? []).map(t => t.name),
      };
    });

    return { workflows, scannedAt: new Date().toISOString() };
  } catch (e) {
    return { workflows: [], scannedAt: new Date().toISOString(), error: String(e) };
  }
}

// ── NocoDB Schema Scanner ──────────────────────────────────────────────────────

export async function runNocodbSchemaScan(): Promise<{ tables: NocoTable[]; scannedAt: string; error?: string }> {
  const base = process.env.NOCODB_URL ?? 'https://nocodb.automation-plus-ki.de';
  const token = process.env.NOCODB_API_TOKEN ?? '';
  const baseId = process.env.NOCODB_AI_SYSTEM_BASE_ID ?? '';
  if (!token) return { tables: [], scannedAt: new Date().toISOString(), error: 'NOCODB_API_TOKEN not set' };

  try {
    const tablesRes = await fetch(`${base}/api/v1/db/meta/projects/${baseId}/tables`, {
      headers: { 'xc-token': token },
      signal: AbortSignal.timeout(10000),
    });
    if (!tablesRes.ok) throw new Error(`NocoDB meta ${tablesRes.status}`);
    const tablesData = await tablesRes.json();
    const rawTables: { id: string; title: string; type: string }[] = tablesData.list ?? [];

    const detailed = await Promise.allSettled(
      rawTables.map(async (table): Promise<NocoTable> => {
        const fRes = await fetch(`${base}/api/v1/db/meta/tables/${table.id}/fields`, {
          headers: { 'xc-token': token },
          signal: AbortSignal.timeout(5000),
        });
        const fData = fRes.ok ? await fRes.json() : { list: [] };
        const fields: { name: string; type: string }[] = (fData.list ?? []).map(
          (f: { title: string; uidt: string }) => ({ name: f.title, type: f.uidt })
        );
        return { id: table.id, name: table.title, type: table.type, fieldCount: fields.length, fields };
      })
    );

    const tables = detailed
      .filter(r => r.status === 'fulfilled')
      .map(r => (r as PromiseFulfilledResult<NocoTable>).value);

    return { tables, scannedAt: new Date().toISOString() };
  } catch (e) {
    return { tables: [], scannedAt: new Date().toISOString(), error: String(e) };
  }
}

// ── RSS Scanner ────────────────────────────────────────────────────────────────

const RSS_FEEDS = [
  { id: 'hn',       name: 'Hacker News',  url: 'https://news.ycombinator.com/rss' },
  { id: 'n8n',      name: 'n8n Blog',     url: 'https://blog.n8n.io/rss/' },
  { id: 'gh-blog',  name: 'GitHub Blog',  url: 'https://github.blog/feed/' },
  { id: 'anthropic',name: 'Anthropic',    url: 'https://www.anthropic.com/rss.xml' },
  { id: 'ai-times', name: 'The AI Times', url: 'https://theaitimes.substack.com/feed' },
];

function parseRssItems(xml: string, limit = 6): { title: string; link: string; pubDate: string }[] {
  const items: { title: string; link: string; pubDate: string }[] = [];
  const re = /<item[^>]*>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) !== null && items.length < limit) {
    const b = m[1];
    const title = (
      b.match(/<title[^>]*><!\[CDATA\[([^\]]+)\]\]>/)?.[1] ??
      b.match(/<title[^>]*>([^<]+)<\/title>/)?.[1] ?? ''
    ).trim();
    const link = (
      b.match(/<link[^>]*>([^<]+)<\/link>/)?.[1] ??
      b.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1] ?? ''
    ).trim();
    const pubDate = (
      b.match(/<pubDate[^>]*>([^<]+)<\/pubDate>/)?.[1] ??
      b.match(/<published[^>]*>([^<]+)<\/published>/)?.[1] ?? ''
    ).trim();
    if (title) items.push({ title, link, pubDate });
  }
  return items;
}

export async function runRssScan(): Promise<{ feeds: RssFeed[]; scannedAt: string }> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async feed => {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'AIOS-Dashboard/1.0' },
        signal: AbortSignal.timeout(8000),
        next: { revalidate: 300 },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const xml = await res.text();
      return { id: feed.id, name: feed.name, ok: true as const, items: parseRssItems(xml) };
    })
  );

  const feeds: RssFeed[] = results.map((r, i) =>
    r.status === 'fulfilled'
      ? r.value
      : { id: RSS_FEEDS[i].id, name: RSS_FEEDS[i].name, ok: false, error: String((r as PromiseRejectedResult).reason), items: [] }
  );

  return { feeds, scannedAt: new Date().toISOString() };
}
