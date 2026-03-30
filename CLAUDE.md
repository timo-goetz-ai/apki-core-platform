# AIOS (ai-os) — Claude Code Intelligence Layer
<!-- Äquivalent zu .cursorrules — wird bei JEDER Session automatisch geladen -->

Monorepo für **Automation+KI / AIOS**: Orchestrierung, Admin-UI, APIs und Landing — betrieben auf **Hetzner** über **Coolify**, Builds über **GitHub Actions** und **Docker**.

## Architektur (Kern-Services)

| Bereich | Pfad / Rolle |
|--------|----------------|
| **Admin-Dashboard** | `services/admin-dashboard` — Next.js 14, App Router, Operations-UI (Agentic OS), API-Integrationen (NocoDB, n8n, …) |
| **Landing Page** | `services/landing-page` — Öffentliche Website |
| **Crew API** | `services/crew-api` — Python-API (siehe CI-/Docker-Context) |
| **AIOS Core** | `services/aios-core` — Python-Kern-API, DB-Migrationen (Alembic im Deploy-Workflow) |

Weitere Infrastruktur- und MCP-Details: `infra/`, `infrastructure/`, `infra/services.json`.

## Deployment-Pipeline

1. **Push** nach `main` auf `git@github.com:TimoGoetz1988/aios.git`
2. **GitHub Actions** — Workflow **Build & Push – Docker Images** (`.github/workflows/build-and-push.yml`): baut u. a. Images für `admin-dashboard`, `aios-core`, `crew-api`, `landing-page` → **ghcr.io** (`ghcr.io/timogoetz1988/…`).
3. **Coolify** zieht die neuen Images und rollt die Anwendungen auf dem **Hetzner**-Host aus.
4. **Einzel-Deploys / Checks**: zusätzliche Workflows unter `.github/workflows/` (z. B. `deploy-prod.yml`, `ci.yml`).

**Regel:** Bevor du Code deployest oder einen Push als „fertig“ behandelst, prüfe **immer**, dass der **Build lokal** (mindestens für den betroffenen Service) **fehlerfrei** durchläuft — für das Admin-Dashboard: `cd services/admin-dashboard && npm run build`.

## Externe Systeme & URLs

| System | Erreichbarkeit |
|--------|----------------|
| **n8n** | `http://10.0.1.12:5678` intern / `https://n8n.automation-plus-ki.de` öffentlich |
| **NocoDB** | `http://10.0.1.20:8080` intern / `https://nocodb.automation-plus-ki.de` öffentlich |

## Umgebungsvariablen (Coolify)

Secrets und env-spezifische Werte werden **in Coolify** pro Anwendung/Stack gesetzt (nicht im Repo committen). Typische Kategorien:

- **Next.js / Admin-Dashboard**: URLs und API-Keys für NocoDB, n8n, Authentik-OIDC, interne Service-URLs, ggf. Grafana/Prometheus-Endpoints — jeweils in der Coolify-Ressource für `infra-dashboard` / Admin-Service konfigurieren.
- **Python-Services** (`aios-core`, `crew-api`): DB-URLs, API-Keys, CORS, Service-Discovery — analog in den jeweiligen Coolify-Services.

Für lokale Entwicklung: `.env.example`-Dateien im Repo beachten (falls vorhanden) und nur **nicht-sensible** Defaults dokumentieren.

## n8n-Workflow-Konvention (Layer-Struktur)

Workflows nach Layer gruppiert:

| Layer | Präfix | Zweck |
|-------|--------|-------|
| INGEST | `100–199` | Daten-Eingang (Webhook, Mobile, Obsidian) |
| BRAIN | `200–299` | KI-Kern, Routing, Logging, Discovery |
| RESEARCH | `300–399` | Trend, Sentiment, Content-Chancen (Gemini direct) |
| CONTENT | `400–499` | Pipeline, TTS, Templates, Digest |
| HUMAN | `500–599` | Telegram, Approvals, Trigger, Reports |

So bleiben Exporte, Doku und Dashboard-Zuordnung konsistent.

**Strategische Phasen (10 / 20 / 30):** Roadmap- und Management-Ebene **zusätzlich** zu den 100er-Layern. **n8n-Workflow-Namen** sind kanonisch **`{ZehnerLayer}_{NNN}_…`** (z. B. `30_310_TREND_MONITOR`, `40_450_CONTENT_MASTER_FLOW_v2`) — Mapping und Regeln: `docs/operations/N8N_WORKFLOW_RENAME_MAP.md`, Architektur: `docs/architecture/N8N_STRATEGISCHE_PHASEN.md`. In NocoDB kann `agents` optional **Phase** (`10`|`20`|`30`) neben **Layer** führen.


## Claude Code / Workspace

- Globale Einstellungen: `~/.claude/settings.json` (Hooks, Permissions, Plugins)
- Projekt overrides: `projects/ai-os/.claude/settings.json` bzw. `.claude/settings.local.json`
- Slash-Commands: `~/.claude/commands/*.md`
- **Service-spezifisch:** `services/admin-dashboard/CLAUDE.md` für Next.js- und UI-Konventionen

## Operative Checkliste (kurz)

1. Änderung im richtigen Service vornehmen.
2. **Build** des betroffenen Service lokal verifizieren (Next: `npm run build`).
3. Commit & Push → Actions beobachten → Coolify/HTTP-Health prüfen.
4. Bei Automation-Änderungen: n8n-Workflow-Namen/Präfixe und NocoDB-Ziele mit dieser Konvention abgleichen.

---

## Interne Service-URLs & API-Zugänge

| Service | URL | Auth |
|---------|-----|------|
| n8n | `http://10.0.1.16:5678` (intern) | `X-N8N-API-KEY: n8n_api_191d56c7f262a4c859c0f77e6a5ee1115480fbd31d687b07` |
| NocoDB | `http://10.0.1.20:8080` (intern) / `https://nocodb.automation-plus-ki.de` | `xc-token: WeWyMvo8QUyzl9LLIZKawX3VxlO8AVC1sWzEJqsK` |
| Grafana | `https://grafana.automation-plus-ki.de` | Bearer Token in Coolify |
| Prometheus | `http://10.0.1.15:9090` | kein Auth intern |
| Coolify | `https://coolify.automation-plus-ki.de` | Bearer in Coolify |
| Admin-Dashboard | `https://admin.automation-plus-ki.de` | Authentik OIDC |
| Mobile-Ingest (n8n) | `https://n8n.automation-plus-ki.de/webhook/mobile-ingest` | Header `x-aios-token` — nur Coolify/1Password; siehe `docs/operations/MOBILE_INGEST_N8N.md` |

**NocoDB Base-ID (neu):** `pmox01979j55xbd`
**NocoDB Login:** `ai_studio@timo-goetz-ai.de` / `NocoDB2026Admin`
**n8n Login:** `admin@timo-goetz-ai.de` / `Aios2026!`

## Authentik SSO — OAuth2 Provider (Stand 2026-03-27)

Authentik: `https://auth.automation-plus-ki.de` | Admin: `akadmin` / `ai_studio@timo-goetz-ai.de`
API-Token (akadmin): `25ePGtroeI1neB1n9OvKeKI1v6ojRg3InQFabXszrat9N6xnKzjw1lZMP2Lk`

| Service | client_id | Typ |
|---------|-----------|-----|
| n8n | `KiVQUem542T047KvDduDXjloaQYLF3dFd0X7ZNEa` | Forward Auth |
| Admin Dashboard | `nstQ0xU5RXyNq35liCqRe6wnHfJIIPsLWSfdN7qf` | Forward Auth |
| AIOS Dashboard | `pMrUHmcAbP95cd2Ev1hV72kv8MOrZ7MHDsTF3EUQ` | Forward Auth |
| Grafana | `rAERcNo8Fk7ZEOuFkMEX6pcMCfk4eRy6X5lIAUml` | Proxy Auth |
| NocoDB | `V0HDsDvI0MYBpqcHvdp0ueO7Do7UwsNL0JEVp8tD` | Forward Auth |
| Coolify | `yTBQgGHqRE94QNeOiSjMnYxcDTxgNcTlCV6GTDVH` | Forward Auth |
| Postiz | `1srfgfgKwaYyw6WlvyNYK7Zp1pb5IaIB1d52qXKy` | Forward Auth |
| Prometheus | `o0ccmAtRQVchiXDCWMorsbgiQkhpza9BLgDukaPV` | Forward Auth |

Outpost: `c2904edf-8e53-4a02-8345-b0e32e2d999e` (Embedded, alle 10 Provider aktiv)

## NocoDB Table-IDs

| Tabelle | ID | Beschreibung |
|---------|-----|--------------|
| workflows | `mfz43ghxesvn1yy` | n8n-Workflow-Register |
| trends | `mrdi13quucpnps4` | Output: `30_310_TREND_MONITOR` |
| sentiment | `mvb46y3ncw21m1g` | Output: `30_320_SENTIMENT_TRACKER` |
| content_opportunities | `m5abfrtfyr2j912` | Output: `30_330_CONTENT_OPPORTUNITY` |
| content_pipeline | `mgjsuwl4jwlyhdc` | Content-Produktion |
| prompts | `mlw20rrihtkbmew` | Prompt-Bibliothek |
| agents | `m8c0rpjwx5d4bu2` | KI-Agenten-Register |
| tasks | `mjd39ltx4bq27qj` | Agent-Aufgaben |
| batch_jobs | `mg4p0eux8onz3nq` | Batch-Produktions-Jobs |
| content_versions | `mzzemannneaes9g` | Content-Versionierung |
| media_assets | `msxl4hvogh62u4u` | Medien-Assets (Bilder, Audio, Video) |
| publish_log | `mcwxjf0na0ixkah` | Publishing-Protokoll (Social/Blog) |
| mobile_ingest | `m3sn5vn7x9iye25` | Mobile Eingabe / Handy-Uploads |
| content_pieces | `mm1ssn0luruhzyx` | KI-generierte Content-Pieces (crew-api Output) |
| fabrik_snapshots | `mx6wt60oh2050du` | Fabrik-Index / Qdrant-Metadaten (Extended-Spalten) |
| audit_trail | `mgeh1epw96tgx3u` | Audit-Log aller Workflow-Aktionen |

## n8n Workflow-IDs (wichtigste)

| Workflow | ID | Zeitplan |
|----------|-----|---------|
| `30_310_TREND_MONITOR` | `QXMKnvar7vGceevY` | tägl. 08:00 — **AKTIV** |
| `30_320_SENTIMENT_TRACKER` | `bycPphxXy3Crhx4h` | Mo. 08:00 — **AKTIV** |
| `30_330_CONTENT_OPPORTUNITY` | `WBi8X5LhT0lrh0Wn` | tägl. 09:30 — **AKTIV** |
| `40_430_DAILY_DIGEST` | `b1uFH47VF0RcahVS` | tägl. 08:00 — **AKTIV** |
| `40_435_WEEKLY_SUMMARY` | `DQWIR7s5zaGRqNX2` | Mo. 09:00 — **AKTIV** |
| `50_540_TELEGRAM_ASSISTANT` | `uDiIZ5Fm2npk1bOW` | on_demand — webhook: `/webhook/tg-assistant` |
| `40_450_CONTENT_MASTER_FLOW_v2` | `j4DqKVd9N2U1AEGy` | on_demand — webhook: `/webhook/content-master` — **AKTIV** |

**AI-Modell in Research-Workflows:** `gemini-2.0-flash` (direkt via Gemini API, KEIN OpenRouter)
**Gemini API Key:** in n8n Container-Env als `GEMINI_API_KEY`

## Admin-Dashboard Code-Konventionen

**Design-Tokens (CSS-Variablen):**
```css
--layer-0 bis --layer-3   /* Hintergrund-Ebenen */
--text-primary/secondary/muted
--accent-blue/green/red/amber
--border, --border-bright
--font-ui, --font-mono
```

**Utility-Libs (bereits vorhanden, importieren statt neu bauen):**
```typescript
import { toast } from '@/lib/toast-store'          // toast.success/error/info/warning()
import { exportCsv } from '@/lib/csv-export'        // exportCsv('file.csv', rows)
```

**API-Route-Muster:**
```
GET /api/nocodb/table?id=TABLE_ID&limit=100
GET /api/nocodb/agents
GET /api/services                    // Service-Health
GET /api/monitoring/alerts           // Prometheus + Grafana Alerts
POST /api/n8n/trigger/[workflowId]
```

**Häufige Build-Fallen:**
- `react/jsx-key`: JSX in Array-Literal → `.map()` mit `key`-Prop verwenden
- Picsart: max Bildgröße 1024×1024 (nicht 1920×1080)
- Stale `.next` Cache: `rm -rf .next` → neu bauen

## Git: SSH-Commit-Signatur (1Password)

- Global: `gpg.format=ssh`, `gpg.ssh.program` → `op-ssh-sign`, `commit.gpgsign=true`, `gpg.ssh.allowedSignersFile` → `~/.ssh/git_allowed_signers`.
- **Wichtig:** Existiert `~/.config/1Password/ssh/agent.toml` nur mit Vault `Persönlich`, werden Keys in anderen Vaults **nicht** angeboten → Agent wirkt „leer“. Vaults `01_PERSONAL` (u. a. „I Mac Home“) und ggf. `05_INFRASTRUCTURE` in `[[ssh-keys]]` eintragen (siehe [Agent-Config](https://developer.1password.com/docs/ssh/agent/config)).
- Shell: `SSH_AUTH_SOCK` zeigt auf den 1Password-Socket (in `~/.zshrc` gesetzt, wenn der Socket existiert).
- Check: `~/projects/ai-os/scripts/verify-1password-ssh-agent.sh` oder `ssh-add -l` mit demselben `SSH_AUTH_SOCK`.
- Signatur prüfen: `git show --show-signature -s HEAD`.
- **Hinweis:** `op-ssh-sign` kann in nicht-interaktiven Umgebungen scheitern, bis 1Password/Freigabe (Touch ID) einmal bestätigt wurde — Commits ggf. im Terminal ausführen.
- **GitHub-Push:** Wenn `git push` mit „agent refused operation“ scheitert, temporär Datei-Key nutzen: `GIT_SSH_COMMAND='ssh -o IdentitiesOnly=yes -o IdentityAgent=none -i ~/.ssh/id_ed25519' git push` (nur wenn der Schlüssel zu GitHub passt).

- **Dieses Repo (`ai-os`):** Einmalig `git config --local gpg.ssh.program ssh-keygen` — dann reicht `git commit` ohne `-c …` und ohne `op-ssh-sign` (Schlüssel vorher mit `ssh-add ~/.ssh/id_ed25519` oder laufender Agent). Platzhalter in Anleitungen: `<dateien>` = echte Pfade oder `git add -A`.

## Verfügbare Slash-Commands

Folgende Commands sind unter `~/.claude/commands/` definiert:

| Command | Funktion |
|---------|----------|
| `/deploy` | Push + Coolify-Deploy auslösen |
| `/fix-build` | Build-Fehler im admin-dashboard beheben |
| `/mcp-status` | Alle MCP-Server prüfen |
| `/mcp-health` | Health-Check aller MCP-Verbindungen |
| `/n8n-status` | n8n Workflow-Status anzeigen |
| `/nocodb-check` | Research-Output-Tabellen prüfen |
| `/trends` | Aktuelle Trend-Daten aus NocoDB anzeigen |
| `/research-check` | Research-Workflow-Outputs + n8n-Status |
| `/content-gen` | Content aus Trend-Daten generieren |

## Agents (Spezialisierte Subagenten)

Subagenten-Definitionen in `.claude/agents/`:
- `research-monitor.md` — Prüft NocoDB Research-Outputs + n8n Workflow-Status
- `build-guard.md` — Prüft TypeScript/ESLint vor Push
- `deployment-checker.md` — Verfolgt Coolify-Deploys bis zur Gesundheitsprüfung

## Verhaltensregeln (nicht verhandelbar)

1. **Vor Edits:** Datei immer zuerst lesen (`Read`-Tool)
2. **Vor Push:** `npm run build` muss fehlerfrei sein
3. **Irreversible Aktionen** (DB-Drop, Force-Push, Service-Restart): erst bestätigen lassen
4. **Dry-Run-Prinzip:** Zeige was passiert, dann ausführen
5. **Keine Abstraktion:** Einfachste Lösung, keine Overengineering
6. **Preview nach Frontend-Edits:** Immer `preview_screenshot` zur Verifikation
7. **Secrets nie committen:** .env, API-Keys, Tokens nur in Coolify

## Offene Aufgaben (Stand März 2026)

- `agents`-Tabelle leer → manuell befüllen oder `20_240_AIOS_DISCOVERY` aktivieren
- Publishing Layer (`440_*` / `41_*` Workflows) wartet auf Blogify-Credentials (`BLOGIFY_CLIENT_ID`, `BLOGIFY_CLIENT_SECRET`, `BLOGIFY_INTEGRATION_ID`)
- Research-Tabellen füllen sich täglich ab 08:00 / 09:30 Uhr (Schedules aktiv)
- n8n interne IP: `10.0.1.16:5678` (Container: `homestack-n8n`)
