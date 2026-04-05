"use client";

import { useEffect, useState, useCallback } from "react";

// ── Agent definitions (Multi-Orchestrator: AnythingLLM, Ollama, SauerkrautLM, …) ─
const AGENTS = [
  {
    id: "claude",
    name: "Claude",
    vendor: "Anthropic",
    color: "var(--accent-amber)",
    glow: "rgba(201,117,57,0.18)",
    border: "rgba(201,117,57,0.35)",
    specialty: "Code · Analyse · Struktur",
    avatar: "✦",
    thoughts: [
      "Überprüfe Codestruktur auf Patterns…",
      "Schreibe Unit-Tests für API-Route…",
      "Refactoring: Extrahiere wiederverwendbare Hooks…",
      "Analysiere PR-Änderungen auf Edge Cases…",
      "Generiere TypeScript-Typen aus Schema…",
      "Dokumentiere Funktion mit JSDoc…",
      "Prüfe Abhängigkeiten auf Sicherheitslücken…",
    ],
  },
  {
    id: "grok",
    name: "Grok",
    vendor: "xAI",
    color: "var(--border-bright)",
    glow: "rgba(232,232,232,0.10)",
    border: "rgba(232,232,232,0.25)",
    specialty: "Echtzeit · Web · Reasoning",
    avatar: "⚡",
    thoughts: [
      "Durchsuche aktuelle Nachrichtenquellen…",
      "Verifiziere Marktdaten in Echtzeit…",
      "Cross-referenziere 3 Quellen…",
      "Analysiere Social-Media-Trends…",
      "Hole aktuelle API-Statusmeldungen…",
      "Recherchiere Wettbewerber-Updates…",
      "Prüfe Technologie-News der letzten 24h…",
    ],
  },
  {
    id: "gemini",
    name: "Gemini",
    vendor: "Google",
    color: "var(--accent-blue)",
    glow: "rgba(79,156,249,0.15)",
    border: "rgba(79,156,249,0.30)",
    specialty: "Multimodal · Search · Vision",
    avatar: "◈",
    thoughts: [
      "Verarbeite multimodalen Input…",
      "Analysiere Bild- und Textkontext…",
      "Durchsuche Google-Wissensbasis…",
      "Generiere strukturierten Report…",
      "Extrahiere Daten aus Screenshot…",
      "Kombiniere Text- und Bildinformationen…",
      "Erstelle Zusammenfassung mit Quellen…",
    ],
  },
  {
    id: "sauerkraut",
    name: "SauerkrautLM",
    vendor: "Ollama",
    color: "var(--accent-purple)",
    glow: "rgba(167,139,250,0.15)",
    border: "rgba(167,139,250,0.35)",
    specialty: "Deutsch · Lokal · Kostenlos",
    avatar: "⬡",
    thoughts: [
      "Verarbeite deutsche Anfrage lokal…",
      "Antworte auf Deutsch ohne API-Kosten…",
      "Einfache Klassifikation…",
      "Kombiniere mit AnythingLLM für komplexe Tasks…",
      "Prüfe lokale Verfügbarkeit…",
    ],
  },
];

// ── Tasks that get "dispatched" (Multi-Orchestrator: je nach Anwendbarkeit) ───
const DEMO_TASKS = [
  { task: "Analysiere Lead-Pipeline und erstelle Report", agent: "claude" },
  { task: "Überprüfe aktuelle KI-News für Kunden-Briefing", agent: "grok" },
  { task: "Extrahiere Daten aus Kunden-Screenshots", agent: "gemini" },
  { task: "Schreibe API-Endpunkt für Bewerbungs-Automation", agent: "claude" },
  { task: "Recherchiere Wettbewerber-Preise in Echtzeit", agent: "grok" },
  { task: "Analysiere Diagramm aus Präsentation", agent: "gemini" },
  { task: "Refactore NocoDB-Integration", agent: "claude" },
  { task: "Prüfe Deployment-Status und Changelogs", agent: "grok" },
  { task: "Vergleiche Logos auf Brand-Konformität", agent: "gemini" },
  { task: "Kurze deutsche Zusammenfassung (lokal)", agent: "sauerkraut" },
  { task: "Übersetze Glossar auf Deutsch", agent: "sauerkraut" },
];

type AgentState = "idle" | "thinking" | "working" | "done";

interface AgentStatus {
  state: AgentState;
  thought: string;
  thoughtIdx: number;
  taskCount: number;
}

// ── Typing effect hook ───────────────────────────────────────────────────────
function useTypingText(text: string, speed = 28) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    setDisplayed("");
    if (!text) return;
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(iv);
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);
  return displayed;
}

// ── Speech bubble ────────────────────────────────────────────────────────────
function SpeechBubble({ text, color, visible }: { text: string; color: string; visible: boolean }) {
  const typed = useTypingText(visible ? text : "", 22);
  if (!visible) return null;
  return (
    <div style={{
      position: "relative",
      background: "rgba(15,20,35,0.95)",
      border: `1px solid ${color}55`,
      borderRadius: 10,
      padding: "8px 11px",
      fontSize: 11,
      lineHeight: 1.5,
      color: "var(--text-secondary)",
      minHeight: 38,
      transition: "opacity 0.3s",
    }}>
      {typed}
      {typed.length < text.length && (
        <span style={{ display: "inline-block", width: 2, height: 11, background: color, marginLeft: 2, verticalAlign: "middle", animation: "blink 0.7s step-end infinite" }} />
      )}
      {/* tail */}
      <div style={{
        position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
        width: 10, height: 6, overflow: "hidden",
      }}>
        <div style={{
          width: 10, height: 10, background: "rgba(15,20,35,0.95)",
          border: `1px solid ${color}55`, transform: "rotate(45deg)",
          marginTop: -5, marginLeft: 0,
        }} />
      </div>
    </div>
  );
}

// ── State dot ────────────────────────────────────────────────────────────────
function StateDot({ state, color }: { state: AgentState; color: string }) {
  const cfg: Record<AgentState, { label: string; pulse: boolean }> = {
    idle:     { label: "bereit",   pulse: false },
    thinking: { label: "denkt…",  pulse: true  },
    working:  { label: "arbeitet", pulse: true  },
    done:     { label: "fertig",  pulse: false },
  };
  const { label, pulse } = cfg[state];
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 10, color: "var(--text-secondary)" }}>
      <span style={{
        width: 5, height: 5, borderRadius: "50%",
        background: state === "idle" ? "var(--text-secondary)" : color,
        flexShrink: 0,
        animation: pulse ? "livePulse 1.4s ease-in-out infinite" : "none",
      }} />
      {label}
    </span>
  );
}

// ── Single agent card ────────────────────────────────────────────────────────
function AgentCard({ agent, status, active }: {
  agent: typeof AGENTS[0];
  status: AgentStatus;
  active: boolean;
}) {
  return (
    <div style={{
      display: "flex", flexDirection: "column", gap: 10,
      padding: "14px 14px 16px",
      borderRadius: 12,
      background: active ? `${agent.glow}` : "var(--surface2)",
      border: `1px solid ${active ? agent.border : "var(--border)"}`,
      transition: "background 0.4s, border-color 0.4s",
      flex: 1,
      minWidth: 0,
    }}>
      {/* Speech bubble */}
      <SpeechBubble
        text={status.thought}
        color={agent.color}
        visible={status.state === "thinking" || status.state === "working"}
      />
      {(status.state === "idle" || status.state === "done") && (
        <div style={{ minHeight: 38, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 10, color: "var(--text-secondary)" }}>
            {status.state === "done" ? "✓ Aufgabe abgeschlossen" : "Wartet auf Task…"}
          </span>
        </div>
      )}

      {/* Avatar + info */}
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 4 }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          display: "flex", alignItems: "center", justifyContent: "center",
          background: `${agent.color}18`, border: `1px solid ${agent.color}40`,
          fontSize: 17, color: agent.color,
          boxShadow: active ? `0 0 14px ${agent.glow}` : "none",
          transition: "box-shadow 0.4s",
        }}>
          {agent.avatar}
        </div>
        <div style={{ minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text)" }}>{agent.name}</span>
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontWeight: 500 }}>by {agent.vendor}</span>
          </div>
          <div style={{ fontSize: 10, color: "var(--text-muted)", marginTop: 1 }}>{agent.specialty}</div>
        </div>
        <div style={{ marginLeft: "auto", flexShrink: 0 }}>
          <StateDot state={status.state} color={agent.color} />
        </div>
      </div>

      {/* Task counter */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        paddingTop: 8, borderTop: "1px solid var(--border)", marginTop: 2,
      }}>
        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>Tasks ausgeführt</span>
        <span style={{ fontSize: 12, fontWeight: 700, color: agent.color, fontFamily: "monospace" }}>
          {status.taskCount}
        </span>
      </div>
    </div>
  );
}

// ── Main widget ──────────────────────────────────────────────────────────────
export function AgentOrchestratorWidget() {
  const [agentStates, setAgentStates] = useState<Record<string, AgentStatus>>(() =>
    Object.fromEntries(AGENTS.map(a => [a.id, {
      state: "idle" as AgentState,
      thought: a.thoughts[0],
      thoughtIdx: 0,
      taskCount: Math.floor(Math.random() * 24) + 3,
    }]))
  );
  const [activeTask, setActiveTask] = useState<{ task: string; agent: string } | null>(null);
  const [taskIdx, setTaskIdx] = useState(0);

  const dispatch = useCallback(() => {
    const t = DEMO_TASKS[taskIdx % DEMO_TASKS.length];
    setTaskIdx(i => i + 1);
    setActiveTask(t);

    // Set target agent to thinking → working → done → idle
    setAgentStates(prev => {
      const agent = AGENTS.find(a => a.id === t.agent)!;
      const thought = agent.thoughts[Math.floor(Math.random() * agent.thoughts.length)];
      return {
        ...prev,
        [t.agent]: { ...prev[t.agent], state: "thinking", thought },
      };
    });

    setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        [t.agent]: { ...prev[t.agent], state: "working" },
      }));
    }, 1800);

    setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        [t.agent]: { ...prev[t.agent], state: "done", taskCount: prev[t.agent].taskCount + 1 },
      }));
    }, 5500);

    setTimeout(() => {
      setAgentStates(prev => ({
        ...prev,
        [t.agent]: { ...prev[t.agent], state: "idle" },
      }));
      setActiveTask(null);
    }, 7500);
  }, [taskIdx]);

  // Auto-dispatch every 9s
  useEffect(() => {
    const iv = setInterval(dispatch, 9000);
    // kick off immediately after short delay
    const t = setTimeout(dispatch, 1200);
    return () => { clearInterval(iv); clearTimeout(t); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, height: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>
            Agent Orchestrator
          </p>
          <p style={{ fontSize: 11, color: "var(--text2)", margin: "2px 0 0" }}>
            KI-Arbeiter · Live-Routing
          </p>
        </div>
        <button
          onClick={dispatch}
          style={{
            padding: "4px 11px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: "var(--accent)", color: "white",
            border: "none", cursor: "pointer",
            letterSpacing: "0.02em",
          }}
        >
          + Task
        </button>
      </div>

      {/* Active task banner */}
      <div style={{
        minHeight: 34,
        padding: "7px 12px",
        borderRadius: 8,
        background: activeTask ? "rgba(79,156,249,0.08)" : "var(--surface2)",
        border: `1px solid ${activeTask ? "rgba(79,156,249,0.25)" : "var(--border)"}`,
        transition: "all 0.3s",
        display: "flex", alignItems: "center", gap: 8,
      }}>
        {activeTask ? (
          <>
            <span style={{ fontSize: 10, color: "var(--accent-blue)", fontWeight: 600, flexShrink: 0 }}>▶ ROUTING</span>
            <span style={{ fontSize: 11, color: "var(--text2)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {activeTask.task}
            </span>
            <span style={{
              marginLeft: "auto", flexShrink: 0, fontSize: 10, fontWeight: 700,
              color: AGENTS.find(a => a.id === activeTask.agent)?.color,
              background: `${AGENTS.find(a => a.id === activeTask.agent)?.color}18`,
              padding: "2px 7px", borderRadius: 4,
            }}>
              → {AGENTS.find(a => a.id === activeTask.agent)?.name}
            </span>
          </>
        ) : (
          <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>Warte auf nächste Aufgabe…</span>
        )}
      </div>

      {/* Agent cards */}
      <div style={{ display: "flex", gap: 8, flex: 1 }}>
        {AGENTS.map(agent => (
          <AgentCard
            key={agent.id}
            agent={agent}
            status={agentStates[agent.id]}
            active={activeTask?.agent === agent.id}
          />
        ))}
      </div>

      <style>{`
        @keyframes livePulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.5); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
