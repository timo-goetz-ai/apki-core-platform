# AIOS – AI Automation Platform
## Projektdokumentation & Systemübersicht
**Stand: 12. März 2026**

---

## 1. WAS WURDE GEMACHT

### Phase 1 – Analyse der alten Struktur
Das bestehende System war über mindestens 3 Verzeichnisse verteilt und hatte mehrere kritische Probleme:

- **Verstreute Projekte**: `~/01_AI/`, `~/02_PROJECTS/`, `~/Desktop/03_AI_Engineering/`
- **4 doppelte Projektgruppen** (FastAPI-Backends, Next.js-Dashboards, Coder-Agents)
- **5 unabhängige Git-Repositories** ohne gemeinsamen Ursprung
- **Keine konsistente Benennung** (Mischung aus deutschen/englischen Namen, Zahlen-Prefixen)
- **Keine klare Trennung** zwischen Dev/Staging/Prod
- **Deployment-Konfigurationen** überall verstreut

### Phase 2 – Neue Monorepo-Struktur erstellt
Ein neues konsolidiertes Repository wurde unter `~/aios/` angelegt mit folgender Struktur:

```
~/aios/
├── .github/workflows/      → CI/CD Pipelines (GitHub Actions)
├── agents/                 → KI-Agenten (coder-agent, service-agents)
├── services/               → Haupt-Services (aios-core, admin-dashboard, crew-api)
├── automations/            → N8N Workflows, Prompts-Registry, Storage-Guardian
├── infrastructure/         → Coolify-Configs, Docker, Monitoring, MCP-Server
│   ├── coolify/            → Deployment-YAML für jeden Service
│   ├── databases/          → PostgreSQL / MySQL Configs
│   ├── mcp-servers/        → Cloudflare, Coolify, Filesystem, HCloud, Postgres
│   ├── monitoring/         → Prometheus, Grafana, Loki
│   └── stacks/             → N8N, NocoDB, Qdrant, Uptime-Kuma
├── experiments/            → Prototypen & archivierte alte Versionen
├── docs/                   → Architektur, Setup, Troubleshooting
├── scripts/                → Migrations-, Setup- & Deployment-Skripte
└── tests/                  → Integration & E2E Tests
```

### Phase 3 – Migration durchgeführt
- **`migrate-structure.sh --execute`** ausgeführt: alle Komponenten von alter Struktur in neues Monorepo kopiert
- Git-History für direkt migrierbare Repos erhalten
- Alle Komponenten kategorisiert und korrekt abgelegt

### Phase 4 – GitHub Repository eingerichtet
- Neues **privates** Repository erstellt: `https://github.com/TimoGoetz1988/aios`
- Kompletter Code gepusht (`main` Branch)
- GitHub Actions CI/CD Pipelines aktiviert

### Phase 5 – Lokale Entwicklungsumgebung gestartet
Docker Compose lokal gestartet – 4 Core-Services laufen:
- `aios-core` (FastAPI Backend)
- `admin-dashboard` (Next.js Frontend)
- PostgreSQL Datenbank
- Redis Cache

### Phase 6 – CI/CD Fehler behoben
Nach dem ersten Push kamen Fehler-E-Mails von GitHub. Folgende Probleme wurden systematisch behoben:

| # | Problem | Ursache | Lösung |
|---|---------|---------|--------|
| 1 | Legacy-Workflows schlugen fehl | Alte `deploy.yml`/`guardian.yml` hatten falsche Pfade | Komplett entfernt und durch neue ersetzt |
| 2 | Build mit `./apps/aios-core` | Pfad aus alter Struktur | Auf `services/aios-core` korrigiert |
| 3 | `package-lock.json` fehlte | Beim Kopieren nicht mitgenommen | `npm install --legacy-peer-deps` ausgeführt, Lock-File committed |
| 4 | eslint lief interaktiv und hing | Keine `.eslintrc.json` vorhanden | `.eslintrc.json` mit `next/core-web-vitals` erstellt |
| 5 | Python Lint-Fehler `E402`/`F401` | Import-Reihenfolge und ungenutzter Import in `crew-api` | Code in `main.py` und `event_stream.py` bereinigt |
| 6 | `coder-agent` kein Dockerfile | Script-Ordner, kein Container | Aus Build-Matrix entfernt |

**Aktueller Status: CI und Build laufen grün ✅**

---

## 2. ERREICHBARE SERVICES

### Lokal (Mac / Docker Desktop)

| Service | URL | Zugangsdaten |
|---------|-----|-------------|
| **Admin Dashboard** (Next.js UI) | http://localhost:3000 | – |
| **AIOS Core API** (FastAPI) | http://localhost:8000 | – |
| **API Dokumentation** (Swagger) | http://localhost:8000/docs | – |
| **API Dokumentation** (ReDoc) | http://localhost:8000/redoc | – |
| **PostgreSQL** | localhost:5432 | siehe `.env` |
| **Redis** | localhost:6379 | – |

### Live auf Hetzner (Production)

| Service | URL | Beschreibung |
|---------|-----|-------------|
| **Authentik SSO** | https://agents.automation-plus-ki.de | Identity Provider / Login-Portal |
| **Coolify** | https://coolify.automation-plus-ki.de *(intern)* | Deployment-Management |
| **Dashboard** (geplant) | https://dashboard.automation-plus-ki.de | Admin-Dashboard (Timeout – noch nicht deployed) |

### GitHub

| Ressource | URL |
|-----------|-----|
| **Repository** | https://github.com/TimoGoetz1988/aios |
| **CI/CD Workflows** | https://github.com/TimoGoetz1988/aios/actions |
| **Container Registry** | https://github.com/TimoGoetz1988/aios/packages |

---

## 3. GITHUB ACTIONS WORKFLOWS

| Workflow | Trigger | Was passiert |
|----------|---------|-------------|
| **CI – Lint, Test & Build** | Jeder Push (alle Branches) | Python Lint (ruff) + Tests, Node Lint (eslint) + Build, Docker-Build-Validation |
| **Build & Push – Docker Images** | Push auf `main` | Baut Docker Images für aios-core, admin-dashboard, crew-api und pusht zu `ghcr.io` |
| **Deploy Staging** | Push auf `staging` Branch | Deployed auf Hetzner Staging via Coolify API, führt Smoke-Tests durch |
| **Deploy Production** | Tag `v*` Push + manuelle Bestätigung | Blue-Green Deployment, DB-Migrations, Rollback bei Fehler, Slack-Notification |

---

## 4. WICHTIGE BEFEHLE

### Lokale Entwicklung starten/stoppen

```bash
# In das Projektverzeichnis wechseln
cd ~/aios

# Alle Services starten
docker compose up -d

# Status prüfen
docker compose ps

# Logs anschauen (z.B. aios-core)
docker compose logs -f aios-core

# Services stoppen
docker compose down
```

### Git-Workflow

```bash
cd ~/aios

# Neues Feature entwickeln
git checkout -b feature/mein-feature
# ... Code schreiben ...
git add .
git commit -m "feat: kurze Beschreibung"
git push origin feature/mein-feature
# → CI läuft automatisch auf GitHub

# Auf main mergen
git checkout main
git merge feature/mein-feature
git push origin main
# → CI + Docker Build laufen automatisch

# Release für Production
git tag v1.0.1
git push origin v1.0.1
# → Deploy-Prod Workflow startet (mit manueller Bestätigung)
```

### Struktur validieren

```bash
cd ~/aios
bash scripts/utils/validate-structure.sh
```

### Maintenance Dashboard

```bash
cd ~/aios
bash scripts/utils/maintenance-dashboard.sh
```

---

## 5. DATEIEN & KONFIGURATION

### Wichtige Dateien im Monorepo-Root

| Datei | Zweck |
|-------|-------|
| `docker-compose.yml` | Lokale Entwicklung (Docker Desktop) |
| `docker-compose.prod.yml` | Produktionsreferenz (Hetzner) |
| `.env.example` | Template für alle Umgebungsvariablen |
| `.env` | Lokale Secrets (NICHT in Git!) |
| `.gitignore` | Verhindert Commit von Secrets/Artefakten |
| `pyproject.toml` | Python-Konfiguration (ruff, black, pytest) |
| `Makefile` | Shortcut-Befehle (`make dev`, `make test`, etc.) |
| `README.md` | Projektbeschreibung |
| `CONTRIBUTING.md` | Beitrags-Richtlinien |

### Secrets einrichten (einmalig!)

```bash
cd ~/aios
cp .env.example .env
nano .env   # oder: open .env (in TextEdit)
```

Folgende Werte müssen eingetragen werden:
- `POSTGRES_PASSWORD` – Datenbankpasswort
- `REDIS_PASSWORD` – Redis-Passwort (falls aktiviert)
- `JWT_SECRET` – Mindestens 32 Zeichen
- `API_KEY` – Dein OpenRouter/OpenAI API Key
- `OPENROUTER_API_KEY` – OpenRouter Schlüssel
- `HETZNER_API_TOKEN` – für Deployment-Skripte
- `COOLIFY_API_TOKEN` – für automatische Deployments

---

## 6. SYSTEM-ARCHITEKTUR

```
INTERNET
    │
    ▼
┌─────────────────────────────────────────────┐
│  Cloudflare DNS                             │
│  automation-plus-ki.de                      │
└──────────────────┬──────────────────────────┘
                   │
                   ▼
┌─────────────────────────────────────────────┐
│  HETZNER SERVER                             │
│  Traefik (Reverse Proxy + SSL)              │
├─────────────────┬───────────────────────────┤
│  Coolify        │  Services                 │
│  (Deployment)   ├── Admin Dashboard         │
│                 ├── AIOS Core API          │
│  Authentik      ├── Crew API               │
│  (SSO / Login)  ├── PostgreSQL             │
│                 ├── MySQL                  │
│                 ├── Redis                  │
│                 ├── Monitoring Stack        │
│                 └── (N8N, NocoDB, Qdrant)  │
└─────────────────────────────────────────────┘
         ↕ CI/CD via GitHub Actions
┌─────────────────────────────────────────────┐
│  GITHUB                                     │
│  TimoGoetz1988/aios                         │
│  → ghcr.io (Docker Image Registry)         │
└─────────────────────────────────────────────┘
         ↕ Lokale Entwicklung
┌─────────────────────────────────────────────┐
│  MAC (Docker Desktop)                       │
│  ~/aios/                                    │
│  → localhost:3000 (Dashboard)               │
│  → localhost:8000 (API)                     │
└─────────────────────────────────────────────┘
```

---

## 7. SERVICES IM DETAIL

### aios-core (FastAPI Backend)
- **Lokal**: http://localhost:8000
- **Pfad**: `~/aios/services/aios-core/`
- **Stack**: Python 3.12, FastAPI, PostgreSQL, Redis, CrewAI
- **Hauptfunktion**: Zentrale REST-API für das gesamte System

### admin-dashboard (Next.js Frontend)
- **Lokal**: http://localhost:3000
- **Pfad**: `~/aios/services/admin-dashboard/`
- **Stack**: Next.js 14, TypeScript, Tailwind CSS
- **Hauptfunktion**: Web-Oberfläche zur Verwaltung

### crew-api (CrewAI Integration)
- **Pfad**: `~/aios/services/crew-api/`
- **Stack**: Python 3.12, FastAPI, CrewAI, Redis
- **Hauptfunktion**: KI-Agenten-Orchestrierung via CrewAI

### coder-agent (Script-basiert)
- **Pfad**: `~/aios/agents/coder-agent/`
- **Stack**: Python, Node.js (Scripts)
- **Hauptfunktion**: Automatisierung von Coding-Tasks

---

## 8. NÄCHSTE SCHRITTE (OFFEN)

### Sofort notwendig
- [ ] `.env` Datei mit echten Secrets befüllen (`cp .env.example .env && nano .env`)
- [ ] Secrets in GitHub Repository eintragen (für CI/CD Deployments):
  - `Settings → Secrets → New repository secret`
  - Benötigt: `HETZNER_SSH_KEY`, `COOLIFY_API_TOKEN`, `COOLIFY_WEBHOOK_URL`, `SLACK_WEBHOOK`

### Kurzfristig (1-2 Wochen)
- [ ] Admin Dashboard auf Hetzner deployen (via Coolify)
- [ ] Staging-Umgebung auf Hetzner aufsetzen
- [ ] Monitoring Stack (Grafana/Prometheus/Loki) aktivieren
- [ ] Tests schreiben (`tests/unit/`, `tests/integration/`)

### Mittelfristig (1 Monat)
- [ ] N8N Workflows einrichten (`infrastructure/stacks/n8n/`)
- [ ] NocoDB aktivieren (No-Code Datenbankoberfläche)
- [ ] Qdrant (Vektor-Datenbank für KI) deployen
- [ ] Auto-Maintenance Agents implementieren

### Offene Entscheidungen
- [ ] Welches Next.js Dashboard ist das aktive? (`dashboard-nextjs` vs `admin-dashboard`)
- [ ] `agents-backend/` Leads-Router Code: mergen oder archivieren?

---

## 9. TROUBLESHOOTING

### Services starten nicht

```bash
# Docker Desktop prüfen
docker --version

# Logs prüfen
docker compose logs aios-core
docker compose logs admin-dashboard

# Alles neu bauen
docker compose down
docker compose build --no-cache
docker compose up -d
```

### Port bereits belegt

```bash
# Wer nutzt Port 8000?
lsof -i :8000
# Prozess beenden
kill -9 <PID>
```

### GitHub Actions schlägt fehl

```bash
# Letzten Run anzeigen
cd ~/aios
gh run list --limit 5

# Fehler-Details anzeigen
gh run view <RUN_ID> --log-failed
```

### Datenbank-Verbindungsfehler

```bash
# PostgreSQL Status prüfen
docker compose ps aios-db

# Direkt verbinden
docker compose exec aios-db psql -U aios_user -d aios_db
```

---

## 10. KONTAKT & RESSOURCEN

| Ressource | Link/Info |
|-----------|-----------|
| **GitHub Repository** | https://github.com/TimoGoetz1988/aios |
| **CI/CD Status** | https://github.com/TimoGoetz1988/aios/actions |
| **Docker Images** | https://github.com/TimoGoetz1988/aios/packages |
| **Coolify Docs** | https://coolify.io/docs |
| **FastAPI Docs** | https://fastapi.tiangolo.com |
| **CrewAI Docs** | https://docs.crewai.com |

---

---

## 11. VOLLSTÄNDIGER MONOREPO-INHALT (nach Workspace-Scan)

Nach dem kompletten Scan des Workspace wurden folgende Inhalte in das Monorepo integriert:

### Neu hinzugefügte Komponenten

| Bereich | Quellpfad | Ziel in aios/ |
|---------|-----------|---------------|
| **Dashboard-Komponenten** | `02_PROJECTS/agents-next-js/dashboard-nextjs/` | `services/admin-dashboard/src/components/` |
| MCPHealthDashboard, ProjektKanban, LeadFeedWidget, S3StorageWidget, SecurityCheckWidget, ServicesSidebar | `02_PROJECTS/agents-backend/dashboard-nextjs/` | `services/admin-dashboard/src/components/` |
| CrewExecutionViewer, CrewLauncher, useCrewStream | `02_PROJECTS/agents-next-js/` | `services/admin-dashboard/src/` |
| **Terraform / IaC** | `02_PROJECTS/devops-center/agents/INFRA_AS_CODE/terraform/` | `infrastructure/terraform/` |
| **Service-Agents** | `02_PROJECTS/devops-center/agents/SERVICE_AGENTS/` | `agents/service-agents/` |
| **Storage-Guardian Scripts** | `02_PROJECTS/devops-center/agents/storage-guardian/scripts/` | `automations/storage-guardian/scripts/` |
| **Crew-AI-Generator** | `03_BUSINESS/STUDIO/crew-ai-generator/` | `agents/crew-ai-generator/` |
| **N8N Workflows** | `01_AI/`, `03_BUSINESS/STUDIO/03_AI_Engineering/n8n/` | `automations/n8n-workflows/` |
| **NocoDB Schemas & Setup** | `03_BUSINESS/STUDIO/03_AI_Engineering/nocodb/` | `infrastructure/databases/nocodb/` |
| **Prompt-Definitionen** | `01_AI/ai-prompts-registry/` | `automations/prompts-registry/` |
| **Crew-API Configs** | `02_PROJECTS/agents-next-js/agent-backend/config/` | `agents/crew-api-configs/`, `services/crew-api/config/` |
| **Infra-Docs** | `Downloads/`, `03_BUSINESS/STUDIO/03_AI_Engineering/` | `docs/architecture/` |
| **Systemanalysen** | `02_PROJECTS/devops-center/docs/` | `docs/knowledge-base/` |
| **Architektur-Docs** | `02_PROJECTS/agents-next-js/`, `01_AI/Blueprint.txt` | `docs/architecture/` |
| **AppFlowy-Workspace** | `02_PROJECTS/docs/appflowy-workspace/` | `docs/appflowy-workspace/` |
| **System-Canvas** | `canvas/aios-system-overview.html` | `docs/visuals/` |
| **MCP-Referenz** | `03_BUSINESS/STUDIO/03_AI_Engineering/.cursor/` | `docs/architecture/` |
| **Deployment Scripts** | `02_PROJECTS/devops-center/agents/INFRA_AS_CODE/scripts/` | `scripts/deployment/` |
| **AI-Control-Center** | `01_AI/ai-control-center/` | `experiments/prototypes/ai-control-center/` |
| **AI-Engineering Stack** | `03_BUSINESS/STUDIO/03_AI_Engineering/coolify/` | `infrastructure/stacks/ai-engineering-coolify/` |

### Aktuelle Monorepo-Struktur (vollständig)

```
~/aios/
├── .github/workflows/          → CI (lint/test), Build&Push, Deploy-Staging, Deploy-Prod
├── agents/
│   ├── coder-agent/            → CrewAI Coder-Agent (Python + JS)
│   ├── crew-ai-generator/      → Tool zur Generierung neuer CrewAI-Agenten
│   ├── crew-api-configs/       → YAML-Konfigurationen für Crews & MCP-Server
│   ├── prompts/                → Prompt-Vorlagen & Agent-Prompts
│   └── service-agents/         → Service-Monitoring-Agenten
├── services/
│   ├── aios-core/             → FastAPI Haupt-Backend [läuft: localhost:8000]
│   ├── admin-dashboard/        → Next.js Frontend [läuft: localhost:3000]
│   │   └── src/components/     → 9 Komponenten inkl. MCPHealth, Kanban, S3, Crew
│   └── crew-api/               → CrewAI API-Service
├── automations/
│   ├── n8n-workflows/
│   │   ├── task-pipelines/     → Voice-Lead, Coder-Agent Workflows
│   │   ├── event-driven/       → File-Sort-Webhook
│   │   └── scheduled-jobs/     → Research-Jobs
│   ├── prompts-registry/       → access-matrix, model-router, agent YAMLs
│   ├── integrations/           → n8n_client.py
│   └── storage-guardian/
│       └── scripts/            → scan, classify, cluster, mark-relevance, propose
├── infrastructure/
│   ├── coolify/                → YAML-Deployment-Templates für alle Services
│   ├── config/                 → system-map.yaml, setup.yaml
│   ├── databases/
│   │   ├── postgres/           → init.sql, backup-script
│   │   ├── mysql/              → init.sql
│   │   └── nocodb/             → schema (7 Tabellen), seed CSV, setup.py
│   ├── docker/                 → base-images, AI-Engineering compose
│   ├── mcp-servers/            → Cloudflare, Coolify, Filesystem, HCloud, Postgres
│   ├── monitoring/             → Prometheus, Grafana, Loki
│   ├── networking/             → internal-network.yaml
│   ├── server-config/          → nginx, firewall
│   ├── stacks/                 → n8n, NocoDB, Qdrant, Uptime-Kuma, AI-Engineering
│   └── terraform/              → Hetzner IaC (main.tf, variables, outputs)
├── experiments/
│   ├── archive/                → ai-control-center, leads-backend
│   └── prototypes/             → coder-agent-boilerplate, streamlit-dashboard
├── docs/
│   ├── architecture/           → blueprint, system-map, server-übersicht, MCP-Referenz, Infra-HTML
│   ├── knowledge-base/         → Inventar, semantische Zuordnung, Themencluster, Wissensanker
│   ├── visuals/                → aios-system-overview.html (interaktiv)
│   ├── plans/                  → Implementierungspläne (AppFlowy, n8n-MCP, Agent Control Center)
│   ├── appflowy-workspace/     → Templates, Rollen, Workspace-Design
│   ├── setup/                  → local-development, hetzner-setup, stack_anleitung
│   ├── workflows/              → deployment.md, ci-cd, agent-development
│   └── troubleshooting/        → common-issues, debugging
├── scripts/
│   ├── deployment/             → deploy-to-hetzner, deploy-via-coolify-api, health-check, drift-check
│   ├── setup/                  → init-project, setup-dev-env, setup-coolify
│   ├── maintenance/            → backup-all, cleanup
│   ├── migration/              → migrate-structure.sh (bereits ausgeführt)
│   └── utils/                  → validate-structure, test-connectivity, op-run-local
└── tests/
    ├── integration/
    └── e2e/
```

---

*Dokument erstellt: 12. März 2026 | Zuletzt aktualisiert: 12. März 2026 nach vollständigem Workspace-Scan*
*Monorepo: ~/aios | GitHub: TimoGoetz1988/aios | Status: CI/CD grün ✅*
