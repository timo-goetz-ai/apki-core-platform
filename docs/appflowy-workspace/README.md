# AppFlowy Workspace – Timo Goetz

**Workspace Audit 08.03.2026 — Integration in AppFlowy**

URL: https://appflowy.automation-plus-ki.de

---

## Inhalt

| Datei/Ordner | Zweck |
|--------------|-------|
| `00_BLUEPRINT.md` | Anleitung + Ordnerstruktur |
| `01_Dashboard.md` | Zentraler Einstieg, Audit-Score, Prioritäten |
| `02_WORKSPACE_AUDIT.md` | Vollständiger Audit-Report |
| `docs/` | ARCHITECTURE, SERVICES, NEXT_ACTIONS |
| `vorlagen/` | Templates, Skills, Rollen, Plugins, MCP-Server |
| `projekt/` | Einstieg pro STUDIO-Bereich (01–08) |

---

## Vorgehen

### Option A: Automatisch (Playwright)

```bash
cd docs/appflowy-workspace/scripts
npm install
npm run create:headed   # Mit Browser – empfohlen für ersten Lauf
```

Voraussetzung: In AppFlowy eingeloggt (Authentik) oder Login beim Start.

### Option B: Manuell

1. AppFlowy öffnen
2. Ordnerstruktur gemäß `00_BLUEPRINT.md` anlegen
3. Inhalte aus den Markdown-Dateien in die entsprechenden Seiten einfügen

---

## Struktur (Phase 9)

- **DOCS** — Zentrales Wissen (nicht in Memory-Files vergraben)
- **Projekte 01–08** — STUDIO-Bereiche nach Abhängigkeit
- **01_Infrastructure** bis **08_Experiments** — Production → Experiments
