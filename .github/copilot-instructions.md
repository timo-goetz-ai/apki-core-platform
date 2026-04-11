# GitHub Copilot Instructions

Diese Datei wird von GitHub Copilot automatisch als Kontext für alle Prompts in diesem Repository gelesen.  
Speichere sie als `.github/copilot-instructions.md` im Root jedes Repos.

---

## Kontext: Wer & Was

**User:** Timo Götz (`ai_studio@timo-goetz-ai.de`)  
**Organisation:** `timo-goetz-ai` auf GitHub  
**Brand:** AI Engineering Services — "Von der Idee bis zur laufenden Produktion — selbst gehostet, datenschutzkonform, skalierbar"  
**Hauptdomain:** `timo-goetz-ai.de` (Firma) + `automation-plus-ki.de` (Infra)  
**Sprache:** Deutsch (informell, per Du) für Kommentare, Commits & PR-Beschreibungen. Englisch für Code, Variablen, API-Responses.  
**Kommunikationsstil:** Kurz, direkt, kein Schnickschnack. Keine Floskeln, keine Füllwörter.

---

## Tech Stack (Default-Entscheidungen)

**Wähle aus diesem Stack, außer das Repo sagt explizit was anderes:**

| Layer | Default |
|-------|---------|
| Frontend | Next.js 15 App Router + TypeScript + Tailwind CSS |
| UI Components | shadcn/ui (falls nicht vorhanden: reine Tailwind) |
| Backend | Next.js Route Handlers ODER FastAPI (Python) für ML/Data |
| Datenbank | Supabase (self-hosted auf `supabase.automation-plus-ki.de`), PostgreSQL 16 |
| Auth | Supabase Auth ODER Authentik Forward Auth (`auth.automation-plus-ki.de`) |
| Cache/Queue | Redis |
| Vector DB | Qdrant (`qdrant.automation-plus-ki.de`) |
| Automation | n8n (self-hosted) |
| LLM Provider | OpenRouter (primär) + Google Gemini (fallback) — **NIE** OpenAI direkt |
| Voice/TTS | FishAudio |
| Deployment | Coolify auf Hetzner CPX42 (`46.224.145.109`) |
| CI/CD | GitHub Actions → GHCR → Coolify Auto-Deploy |
| Container Registry | `ghcr.io/timo-goetz-ai/<repo>:latest` |
| Observability | Prometheus + Grafana + Loki (Homestack) |

---

## Infrastruktur-Regeln (HART)

1. **1Password ist die Source of Truth für alle Secrets.** Niemals Secrets committen, niemals in `.env.example` echte Werte. Platzhalter + Kommentar welcher 1Password-Item-Name gemeint ist.

2. **Keine Secrets in URLs, Logs, Error Messages, Commit Messages.**

3. **Deployment-Pattern:**
   - Code push → GitHub Actions baut Docker Image → pusht zu GHCR → ruft Coolify Deploy API
   - Jedes Repo hat `.github/workflows/build-push.yml`
   - GitHub Secrets: `COOLIFY_URL`, `COOLIFY_TOKEN`, `COOLIFY_APP_UUID`
   - Dockerfile: Multi-Stage Build, Standalone Next.js Output (`output: 'standalone'`)

4. **`NEXT_PUBLIC_*` Variablen werden BEIM BUILD in den JS Bundle gebacken** — nicht Laufzeit. Müssen als `build-args` im Workflow durchgereicht werden, und Cache-Busting via sha256-Hash nicht vergessen.

5. **Coolify App-Config:**
   - Image Source: `ghcr.io/timo-goetz-ai/<repo>:latest`
   - Deployment: `POST /api/v1/deploy?uuid=<uuid>&force=true`

6. **Domains unter `timo-goetz-ai.de` + `automation-plus-ki.de`** via Cloudflare (proxied=true). DNS via Cloudflare API.

7. **Niemals Vercel.** Alles läuft auf Coolify. Vercel-spezifische Features (edge runtime, ISR on-demand) nicht nutzen.

8. **Niemals die `admin@timo-goetz-ai.de` Email nutzen.** Immer `ai_studio@timo-goetz-ai.de` für Services, `timo.goetz1988@gmail.com` für Privatkonten.

---

## Code-Konventionen

**TypeScript/JavaScript:**
- TypeScript strict mode
- Async/await, kein `.then()` Chaining
- Named exports > default exports (außer Next.js Pages/Layouts)
- Zod für Input-Validierung an System-Grenzen (Forms, API Input)
- Keine unnötigen Utility-Abstraktionen bei one-off Operations

**Python:**
- Python 3.11+, Type Hints überall
- FastAPI für APIs, Pydantic für Models
- `uv` als Package-Manager, `pyproject.toml` als Single Source
- Ruff für Linting + Format

**SQL:**
- `snake_case` Tabellen/Spalten, Plural für Tabellen
- Jede Tabelle: `id UUID PRIMARY KEY DEFAULT gen_random_uuid()`, `created_at TIMESTAMPTZ DEFAULT now()`
- RLS (Row Level Security) für alle Supabase-Tabellen
- Migrations via `supabase/migrations/YYYYMMDD_description.sql`

**Commit Messages:**
- Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`)
- Beschreibung auf Deutsch, kurz und direkt
- Bei Bug Fixes: **Warum** war der Bug — nicht nur **was** behoben wurde

**PR Beschreibungen:**
- Kurze Zusammenfassung (1-3 Bullet Points) auf Deutsch
- Test Plan als Markdown Checkliste
- Bei DB-Änderungen: Migration-Hinweise explizit nennen

---

## Was Copilot NICHT tun soll

- ❌ Keine Kommentare wie `// TODO: vielleicht später refactoren` schreiben
- ❌ Keine generischen "improvements" die nicht angefragt wurden
- ❌ Keine Docstrings/Type-Hints zu Code hinzufügen, der nicht geändert wurde
- ❌ Keine Error Handlers für unmögliche Fälle (Framework-Garantien vertrauen)
- ❌ Keine Feature-Flags oder Backwards-Compat-Shims, wenn direkt geändert werden kann
- ❌ Keine Helper/Utility-Abstraktionen für Einmal-Operations
- ❌ Keine speculative Abstractions für hypothetische Zukunfts-Requirements
- ❌ Keine `// @ts-ignore` oder `any`-Casts ohne explizite Begründung
- ❌ Keine emojis in Code, Kommentaren, Commits — außer explizit angefragt
- ❌ Keine `console.log` Debugs im finalen Code
- ❌ Keine deutsche Code-Benennung (`getBenutzer` ist falsch, `getUser` richtig)

---

## Spezielle Regeln

**Bei neuen React-Komponenten:**
- Server Components als Default, Client Components (`'use client'`) nur wo zwingend nötig (State, Event Handler, Browser APIs)
- Props-Interface direkt über der Komponente, `ComponentProps` als Name-Suffix
- Keine `useEffect` wenn `useMemo`/`useCallback`/Server Component ausreicht

**Bei API Routes:**
- Zod Schema für Input-Validierung
- Typed Response Objects
- Supabase-Calls via `createServerClient()` (SSR Package)
- Nie direkt `service_role` Key exposen — Row-Level-Security nutzen

**Bei DB Schemas:**
- Jede neue Tabelle mit RLS-Policies (`authenticated` + `service_role`)
- Foreign Keys + Indexes auf relevanten Columns
- Migrations sind idempotent (`CREATE TABLE IF NOT EXISTS`)

**Bei Dockerfiles:**
- Multi-Stage Build
- `node:22-alpine` als Base für Next.js
- Non-root User (`nextjs:nodejs`, uid 1001)
- `.dockerignore` pflegen
- Nie `latest` Tag für FROM, immer Version pinnen

**Bei GitHub Actions:**
- `actions/checkout@v4`, `docker/setup-buildx-action@v3`
- Build Args für `NEXT_PUBLIC_*` explizit durchreichen
- Deploy-Job erst nach erfolgreichem Build
- Nie Secrets echoen

---

## Projektspezifischer Kontext

Diese Section wird **pro Repo überschrieben** (siehe unten im Template-Bereich).

<!-- BEGIN REPO-SPECIFIC -->

### Was macht dieses Repo?
(kurz beschreiben)

### Welche Coolify App UUID?
(UUID aus `timo-goetz-ai.de` Coolify Setup)

### Welche Domain?
(z.B. `app.timo-goetz-ai.de`)

### Welche GitHub Secrets sind gesetzt?
- `COOLIFY_URL`
- `COOLIFY_TOKEN`
- `COOLIFY_<NAME>_UUID`
- weitere projektspezifische

### Relevante 1Password Items
(Liste der Items die für dieses Projekt gebraucht werden)

<!-- END REPO-SPECIFIC -->
