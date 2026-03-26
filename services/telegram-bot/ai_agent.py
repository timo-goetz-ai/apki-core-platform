"""AI Co-Pilot Agent: Conversation memory + intelligent response generation.

Architecture:
- ConversationMemory: Window Buffer per user (last 6 messages)
- generate_response(): Takes raw API data + context → human-friendly Telegram answer
- The AI acts as the final interpretation layer, not just a classifier

The system prompt defines the bot as a proactive AIOS co-pilot that:
- Interprets metrics in human terms (not raw numbers)
- Remembers context between messages
- Asks clarifying questions instead of generic responses
- Recognizes cross-system relationships
"""
from __future__ import annotations

import json
import logging
import os
from collections import deque
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = "google/gemini-2.0-flash:free"

# ─── System Prompt ────────────────────────────────────────────────────────────

AGENT_SYSTEM_PROMPT = """Du bist der zentrale KI-Assistent für das AIOS-Ökosystem von Timo. Du fungierst als intelligente Schnittstelle zwischen dem Nutzer und seinen technischen Systemen.

CHARAKTER & STIL:
- Proaktiver Co-Pilot, kein passiver Status-Bot
- Antworten: kurz, prägnant, Telegram-tauglich (max 5-8 Zeilen)
- Nutze Markdown-Formatierung: *fett* für Wichtiges, `code` für Namen/IDs, - für Listen
- Sprich den Nutzer direkt an, nicht in der dritten Person

DEINE SYSTEME (du kennst sie alle):
- *n8n* – Workflows für Automation, Content-Pipeline, Research (Trends/Sentiment/Content)
- *NocoDB* – Strukturierte Projektverwaltung: Trends, Sentiment, Content, Prompts
- *Prometheus/Grafana* – Server-Monitoring (Hetzner-Host, alle Coolify-Services)
- *Coolify* – Service-Deployment: Dashboard, MCP-Services, Bot
- *YouTube-Nischen* – Marktforschungsdaten via 10_NISCHEN_SCANNER + 14_JOB_SCOUT Workflows

VERHALTENSREGELN:
1. Metriken IMMER menschlich interpretieren — nie Rohdaten ausgeben:
   - Statt "cpu_idle: 0.72" → "CPU entspannt bei 28% — alles grün ✅"
   - Statt "executions: 47" → "47 Workflows liefen heute, davon 3 mit Fehlern — Handlungsbedarf"
2. Wenn Infos fehlen oder unklar → frage präzise nach (1 gezielte Frage, keine Liste)
3. Bei Workflow-Ausführung → bestätige kurz + liefere Ergebnis wenn verfügbar
4. Erkenne System-Zusammenhänge: z.B. hohe n8n-Fehlerrate + Prometheus-Alert = korreliertes Problem
5. Sei proaktiv: Wenn du Anomalien siehst, weise darauf hin ohne gefragt zu werden
6. YouTube-Nischen: Greife auf NISCHEN_SCANNER + JOB_SCOUT Workflow-Daten zu

FORMAT-REGELN für Telegram:
- Keine langen Fließtexte
- Emojis sparsam aber gezielt (✅ ok, ⚠️ warnung, ❌ fehler, 🚀 aktion)
- Zahlen mit Kontext: nicht "45%" sondern "CPU bei 45% (normal < 70%)"

Die aktuellen Systemdaten werden dir als JSON übergeben — interpretiere sie, gib keine Rohdaten zurück."""


# ─── Conversation Memory ──────────────────────────────────────────────────────

class ConversationMemory:
    """Per-user sliding window of the last N message turns."""

    def __init__(self, max_turns: int = 6):
        self._store: dict[int, deque] = {}
        self.max_turns = max_turns

    def add(self, user_id: int, role: str, content: str) -> None:
        if user_id not in self._store:
            self._store[user_id] = deque(maxlen=self.max_turns)
        self._store[user_id].append({"role": role, "content": content[:600]})

    def get(self, user_id: int) -> list[dict]:
        return list(self._store.get(user_id, []))

    def clear(self, user_id: int) -> None:
        self._store.pop(user_id, None)


# ─── Response Generator ───────────────────────────────────────────────────────

async def generate_response(
    client: httpx.AsyncClient,
    user_message: str,
    data_context: dict,
    memory: ConversationMemory,
    user_id: int,
    max_tokens: int = 400,
) -> str | None:
    """Generate a human-friendly AI response using conversation history + live data.

    Returns None if OpenRouter is not configured or the call fails.
    The caller falls back to pre-formatted text in that case.
    """
    if not OPENROUTER_API_KEY:
        return None

    history = memory.get(user_id)

    # Build message list: system + history + current request with data
    messages: list[dict] = [{"role": "system", "content": AGENT_SYSTEM_PROMPT}]
    messages.extend(history)

    # Attach current data as context
    data_str = json.dumps(data_context, ensure_ascii=False, indent=2)
    # Limit data size to avoid token overflow
    if len(data_str) > 2500:
        data_str = data_str[:2500] + "\n... [gekürzt]"

    messages.append({
        "role": "user",
        "content": f"{user_message}\n\n---\nAktuelle Systemdaten:\n{data_str}",
    })

    try:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": max_tokens,
                "temperature": 0.35,
            },
            timeout=httpx.Timeout(20.0),
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"].strip()

        # Store in memory
        memory.add(user_id, "user", user_message)
        memory.add(user_id, "assistant", content[:500])

        return content

    except Exception as exc:
        logger.warning("AI response generation failed: %s", exc)
        # Still store the user message even if AI fails
        memory.add(user_id, "user", user_message)
        return None


async def ask_clarification(
    client: httpx.AsyncClient,
    user_message: str,
    memory: ConversationMemory,
    user_id: int,
) -> str | None:
    """Ask the AI to formulate a clarifying question when the intent is unclear."""
    if not OPENROUTER_API_KEY:
        return None

    history = memory.get(user_id)
    messages = [
        {"role": "system", "content": AGENT_SYSTEM_PROMPT},
        *history,
        {
            "role": "user",
            "content": (
                f"Der Nutzer schrieb: '{user_message}'\n\n"
                "Ich konnte keinen konkreten System-Intent erkennen. "
                "Formuliere eine einzelne, präzise Rückfrage (max 1 Satz) "
                "die klärt was der Nutzer genau braucht. "
                "Keine Standardantwort, keine Liste von Optionen — nur 1 gezielte Frage."
            ),
        },
    ]

    try:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            json={
                "model": OPENROUTER_MODEL,
                "messages": messages,
                "max_tokens": 120,
                "temperature": 0.4,
            },
            timeout=httpx.Timeout(10.0),
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"].strip()
        memory.add(user_id, "user", user_message)
        memory.add(user_id, "assistant", content)
        return content
    except Exception as exc:
        logger.warning("Clarification question generation failed: %s", exc)
        return None


async def interpret_metrics(
    client: httpx.AsyncClient,
    metrics_data: dict,
    memory: ConversationMemory,
    user_id: int,
) -> str | None:
    """Specifically for metric data — generates a concise human interpretation."""
    prompt = (
        "Interpretiere diese Server-Metriken in 3-4 kurzen Stichpunkten. "
        "Bewerte was gut ist, was beobachtet werden sollte und ob Handlungsbedarf besteht. "
        "Nutze Emojis: ✅ gut, ⚠️ beobachten, ❌ Problem."
    )
    return await generate_response(
        client, prompt, metrics_data, memory, user_id, max_tokens=300
    )
