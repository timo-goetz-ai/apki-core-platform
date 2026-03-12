# AppFlowy Workspace – Blueprint

**Workspace Audit 08.03.2026 — Phase 9 Zielarchitektur**

Kopiere diese Struktur in AppFlowy oder nutze `npm run create` (Playwright).

---

## Anleitung

1. **Dashboard** → `01_Dashboard.md`
2. **WORKSPACE_AUDIT** → `02_WORKSPACE_AUDIT.md`
3. **DOCS** → ARCHITECTURE, SERVICES, NEXT_ACTIONS aus `docs/`
4. **_Vorlagen** → Templates, Skills, Rollen, Plugins, MCP-Server
5. **Projekte** → 01_Infrastructure bis 08_Experiments (je mit Einstieg, Tasks, Configs, Rollen, Plugins, MCP-Server, Ergebnis)

---

## Ordnerstruktur (Referenz)

```
📁 Workspace
├── 📄 Dashboard
├── 📄 WORKSPACE_AUDIT
├── 📁 DOCS
│   ├── ARCHITECTURE
│   ├── SERVICES
│   └── NEXT_ACTIONS
├── 📁 _Vorlagen
│   ├── 📁 Templates (Task, Meeting, Research, Config)
│   ├── 📁 Skills (Development, Content, Recherche, Planung)
│   ├── 📁 Rollen (Owner, Reviewer, Executor)
│   ├── 📄 Plugins
│   └── 📄 MCP-Server
└── 📁 Projekte
    ├── 📁 01_Infrastructure
    ├── 📁 02_Platform
    ├── 📁 03_Agents
    ├── 📁 04_Voice
    ├── 📁 05_Data
    ├── 📁 06_MCP
    ├── 📁 07_Automation
    └── 📁 08_Experiments
```

---

## Automatische Erstellung

```bash
cd docs/appflowy-workspace/scripts
npm run create          # Headless
npm run create:headed   # Mit Browser
npm run create:slow     # Langsam (Debug)
```
