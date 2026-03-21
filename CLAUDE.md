# AIOS (ai-os) — Claude Code Intelligence Layer
<!-- Äquivalent zu .cursorrules — wird bei JEDER Session automatisch geladen -->

Monorepo für **Automation+KI / AIOS**: Orchestrierung, Admin-UI, APIs und Landing — betrieben auf **Hetzner** über **Coolify**, Builds über **GitHub Actions** und **Docker**.

## Architektur (Kern-Services)

| Bereich | Pfad / Rolle |
|--------|----------------|
| **Admin-Dashboard** | `services/admin-dashboard` — Next.js 14, App Router, Operations-UI (Agentic OS), API-Integrationen (NocoDB, n8n, …) |
| **Landing Page** | `services/landing-page` — Öffentliche Website |
| **Crew API** | `services/crew-api` — Python-API (siehe CI-/Docker-Context) |
| **Nexus Core** | `services/nexus-core` — Python-Kern-API, DB-Migrationen (Alembic im Deploy-Workflow) |

Weitere Infrastruktur- und MCP-Details: `infra/`, `infrastructure/`, `infra/services.json`.

## Deployment-Pipeline

1. **Push** nach `main` auf `git@github.com:TimoGoetz1988/aios.git`
2. **GitHub Actions** — Workflow **Build & Push – Docker Images** (`.github/workflows/build-and-push.yml`): baut u. a. Images für `admin-dashboard`, `nexus-core`, `crew-api`, `landing-page` → **ghcr.io** (`ghcr.io/timogoetz1988/…`).
3. **Coolify** zieht die neuen Images und rollt die Anwendungen auf dem **Hetzner**-Host aus.
4. **Einzel-Deploys / Checks**: zusätzliche Workflows unter `.github/workflows/` (z. B. `deploy-prod.yml`, `ci.yml`).

**Regel:** Bevor du Code deployest oder einen Push als „fertig“ behandelst, prüfe **immer**, dass der **Build lokal** (mindestens für den betroffenen Service) **fehlerfrei** durchläuft — für das Admin-Dashboard: `cd services/admin-dashboard && npm run build`.

## Externe Systeme & URLs

| System | Erreichbarkeit |
|--------|----------------|
| **n8n** | Instanz im internen Netz: `http://10.0.1.29:5678` (Workflows triggern/API je nach Setup) |
| **NocoDB** | `https://nocodb.automation-plus-ki.de` — zentrale Tabellen/Research-Outputs |

## Umgebungsvariablen (Coolify)

Secrets und env-spezifische Werte werden **in Coolify** pro Anwendung/Stack gesetzt (nicht im Repo committen). Typische Kategorien:

- **Next.js / Admin-Dashboard**: URLs und API-Keys für NocoDB, n8n, Authentik-OIDC, interne Service-URLs, ggf. Grafana/Prometheus-Endpoints — jeweils in der Coolify-Ressource für `infra-dashboard` / Admin-Service konfigurieren.
- **Python-Services** (`nexus-core`, `crew-api`): DB-URLs, API-Keys, CORS, Service-Discovery — analog in den jeweiligen Coolify-Services.

Für lokale Entwicklung: `.env.example`-Dateien im Repo beachten (falls vorhanden) und nur **nicht-sensible** Defaults dokumentieren.

## n8n-Workflow-Konvention (Präfixe)

Workflows nach Zweck gruppieren, z. B.:

- `11_` — Trend
- `12_` — Sentiment
- `13_` — Content  
(Nachfolgende Nummern/Kategorien analog fortsetzen.)

So bleiben Exporte, Doku und Dashboard-Zuordnung konsistent.

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
| n8n | `http://10.0.1.29:5678` | `X-N8N-API-KEY: op://03_INFRA_AUTO/Homestack - Service Credentials/N8N_API_KEY_AGENT_PLATFORM` |
| NocoDB | `https://nocodb.automation-plus-ki.de` | `xc-token: op://03_INFRA_AUTO/Homestack - Service Credentials/NOCODB_API_TOKEN_MAIN` |
| Grafana | `https://grafana.automation-plus-ki.de` | Bearer Token in Coolify |
| Prometheus | `http://10.0.1.29:9090` | kein Auth intern |
| Coolify | `https://coolify.automation-plus-ki.de` | Bearer in Coolify |
| Admin-Dashboard | `https://admin.automation-plus-ki.de` | Authentik OIDC |

**NocoDB Projekt-ID:** `pfx0ca6docorj8n`

## NocoDB Table-IDs (Research-Outputs)

| Tabelle | ID | Beschreibung |
|---------|-----|--------------|
| workflows | `mnwlsxsm0q1k2d2` | n8n-Workflow-Register |
| trends | `m91y1ifz2aop1ef` | Output: `11_TREND_MONITOR` |
| sentiment | `moigzpvd4yw1d0a` | Output: `12_SENTIMENT_TRACKER` |
| content_opportunities | `m7ehbmbi5t2w0dw` | Output: `13_CONTENT_OPPORTUNITY` |
| content_pipeline | `m48nvpornrxuba9` | Content-Produktion |
| prompts | `mijlvsujsgqa92m` | Prompt-Bibliothek |

## n8n Workflow-IDs (wichtigste)

| Workflow | ID | Zeitplan |
|----------|-----|---------|
| `11_TREND_MONITOR` | `fEYWN4pWhRcG2tLg` | tägl. 07:00 |
| `12_SENTIMENT_TRACKER` | `Vx1Aea5glbogJxg6` | alle 4h |
| `13_CONTENT_OPPORTUNITY` | `I6LcxlyMM8TU7A7V` | tägl. |

**OpenRouter-Modell in Research-Workflows:** `google/gemini-2.0-flash:free`
(NICHT `gemini-2.0-flash-exp:free` — wurde von OpenRouter entfernt)

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

- `agents`-Tabelle leer → manuell befüllen oder `52_AIOS_DISCOVERY` aktivieren
- `60_DAILY_DIGEST` + `61_WEEKLY_SUMMARY` noch auf INAKTIV
- Publishing Layer (`40_*` Workflows) wartet auf Blogify-Credentials
- Research-Tabellen füllen sich ab nächstem geplanten Workflow-Lauf
