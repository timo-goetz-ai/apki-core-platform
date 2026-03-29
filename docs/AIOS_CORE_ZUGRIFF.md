# AIOS Core — Zugriffspunkte und URLs

**Begriff:** **AIOS Core** ist der zentrale FastAPI-Orchestrierungsdienst (Agents, Tasks, Models, Prompts, Automations, Jarvis). Er ist **nicht** [CrewAI](https://www.crewai.com/) und **nicht** identisch mit **Crew API** (`services/crew-api`) — Crew API ist ein separater Service im Monorepo.

---

## Öffentlich (Traefik / Coolify)

| Zweck | URL (Beispiel Prod) | Hinweis |
|--------|---------------------|---------|
| REST + Docs | `https://api.automation-plus-ki.de` | OpenAPI: `/docs`, `/redoc` |
| Health (ohne Token) | `GET https://api.automation-plus-ki.de/health` | Für Loadbalancer / Monitoring |
| Metrics (ohne Token) | `GET https://api.automation-plus-ki.de/metrics` | Prometheus-Format |
| WebSocket Dashboard | `wss://api.automation-plus-ki.de/ws/...` | Siehe unten |

Konkrete Hostnamen in **Coolify** / DNS können abweichen; die **Pfade** bleiben gleich.

---

## Intern (Docker / Compose)

| Von | Nach | Basis-URL |
|-----|------|-----------|
| `admin-dashboard` | AIOS Core | `http://aios-core:8000` |
| `crew-api` | AIOS Core | `http://aios-core:8000` (Env: `AIOS_CORE_URL`) |
| Browser / lokal | Dev | `http://localhost:8000` |

**Container-Name:** `aios-core` · **Image (GHCR):** `ghcr.io/timogoetz1988/aios-core`

---

## Authentifizierung

| Mechanismus | Wert |
|-------------|------|
| Header | `x-aios-token: <AIOS_TOKEN>` |
| Env im Core | `AIOS_TOKEN` (siehe `app/config/settings.py` → Feld `aios_token`) |
| Wenn `AIOS_TOKEN` leer | Alle Routen ohne Prüfung (nur für Dev gedacht) |

**Ohne Token erlaubt** (Middleware-Ausnahme): `/health`, `/metrics`, `/docs`, `/redoc`, `/openapi.json`, `/ws/dashboard`, sowie alle Pfade unter `/ws`.

---

## REST-API-Prefixe (`/api/...`)

| Prefix | Inhalt (Kurz) |
|--------|----------------|
| `/api/agents` | Agenten |
| `/api/tasks` | Aufgaben |
| `/api/models` | Modelle |
| `/api/prompts` | Prompts |
| `/api/automations` | Automationen |
| `/api/jarvis` | Jarvis (u. a. Tasks-Proxy) |

Root-Endpoints: `GET /health`, `GET /metrics`.

---

## Admin-Dashboard (Next.js) — relevante Env-Variablen

| Variable | Bedeutung |
|----------|-----------|
| `NEXT_PUBLIC_AIOS_CORE_API_URL` | Öffentliche oder interne Basis-URL des Core für Browser/Server Components |
| `NEXT_PUBLIC_NEXUS_API_URL` | **Legacy-Fallback** (gleiche Rolle wie oben), bis Coolify überall umgestellt ist |
| `NEXT_PUBLIC_WS_URL` | WebSocket-Basis (z. B. `wss://api.automation-plus-ki.de`) |
| `AIOS_CORE_URL` | Server-only: interner Fetch zur Jarvis-Route (`/api/jarvis/tasks`) |
| `NEXUS_CORE_URL` | **Legacy-Fallback** für `AIOS_CORE_URL` |

---

## Crew API (Abgrenzung)

| Service | Pfad im Repo | Typische Rolle |
|---------|----------------|----------------|
| **AIOS Core** | `services/aios-core` | Zentrale Orchestrierung, Jarvis-Anbindung, Prometheus |
| **Crew API** | `services/crew-api` | Eigener API-Dienst (eigener Port / eigenes Image), nicht mit CrewAI-Produkt verwechseln |

---

## Deploy / CI (Referenz)

- Build-Job: `.github/workflows/build-and-push.yml` — Image `aios-core`
- Coolify: Ressource auf Image `ghcr.io/timogoetz1988/aios-core` umstellen, falls noch `nexus-core` eingetragen war
- Geheimnis-Workflow: ggf. `COOLIFY_AIOS_CORE_UUID` / 1Password-Feld `aios_core_uuid`

---

*Stand: generiert im Rahmen der Umbenennung Nexus Core → AIOS Core.*
