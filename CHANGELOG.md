# Changelog

All notable changes to the AIOS project will be documented in this file.

---

## [Unreleased] — Branch: claude/update-services-config-5F7VD

### Added
- **Bento Grid Dashboard** — komplett neu gestaltetes Haupt-Dashboard mit 4-Spalten-Grid, Cyan-Farbschema und Tool-Navigation
- **Agentic OS Cockpit** — Dateisystem als Single Source of Truth; 4-Kategorien-Sidebar (Engine Room, Knowledge, Management, Monitoring) mit 8 Sub-Pages
  - `/agentic-os/engine-room/agents`
  - `/agentic-os/engine-room/workflows`
  - `/agentic-os/knowledge/prompts`
  - `/agentic-os/knowledge/templates`
  - `/agentic-os/management/active-projects`
  - `/agentic-os/management/ai-ops`
  - `/agentic-os/monitoring/automations`
  - `/agentic-os/monitoring/dashboards`
- **MCP-Plattform** — reales Infrastruktur-Konzept ersetzt MCP-Stadt-Metapher; 3 Projekte, 15 MCP-Dienste, RACI-Matrix, Audit-Trail
- **NocoDB-Persistenz** — Tabellen für MCP-Projekte, MCP-Dienste und Audit-Log über NocoDB API
- **MCP-Stadt** als eigenständige Dashboard-Seite integriert
- **Phase 2** — Cloudflare, Coolify, GitHub, Raycast, Prompts + 1Password Integration
- **Phase 3** — Raycast Extension, N8N, Activity Feed, Corporate Dark Mode
- **Mac Scanner** — lokale Projektverzeichnisse per API-Key-Auth synchronisieren
- **Docker Control** — Container via Admin-Dashboard starten/stoppen/restarten

### Fixed
- CI-Lint und Build-Fehler im admin-dashboard behoben (ESLint + page.tsx Export-Fehler)
- TypeScript-Fehler in coolify/services und mac-store
- Mehrere client-side Bugs behoben

### Changed
- `next-env.d.ts` von Next.js generiert und committed
- `tsconfig.tsbuildinfo` nach tsc-Runs aktualisiert

---

## [0.1.0] — 2026-01-01 (Initial)

### Added
- Initiales Projekt-Setup: Nexus Core (FastAPI), Admin Dashboard (Next.js), Crew API
- Infra-Dashboard, SaaS-Landing, Salon-Stack als eigenständige Projekte
- MCP-Server: PostgreSQL, Filesystem, Google Workspace, Cloudflare DNS, GitHub, Hetzner Cloud, Coolify
- Monitoring Stack: Prometheus, Grafana, Loki, Promtail
- Docker Stacks: N8N, NocoDB, Qdrant, Uptime Kuma
- Coolify-Deployment auf Hetzner CPX42 (nbg1)
- Traefik Reverse Proxy mit Let's Encrypt
- Cloudflare DNS für `automation-plus-ki.de`
