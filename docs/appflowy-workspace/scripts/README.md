# AppFlowy Workspace – Skripte

## Übersicht

| Skript | Methode | Zweck |
|--------|---------|-------|
| `create-structure.mjs` | Playwright (Browser) | Erstellt Struktur + Inhalte via UI |
| `create-via-api.mjs` | REST API | Erstellt DB-Rows (falls DB existiert) |

**Die AppFlowy Cloud API erlaubt kein Erstellen von Ordnern/Seiten.** Nur Database-Rows.  
Für die vollständige Struktur (Dashboard, _Vorlagen, Projekte) → **create-structure.mjs**.

---

## create-structure.mjs (Playwright)

### Setup

```bash
cd docs/appflowy-workspace/scripts
npm install   # installiert auch Chromium via postinstall
```

Falls Fehler „Executable doesn't exist“: `npx playwright install chromium` ausführen.

### Ausführung

```bash
# Headless (schnell)
npm run create

# Mit sichtbarem Browser (empfohlen für ersten Lauf)
npm run create:headed

# Langsam, für Debugging
npm run create:slow
```

### Ablauf

1. Öffnet Browser und navigiert zu `https://appflowy.automation-plus-ki.de`
2. Falls Login-Seite (Authentik): **60 Sekunden warten** – du loggst dich in dieser Zeit ein
3. Erstellt Struktur: Dashboard, _Vorlagen, Templates, Skills, Rollen, Plugins, MCP-Server, Projekte
4. Fügt Inhalte aus den Markdown-Vorlagen ein

### Hinweis

AppFlowy Web nutzt React. Die Selektoren (Add-Button, Editor) können je nach Version abweichen.  
Falls das Skript fehlschlägt:

1. Mit `--headed --slow` ausführen und beobachten
2. Selectors in `create-structure.mjs` anpassen (Zeile ~80)
3. Oder: `npx playwright codegen https://appflowy.automation-plus-ki.de` – manuell Aktionen ausführen, Playwright generiert Code

---

## create-via-api.mjs (API)

Erstellt nur **Database-Rows** mit Vorlagen-Inhalt. Keine Ordnerstruktur.

### Voraussetzung

- Workspace existiert
- Mindestens eine Database existiert
- JWT-Token von GoTrue

### Token holen

```bash
curl -X POST "https://appflowy.automation-plus-ki.de/gotrue/token" \
  -H "Content-Type: application/json" \
  -d '{"grant_type":"password","email":"DEINE_EMAIL","password":"DEIN_PASSWORT"}'
```

### Ausführung

```bash
APPFLOWY_TOKEN="eyJ..." node create-via-api.mjs
```

---

## Umgebungsvariablen

| Variable | Default | Beschreibung |
|----------|---------|--------------|
| `APPFLOWY_URL` | https://appflowy.automation-plus-ki.de | AppFlowy-Instanz |
| `APPFLOWY_TOKEN` | – | JWT (nur für create-via-api) |
