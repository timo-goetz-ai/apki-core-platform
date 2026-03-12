# AppFlowy Workspace Blueprint – Design

**Datum:** 2026-03-08  
**Status:** Freigegeben  
**URL:** https://appflowy.automation-plus-ki.de

---

## 1. Ziel

Einheitlicher Einstiegspunkt für alle Projekte. Jedes Projekt hat dieselbe Struktur: Einstieg → Templates → Skills → Rollen → Plugins → MCP-Server → Ergebnis.

---

## 2. Workspace-Struktur

```
📁 Workspace
├── 📄 Dashboard
├── 📁 _Vorlagen
│   ├── 📁 Templates
│   ├── 📁 Skills
│   ├── 📁 Rollen
│   ├── 📁 Plugins
│   └── 📁 MCP-Server
└── 📁 Projekte
    └── 📁 [Projekt]
        ├── 📄 Einstieg
        ├── 📁 Tasks
        ├── 📁 Configs
        ├── 📁 Rollen
        ├── 📁 Plugins
        ├── 📁 MCP-Server
        └── 📁 Ergebnis
```

---

## 3. Elemente

| Element | Zweck |
|---------|-------|
| **Dashboard** | Zentraler Einstieg, Links zu allen Projekten |
| **Templates** | Task, Meeting, Research, Config (n8n-Brain) |
| **Skills** | Development, Content, Recherche, Planung |
| **Rollen** | Owner, Reviewer, Executor |
| **Plugins** | Cursor-Plugins, Skills pro Projekt |
| **MCP-Server** | Liste mit URL, Auth, Status |
| **Ergebnis** | Deliverables, Outputs, Reports |

---

## 4. Projekte (Initial)

- automation-plus-ki
- ai-agent-platform
- ai-voice-platform
- Groundfounding
- Job Search
- Freundin
- TikTok

---

## 5. Umsetzung

Vorlagen liegen in `docs/appflowy-workspace/` – kopieren in AppFlowy.
