import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const GH_BASE = "https://api.github.com";

async function ghFetch(path: string, token: string) {
  const res = await fetch(`${GH_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    next: { revalidate: 0 },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${path}`);
  return res.json();
}

export async function GET() {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_TOKEN nicht gesetzt", stats: null }, { status: 200 });
  }

  try {
    const [user, repos, events] = await Promise.all([
      ghFetch("/user", token),
      ghFetch("/user/repos?sort=pushed&per_page=10&type=owner", token),
      ghFetch("/users/" + "me" + "/events?per_page=30", token).catch(() => []),
    ]);

    // User info
    const userLogin = user.login;

    // Fetch real events with correct login
    const recentEvents = await ghFetch(`/users/${userLogin}/events?per_page=30`, token).catch(() => events);

    const repoStats = repos.map((r: {
      id: number; name: string; full_name: string; html_url: string;
      stargazers_count: number; forks_count: number; open_issues_count: number;
      pushed_at: string; language: string | null; visibility: string;
      default_branch: string;
    }) => ({
      id: r.id,
      name: r.name,
      fullName: r.full_name,
      url: r.html_url,
      stars: r.stargazers_count,
      forks: r.forks_count,
      openIssues: r.open_issues_count,
      pushedAt: r.pushed_at,
      language: r.language,
      visibility: r.visibility,
      branch: r.default_branch,
    }));

    const commits = recentEvents
      .filter((e: { type: string }) => e.type === "PushEvent")
      .slice(0, 5)
      .map((e: {
        repo: { name: string };
        created_at: string;
        payload: { commits?: { message: string }[] };
      }) => ({
        repo: e.repo.name,
        message: e.payload.commits?.[0]?.message ?? "–",
        date: e.created_at,
      }));

    return NextResponse.json({
      stats: {
        login: userLogin,
        name: user.name,
        avatarUrl: user.avatar_url,
        publicRepos: user.public_repos,
        followers: user.followers,
        repos: repoStats,
        recentCommits: commits,
      },
    });
  } catch (e) {
    return NextResponse.json({ error: String(e), stats: null }, { status: 503 });
  }
}
