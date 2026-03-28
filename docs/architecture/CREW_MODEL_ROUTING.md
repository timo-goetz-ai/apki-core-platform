# Crew AI: Modell-Routing & Kosten (Phase 4)

## Architektur kurz

- **Orchestrierung:** Crew-API (Python) startet Executions; Status/Events per **SSE** (`GET /crews/executions/:id`).
- **Dashboard:** Next.js proxy `GET /api/crews/stream/[executionId]` → vermeidet Browser-CORS.
- **Konfiguration:** Modellwahl und Limits liegen typischerweise in **Crew-API-Env** (Coolify), nicht im Next-Frontend.

## Rollen vs. Modelle

Das UI unter `/agents` zeigt **Crews** und Agenten-Rollen (Researcher, Writer, …). Die tatsächliche Modellzuordnung (z. B. Gemini vs. OpenRouter) steckt in der **Crew-API / YAML / Env** pro Crew.

Empfehlung für Nachvollziehbarkeit:

| Ebene | Was dokumentieren |
|--------|-------------------|
| Crew | Default-Modell, Fallback-Modell |
| Task-Typ | Ob teurer Reasoning-Call nötig ist |
| Kosten | Ungefähre Input/Output-Tokens pro Lauf (Schätzung reicht für Budget) |

## Operative Checks

- Crew-API erreichbar (`CREW_API_URL` im Dashboard).
- Bei Fehlern: zuerst **SSE-Proxy-Status** (502 = Upstream), dann Crew-API-Logs.
- **Audit:** sinnvoll sind Einträge in NocoDB oder App-Logs pro `execution_id`, wenn die API das liefert.

## Frontend (SSE)

Die Seite `/agents` zeigt bei Verbindungsabbruch einen **sichtbaren Fehlerzustand**; der Stream wird nicht mehr still nach 2s geschlossen — Nutzer schließt manuell oder startet neu.

## Erweiterung (optional)

- Zentrales **LLM-Observability**-Tool (z. B. Langfuse) parallel zu Grafana, wenn Token-Kosten kritisch werden.
- Rate-Limits pro Crew in der API durchsetzen, nicht nur im UI.
