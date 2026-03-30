"use client";

import { useCallback, useState } from "react";
import { Play, Radio, Bot } from "lucide-react";
import { dashboardApiAuthHeaders } from "@/lib/dashboard-auth-headers";
import { useCrewStream } from "@/hooks/useCrewStream";

const DEFAULT_CREW = "quick_research_crew";
const SPRITE_COLS = 6;

function spriteIndex(key: string): number {
  let h = 0;
  for (let i = 0; i < key.length; i += 1) {
    h = (h * 31 + key.charCodeAt(i)) >>> 0;
  }
  return h % SPRITE_COLS;
}

function CrewAvatar({ taskKey }: { taskKey: string }) {
  const col = spriteIndex(taskKey);
  const pct = SPRITE_COLS > 1 ? (col / (SPRITE_COLS - 1)) * 100 : 0;
  return (
    <span
      title={`Agent-Zelle ${col + 1} von ${SPRITE_COLS} (Sprite)`}
      aria-hidden
      style={{
        display: "inline-block",
        width: 28,
        height: 28,
        borderRadius: 6,
        flexShrink: 0,
        backgroundImage: "url(/crew-agents-sprite.png)",
        backgroundRepeat: "no-repeat",
        backgroundSize: `${SPRITE_COLS * 100}% 100%`,
        backgroundPosition: `${pct}% 50%`,
        border: "1px solid var(--border)",
      }}
    />
  );
}

export function CrewLivePanel() {
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { events, isConnected, pollTick } = useCrewStream(executionId);

  const start = useCallback(async () => {
    setBusy(true);
    try {
      const res = await fetch(
        `/api/crews/${encodeURIComponent(DEFAULT_CREW)}/start`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...dashboardApiAuthHeaders(),
          },
          body: JSON.stringify({
            inputs: { topic: "Overview Kurztest", category: "Allgemein" },
          }),
        }
      );
      const data = (await res.json().catch(() => ({}))) as {
        execution_id?: string;
      };
      if (res.ok && data.execution_id) {
        setExecutionId(String(data.execution_id));
      }
    } finally {
      setBusy(false);
    }
  }, []);

  const timeline = events.filter(
    (e) =>
      e.type === "task_started" ||
      e.type === "task_completed" ||
      e.type === "execution_started" ||
      e.type === "execution_completed" ||
      e.type === "execution_error"
  );

  const last = events[events.length - 1];
  const status =
    last?.type === "execution_completed"
      ? "completed"
      : last?.type === "execution_error"
        ? "error"
        : executionId
          ? "running"
          : "idle";

  const statusColor =
    status === "completed"
      ? "var(--accent-green)"
      : status === "error"
        ? "var(--accent-red)"
        : status === "running"
          ? "var(--accent-amber)"
          : "var(--text-muted)";

  return (
    <section>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <Bot size={13} color="var(--accent-blue)" />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: "var(--text-primary)",
          }}
        >
          Crew Live
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 10,
            fontWeight: 600,
            color: statusColor,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
          }}
        >
          {status}
        </span>
      </div>

      <button
        type="button"
        onClick={() => void start()}
        disabled={busy}
        className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent-blue)]"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          borderRadius: 7,
          border: "1px solid var(--border)",
          background: "var(--layer-1)",
          cursor: busy ? "wait" : "pointer",
          width: "100%",
          fontSize: 12,
          fontWeight: 600,
          color: "var(--text-primary)",
          marginBottom: 10,
        }}
      >
        <Play size={12} />
        {busy ? "Starte…" : "Quick Research starten"}
      </button>

      {executionId && (
        <p
          style={{
            fontSize: 10,
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
            marginBottom: 8,
            wordBreak: "break-all",
          }}
        >
          {executionId}
        </p>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 10,
          color: "var(--text-muted)",
          marginBottom: 8,
        }}
      >
        <Radio
          size={11}
          color={isConnected ? "var(--accent-green)" : "var(--text-muted)"}
        />
        <span>{isConnected ? "SSE verbunden" : "SSE getrennt / Reconnect"}</span>
        {!isConnected && executionId ? (
          <span style={{ fontFamily: "var(--font-mono)" }}>
            · Poll #{pollTick}
          </span>
        ) : null}
      </div>

      <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", marginBottom: 6 }}>
        Task-Zeitleiste
      </div>
      <ul style={{ listStyle: "none", padding: 0, margin: 0, maxHeight: 160, overflowY: "auto" }}>
        {timeline.length === 0 ? (
          <li style={{ fontSize: 11, color: "var(--text-muted)" }}>Keine Events</li>
        ) : (
          timeline.map((e, i) => {
            const tid =
              "task_id" in e && e.task_id != null ? String(e.task_id) : String(e.type);
            const agent =
              "agent_id" in e && e.agent_id != null ? String(e.agent_id) : tid;
            return (
              <li
                key={`${i}-${tid}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "4px 0",
                  borderBottom: "1px solid var(--border)",
                  fontSize: 11,
                }}
              >
                <CrewAvatar taskKey={agent} />
                <span style={{ color: "var(--text-muted)", flexShrink: 0 }}>
                  {String(e.type)}
                </span>
                <span style={{ color: "var(--text-secondary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {tid}
                </span>
              </li>
            );
          })
        )}
      </ul>
    </section>
  );
}
