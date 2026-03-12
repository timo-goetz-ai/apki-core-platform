# WORKSPACE AUDIT — Timo Goetz

**Stand:** 08.03.2026 | **Auditor:** Claude Sonnet 4.6

---

## Phase 1 — Workspace Map

```
/Users/zuhause_mit_ideen/Geschäft/
├── STUDIO/
│   ├── 03_AI_Engineering/            ← Hauptentwicklungshub
│   │   ├── .cursor/rules/
│   │   ├── 07_Projects/
│   │   │   └── 03_ai-agent-platform/ (LIVE ✅ Next.js + FastAPI)
│   │   ├── docs/, scripts/, nocodb/schema/, n8n/workflows/
│   └── crew-ai-generator/
└── ARCHIV/
    ├── 00_ADMIN/, 01_HUB_SYSTEM/, 02_PROJECTS/
    ├── 06_automation-plus-ki/, 07_n8n-production/
    └── 03_OPERATIONS/ bis 09_BACKUPS/
```

---

## Phase 2 — Server-Infrastruktur

**Hetzner 46.224.145.109 (Coolify)**

| Stack | Services |
|-------|----------|
| **Homestack** | n8n, NocoDB, Authentik, Vaultwarden, Qdrant, Redis, Prometheus, Grafana, Loki, Promtail, cAdvisor, PostgreSQL (6 Instanzen) |
| **MCP Stack** | 18 Server (github, cloudflare, hetzner, coolify, grafana...) |
| **Apps** | AI Agent Platform, AI Voice Platform, AppFlowy |

---

## Phase 3 — Projekt-Intelligence

| Projekt | Status | Tech | Strategisch |
|---------|--------|------|-------------|
| AI Agent Platform | Production | Next.js 15 + FastAPI | ✅ Hoch |
| AI Voice Platform | Production (Phase 6) | FastAPI + Twilio | ✅ Hoch |
| Homestack | Production | Docker Compose + Coolify | ✅ Kritisch |
| MCP Stack | Production | 18 Server | ✅ Kritisch |
| KI-Bewerbungs-Automation | Prototype Phase 1 | n8n + NocoDB | ⚠️ Mittel |
| crew-ai-generator | Experimental | Python + Jinja2 | ⚠️ Unklar |
| AppFlowy | Production | SaaS Deploy | ⚠️ Passiv |

---

## Phase 4 — Quality Score: 7.5/10

| Kriterium | Score |
|-----------|-------|
| Architektur-Qualität | 8/10 |
| Klarheit | 7/10 |
| Skalierbarkeit | 7/10 |
| Wartbarkeit | 8/10 |
| AI Readiness | 7/10 |
| Automation Readiness | 8/10 |

**Größte Schwäche:** 17/18 n8n-Workflows inaktiv. Qdrant ungenutzt.

---

## Phase 5 — Kritische Lücken

- Kein ARCHITECTURE.md auf Root-Ebene
- Keine API-Dokumentation für AI Agent Platform
- AppFlowy ohne MCP
- Qdrant läuft, kein Agent nutzt es
- Token-Usage-Monitoring fehlt

---

## Phase 6 — Ideale Zielarchitektur

```
STUDIO/
├── 01_Infrastructure/   (Homestack, MCP-Stack Configs)
├── 02_Platform/        (AI Agent Platform)
├── 03_Agents/          (n8n Workflows)
├── 04_Voice/           (AI Voice Platform)
├── 05_Data/            (NocoDB, Qdrant)
├── 06_MCP/             (MCP Server Code)
├── 07_Automation/      (KI-Bewerbungs-Automation)
└── 08_Experiments/     (crew-ai-generator)

DOCS/
├── ARCHITECTURE.md
├── RUNBOOKS.md
├── SERVICES.md
└── DECISIONS.md
```

---

## Phase 7 — Redundanz & Chaos

| Problem | Empfehlung |
|--------|------------|
| 17/18 n8n-Workflows inaktiv | Aktivieren oder löschen |
| Dashboard + Agents zwei Domains | Merge: dashboard → agents redirect |
| ARCHIV/01_HUB_SYSTEM/ veraltet | Aktualisieren oder als "Vision" markieren |
| KI-Bewerbungs-Automation Phase 2 offen | Weiterführen oder einfrieren |
| AppFlowy ohne MCP | MCP bauen |
| Qdrant ungenutzt | Nutzen oder abschalten |
