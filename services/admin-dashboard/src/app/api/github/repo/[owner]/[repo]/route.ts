import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const GH_BASE = 'https://api.github.com';

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${GH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'X-GitHub-Api-Version': '2022-11-28',
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
  return res.json();
}

export async function GET(
  _req: Request,
  { params }: { params: { owner: string; repo: string } },
) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: 'GITHUB_TOKEN nicht gesetzt' }, { status: 200 });
  }

  const { owner, repo } = params;
  const repoPath = `/repos/${owner}/${repo}`;

  try {
    const [repoResult, contentsResult, commitsResult, branchesResult, prsResult, readmeResult] =
      await Promise.allSettled([
        ghFetch(repoPath, token),
        ghFetch(`${repoPath}/contents/`, token),
        ghFetch(`${repoPath}/commits?per_page=10`, token),
        ghFetch(`${repoPath}/branches?per_page=30`, token),
        ghFetch(`${repoPath}/pulls?state=open&per_page=10`, token),
        ghFetch(`${repoPath}/readme`, token),
      ]);

    if (repoResult.status === 'rejected') {
      return NextResponse.json({ error: 'Repo nicht gefunden' }, { status: 404 });
    }
    const r = repoResult.value;

    // Decode README
    let readme: string | null = null;
    if (readmeResult.status === 'fulfilled' && readmeResult.value?.content) {
      try {
        readme = Buffer.from(readmeResult.value.content, 'base64').toString('utf-8');
      } catch {
        readme = null;
      }
    }

    const files =
      contentsResult.status === 'fulfilled' && Array.isArray(contentsResult.value)
        ? contentsResult.value.map(
            (f: { name: string; path: string; type: string; html_url: string }) => ({
              name: f.name,
              path: f.path,
              type: f.type,
              url: f.html_url,
            }),
          )
        : [];

    const commits =
      commitsResult.status === 'fulfilled' && Array.isArray(commitsResult.value)
        ? commitsResult.value.slice(0, 8).map(
            (c: {
              sha: string;
              commit: { message: string; author: { name: string; date: string } };
              html_url: string;
            }) => ({
              sha: c.sha.slice(0, 7),
              message: c.commit.message.split('\n')[0],
              author: c.commit.author.name,
              date: c.commit.author.date,
              url: c.html_url,
            }),
          )
        : [];

    const branches =
      branchesResult.status === 'fulfilled' && Array.isArray(branchesResult.value)
        ? branchesResult.value.map((b: { name: string; protected: boolean }) => ({
            name: b.name,
            protected: b.protected,
          }))
        : [];

    const pullRequests =
      prsResult.status === 'fulfilled' && Array.isArray(prsResult.value)
        ? prsResult.value.map(
            (p: {
              number: number;
              title: string;
              state: string;
              html_url: string;
              updated_at: string;
              user: { login: string };
            }) => ({
              number: p.number,
              title: p.title,
              state: p.state,
              url: p.html_url,
              updatedAt: p.updated_at,
              author: p.user.login,
            }),
          )
        : [];

    return NextResponse.json({
      repo: {
        name: r.name,
        fullName: r.full_name,
        description: r.description ?? null,
        url: r.html_url,
        language: r.language ?? null,
        stars: r.stargazers_count,
        forks: r.forks_count,
        openIssues: r.open_issues_count,
        visibility: r.visibility,
        branch: r.default_branch,
        pushedAt: r.pushed_at,
        createdAt: r.created_at,
        topics: r.topics ?? [],
        homepage: r.homepage ?? null,
        hasWiki: r.has_wiki,
        hasPages: r.has_pages,
        issuesUrl: `${r.html_url}/issues`,
        prsUrl: `${r.html_url}/pulls`,
        actionsUrl: `${r.html_url}/actions`,
      },
      readme,
      files,
      commits,
      branches,
      pullRequests,
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 503 });
  }
}
