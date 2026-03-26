"""Intent classification: keyword matching with OpenRouter AI fallback.

Root cause of the original n8n bot failure:
  The HTTP request body used Google's native Gemini format (contents/parts)
  instead of the OpenAI-compatible format (messages/content) that OpenRouter expects.
  This caused a 400 error on every request → intent always UNKNOWN → always Help text.

This module uses deterministic keyword matching first (fast, no external dependency),
and falls back to OpenRouter only for genuinely ambiguous natural-language queries.
"""
from __future__ import annotations

import json
import logging
import os
import re
from dataclasses import dataclass, field

import httpx

logger = logging.getLogger(__name__)

OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")
OPENROUTER_MODEL   = "google/gemini-2.0-flash:free"

# ─── Intent dataclass ─────────────────────────────────────────────────────────

@dataclass
class Intent:
    name: str
    workflow_name: str | None = None
    extra: dict = field(default_factory=dict)


# ─── Keyword map ──────────────────────────────────────────────────────────────
# Order matters: more specific patterns first.
# Each entry: (intent_name, [keywords]) — keyword must appear in lowercased text.

KEYWORD_MAP: list[tuple[str, list[str]]] = [
    # Workflow control patterns are handled by regex before this map
    ("LIST_WORKFLOWS",    ["welche workflows", "zeige workflows", "workflow list",
                           "alle workflows", "liste der workflows", "workflow-liste",
                           "aktive workflows", "workflows anzeigen", "workflow status"]),
    ("NOCODB_TRENDS",     ["trend-daten", "aktuelle trends", "trend daten",
                           "letzte trends", "zeige trends"]),
    ("NOCODB_SENTIMENT",  ["sentiment-analyse", "stimmungsanalyse", "letzte sentiment",
                           "zeige sentiment", "stimmung analysieren"]),
    ("CONTENT_FACTORY",   ["content factory", "inhalte erstellen", "neuen inhalt",
                           "bestehenden inhalt", "inhaltsübersicht", "letzte inhalte",
                           "häufigsten inhalte", "content pipeline"]),
    ("ANALYTICS",         ["analysen", "analytics", "wichtigsten erkenntnisse",
                           "neuen bericht erstellen", "trends letzten 30",
                           "letzte berichte", "neue analysen"]),
    ("MONITORING",        ["monitoring", "systemüberwachung", "metriken überwacht",
                           "letzten 24 stunden systemmetriken", "häufigsten probleme monitoring"]),
    ("ALERTS",            ["feuernde alerts", "aktuelle alerts", "prometheus alerts",
                           "warnungen prometheus", "alert status"]),
    ("ACTIVITY",          ["aktivitätsprotokoll", "aktivitätsprotokol", "letzte aktivitäten",
                           "benutzeraktivitäten", "letzten aktivitäten", "benutzer angemeldet",
                           "häufigsten aktivitäten"]),
    ("LOGS",              ["detaillierte log", "fehlerprotokolle", "fehlerprotokoll",
                           "log durchsuchen", "kritische fehler", "log-einträge",
                           "letzte kritische", "warnungen log", "letzten log"]),
    ("DEPLOYMENTS",       ["deployment", "deployments", "deploy", "letzte deployments",
                           "fehlgeschlagene deployments", "deployment zurücksetzen",
                           "aktuelle versionen", "deployment-historie"]),
    ("AGENTS",            ["agenten konfiguriert", "details agent", "neuen agenten",
                           "statusberichte agenten", "agenten hinzufügen",
                           "agent konfigurieren", "agentendetails"]),
    ("KNOWLEDGE",         ["knowledge base", "knowledge-base", "dokumentation",
                           "häufigsten fragen dokumentation", "neuen artikel",
                           "wissen", "artikel hinzufügen", "workflow-optimierung"]),
    ("MCP_SERVICES",      ["mcp-services", "mcp services", "mcp-service",
                           "konfigurierten mcp", "neuen mcp", "mcp probleme",
                           "mcp statusberichte"]),
    ("KANBAN",            ["kanban", "aufgaben bearbeitung", "kanban-board",
                           "neue aufgabe kanban", "prioritäten aufgaben",
                           "abgeschlossenen aufgaben"]),
    ("TEMPLATES",         ["vorlagen", "vorlage", "templates", "neue vorlage",
                           "template erstellen", "vorlage bearbeiten"]),
    ("FILES",             ["dateiübersicht", "dateizugriff", "neue datei hochladen",
                           "datei löschen", "häufigsten dateitypen"]),
    ("DATABASES",         ["datenbanken", "datenbank", "database", "neue datenbank",
                           "datenbank sichern", "änderungen datenbank"]),
    ("SETTINGS",          ["systemeinstellungen", "einstellungen ändern",
                           "benutzereinstellungen", "einstellungen überprüfen",
                           "wichtigsten einstellungen"]),
    # Generic fallbacks — lower priority
    ("STATUS_OVERVIEW",   ["status", "übersicht", "systemstatus", "system online",
                           "metriken", "kennzahlen", "zusammenfassung",
                           "wie läuft", "aktueller status", "system derzeit"]),
    ("LIST_WORKFLOWS",    ["workflows"]),
    ("NOCODB_TRENDS",     ["trends"]),
    ("NOCODB_SENTIMENT",  ["sentiment", "stimmung"]),
    ("MONITORING",        ["prometheus", "grafana"]),
    ("ALERTS",            ["alerts", "alert", "warnungen"]),
    ("ACTIVITY",          ["aktivität", "aktivitäten", "protokoll"]),
    ("LOGS",              ["logs", " log "]),
    ("DEPLOYMENTS",       ["coolify"]),
    ("AGENTS",            ["agenten", "agent"]),
    ("KNOWLEDGE",         ["knowledge", "artikel"]),
    ("MCP_SERVICES",      ["mcp", "tools", "api"]),
    ("KANBAN",            ["kanban", "aufgaben"]),
    ("TEMPLATES",         ["vorlage"]),
    ("FILES",             ["datei"]),
    ("DATABASES",         ["datenbank"]),
    ("SETTINGS",          ["einstellungen"]),
    ("HELP",              ["hilfe", "help", "befehle", "was kannst", "was kann",
                           "funktionen", "/hilfe", "/help"]),
]


# ─── Regex patterns for workflow control ──────────────────────────────────────

_ACTIVATE_RE   = re.compile(r"^aktiviere\s+(.+)$", re.IGNORECASE)
_DEACTIVATE_RE = re.compile(r"^deaktiviere\s+(.+)$", re.IGNORECASE)
_TRIGGER_RE    = re.compile(r"^starte\s+(.+)$", re.IGNORECASE)
_ACTIVATE2_RE  = re.compile(r"^aktiviere\s+den\s+workflow\s+[\"']?(.+?)[\"']?$", re.IGNORECASE)
_DEACTIVATE2_RE = re.compile(r"^deaktiviere\s+den\s+workflow\s+[\"']?(.+?)[\"']?$", re.IGNORECASE)


# ─── AI fallback ──────────────────────────────────────────────────────────────

_SYSTEM_PROMPT = """Du bist ein Intent-Classifier für einen AIOS-Telegram-Admin-Bot.
Klassifiziere die Benutzeranfrage in EINEN der folgenden Intents und antworte NUR mit validem JSON.

Erlaubte Intents:
STATUS_OVERVIEW, LIST_WORKFLOWS, ACTIVATE_WORKFLOW, DEACTIVATE_WORKFLOW, TRIGGER_WORKFLOW,
AGENTS, KNOWLEDGE, MONITORING, ACTIVITY, LOGS, DEPLOYMENTS, ANALYTICS, CONTENT_FACTORY,
MCP_SERVICES, NOCODB_TRENDS, NOCODB_SENTIMENT, ALERTS,
KANBAN, TEMPLATES, FILES, DATABASES, SETTINGS, HELP, UNKNOWN

Antworte ausschließlich mit:
{"intent": "INTENT_NAME", "workflow_name": null_oder_workflow_name}"""


async def ai_classify(client: httpx.AsyncClient, text: str) -> Intent:
    """Call OpenRouter with the correct OpenAI-compatible format."""
    if not OPENROUTER_API_KEY:
        return Intent("UNKNOWN")
    try:
        r = await client.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
            },
            # ← CORRECTED FORMAT: OpenAI-compatible messages/content
            #   (original n8n bot used Gemini-native contents/parts → 400 error)
            json={
                "model": OPENROUTER_MODEL,
                "messages": [
                    {"role": "system", "content": _SYSTEM_PROMPT},
                    {"role": "user",   "content": text},
                ],
                "max_tokens": 100,
                "temperature": 0,
            },
            timeout=httpx.Timeout(8.0),
        )
        r.raise_for_status()
        content = r.json()["choices"][0]["message"]["content"].strip()
        # Strip markdown code fences if present
        content = re.sub(r"^```[a-z]*\n?", "", content)
        content = re.sub(r"\n?```$", "", content)
        parsed = json.loads(content)
        return Intent(
            name=parsed.get("intent", "UNKNOWN"),
            workflow_name=parsed.get("workflow_name"),
        )
    except Exception as exc:
        logger.warning("AI classifier failed: %s", exc)
        return Intent("UNKNOWN")


# ─── Main classifier ──────────────────────────────────────────────────────────

async def classify(client: httpx.AsyncClient, text: str) -> Intent:
    """Classify user text into an intent.

    Priority:
    1. Exact regex patterns for workflow control commands
    2. Keyword matching (deterministic, no external calls)
    3. AI fallback via OpenRouter (only if OPENROUTER_API_KEY is set)
    4. HELP (final fallback)
    """
    t = text.strip()

    # 1. Regex: workflow control
    for pat, intent_name in [
        (_ACTIVATE2_RE,   "ACTIVATE_WORKFLOW"),
        (_DEACTIVATE2_RE, "DEACTIVATE_WORKFLOW"),
        (_ACTIVATE_RE,    "ACTIVATE_WORKFLOW"),
        (_DEACTIVATE_RE,  "DEACTIVATE_WORKFLOW"),
        (_TRIGGER_RE,     "TRIGGER_WORKFLOW"),
    ]:
        if m := pat.match(t):
            return Intent(intent_name, workflow_name=m.group(1).strip())

    # 2. Keyword matching
    t_lower = t.lower()
    for intent_name, keywords in KEYWORD_MAP:
        for kw in keywords:
            if kw in t_lower:
                return Intent(intent_name)

    # 3. AI fallback
    if OPENROUTER_API_KEY:
        ai_result = await ai_classify(client, t)
        if ai_result.name != "UNKNOWN":
            return ai_result

    # 4. Default
    return Intent("HELP")
