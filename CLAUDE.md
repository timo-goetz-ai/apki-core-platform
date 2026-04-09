# AIOS (ai-os) — Claude Code Intelligence Layer
<!-- Äquivalent zu .cursorrules — wird bei JEDER Session automatisch geladen -->

Monorepo für **Automation+KI / AIOS**: Orchestrierung, Admin-UI, APIs und Landing — betrieben auf **Hetzner** über **Coolify**, Builds über **GitHub Actions** und **Docker**.

**Persona (Agenten, ohne PII im Repo):** [`content/personas/timo-goetz.agent-persona.yaml`](content/personas/timo-goetz.agent-persona.yaml) — `persona_ref: timo-goetz`. Vollständiger Lebenslauf / Kontaktdaten: nur `content/personas/private/` (gitignored).

## Architektur (Kern-Services)

| Bereich | Pfad / Rolle |
|--------|----------------|
| **Admin-Dashboard** | `services/admin-dashboard` — Next.js 14, App Router, Operations-UI (Agentic OS), API-Integrationen (Supabase, n8n, …) |
| **Landing Page** | `services/landing-page` — Öffentliche Website |
| **Crew API** | `services/crew-api` — Python-API (siehe CI-/Docker-Context) |
| **AIOS Core** | `services/aios-core` — Python-Kern-API, DB-Migrationen (Alembic im Deploy-Workflow) |

Weitere Infrastruktur- und MCP-Details: `infra/`, `infrastructure/`, `infra/services.json`.

## Deployment-Pipeline

1. **Push** nach `main` auf `git@github.com:timo-goetz-ai/core-platform.git` (ehem. `TimoGoetz1988/aios`)
2. **GitHub Actions** — Workflow **Build & Push – Docker Images** (`.github/workflows/build-and-push.yml`): baut u. a. Images für `admin-dashboard`, `aios-core`, `crew-api`, `landing-page` → **ghcr.io** (`ghcr.io/timo-goetz-ai/…`).
3. **Coolify** zieht die neuen Images und rollt die Anwendungen auf dem **Hetzner**-Host aus.
4. **Einzel-Deploys / Checks**: zusätzliche Workflows unter `.github/workflows/` (z. B. `deploy-prod.yml`, `ci.yml`).

**Regel:** Bevor du Code deployest oder einen Push als „fertig“ behandelst, prüfe **immer**, dass der **Build lokal** (mindestens für den betroffenen Service) **fehlerfrei** durchläuft — für das Admin-Dashboard: `cd services/admin-dashboard && npm run build`.

## Externe Systeme & URLs

| System | Erreichbarkeit |
|--------|----------------|
| **n8n** | `http://10.0.1.12:5678` intern / `https://n8n.automation-plus-ki.de` öffentlich |
| **Supabase** | `https://supabase.automation-plus-ki.de` (PostgREST + Studio, self-hosted) |

## Umgebungsvariablen (Coolify)

Secrets und env-spezifische Werte werden **in Coolify** pro Anwendung/Stack gesetzt (nicht im Repo committen). Typische Kategorien:

- **Next.js / Admin-Dashboard**: `SUPABASE_URL`, `SUPABASE_SERVICE_KEY`, `SUPABASE_ANON_KEY`, n8n, Authentik-OIDC, interne Service-URLs (Grafana/Prometheus über Docker-Hostnamen) — jeweils in der Coolify-Ressource für `infra-dashboard` konfigurieren.
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
- Projekt overrides: `projects/aios/.claude/settings.json` bzw. `.claude/settings.local.json`
- Slash-Commands: `~/.claude/commands/*.md`
- **Service-spezifisch:** `services/admin-dashboard/CLAUDE.md` für Next.js- und UI-Konventionen

## Operative Checkliste (kurz)

1. Änderung im richtigen Service vornehmen.
2. **Build** des betroffenen Service lokal verifizieren (Next: `npm run build`).
3. Commit & Push → Actions beobachten → Coolify/HTTP-Health prüfen.
4. Bei Automation-Änderungen: n8n-Workflow-Namen/Präfixe und NocoDB-Ziele mit dieser Konvention abgleichen.

---

## Interne Service-URLs & API-Zugänge

> ⚠️ **Keine Credentials hier eintragen — alle Tokens/Passwörter ausschließlich in 1Password Vault `05_INFRASTRUCTURE`**

| Service | URL | Auth (Quelle) |
|---------|-----|------|
| n8n | `http://10.0.1.16:5678` (intern) | `X-N8N-API-KEY` → 1Password: `05_INFRASTRUCTURE > n8n API Key` |
| Supabase | `https://supabase.automation-plus-ki.de` | service_role key → 1Password: `05_INFRASTRUCTURE > Supabase - AIOS Self-Hosted` |
| NocoDB (legacy) | `https://nocodb.automation-plus-ki.de` (gestoppt, Daten in PG `nocodb` DB als Backup) | xc-token → 1Password: `05_INFRASTRUCTURE > NocoDB Token` |
| Grafana | `https://grafana.automation-plus-ki.de` | Bearer Token → Coolify Env |
| Prometheus | `http://10.0.1.15:9090` | kein Auth intern |
| Coolify | `https://coolify.automation-plus-ki.de` | Bearer → 1Password: `05_INFRASTRUCTURE > Coolify API Token` |
| Admin-Dashboard | `https://admin.automation-plus-ki.de` | Authentik OIDC |
| Mobile-Ingest (n8n) | `https://n8n.automation-plus-ki.de/webhook/mobile-ingest` | `x-aios-token` → 1Password: `05_INFRASTRUCTURE`; siehe `docs/operations/MOBILE_INGEST_N8N.md` |

**Directus Login:** `ai_studio@timo-goetz-ai.de` — Passwort → 1Password: `05_INFRASTRUCTURE > Directus Login`
**NocoDB (legacy):** Coolify App `sow4k0go0swkssgokk84wwwg` — gestoppt, PG-Daten erhalten. Base-ID war `pfx0ca6docorj8n`.
**n8n Login:** `admin@timo-goetz-ai.de` — Passwort → 1Password: `05_INFRASTRUCTURE > n8n Login`

## Authentik SSO — OAuth2 Provider (Stand 2026-04-04)

Authentik: `https://auth.automation-plus-ki.de` | Admin: `akadmin` / `ai_studio@timo-goetz-ai.de`
API-Token (akadmin): → 1Password: `05_INFRASTRUCTURE > Authentik API Token`

| Service | client_id | Typ |
|---------|-----------|-----|
| n8n | `KiVQUem542T047KvDduDXjloaQYLF3dFd0X7ZNEa` | Forward Auth |
| Admin Dashboard | `nstQ0xU5RXyNq35liCqRe6wnHfJIIPsLWSfdN7qf` | Forward Auth |
| AIOS Dashboard | `pMrUHmcAbP95cd2Ev1hV72kv8MOrZ7MHDsTF3EUQ` | Forward Auth |
| Grafana | `rAERcNo8Fk7ZEOuFkMEX6pcMCfk4eRy6X5lIAUml` | Proxy Auth |
| NocoDB | via Homestack Forward Auth (forward_domain) | Forward Auth (inline Traefik, API-Pfade ausgenommen) |
| Coolify | `yTBQgGHqRE94QNeOiSjMnYxcDTxgNcTlCV6GTDVH` | Forward Auth |
| Postiz | via Homestack Forward Auth (forward_domain) | Forward Auth |
| Prometheus | `o0ccmAtRQVchiXDCWMorsbgiQkhpza9BLgDukaPV` | Forward Auth |

Outpost: `382e87cd-20e3-444f-ad62-97b0b2edc5a8` (Embedded, Provider: Homestack Forward Auth pk=19, NocoDB Forward Auth pk=25)

## Directus Collections (ehem. NocoDB)

Zugriff via Directus REST: `GET /items/{collection_name}` oder GraphQL: `POST /graphql`

| Tabelle | ID | Beschreibung |
|---------|-----|--------------|
| 100_workflows | `mnwlsxsm0q1k2d2` | n8n-Workflow-Register |
| 110_agents | `mjdp54ldeoxlb8s` | KI-Agenten-Register |
| 120_subagents | `m6kwm1cedzeou6w` | Sub-Agenten |
| 130_agent_runs | `m0245soubmzha5r` | Agent-Ausführungen |
| 200_prompts | `mijlvsujsgqa92m` | Prompt-Bibliothek |
| 210_rules | `mcn1qpaapk5x849` | Regeln |
| 220_skills | `mdkwfxgjg80tgjd` | Skills |
| 230_hooks | `mgnxselg5bkglr8` | Hooks |
| 240_mcp_configs | `m128afvs767oxqa` | MCP-Konfigurationen |
| 250_plugins | `mbt77n1toqpa094` | Plugins |
| 260_cursor_configs | `mzzgzfzgatrauwy` | Cursor-Konfigurationen |
| 300_trends | `m91y1ifz2aop1ef` | Output: `30_310_TREND_MONITOR` |
| 310_sentiment | `moigzpvd4yw1d0a` | Output: `30_320_SENTIMENT_TRACKER` |
| 320_content_opportunities | `m7ehbmbi5t2w0dw` | Output: `30_330_CONTENT_OPPORTUNITY` |
| 330_knowledge_items | `m9hgs3y3iz9xtgl` | Wissens-Items |
| 340_regulatory | `mzed73lf80jgygt` | Regulatorisches |
| 350_tools | `m1dtcwceeejaupb` | Tools |
| 360_social_proof | `mvbndkze3r4yce5` | Social Proof |
| 400_content_pipeline | `m48nvpornrxuba9` | Content-Produktion |
| 410_templates | `mlmvyh28wyf9zxu` | Templates |
| 420_media_assets | `m2u6y7ibyxt9tzp` | Medien-Assets (Bilder, Audio, Video) |
| 430_brand_identity | `me37a6o966k1dnr` | Brand Identity |
| 440_publish_log | `mpe25xaikbpr0wj` | Publishing-Protokoll (Social/Blog) |
| 500_clients | `mxfirejid6z3h5g` | Kunden/Leads |
| 510_tasks | `mrt4iah96z7za7t` | Agent-Aufgaben |
| 520_mobile_ingest | `m6e0i80gmudaerl` | Mobile Eingabe / Handy-Uploads |

## n8n Workflow-IDs (wichtigste)

| Workflow | ID | Zeitplan |
|----------|-----|---------|
| `17_020_AI — Trend Monitor` | `fEYWN4pWhRcG2tLg` | tägl. 08:00 — **AKTIV** |
| `17_030_AI — Sentiment Tracker` | `Vx1Aea5glbogJxg6` | Mo. 08:00 — **AKTIV** |
| `17_040_AI — Content Opportunity` | `I6LcxlyMM8TU7A7V` | tägl. 09:30 — **AKTIV** |
| `02_010_REPORT — Daily Digest` | `zb9g2zj7SKptuBRq` | tägl. 08:00 — **AKTIV** |
| `02_020_REPORT — Weekly Summary` | `xxBJQVAd3CSB8ytc` | Mo. 09:00 — **AKTIV** |
| `06_010_CONTENT — Content Pipeline` | `4jCqinBKiFKJmdor` | on_demand — **AKTIV** |

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
GET /api/nocodb/agents               // via Supabase PostgREST (nocodb.ts als Wrapper)
GET /api/services                    // Service-Health (interne Docker-Hostnamen!)
GET /api/monitoring/alerts           // Prometheus + Grafana (intern: homestack-prometheus:9090, homestack-grafana:3000)
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
- Check: `~/projects/aios/scripts/verify-1password-ssh-agent.sh` oder `ssh-add -l` mit demselben `SSH_AUTH_SOCK`.
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

## Gotchas & Learnings

- **Authentik Forward Auth**: `forward_single` verursacht Redirect-Loops → `forward_domain` (Homestack) nutzen
- **Authentik + API-Pfade**: Services mit eigener Auth brauchen separaten Traefik-Router (höhere Priorität) OHNE ForwardAuth für `/api/`
- **Server-zu-Server Calls**: Immer interne Docker-Hostnamen (`homestack-grafana:3000`, `homestack-prometheus:9090`), NIE externe URLs hinter Authentik
- **Coolify API**: Custom Labels sind base64-encoded; Apps erstellen via `POST /api/v1/applications/dockerimage`; Coolify Token → 1Password: `05_INFRASTRUCTURE > Coolify API Token`
- **Supabase Migration (2026-04-09)**: `nocodb.ts` nutzt jetzt Supabase PostgREST (`SUPABASE_URL` + `SUPABASE_SERVICE_KEY`). Tabellennamen ohne Prefix (z.B. `agents` statt `110_agents`). Alle Consumers blieben unverändert. Directus ist abgeschaltet.
- **Voice Platform** (`voice.automation-plus-ki.de`): OpenAI/Anthropic Keys via OpenRouter (`OPENAI_BASE_URL=https://openrouter.ai/api/v1`)
- **Postiz S3**: Bucket `postiz-aios` auf Hetzner Object Storage, `STORAGE_PROVIDER=s3`
- **1Password**: API-Keys in Vault `05_INFRASTRUCTURE`; `AI-APIs` Item hat OpenRouter-Key
- **Deploy-Reihenfolge**: Erst neues Image deployen, DANN alte Services stoppen — nicht umgekehrt!

## Offene Aufgaben (Stand April 2026)

- `agents`-Tabelle hat 21 Einträge (migriert von NocoDB nach Directus am 2026-04-04)
- NocoDB temporär noch aktiv bis neues Dashboard-Image mit Directus-Code deployed ist → dann endgültig stoppen
- Publishing Layer (`440_*` / `41_*` Workflows) wartet auf Blogify-Credentials
- Research-Tabellen füllen sich täglich ab 08:00 / 09:30 Uhr (Schedules aktiv)
- n8n interne IP: `10.0.1.16:5678` (Container: `homestack-n8n`)
- Voice Platform: `OPENAI_API_KEY` + `ANTHROPIC_API_KEY` fehlen in 1Password (aktuell via OpenRouter)
