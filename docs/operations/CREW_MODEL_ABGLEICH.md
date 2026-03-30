# Crew-Modelle — Abgleich Ops ↔ Repo

Quelle im Code: `services/crew-api/config/crews.yaml` und Routing in `services/crew-api/app/services/crew_manager.py`.

| Crew-Typ (Beispiele) | Modell in `crews.yaml` | API |
|----------------------|-------------------------|-----|
| Meiste Produktions-Crews | `gemini-2.5-flash` | Gemini (direkt oder über OpenRouter-Pfad `openrouter/google/…` je nach Konfiguration) |
| `red_team` / Faktenprüfung | `openrouter/deepseek/deepseek-r1` | OpenRouter |
| `xai_social_crew` | `openrouter/x-ai/grok-3` | OpenRouter |

**Hinweis:** Default in `app/models/crew.py` kann von den YAML-Defaults abweichen — maßgeblich ist die Crew-Definition in `crews.yaml` je Agent.

Bei Deploy: `GEMINI_API_KEY` und `OPENROUTER_API_KEY` in Coolify setzen (siehe `infra/env-template.md`).
