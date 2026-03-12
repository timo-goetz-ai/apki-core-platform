/**
 * Backend-Proxy Server für CoderAgent Widget
 * Vermittelt zwischen React-Widget und Python-Agent + AppFlowy.
 *
 * Setup:
 *   npm install express cors
 *   node server.js
 *
 * Port: 3001 (konfigurierbar via PORT env)
 */

import express from "express";
import cors from "cors";
import { execFile } from "child_process";
import {
  saveCodeRecord as afSave,
  getCodeRecords as afGet,
  updateStatus as afUpdateStatus,
} from "./appflowy_integration.js";
import {
  saveCodeRecord as ncSave,
  getCodeRecords as ncGet,
  updateRecord as ncUpdate,
} from "./nocodb_integration.js";

// Beide Speicher parallel nutzen – NocoDB ist primär, AppFlowy als Backup
async function saveToAll(params) {
  const [nc, af] = await Promise.allSettled([
    ncSave(params),
    afSave(params).catch(() => null), // AppFlowy optional
  ]);
  return {
    nocodb:   nc.status === "fulfilled" ? nc.value : null,
    appflowy: af.status === "fulfilled" ? af.value : null,
  };
}

async function getFromPrimary(filter = {}) {
  // NocoDB ist primär; Fallback auf AppFlowy
  try {
    return await ncGet(filter);
  } catch {
    return afGet(filter);
  }
}

const app = express();
const PORT = process.env.PORT ?? 3001;

app.use(cors());
app.use(express.json());

// ---------------------------------------------------------------------------
// POST /api/coder/generate
// Body: { requirement: string, language: string }
// ---------------------------------------------------------------------------

app.post("/api/coder/generate", async (req, res) => {
  const { requirement, language = "JavaScript" } = req.body;

  if (!requirement?.trim()) {
    return res.status(400).json({ error: "requirement ist erforderlich" });
  }

  console.log(`[API] Generate: "${requirement}" (${language})`);

  // Python-Agent aufrufen
  await new Promise((resolve, reject) => {
    const env = {
      ...process.env,
      CODER_LANGUAGE: language,
      PYTHONUNBUFFERED: "1",
    };

    execFile(
      "python3",
      ["agent.py", requirement],
      { env, cwd: new URL(".", import.meta.url).pathname, timeout: 120_000 },
      (err, stdout, stderr) => {
        if (err) {
          console.error("[Agent Error]", stderr);
          return reject(new Error(stderr || err.message));
        }
        resolve(stdout);
      }
    );
  })
    .then(() => {
      res.json({
        status: "success",
        title: requirement.trim().slice(0, 60),
        message: "Code generiert und in AppFlowy gespeichert",
      });
    })
    .catch((err) => {
      console.error("[API] Fehler:", err.message);
      res.status(500).json({ error: err.message });
    });
});

// ---------------------------------------------------------------------------
// GET /api/coder/records
// Query: ?language=JavaScript&status=Ready+for+Review
// ---------------------------------------------------------------------------

app.get("/api/coder/records", async (req, res) => {
  try {
    const filter = {};
    if (req.query.language) filter.language = req.query.language;
    if (req.query.status) filter.status = req.query.status;

    const records = await getFromPrimary(filter);
    res.json(records);
  } catch (err) {
    console.error("[API] Records laden:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// PATCH /api/coder/records/:id/status
// Body: { status: string }
// ---------------------------------------------------------------------------

app.patch("/api/coder/records/:id/status", async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!status) return res.status(400).json({ error: "status ist erforderlich" });

  try {
    await Promise.allSettled([
        ncUpdate(id, { Status: status }),
        afUpdateStatus(id, status).catch(() => null),
      ]);
    res.json({ success: true });
  } catch (err) {
    console.error("[API] Status-Update:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ---------------------------------------------------------------------------
// Health Check
// ---------------------------------------------------------------------------

app.get("/health", (_req, res) => res.json({ status: "ok", agent: "CoderAgent v1.0" }));

app.listen(PORT, () => {
  console.log(`[CoderAgent Server] läuft auf http://localhost:${PORT}`);
});
