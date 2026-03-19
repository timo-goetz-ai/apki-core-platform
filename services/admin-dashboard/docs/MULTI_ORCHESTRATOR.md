# Multi-Model-Orchestrator

**Stand**: 2026-03-18  
**Kontext**: Admin-Dashboard, AIOS Cockpit

---

## Übersicht

Der Multi-Orchestrator wählt Modelle **je nach Anwendbarkeit** automatisch aus:

| Anwendungsfall | Bevorzugte Modelle | Begründung |
|----------------|--------------------|------------|
| **Einfache Chats** (kurz, keine Tools) | SauerkrautLM, Ollama-Qwen, Mistral | Lokal, kostenlos, schnell |
| **Tool-Use** (Docker, n8n, Services) | Gemini Free, Llama 4, DeepSeek R1 | OpenRouter Free mit Function Calling |
| **Komplexes Reasoning** | DeepSeek R1, Qwen 72B, Llama 4 | Stärkere Modelle für lange Kontexte |

---

## Angebundene Provider

| Provider | Modelle | Kosten | Tool-Calling |
|----------|---------|--------|--------------|
| **OpenRouter** | DeepSeek R1, Gemini 2.0 Flash, Llama 3.3/4, Qwen 2.5, Mistral | Free Tier | Ja (ausgewählte) |
| **Ollama** | Llama 3.2, Phi-3, Qwen 2.5, **SauerkrautLM** | Lokal, 0 € | Nein |
| **Anthropic** | Claude 3 Haiku/Sonnet/Opus | Abo | Ja |
| **Google AI Studio** | Gemini 1.5/2.0 | Abo | Ja |

---

## SauerkrautLM

- **Quelle**: VAGOsolutions, Hugging Face
- **Ollama**: `ollama pull sauerkrautlm` (oder `localmind/sauerkrautlm`)
- **Einsatz**: Deutsche Texte, kurze Anfragen, keine API-Kosten
- **Lizenz**: Apache 2.0

---

## Auto-Routing-Logik

```ts
// Heuristik (resolveOrchestratorModel):
// 1. Tool-Use-Keywords → OpenRouter (tools)
// 2. Kurze Nachricht (<80 Zeichen) → Ollama/SauerkrautLM (simple)
// 3. Sonst → Reasoning-Kette (reasoning)
```

---

## Erweiterungsideen (ngx-admin inspiriert)

- **Dashboard-Widgets**: Modell-Nutzung pro Tag, Kosten-Tracking
- **Routing-Regeln**: Benutzerdefinierte Regeln (z.B. "immer lokal für Thema X")
- **Fallback-Kette**: Bei 429/Timeout → nächstes Modell in der Kette
- **Model-Discovery**: OpenRouter-Modelle dynamisch laden, neue Free-Tier-Modelle automatisch einbinden
