# Nexus Core — Zugriffspunkte und URLs

**Begriff:** **Nexus Core** ist der zentrale FastAPI-Orchestrierungsdienst (Agents, Tasks, Models, Prompts, Automations, Jarvis). Er ist **nicht** [CrewAI](https://www.crewai.com/) und **nicht** identisch mit **Crew API** (`services/crew-api`).

---

## Öffentlich (Traefik / Coolify)

| Zweck | URL (Beispiele Prod) | Hinweis |
|--------|----------------------|---------|
| REST + Docs | `https://api.aios.automation-plus-ki.de` oder `https://api.automation-plus-ki.de` | DNS je nach Stack; Pfade identisch |
| Health | `GET …/health` | Ohne Token |
| Metrics | `GET …/metrics` | Prometheus |
| WebSocket | `wss://…/ws/...` | Siehe Middleware-Ausnahmen |

---

## Intern (Docker / Compose)

| Von | Nach | Basis-URL |
|-----|------|-----------|
| `admin-dashboard` | Nexus Core | `http://nexus-core:8000` |
| `crew-api` | Nexus Core | `http://nexus-core:8000` (`AIOS_CORE_URL` in Compose) |
| Lokal | Dev | `http://localhost:8000` |

**Image (GHCR):** `ghcr.io/timo-goetz-ai/nexus-core`

---

## Authentifizierung

| Mechanismus | Wert |
|-------------|------|
| Header | `x-aios-token: <AIOS_TOKEN>` |
| Env im Core | `AIOS_TOKEN` → `settings.aios_token` |
| Leer lassen | Nur für Dev: Middleware lässt alles durch |

**Ohne Token erlaubt:** `/health`, `/metrics`, `/docs`, `/redoc`, `/openapi.json`, `/ws/dashboard`, `/ws/*`.

---

## REST unter `/api/...`

| Prefix | Inhalt |
|--------|--------|
| `/api/agents` | Agenten |
| `/api/tasks` | Aufgaben |
| `/api/models` | Modelle |
| `/api/prompts` | Prompts |
| `/api/automations` | Automationen |
| `/api/jarvis` | Jarvis |

---

## Admin-Dashboard (Next.js) — Env

| Variable | Rolle |
|----------|--------|
| `NEXT_PUBLIC_AIOS_CORE_API_URL` | Öffentliche API-Basis (Client/Server) |
| `NEXT_PUBLIC_WS_URL` | WebSocket-Basis |
| `AIOS_CORE_URL` | Server-only: Proxy zu Core (z. B. Jarvis) |
| `AIOS_TOKEN` | Server-only: `x-aios-token` beim Aufruf des Core |

**Hinweis:** `NEXT_PUBLIC_*` werden beim **Docker-Build** mit `build-args` gesetzt; Runtime-Env in Coolify sollte dieselben Werte tragen, falls ihr ohne Rebuild arbeitet.

---

## 1Password CLI (`op`)

Vault **AIOS**, Item **`Core`** (anlegen mit `tools/op-secrets/setup-vault.sh` oder manuell):

| Feld (Label) | `op://`-Referenz | Verwendung |
|--------------|------------------|------------|
| `aios_token` | `op://AIOS/Core/aios_token` | Core + Dashboard + Coolify |
| `aios_core_url` | `op://AIOS/Core/aios_core_url` | z. B. `http://nexus-core:8000` |
| `next_public_aios_core_api_url` | `op://AIOS/Core/next_public_aios_core_api_url` | öffentliche API-URL |
| `next_public_ws_url` | `op://AIOS/Core/next_public_ws_url` | öffentliche WS-URL |
| `postgres_password` | `op://AIOS/Core/postgres_password` | laut `env.op.all` |
| `jwt_secret` | `op://AIOS/Core/jwt_secret` | … |
| `dashboard_api_key` | `op://AIOS/Core/dashboard_api_key` | … |

**Lokal injizieren:**

```bash
cd ~/projects/aios
op run --env-file=tools/op-secrets/env.op.all -- <dein-befehl>
```

(Einzelwert lesen: `op read op://AIOS/Core/aios_token` — Ausgabe nicht loggen/teilen.)

**Wichtig:** `postgres_password` / `jwt_secret` / `dashboard_api_key` im Item **Core** müssen zu eurer **echten** Prod-Umgebung passen; bei Neu-Anlage wurden ggf. Platzhalter-Zufallswerte gesetzt — in der 1Password-App gegen Hetzner/Coolify-DB abgleichen.

---

## Coolify (Prod-Deploy)

- **nexus-core:** Image `ghcr.io/timo-goetz-ai/nexus-core`, Env mindestens `DATABASE_URL`, `REDIS_URL`, **`AIOS_TOKEN`** (gleicher Wert wie im 1Password-Feld `aios_token`).
- **admin-dashboard:** `NEXT_PUBLIC_AIOS_CORE_API_URL`, `NEXT_PUBLIC_WS_URL`, **`AIOS_CORE_URL`**, **`AIOS_TOKEN`**.

Workflow **Deploy – Production** patcht diese Keys per API, sofern 1Password-Service-Account die `op://AIOS/Core/...`-Referenzen auflösen kann.

---

## Crew API (Abgrenzung)

| Service | Pfad | Rolle |
|---------|------|--------|
| **Nexus Core** | `services/nexus-core` | Orchestrierung, Jarvis, Metrics |
| **Crew API** | `services/crew-api` | eigener Dienst, nicht CrewAI-Framework |

---

*Aktualisiert: 1Password-Item „Core“, Entfernung NEXUS-Legacy im Code, Coolify-Env-Patches im Deploy-Workflow.*

## Kanonische 1Password-Items (CI / `env.op.all`)

| Item | Zweck |
|------|--------|
| `Coolify` | `url`, `token`, `nexus_core_uuid`, `dashboard_uuid`, `coder_agent_uuid` |
| `NocoDB` | `url`, `api_key`, `db_password`, MCP-Tabellen-IDs |
| `N8N` | `url`, `api_key`, `encryption_key`, `db_password` |
| `AI-APIs` | `anthropic_api_key`, `openai_api_key`, `openrouter_api_key` |
| `Core` | Postgres/JWT/Dashboard + AIOS Token/URLs |
| `Cloudflare-API` | `email`, `api_token`, `api_key`, `account_id` (eigenes API-Credential-Item; das Login-Item **Cloudflare** wird wegen SSO nicht per CLI geändert) |
| `GITHUB` | PAT im Feld **`password`** (`op://AIOS/GITHUB/password`) |

**Wiederholen / nachziehen:** `tools/op-secrets/sync-vault-canonical.sh` (nach `op signin`).

