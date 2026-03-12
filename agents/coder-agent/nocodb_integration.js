/**
 * NocoDB Integration für CoderAgent
 *
 * Speichert Code-Snippets in NocoDB (Dashboard Base).
 *
 * IDs (fest, kein Setup nötig):
 *   BASE_ID  = pwxfagcnm6bru9w  (Dashboard Base)
 *   TABLE_ID = mjq8palk78za2sz  (code_snippets Tabelle)
 *
 * WICHTIG – Zugriff:
 *   NocoDB ist hinter Authentik (SSO). Von außen nicht direkt erreichbar.
 *   Zwei Optionen:
 *
 *   Option A: Agent läuft auf dem Hetzner-Server (empfohlen)
 *     NOCODB_API_URL=http://homestack-nocodb:8080   ← interner Docker-Name
 *
 *   Option B: Tunnel via SSH (lokal entwickeln)
 *     ssh -L 8181:homestack-nocodb:8080 root@46.224.145.109 -N &
 *     NOCODB_API_URL=http://localhost:8181
 *
 * .env:
 *   NOCODB_API_TOKEN=qvOud9RyADawysdG0vqzVa8vZ2n-wXCnK6skTXC2
 *   NOCODB_API_URL=http://localhost:8181   (oder interner URL auf Server)
 */

import "dotenv/config";

const NOCODB_URL   = process.env.NOCODB_API_URL   ?? "http://localhost:8181";
const NOCODB_TOKEN = process.env.NOCODB_API_TOKEN  ?? "qvOud9RyADawysdG0vqzVa8vZ2n-wXCnK6skTXC2";
const BASE_ID      = process.env.NOCODB_BASE_ID    ?? "pwxfagcnm6bru9w";
const TABLE_ID     = process.env.NOCODB_CODE_TABLE  ?? "mjq8palk78za2sz";

const API = `${NOCODB_URL}/api/v1/db/data/noco/${BASE_ID}/${TABLE_ID}`;

function headers() {
  return {
    "xc-token": NOCODB_TOKEN,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Basis-Request
// ---------------------------------------------------------------------------

async function req(path, options = {}) {
  const url = `${API}${path}`;
  const res = await fetch(url, { ...options, headers: { ...headers(), ...(options.headers ?? {}) } });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`NocoDB ${res.status} @ ${path}: ${body.slice(0, 200)}`);
  }
  return res.json();
}

// ---------------------------------------------------------------------------
// Code Snippets CRUD
// ---------------------------------------------------------------------------

/**
 * Neuen Code-Record speichern.
 * @param {{ title, content, language, tags?, status?, dependencies? }} params
 * @returns {Promise<{ id: number, url: string }>}
 */
export async function saveCodeRecord({ title, content, language, tags = [], status = "Ready for Review", dependencies = "" }) {
  const data = await req("", {
    method: "POST",
    body: JSON.stringify({
      Title:        title,
      Content:      content,
      Language:     language,
      Status:       status,
      GeneratedBy:  "CoderAgent",
      Tags:         Array.isArray(tags) ? tags.join(", ") : tags,
      Dependencies: dependencies,
      CreatedDate:  new Date().toISOString().split("T")[0],
    }),
  });

  const id  = data?.Id ?? data?.id;
  const url = `${NOCODB_URL}/dashboard/#/${BASE_ID}/${TABLE_ID}`;
  console.log(`[NocoDB] Gespeichert: "${title}" (Row ${id})`);
  return { id, url };
}

/**
 * Alle Records laden (optional gefiltert).
 * @param {{ language?, status? }} filter
 */
export async function getCodeRecords(filter = {}) {
  const parts = [];
  if (filter.language) parts.push(`(Language,eq,${filter.language})`);
  if (filter.status)   parts.push(`(Status,eq,${filter.status})`);

  const where = parts.length === 1 ? parts[0]
    : parts.length > 1 ? `~and${parts.join("")}` : "";

  const params = new URLSearchParams({ limit: "100", ...(where ? { where } : {}) });
  const data = await req(`?${params}`);
  return data?.list ?? [];
}

/**
 * Status + QA-Score eines Records aktualisieren.
 */
export async function updateRecord(rowId, fields = {}) {
  await req(`/${rowId}`, {
    method: "PATCH",
    body: JSON.stringify(fields),
  });
  console.log(`[NocoDB] Updated Row ${rowId}:`, Object.keys(fields).join(", "));
}

/**
 * Suche nach Text in Titel oder Content.
 * NocoDB v1: Volltext via where-Filter auf Title.
 */
export async function searchCodeRecords(query, limit = 10) {
  const params = new URLSearchParams({
    where: `(Title,like,%${query}%)`,
    limit: String(limit),
  });
  const data = await req(`?${params}`);
  return data?.list ?? [];
}

/**
 * Dashboard-Statistiken.
 */
export async function getDashboardStats() {
  const rows = await getCodeRecords();
  const byStatus = {}, byLanguage = {};
  for (const r of rows) {
    const s = r.Status   ?? "Unknown";
    const l = r.Language ?? "Unknown";
    byStatus[s]   = (byStatus[s]   ?? 0) + 1;
    byLanguage[l] = (byLanguage[l] ?? 0) + 1;
  }
  return { total: rows.length, byStatus, byLanguage };
}

// ---------------------------------------------------------------------------
// Test
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  try {
    const { id, url } = await saveCodeRecord({
      title:    "NocoDB Integration Test",
      content:  "# Test\n```js\nconsole.log('NocoDB connected');\n```",
      language: "JavaScript",
      tags:     ["#test", "#generated"],
    });
    console.log("✅ Gespeichert:", { id, url });

    const records = await getCodeRecords();
    console.log(`✅ ${records.length} Records in code_snippets`);

    const stats = await getDashboardStats();
    console.log("✅ Stats:", stats);
  } catch (e) {
    console.error("❌", e.message);
  }
}
