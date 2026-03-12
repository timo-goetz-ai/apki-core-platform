# Einstieg: 03_Agents

**n8n Workflows & Agent-Definitionen**

---

## Überblick

| | |
|---|---|
| **Ziel** | Workflow-Orchestrierung, Agent-Logik |
| **Status** | 18 Workflows, 1 aktiv ⚠️ |
| **Tech** | n8n |

---

## Problem

17/18 Workflows inaktiv (ai-brain, system-brain, task-brain, trade-brain...). Infrastruktur kostet ohne Wert.

---

## Aktionen

1. Jeden Workflow: aktivieren + dokumentieren ODER löschen
2. N8N_API_URL in .env.example fixen
3. Qdrant für Workflow-Ergebnisse nutzen

---

## Struktur

- **Tasks** → Workflow-Aktivierung, Dokumentation
- **Configs** → Workflow-JSONs, Brain-Definitionen
- **Ergebnis** → Aktivierte Workflows, Runbooks
