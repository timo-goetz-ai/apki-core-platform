# n8n MCP + Webhook Datei-Sortierung – Design

**Datum:** 2026-03-08  
**Kontext:** Externer Zugriff auf n8n, Dateien per Webhook JSON reinschicken & sortieren

---

## 1. n8n MCP für Cursor andocken (externer Zugriff)

### Ist-Zustand

| Umgebung | MCP-Server | URL | Status |
|----------|------------|-----|--------|
| **Claude** | mcp-n8n | `https://mcp-n8n.automation-plus-ki.de/mcp-server/http` | HTTP, Bearer |
| **Cursor** | n8n-mcp | `https://n8n.automation-plus-ki.de/mcp-server/http` via supergateway | stdio, JWT |

### Empfohlene Konfiguration für Cursor

**Option A: HTTP (wie andere MCP-Server)**

Cursor → Settings → MCP → Add Server:

```json
{
  "mcp-n8n": {
    "type": "http",
    "url": "https://mcp-n8n.automation-plus-ki.de/mcp-server/http",
    "headers": {
      "Authorization": "Bearer <DEIN_MCP_N8N_TOKEN>"
    }
  }
}
```

**Option B: Direkt n8n (bereits im Projekt)**

Im Projekt `/Users/zuhause_mit_ideen` ist `n8n-mcp` bereits konfiguriert (stdio via supergateway).  
Falls nicht sichtbar: Cursor neu starten, MCP-Server in den Einstellungen prüfen.

### Token-Quellen

- **mcp-n8n** (Proxy): Bearer aus MCP-Ops/Homestack (z.B. `MCP_N8N_API_KEY`)
- **n8n direkt**: JWT aus n8n → Settings → API → Create API Key

### Externer Zugriff

- **Raycast:** MCP-Orchestrator nutzt `mcp-n8n` → `trigger_workflow`
- **Claude.ai:** MCP-Connector auf mcp-n8n zeigen
- **Andere Clients:** HTTP-POST an n8n Webhook-URL (siehe Abschnitt 2)

---

## 2. n8n Webhook: Dateien per JSON reinschicken & sortieren

### Workflow-Architektur

```
[Webhook POST] → [JSON parsen] → [Sortier-Logik] → [Ziel: Nextcloud/NocoDB/Ordner]
```

### Webhook-URL (Produktion)

```
POST https://n8n.automation-plus-ki.de/webhook/<path>
```

Path z.B. `/file-sort` oder zufällig generiert.

### JSON-Schema (Eingabe)

```json
{
  "files": [
    {
      "path": "/path/to/file.pdf",
      "url": "https://example.com/file.pdf",
      "filename": "dokument.pdf",
      "category": "Rechnung",
      "target_folder": "INPUT/Rechnungen"
    }
  ],
  "source": "appflowy|raycast|manual"
}
```

**Varianten:**

| Feld | Beschreibung |
|------|--------------|
| `path` | Lokaler Pfad (wenn n8n Zugriff hat) |
| `url` | Download-URL (n8n lädt herunter) |
| `base64` | Base64-kodierter Inhalt (max. ~12MB bei 16MB Limit) |
| `category` | Semantische Kategorie für Sortierregeln |
| `target_folder` | Expliziter Zielordner |

### Sortier-Logik (n8n-Nodes)

1. **Webhook** – POST, Path `/file-sort`, Raw Body: JSON
2. **Code/IF** – `files` iterieren, `category` oder `target_folder` auswerten
3. **Switch** – Nach Kategorie verzweigen
4. **HTTP Request** – Bei `url`: Datei herunterladen
5. **Nextcloud** – `create_file` in Zielordner ODER
6. **NocoDB** – Metadaten in Tabelle `file_inbox` schreiben
7. **Respond to Webhook** – `{ "status": "ok", "processed": 3 }`

### Zielorte

| Ziel | Node | Anmerkung |
|------|------|-----------|
| Nextcloud | Nextcloud Node | `nextcloud.automation-plus-ki.de` |
| NocoDB | NocoDB Node | Tabelle für Inbox/Verarbeitungslog |
| Lokaler Server | Read/Write File | Nur wenn n8n auf Server läuft |

### Sicherheit

- **Header Auth** oder **JWT** am Webhook aktivieren
- **IP-Whitelist** optional (Tailscale, bekannte IPs)
- Credentials für Nextcloud/NocoDB in n8n hinterlegen

---

## 3. Nächste Schritte

1. **MCP:** Cursor Settings → MCP prüfen, ob `mcp-n8n` oder `n8n-mcp` aktiv
2. **Workflow:** In n8n neuen Workflow anlegen: Webhook → Sortier-Logik → Nextcloud/NocoDB
3. **Test:** `curl -X POST https://n8n.automation-plus-ki.de/webhook/file-sort -H "Content-Type: application/json" -d '{"files":[{"filename":"test.pdf","category":"Rechnung"}]}'`

---

## Referenzen

- n8n Webhook Docs: https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/
- MCP-Orchestrator: `.cursor/rules/mcp-orchestrator.mdc`
- ENV-Variablen: `Desktop/ENV_VARIABLEN_UEBERSICHT.md`
