/**
 * Blogify API Client
 * Docs: https://blogify.ai/developer
 *
 * Benötigte Env-Vars (in Coolify setzen):
 *   BLOGIFY_CLIENT_ID     → aus https://blogify.ai/developer/apps
 *   BLOGIFY_CLIENT_SECRET → idem
 *   BLOGIFY_INTEGRATION_ID → deine Publishing-Integration-ID
 */

const BLOGIFY_API = 'https://api.blogify.ai';

let _tokenCache: { token: string; expiresAt: number } | null = null;

async function getToken(): Promise<string> {
  const clientId     = process.env.BLOGIFY_CLIENT_ID;
  const clientSecret = process.env.BLOGIFY_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('BLOGIFY_CLIENT_ID / BLOGIFY_CLIENT_SECRET nicht gesetzt');
  }

  // Token-Cache (5 Minuten Puffer vor Ablauf)
  if (_tokenCache && _tokenCache.expiresAt > Date.now() + 300_000) {
    return _tokenCache.token;
  }

  const res = await fetch(`${BLOGIFY_API}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'client_credentials',
    }),
  });

  if (!res.ok) {
    throw new Error(`Blogify OAuth: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { access_token: string; expires_in?: number };
  _tokenCache = {
    token:     data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return _tokenCache.token;
}

// ─── Blog erstellen ───────────────────────────────────────────────────────────

export interface BlogifyCreateOptions {
  title: string;
  content: string;
  category?: string;
  tags?: string[];
}

export interface BlogifyBlog {
  id: string;
  url: string;
  status: string;
}

export async function createBlog(opts: BlogifyCreateOptions): Promise<BlogifyBlog> {
  const token = await getToken();
  const res = await fetch(`${BLOGIFY_API}/blogs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title:    opts.title,
      content:  opts.content,
      category: opts.category ?? 'Allgemein',
      tags:     opts.tags ?? [],
    }),
  });

  if (!res.ok) {
    throw new Error(`Blogify createBlog: ${res.status} ${await res.text()}`);
  }

  return res.json() as Promise<BlogifyBlog>;
}

// ─── Blog publishen ───────────────────────────────────────────────────────────

export async function publishBlog(blogId: string): Promise<{ url: string }> {
  const token         = await getToken();
  const integrationId = process.env.BLOGIFY_INTEGRATION_ID;

  if (!integrationId) {
    throw new Error('BLOGIFY_INTEGRATION_ID nicht gesetzt');
  }

  const res = await fetch(`${BLOGIFY_API}/publishing/blogs/publish`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ blog_id: blogId, integration_id: integrationId }),
  });

  if (!res.ok) {
    throw new Error(`Blogify publishBlog: ${res.status} ${await res.text()}`);
  }

  const data = await res.json() as { url?: string };
  return { url: data.url ?? '' };
}
