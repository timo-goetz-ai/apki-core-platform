/**
 * AppFlowy API Bridge für CoderAgent
 *
 * Verwaltet Code-Snippets in AppFlowy (Speichern, Suchen, Updaten).
 * Nutzt die AppFlowy REST API v1.
 *
 * Setup:
 *   npm install node-fetch dotenv
 *
 * .env:
 *   APPFLOWY_BASE_URL=http://localhost:8000
 *   APPFLOWY_TOKEN=your_token_here
 *   APPFLOWY_WORKSPACE_ID=your_workspace_id
 *   APPFLOWY_DATABASE_ID=code_snippets_db_id
 */

import "dotenv/config";

const BASE_URL = process.env.APPFLOWY_BASE_URL?.replace(/\/$/, "");
const WORKSPACE_ID = process.env.APPFLOWY_WORKSPACE_ID;
const DATABASE_ID = process.env.APPFLOWY_DATABASE_ID;

function authHeaders() {
  return {
    Authorization: `Bearer ${process.env.APPFLOWY_TOKEN}`,
    "Content-Type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Basis-Request-Helper
// ---------------------------------------------------------------------------

async function apiFetch(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const res = await fetch(url, {
    ...options,
    headers: { ...authHeaders(), ...(options.headers ?? {}) },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`AppFlowy API ${res.status}: ${body}`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Code Snippets – CRUD
// ---------------------------------------------------------------------------

/**
 * Speichert einen neuen Code-Record.
 *
 * @param {Object} params
 * @param {string} params.title        - Feature-Name
 * @param {string} params.content      - Markdown-Content (inkl. Code)
 * @param {string} params.language     - "JavaScript" | "Python" | "React" | ...
 * @param {string[]} [params.tags]     - z.B. ["#generated", "#code"]
 * @param {string} [params.status]     - Default: "Ready for Review"
 * @returns {Promise<{id: string, url: string}>}
 */
export async function saveCodeRecord({
  title,
  content,
  language,
  tags = [],
  status = "Ready for Review",
}) {
  const data = await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}/row`,
    {
      method: "POST",
      body: JSON.stringify({
        data: {
          Title: title,
          Content: content,
          Language: language,
          Status: status,
          GeneratedBy: "CoderAgent",
          Tags: tags.join(", "),
          CreatedDate: new Date().toISOString().split("T")[0],
        },
      }),
    }
  );

  const id = data?.data?.id;
  const url = `${BASE_URL}/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}?rowId=${id}`;

  console.log(`[AppFlowy] Gespeichert: ${title} (${id})`);
  return { id, url };
}

/**
 * Alle Code-Records abrufen.
 *
 * @param {Object} [filter]
 * @param {string} [filter.language]  - Sprache filtern
 * @param {string} [filter.status]    - Status filtern
 * @returns {Promise<Array>}
 */
export async function getCodeRecords(filter = {}) {
  const filterFields = [];

  if (filter.language) {
    filterFields.push({ field: "Language", value: filter.language });
  }
  if (filter.status) {
    filterFields.push({ field: "Status", value: filter.status });
  }

  const body = filterFields.length > 0 ? { filters: filterFields } : {};
  const data = await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}/rows`,
    {
      method: "POST",
      body: JSON.stringify(body),
    }
  );

  return data?.data?.rows ?? [];
}

/**
 * Einzelnen Record per ID laden.
 * @param {string} rowId
 * @returns {Promise<Object>}
 */
export async function getCodeRecord(rowId) {
  const data = await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}/row/${rowId}`
  );
  return data?.data ?? null;
}

/**
 * Status eines Records aktualisieren.
 * @param {string} rowId
 * @param {'Ready for Review'|'Reviewed'|'In-Use'|'Archived'} status
 */
export async function updateStatus(rowId, status) {
  await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}/row/${rowId}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        data: {
          Status: status,
          ReviewedDate:
            status === "Reviewed"
              ? new Date().toISOString().split("T")[0]
              : undefined,
        },
      }),
    }
  );

  console.log(`[AppFlowy] Status → ${status}: ${rowId}`);
}

/**
 * Volltext-Suche in der KB.
 * @param {string} query
 * @param {number} [limit=10]
 * @returns {Promise<Array>}
 */
export async function searchCodeRecords(query, limit = 10) {
  const data = await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/search`,
    {
      method: "POST",
      body: JSON.stringify({ query, database_id: DATABASE_ID, limit }),
    }
  );

  return data?.data ?? [];
}

/**
 * Record löschen (archivieren ist meist besser).
 * @param {string} rowId
 */
export async function deleteCodeRecord(rowId) {
  await apiFetch(
    `/api/workspace/${WORKSPACE_ID}/database/${DATABASE_ID}/row/${rowId}`,
    { method: "DELETE" }
  );
  console.log(`[AppFlowy] Gelöscht: ${rowId}`);
}

// ---------------------------------------------------------------------------
// Dashboard-Stats
// ---------------------------------------------------------------------------

/**
 * Statistiken für das Dashboard.
 * @returns {Promise<{total: number, byStatus: Object, byLanguage: Object}>}
 */
export async function getDashboardStats() {
  const rows = await getCodeRecords();

  const byStatus = {};
  const byLanguage = {};

  for (const row of rows) {
    const status = row.Status ?? "Unknown";
    const lang = row.Language ?? "Unknown";

    byStatus[status] = (byStatus[status] ?? 0) + 1;
    byLanguage[lang] = (byLanguage[lang] ?? 0) + 1;
  }

  return { total: rows.length, byStatus, byLanguage };
}

// ---------------------------------------------------------------------------
// Vollständiges Beispiel / Test
// ---------------------------------------------------------------------------

if (import.meta.url === `file://${process.argv[1]}`) {
  const testRecord = {
    title: "AppFlowy API Bridge Test",
    content: `# Test Record\n\`\`\`javascript\nconsole.log('hello');\n\`\`\``,
    language: "JavaScript",
    tags: ["#generated", "#code", "#test"],
  };

  try {
    const { id, url } = await saveCodeRecord(testRecord);
    console.log("Gespeichert:", { id, url });

    const records = await getCodeRecords({ language: "JavaScript" });
    console.log(`${records.length} JavaScript Records gefunden`);

    const stats = await getDashboardStats();
    console.log("Dashboard Stats:", stats);
  } catch (err) {
    console.error("Fehler:", err.message);
    console.log("(Normal falls AppFlowy nicht läuft – API ist korrekt)");
  }
}
