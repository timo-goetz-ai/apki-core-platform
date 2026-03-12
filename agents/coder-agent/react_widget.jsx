/**
 * CoderAgent Dashboard Widget
 *
 * Zeigt generierte Code-Records aus AppFlowy an.
 * Bietet Input-Form, Copy-Button und "In Cursor öffnen" Funktion.
 *
 * Props:
 *   apiBase  - URL zum Backend-Proxy (z.B. "http://localhost:3001")
 *
 * Backend-Endpunkte die benötigt werden:
 *   POST /api/coder/generate   { requirement, language }  → { markdown, appflowy_id, title }
 *   GET  /api/coder/records    [?language=&status=]       → [{ id, Title, Content, ... }]
 */

import { useState, useEffect, useCallback } from "react";

const LANGUAGES = ["JavaScript", "TypeScript", "Python", "React", "Node.js", "SQL"];

// ---------------------------------------------------------------------------
// Sub-Components
// ---------------------------------------------------------------------------

function CodeCard({ record, onStatusChange }) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const content = record.Content ?? "";

  // Ersten Code-Block aus Markdown extrahieren
  const codeMatch = content.match(/```[\w]*\n([\s\S]*?)```/);
  const previewCode = codeMatch ? codeMatch[1].trim() : content;
  const displayCode = expanded ? previewCode : previewCode.slice(0, 400);

  async function copyCode() {
    await navigator.clipboard.writeText(previewCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function openInCursor() {
    // Datei temporär anlegen und mit cursor:// URI öffnen
    const blob = new Blob([previewCode], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    // Cursor unterstützt: cursor://open?url=...  oder Datei-Download
    const a = document.createElement("a");
    a.href = url;
    a.download = `${record.Title?.replace(/\s+/g, "_") ?? "code"}.${langExtension(record.Language)}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const statusColor = {
    "Ready for Review": "#f59e0b",
    Reviewed: "#10b981",
    "In-Use": "#3b82f6",
    Archived: "#6b7280",
  }[record.Status] ?? "#6b7280";

  return (
    <div style={styles.card}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <div>
          <h3 style={styles.cardTitle}>{record.Title}</h3>
          <div style={styles.metaRow}>
            <span style={styles.langBadge}>{record.Language}</span>
            <span style={{ ...styles.statusBadge, background: statusColor }}>
              {record.Status}
            </span>
            <span style={styles.metaText}>{record.CreatedDate}</span>
          </div>
        </div>

        {/* Status-Dropdown */}
        <select
          style={styles.statusSelect}
          value={record.Status}
          onChange={(e) => onStatusChange(record.id, e.target.value)}
        >
          <option>Ready for Review</option>
          <option>Reviewed</option>
          <option>In-Use</option>
          <option>Archived</option>
        </select>
      </div>

      {/* Code Preview */}
      <pre style={styles.codeBlock}>
        <code>{displayCode}{!expanded && previewCode.length > 400 ? "\n..." : ""}</code>
      </pre>

      {previewCode.length > 400 && (
        <button style={styles.expandBtn} onClick={() => setExpanded(!expanded)}>
          {expanded ? "Weniger anzeigen ▲" : "Vollständigen Code ▼"}
        </button>
      )}

      {/* Actions */}
      <div style={styles.cardActions}>
        <button style={styles.btnCopy} onClick={copyCode}>
          {copied ? "✓ Kopiert!" : "📋 Kopieren"}
        </button>
        <button style={styles.btnCursor} onClick={openInCursor}>
          💻 In Cursor öffnen
        </button>
      </div>
    </div>
  );
}

function StatusBar({ status, error }) {
  if (error) return <div style={styles.errorBar}>{error}</div>;
  if (!status) return null;
  return <div style={styles.statusBar}>{status}</div>;
}

// ---------------------------------------------------------------------------
// Main Widget
// ---------------------------------------------------------------------------

export default function CoderAgentWidget({ apiBase = "http://localhost:3001" }) {
  const [requirement, setRequirement] = useState("");
  const [language, setLanguage] = useState("JavaScript");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [error, setError] = useState("");
  const [filterLang, setFilterLang] = useState("Alle");
  const [filterStatus, setFilterStatus] = useState("Alle");

  // Records laden
  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (filterLang !== "Alle") params.set("language", filterLang);
      if (filterStatus !== "Alle") params.set("status", filterStatus);

      const res = await fetch(`${apiBase}/api/coder/records?${params}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setRecords(data);
    } catch (e) {
      setError(`Laden fehlgeschlagen: ${e.message}`);
    } finally {
      setLoading(false);
    }
  }, [apiBase, filterLang, filterStatus]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  // Code generieren
  async function handleGenerate(e) {
    e.preventDefault();
    if (!requirement.trim()) return;

    setGenerating(true);
    setError("");
    setStatusMsg("Agent schreibt Code...");

    try {
      const res = await fetch(`${apiBase}/api/coder/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement, language }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? `HTTP ${res.status}`);
      }

      const result = await res.json();
      setStatusMsg(`✓ Code generiert: "${result.title}" – jetzt in AppFlowy`);
      setRequirement("");
      await loadRecords();
    } catch (e) {
      setError(`Generierung fehlgeschlagen: ${e.message}`);
      setStatusMsg("");
    } finally {
      setGenerating(false);
    }
  }

  // Status-Update
  async function handleStatusChange(recordId, newStatus) {
    try {
      const res = await fetch(`${apiBase}/api/coder/records/${recordId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setRecords((prev) =>
        prev.map((r) => (r.id === recordId ? { ...r, Status: newStatus } : r))
      );
    } catch (e) {
      setError(`Status-Update fehlgeschlagen: ${e.message}`);
    }
  }

  // Gefilterte Records
  const filtered = records.filter((r) => {
    if (filterLang !== "Alle" && r.Language !== filterLang) return false;
    if (filterStatus !== "Alle" && r.Status !== filterStatus) return false;
    return true;
  });

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h2 style={styles.title}>🤖 CoderAgent</h2>
        <span style={styles.subtitle}>Anforderung → Code → AppFlowy KB</span>
      </div>

      {/* Input Form */}
      <form onSubmit={handleGenerate} style={styles.form}>
        <textarea
          style={styles.textarea}
          placeholder="Was soll der Agent programmieren? z.B. 'Erstelle AppFlowy API Bridge für Agents'"
          value={requirement}
          onChange={(e) => setRequirement(e.target.value)}
          rows={3}
          disabled={generating}
        />
        <div style={styles.formRow}>
          <select
            style={styles.langSelect}
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            disabled={generating}
          >
            {LANGUAGES.map((l) => (
              <option key={l}>{l}</option>
            ))}
          </select>
          <button type="submit" style={styles.btnGenerate} disabled={generating || !requirement.trim()}>
            {generating ? "⏳ Generiere..." : "⚡ Code generieren"}
          </button>
        </div>
      </form>

      {/* Status */}
      <StatusBar status={statusMsg} error={error} />

      {/* Filter */}
      <div style={styles.filterRow}>
        <span style={styles.filterLabel}>Filter:</span>
        <select
          style={styles.filterSelect}
          value={filterLang}
          onChange={(e) => setFilterLang(e.target.value)}
        >
          <option>Alle</option>
          {LANGUAGES.map((l) => <option key={l}>{l}</option>)}
        </select>
        <select
          style={styles.filterSelect}
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          {["Alle", "Ready for Review", "Reviewed", "In-Use", "Archived"].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <button style={styles.btnRefresh} onClick={loadRecords} disabled={loading}>
          {loading ? "..." : "↻ Refresh"}
        </button>
        <span style={styles.countBadge}>{filtered.length} Records</span>
      </div>

      {/* Code Records */}
      <div style={styles.recordsList}>
        {loading && <div style={styles.loadingMsg}>Lade Records...</div>}

        {!loading && filtered.length === 0 && (
          <div style={styles.emptyMsg}>
            Keine Code-Records gefunden. Generiere deinen ersten Code! 👆
          </div>
        )}

        {filtered.map((record) => (
          <CodeCard
            key={record.id}
            record={record}
            onStatusChange={handleStatusChange}
          />
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function langExtension(language) {
  const map = {
    JavaScript: "js",
    TypeScript: "ts",
    Python: "py",
    React: "jsx",
    "Node.js": "js",
    SQL: "sql",
  };
  return map[language] ?? "txt";
}

// ---------------------------------------------------------------------------
// Styles (Inline für Portabilität)
// ---------------------------------------------------------------------------

const styles = {
  container: {
    fontFamily: "'Inter', system-ui, sans-serif",
    maxWidth: 900,
    margin: "0 auto",
    padding: 24,
    background: "#0f172a",
    minHeight: "100vh",
    color: "#e2e8f0",
  },
  header: {
    marginBottom: 24,
    borderBottom: "1px solid #1e293b",
    paddingBottom: 16,
  },
  title: { margin: 0, fontSize: 24, fontWeight: 700, color: "#f8fafc" },
  subtitle: { fontSize: 13, color: "#64748b" },
  form: { background: "#1e293b", borderRadius: 12, padding: 16, marginBottom: 16 },
  textarea: {
    width: "100%",
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: 12,
    color: "#e2e8f0",
    fontSize: 14,
    resize: "vertical",
    boxSizing: "border-box",
    outline: "none",
    marginBottom: 12,
  },
  formRow: { display: "flex", gap: 8, alignItems: "center" },
  langSelect: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 8,
    padding: "8px 12px",
    color: "#e2e8f0",
    fontSize: 14,
  },
  btnGenerate: {
    flex: 1,
    background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
    border: "none",
    borderRadius: 8,
    padding: "10px 20px",
    color: "#fff",
    fontSize: 14,
    fontWeight: 600,
    cursor: "pointer",
  },
  statusBar: {
    background: "#1e293b",
    border: "1px solid #10b981",
    borderRadius: 8,
    padding: "10px 16px",
    marginBottom: 12,
    color: "#10b981",
    fontSize: 13,
  },
  errorBar: {
    background: "#1e293b",
    border: "1px solid #ef4444",
    borderRadius: 8,
    padding: "10px 16px",
    marginBottom: 12,
    color: "#ef4444",
    fontSize: 13,
  },
  filterRow: {
    display: "flex",
    gap: 8,
    alignItems: "center",
    marginBottom: 16,
    flexWrap: "wrap",
  },
  filterLabel: { color: "#64748b", fontSize: 13 },
  filterSelect: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "6px 10px",
    color: "#e2e8f0",
    fontSize: 13,
  },
  btnRefresh: {
    background: "#1e293b",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "6px 12px",
    color: "#94a3b8",
    cursor: "pointer",
    fontSize: 13,
  },
  countBadge: {
    background: "#334155",
    borderRadius: 20,
    padding: "2px 10px",
    fontSize: 12,
    color: "#94a3b8",
    marginLeft: "auto",
  },
  recordsList: { display: "flex", flexDirection: "column", gap: 16 },
  loadingMsg: { textAlign: "center", color: "#64748b", padding: 40, fontSize: 14 },
  emptyMsg: {
    textAlign: "center",
    color: "#64748b",
    padding: 60,
    background: "#1e293b",
    borderRadius: 12,
    fontSize: 14,
  },
  card: {
    background: "#1e293b",
    borderRadius: 12,
    padding: 20,
    border: "1px solid #334155",
  },
  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  cardTitle: { margin: 0, fontSize: 15, fontWeight: 600, color: "#f1f5f9" },
  metaRow: { display: "flex", gap: 8, marginTop: 6, alignItems: "center", flexWrap: "wrap" },
  langBadge: {
    background: "#312e81",
    color: "#a5b4fc",
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
  },
  statusBadge: {
    borderRadius: 4,
    padding: "2px 8px",
    fontSize: 11,
    fontWeight: 600,
    color: "#fff",
  },
  metaText: { fontSize: 11, color: "#64748b" },
  statusSelect: {
    background: "#0f172a",
    border: "1px solid #334155",
    borderRadius: 6,
    padding: "4px 8px",
    color: "#94a3b8",
    fontSize: 12,
    flexShrink: 0,
  },
  codeBlock: {
    background: "#0f172a",
    borderRadius: 8,
    padding: 14,
    overflow: "auto",
    fontSize: 12,
    lineHeight: 1.6,
    color: "#a5f3fc",
    margin: "0 0 8px 0",
    maxHeight: 400,
    fontFamily: "'Fira Code', 'Cascadia Code', monospace",
    whiteSpace: "pre-wrap",
    wordBreak: "break-all",
  },
  expandBtn: {
    background: "none",
    border: "none",
    color: "#6366f1",
    cursor: "pointer",
    fontSize: 12,
    marginBottom: 8,
    padding: 0,
  },
  cardActions: { display: "flex", gap: 8, marginTop: 12 },
  btnCopy: {
    background: "#334155",
    border: "none",
    borderRadius: 6,
    padding: "8px 16px",
    color: "#e2e8f0",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
  btnCursor: {
    background: "#1e3a5f",
    border: "1px solid #3b82f6",
    borderRadius: 6,
    padding: "8px 16px",
    color: "#93c5fd",
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
  },
};
