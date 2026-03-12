import React, { useMemo, useState } from "react";

const languageOptions = ["javascript", "python", "react"];
const providerOptions = ["anthropic", "openai"];

function buildEndpoint(baseUrl, path) {
  const trimmed = (baseUrl || "").replace(/\/$/, "");
  return `${trimmed}${path}`;
}

export default function CoderAgentWidget({
  backendUrl = process.env.NEXT_PUBLIC_AGENT_BACKEND_URL || "http://localhost:8000",
  onOpenInCursor,
}) {
  const [requirement, setRequirement] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [provider, setProvider] = useState("anthropic");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedCode, setGeneratedCode] = useState([]);

  const canSubmit = useMemo(() => requirement.trim().length > 3 && !loading, [requirement, loading]);

  async function generate(event) {
    event.preventDefault();
    if (!canSubmit) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch(buildEndpoint(backendUrl, "/coder-agent/generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requirement, language, provider }),
      });

      if (!response.ok) {
        throw new Error(`Generation failed (${response.status})`);
      }

      const payload = await response.json();
      const result = {
        id: payload.record?.record_id || payload.record?.id || `${Date.now()}`,
        title: payload.feature || requirement,
        language: payload.language || language,
        content: payload.markdown || "",
        code: payload.code || "",
        tags: payload.tags || ["#generated", "#code"],
        status: payload.status || "Ready to Review",
        dashboardMessage: payload.dashboard_message || "Code generated - Review & Copy",
        recordLink: payload.record?.record_link || "",
      };

      setGeneratedCode((current) => [result, ...current]);
      setRequirement("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(value) {
    await navigator.clipboard.writeText(value);
  }

  function openInCursor(item) {
    if (onOpenInCursor) {
      onOpenInCursor(item);
      return;
    }

    if (item.recordLink) {
      window.open(item.recordLink, "_blank", "noopener,noreferrer");
      return;
    }

    copyToClipboard(item.code || item.content);
  }

  return (
    <section className="space-y-6 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <header>
        <h2 className="text-lg font-semibold text-zinc-900">Coder Agent</h2>
        <p className="text-sm text-zinc-500">Generate production code and store it in AppFlowy</p>
      </header>

      <form onSubmit={generate} className="space-y-4">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-700">Requirement</label>
          <textarea
            className="h-28 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm outline-none ring-blue-200 focus:ring"
            placeholder="Erstelle AppFlowy API Bridge fuer Agents"
            value={requirement}
            onChange={(event) => setRequirement(event.target.value)}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Language</label>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
            >
              {languageOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-zinc-700">Provider</label>
            <select
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
              value={provider}
              onChange={(event) => setProvider(event.target.value)}
            >
              {providerOptions.map((option) => (
                <option value={option} key={option}>
                  {option}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? "Generating..." : "Generate Code"}
        </button>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
      </form>

      <div className="space-y-4">
        {generatedCode.map((item) => (
          <article key={item.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-medium text-zinc-900">{item.title}</h3>
              <span className="rounded bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-800">
                {item.status}
              </span>
            </div>

            <p className="mb-2 text-sm text-zinc-600">{item.dashboardMessage}</p>

            <pre className="max-h-52 overflow-auto rounded bg-zinc-950 p-3 text-xs text-zinc-100">
              <code>{item.code || item.content}</code>
            </pre>

            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => copyToClipboard(item.content)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                Copy
              </button>
              <button
                type="button"
                onClick={() => openInCursor(item)}
                className="rounded border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700"
              >
                Open in Cursor
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
              {item.tags.map((tag) => (
                <span key={tag}>{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
