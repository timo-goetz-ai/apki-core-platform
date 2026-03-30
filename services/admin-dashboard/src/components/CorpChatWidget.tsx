"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Send, Bot, User, Loader2, Zap, RotateCcw, ChevronDown } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  model?: string;
  ts: Date;
}

import type { ModelInfo } from "@/lib/chat-models";
type ModelMap = Record<string, ModelInfo>;

const QUICK_COMMANDS = [
  { label: "🟢 Service-Status", prompt: "Zeige mir den Status aller Services." },
  { label: "🐳 Container", prompt: "Liste alle laufenden Docker-Container auf." },
  { label: "☁️  Cloudflare", prompt: "Zeige Cloudflare-Zonen und DNS-Status." },
  { label: "🚀 Coolify Apps", prompt: "Welche Apps laufen in Coolify?" },
  { label: "📊 GitHub", prompt: "Zeige GitHub Repository-Statistiken." },
  { label: "⚠️  Probleme?", prompt: "Gibt es aktuell offline Services oder Probleme?" },
];

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === "user";
  // Render tool output blocks nicely
  const lines = msg.content.split("\n");

  return (
    <div style={{
      display: "flex",
      gap: 9,
      flexDirection: isUser ? "row-reverse" : "row",
      alignItems: "flex-start",
      marginBottom: 14,
    }}>
      {/* Avatar */}
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: isUser ? "var(--accent)" : "var(--layer-2)",
        border: "1px solid " + (isUser ? "transparent" : "var(--border)"),
      }}>
        {isUser
          ? <User size={13} color="white" />
          : <Bot size={13} color="var(--text-secondary)" />
        }
      </div>

      {/* Bubble */}
      <div style={{
        maxWidth: "82%",
        padding: "9px 12px",
        borderRadius: isUser ? "12px 4px 12px 12px" : "4px 12px 12px 12px",
        background: isUser ? "var(--accent)" : "var(--surface2)",
        border: isUser ? "none" : "1px solid var(--border)",
        fontSize: 12.5,
        lineHeight: 1.65,
        color: isUser ? "white" : "var(--text)",
        whiteSpace: "pre-wrap",
        wordBreak: "break-word",
      }}>
        {lines.map((line, i) => {
          // Tool call line
          if (line.startsWith("🔧 *") && line.endsWith("*…")) {
            return (
              <div key={i} style={{
                display: "inline-flex", alignItems: "center", gap: 5,
                fontSize: 11, color: "var(--text-secondary)", fontStyle: "italic",
                marginBottom: 4,
              }}>
                <Zap size={10} color="var(--accent-blue)" />
                {line.replace(/🔧 \*|\*…/g, "")}
              </div>
            );
          }
          return <span key={i}>{line}{i < lines.length - 1 ? "\n" : ""}</span>;
        })}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div style={{ display: "flex", gap: 9, alignItems: "flex-start", marginBottom: 14 }}>
      <div style={{
        width: 28, height: 28, borderRadius: 8, flexShrink: 0,
        display: "flex", alignItems: "center", justifyContent: "center",
        background: "var(--layer-2)", border: "1px solid var(--border)",
      }}>
        <Bot size={13} color="var(--text-secondary)" />
      </div>
      <div style={{
        padding: "10px 14px", borderRadius: "4px 12px 12px 12px",
        background: "var(--surface2)", border: "1px solid var(--border)",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            width: 5, height: 5, borderRadius: "50%", background: "var(--text-muted)",
            display: "inline-block",
            animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}

export function CorpChatWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "Hallo Timo 👋\n\nIch bin dein KI-Assistent für die Infrastruktur. Ich kann Services prüfen, Container steuern, Cloudflare abfragen und vieles mehr.\n\nWas möchtest du wissen?",
      ts: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [models, setModels] = useState<ModelMap>({});
  const [selectedModel, setSelectedModel] = useState("deepseek-chat");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Load models + check config
  useEffect(() => {
    fetch("/api/chat")
      .then(r => r.json())
      .then((d: { models: ModelMap; default: string }) => {
        setModels(d.models ?? {});
        setSelectedModel(d.default ?? "deepseek-chat");
        setConfigured(true);
      })
      .catch(() => setConfigured(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const send = useCallback(async (text: string) => {
    if (!text.trim() || loading) return;
    setInput("");

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text.trim(), ts: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    const allMessages = [...messages, userMsg].map(m => ({ role: m.role, content: m.content }));

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: allMessages, modelKey: selectedModel }),
      });

      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const assistantId = (Date.now() + 1).toString();
      setMessages(prev => [...prev, { id: assistantId, role: "assistant", content: "", model: selectedModel, ts: new Date() }]);
      setLoading(false);

      // Stream SSE
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const payload = line.slice(6);
          if (payload === "[DONE]") break;
          try {
            const { text } = JSON.parse(payload) as { text: string };
            setMessages(prev => prev.map(m =>
              m.id === assistantId ? { ...m, content: m.content + text } : m
            ));
          } catch { /* ignore */ }
        }
      }
    } catch (e) {
      setLoading(false);
      setMessages(prev => [...prev, {
        id: Date.now().toString(), role: "assistant",
        content: `Fehler: ${String(e)}`, ts: new Date(),
      }]);
    }
  }, [messages, loading, selectedModel]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(input); }
  };

  const reset = () => setMessages([{
    id: "welcome", role: "assistant",
    content: "Chat zurückgesetzt. Was kann ich für dich tun?", ts: new Date(),
  }]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 440 }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12, gap: 8 }}>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", margin: 0 }}>KI-Steuerung</p>
          <p style={{ fontSize: 11, color: configured === false ? "var(--warn)" : "var(--text2)", margin: "2px 0 0" }}>
            {configured === null ? "Verbinde…" : configured ? "OpenRouter · Tool-Calling aktiv" : "⚠️ OPENROUTER_API_KEY fehlt"}
          </p>
        </div>

        {/* Model selector */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <button onClick={() => setShowModelMenu(v => !v)} style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 9px", borderRadius: 7, fontSize: 11, fontWeight: 500, cursor: "pointer",
            background: "var(--surface2)", color: "var(--text2)",
            border: "1px solid var(--border)", whiteSpace: "nowrap",
          }}>
            {models[selectedModel]?.free && <span style={{ color: "var(--accent-green)", fontSize: 9, fontWeight: 700 }}>FREE</span>}
            {models[selectedModel]?.label ?? selectedModel}
            <ChevronDown size={10} />
          </button>
          {showModelMenu && (
            <div style={{
              position: "absolute", right: 0, top: "calc(100% + 4px)", zIndex: 50,
              background: "var(--surface)", border: "1px solid var(--border2)",
              borderRadius: 9, overflow: "hidden", minWidth: 190,
              boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
            }}>
              {Object.entries(models).map(([key, m]) => (
                <button key={key} onClick={() => { setSelectedModel(key); setShowModelMenu(false); }}
                  style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    width: "100%", padding: "7px 12px", fontSize: 12, textAlign: "left",
                    background: key === selectedModel ? "var(--accent-bg)" : "transparent",
                    color: key === selectedModel ? "var(--accent)" : "var(--text2)",
                    border: "none", cursor: "pointer", gap: 8,
                  }}>
                  <span>{m.label}</span>
                  <span style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                    {m.free && <span style={{ fontSize: 9, color: "var(--accent-green)", fontWeight: 700, background: "rgba(34,197,94,0.1)", padding: "1px 4px", borderRadius: 3 }}>FREE</span>}
                    {m.tools && <span style={{ fontSize: 9, color: "var(--accent-blue)", background: "rgba(79,156,249,0.1)", padding: "1px 4px", borderRadius: 3 }}>TOOLS</span>}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <button onClick={reset} title="Reset" style={{
          padding: 5, borderRadius: 6, background: "transparent", flexShrink: 0,
          border: "1px solid var(--border)", cursor: "pointer", color: "var(--muted)",
          display: "flex", alignItems: "center",
        }}>
          <RotateCcw size={12} />
        </button>
      </div>

      {/* Quick commands */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
        {QUICK_COMMANDS.map(c => (
          <button key={c.label} onClick={() => send(c.prompt)} disabled={loading}
            style={{
              padding: "3px 9px", borderRadius: 6, fontSize: 11, cursor: loading ? "not-allowed" : "pointer",
              background: "var(--surface2)", color: "var(--text2)",
              border: "1px solid var(--border)", opacity: loading ? 0.5 : 1,
              transition: "border-color 0.15s",
              whiteSpace: "nowrap",
            }}
            onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border)"; }}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* Message list */}
      <div style={{
        flex: 1, overflowY: "auto", padding: "8px 4px",
        borderRadius: 10, background: "rgba(0,0,0,0.15)",
        border: "1px solid var(--border)", marginBottom: 10,
        minHeight: 220, maxHeight: 340,
      }}>
        <div style={{ padding: "8px 10px" }}>
          {messages.map(m => <MessageBubble key={m.id} msg={m} />)}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
        <textarea
          ref={textareaRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Nachricht schreiben… (Enter zum Senden)"
          rows={2}
          style={{
            flex: 1, resize: "none", padding: "9px 12px",
            borderRadius: 10, fontSize: 12.5,
            background: "var(--surface2)", color: "var(--text)",
            border: "1px solid var(--border)", outline: "none",
            fontFamily: "inherit", lineHeight: 1.5,
            transition: "border-color 0.15s",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "var(--border2)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "var(--border)"; }}
          disabled={loading || configured === false}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim() || configured === false}
          style={{
            padding: "9px 14px", borderRadius: 10, border: "none", cursor: "pointer",
            background: loading || !input.trim() ? "var(--surface2)" : "var(--accent)",
            color: loading || !input.trim() ? "var(--muted)" : "white",
            transition: "background 0.2s",
            display: "flex", alignItems: "center", justifyContent: "center",
            alignSelf: "stretch",
          }}
        >
          {loading ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <Send size={15} />}
        </button>
      </div>

      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
