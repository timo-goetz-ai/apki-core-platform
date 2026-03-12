# Dashboard-Erweiterung — Ideen & Roadmap

**Stand:** 08.03.2026  
**Basis:** Agent Control Center — **NICHT Streamlit**, sondern **Agenten-Plattform mit Live-Observability** (CrewAI + LangGraph, FastAPI, Next.js). Siehe ARCHITEKTUR_AGENTEN.md.

---

## 1. Ist-Zustand (Lücken)

| Bereich | Aktuell | Fehlt |
|---------|---------|-------|
| **Services** | n8n, NocoDB, Grafana, Prometheus, Authentik, Qdrant | Voice AI, Mailpit, AppFlowy, S3/Object Storage |
| **Frontend** | Streamlit (statisch) | Next.js mit **animierten Agenten**, Live-Task-Streaming, Crew Launcher |
| **Datenquellen** | Platzhalter-Metrics, statische Task-Feeds | Echte API-Anbindung (n8n, NocoDB, MCP-Server) |
| **Leads / Kontakt** | — | Kontaktformular-Eingänge, Voice-Leads, Recherche-Ergebnisse |
| **Projekte** | — | Projektstatus, MCP/Skills/Rules-Mapping, Security-Layer |
| **Storage** | — | Hetzner S3 / Object Storage Links |
| **MCP-Status** | Statisch | Live-Health-Checks (healthy/unhealthy) |

---

## 2. Erweiterungsvorschläge

### 2.1 Lead- & Event-Feed (zentral)

**Ziel:** Alle eingehenden Signale an einem Ort.

| Quelle | Integration | Technik |
|--------|-------------|---------|
| **Voice AI** | Neue Anrufe/Leads | n8n Webhook → NocoDB Tabelle `leads` → Dashboard liest via MCP-NocoDB oder API |
| **Kontaktformular** | Neue Anfragen | Formspree / Netlify Forms / eigener Endpoint → NocoDB → Dashboard |
| **Recherchen** | Neue Einträge | NocoDB Tabelle `recherchen` oder AppFlowy-Export → Dashboard |
| **Mailpit** | Eingehende Mails (Dev/Test) | Mailpit API oder n8n Poll → NocoDB `mails` → Dashboard |

**UI:** Einheitlicher Feed mit Filter (Typ: Lead | Recherche | Projekt | Mail), Zeitstempel, Status.

---

### 2.2 Projekt-Kanban mit MCP/Skills-Mapping

**Ziel:** Projekte mit Status, zugeordneten Tools und Security-Check.

| Feld | Beschreibung |
|------|--------------|
| **Name** | Projektbezeichnung |
| **Status** | `idee` → `planung` → `entwicklung` → `review` → `live` → `archiv` |
| **MCPs** | z.B. mcp-n8n, mcp-grafana, mcp-postgres |
| **Skills** | z.B. brainstorming, systematic-debugging |
| **Rules** | z.B. mcp-orchestrator, plugin-quality-gates |
| **Plugins** | z.B. context7, figma |
| **Security-Layer** | Ja/Nein, Checkliste (z.B. Secrets-Check, Input-Validierung) |

**Datenquelle:** NocoDB Tabelle `projekte` mit Relationen zu `mcp_server`, `skills`, `rules`.

**UI:** Kanban-Board oder Tabelle mit Filter; Klick auf Projekt → Detailansicht mit allen Anbindungen.

---

### 2.3 Security-Layer vor jedem Projekt

**Konzept:** Vor Projektstart obligatorischer Check.

| Check | Beschreibung |
|-------|--------------|
| **Secrets** | Keine API-Keys/Passwörter im Code; nur Env/Secrets-Manager |
| **Input-Validierung** | Sanitization für User-Input (Kontaktformulare, Webhooks) |
| **MCP-Zugriff** | Welche MCPs braucht das Projekt? Nur notwendige aktivieren |
| **Rate-Limiting** | Für öffentliche Endpoints (Voice, Forms) |
| **Audit** | Kurzer Eintrag: Wer hat wann den Check durchgeführt |

**Umsetzung:**
- NocoDB Tabelle `security_checks` mit Projekt-ID, Checkliste (JSON/Spalten), Datum, User
- Optional: n8n Workflow, der bei neuem Projekt-Eintrag eine Erinnerung auslöst
- Dashboard: Widget „Offene Security-Checks“ + Button „Check durchführen“

---

### 2.4 Hetzner S3 / Object Storage

**Ziel:** Schnellzugriff auf Buckets und wichtige Links.

| Option | Umsetzung |
|--------|-----------|
| **Direktlinks** | Config-Erweiterung: `S3_BUCKET_URL` oder Hetzner Object Storage Console-Link |
| **MCP-Hetzner** | Falls MCP-Hetzner Object Storage unterstützt: Liste der Buckets anzeigen |
| **n8n-Integration** | n8n S3-Node nutzen; Dashboard zeigt „Zuletzt hochgeladene Dateien“ (Metadaten aus NocoDB) |

**UI:** Sidebar oder eigener Tab „Storage“ mit Links zu:
- Hetzner Cloud Console (Object Storage)
- Evtl. direkte Bucket-URLs (wenn öffentlich lesbar oder Pre-Signed URLs)

---

### 2.5 Erweiterte Service-Übersicht

**Neue Services in `config.SERVICES`:**

```python
# Erweiterung config.py
SERVICES = {
    # ... bestehend ...
    "Voice AI": {"url": f"https://voice.{BASE_DOMAIN}", "label": "Voice AI", "icon": "🎙️"},
    "Agents": {"url": f"https://agents.{BASE_DOMAIN}", "label": "AI Agents", "icon": "🤖"},
    "Mailpit": {"url": f"https://mail.{BASE_DOMAIN}", "label": "Mailpit", "icon": "📧"},
    "AppFlowy": {"url": f"https://appflowy.{BASE_DOMAIN}", "label": "AppFlowy", "icon": "📝"},
    "Hetzner S3": {"url": "https://console.hetzner.cloud/", "label": "Hetzner Cloud", "icon": "☁️"},
}
```

---

### 2.6 MCP-Health-Dashboard

**Ziel:** Live-Status aller MCP-Server (healthy/unhealthy).

| MCP | Health-Endpoint | Integration |
|-----|-----------------|-------------|
| mcp-n8n, mcp-grafana, mcp-coolify, … | JSON-RPC `initialize` oder `/health` | MCPRegistry (ARCHITEKTUR_AGENTEN.md) |

*Nicht mehr relevant: mcp-nextcloud, mcp-vaultwarden*

**Umsetzung:**
- Hintergrund-Job (z.B. alle 60s) oder bei Dashboard-Load: HTTP-Requests an alle MCP-URLs
- Ergebnis in `widgets.get_mcp_health()` → Cards mit 🟢/🔴
- Optional: NocoDB Tabelle `mcp_health_log` für Historie

---

### 2.7 Kontaktformular-Pipeline (einheitliches Muster)

**Problem:** Projekte mit gleichem Muster, Gegenfragen per Kontaktformular.

**Lösung:**
1. **Ein zentrales Formular** (z.B. Typeform, Tally, oder eigener Endpoint) mit strukturierten Feldern
2. **n8n Workflow:** Formular-Submit → Validierung → NocoDB `anfragen` → Optional: E-Mail-Benachrichtigung
3. **Dashboard:** Tabelle „Offene Anfragen“ mit Status (neu | in Bearbeitung | beantwortet)
4. **Gegenfragen:** Entweder im Formular als mehrstufiger Flow oder als Follow-up in NocoDB (Notizen-Feld)

---

## 3. Architektur-Übersicht (Ziel)

```
                    ┌─────────────────────────────────────────┐
                    │  Agent Control Center (Next.js + FastAPI) │
                    │  Agenten bewegen sich bei Arbeit         │
                    │  dashboard.automation-plus-ki.de         │
                    └───────────────────┬─────────────────────┘
                                        │
        ┌───────────────────────────────┼───────────────────────────────┐
        │                               │                               │
        ▼                               ▼                               ▼
┌───────────────┐             ┌─────────────────┐             ┌─────────────────┐
│ NocoDB        │             │ MCP-Server      │             │ n8n Webhooks    │
│ (Leads,       │             │ (Health,        │             │ (Voice, Forms,  │
│  Projekte,    │             │  Grafana,       │             │  Recherchen)    │
│  Security)    │             │  n8n, …)        │             │                 │
└───────────────┘             └─────────────────┘             └─────────────────┘
        │                               │                               │
        └───────────────────────────────┼───────────────────────────────┘
                                        │
                    ┌───────────────────┴───────────────────┐
                    │  Authentik SSO | Coolify | Hetzner     │
                    └───────────────────────────────────────┘
```

---

## 4. GitHub-Frameworks für Agent-Visualisierung

| Repo | Beschreibung |
|------|--------------|
| **coding-by-feng/ai-agent-session-center** | 3D-Dashboard, animierte Roboter pro Session, Live-Terminals, 9 Themes |
| **honorstudio/claude-ville** | Isometrisches Pixel-Art, Agenten im Dorf, WebSocket-Updates |
| **wesm/agentsview** | Go-App, Heatmaps, Analytics |
| **CrewAI PR #2321** | Rich Console-Visualisierung |

---

## 5. Implementierungs-Reihenfolge (Vorschlag)

| Phase | Inhalt | Aufwand |
|-------|--------|---------|
| **0** | Agent-Backend (FastAPI + CrewAI + LangGraph) + Next.js Frontend — siehe ARCHITEKTUR_AGENTEN.md | — |
| **1** | Services in Config erweitern (Voice, Agents, Mailpit, AppFlowy, Hetzner) | 1h |
| **2** | NocoDB-Tabellen anlegen: `leads`, `projekte`, `security_checks`, `anfragen` | 2h |
| **3** | MCP-Health-Widget (HTTP-Requests an MCP-URLs) | 2h |
| **4** | Lead-Feed-Widget (NocoDB API oder MCP-NocoDB) | 3h |
| **5** | Projekt-Kanban mit MCP/Skills-Mapping | 4h |
| **6** | Security-Check-Widget + NocoDB-Integration | 2h |
| **7** | n8n Webhooks für Voice, Kontaktformular, Recherchen | 4h |
| **8** | Kontaktformular-Pipeline (zentrales Formular + n8n) | 4h |

---

## 6. NocoDB-Schema (Vorschlag)

### Tabelle `leads`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | Auto | PK |
| created_at | DateTime | Erstellt |
| source | SingleSelect | voice \| form \| mail \| recherche |
| name | Text | Name/Kontakt |
| email | Email | E-Mail |
| status | SingleSelect | neu \| kontaktiert \| in_bearbeitung \| abgeschlossen |
| notes | LongText | Notizen |

### Tabelle `projekte`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | Auto | PK |
| name | Text | Projektname |
| status | SingleSelect | idee \| planung \| entwicklung \| review \| live \| archiv |
| mcps | MultiSelect | mcp-n8n, mcp-grafana, … |
| skills | MultiSelect | brainstorming, systematic-debugging, … |
| rules | MultiSelect | mcp-orchestrator, … |
| plugins | MultiSelect | context7, figma, … |
| security_check_done | Checkbox | Security-Layer durchgeführt |
| created_at | DateTime | Erstellt |

### Tabelle `security_checks`
| Spalte | Typ | Beschreibung |
|--------|-----|--------------|
| id | Auto | PK |
| projekt_id | LinkToRecord | → projekte |
| secrets_ok | Checkbox | Keine Secrets im Code |
| input_validation_ok | Checkbox | Input-Validierung |
| mcp_scope_ok | Checkbox | MCP-Zugriff begrenzt |
| rate_limit_ok | Checkbox | Rate-Limiting |
| checked_by | Text | User |
| checked_at | DateTime | Zeitpunkt |

---

## 7. Weitere Ideen (optional)

- **Grafana-Embed:** iframe oder Link zu einem „Agent-Overview“-Dashboard in Grafana
- **n8n-Executions:** Letzte 10 Workflow-Ausführungen direkt im Dashboard
- **Quick-Actions:** Buttons für häufige Aktionen (z.B. „Neues Projekt anlegen“, „Lead als kontaktiert markieren“)
- **Benachrichtigungen:** Browser-Push oder E-Mail bei neuem Lead (n8n → Mail/Webhook)
- **Dark/Light-Mode:** Toggle in Sidebar (Streamlit `st.theme`)

---

## 8. Nächste Schritte

1. **Priorisierung:** Welche Phase zuerst? (Empfehlung: 1 + 2 + 3 für schnellen Mehrwert)
2. **NocoDB:** Tabellen anlegen und API-Key für Dashboard bereitstellen
3. **MCP-NocoDB:** Prüfen, ob MCP-NocoDB für Lese-Zugriff genutzt werden kann (oder direkte REST-API)
4. **n8n:** Webhooks für Voice/Formulare konfigurieren und mit NocoDB verbinden
