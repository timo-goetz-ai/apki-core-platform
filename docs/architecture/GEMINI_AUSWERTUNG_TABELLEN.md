# Auswertung: Gemini-Input → Tabellen & Resultat

**Quelle:** Gemini-Konversation (Services-Übersicht, Framework-Vergleich, Cursor-Prompt)  
**Stand:** 07.03.2026

---

## 1. Services — automation-plus-ki.de (konsolidiert)

**Server:** `<HETZNER_HOST>` (Hetzner) | HTTPS: Cloudflare + Traefik

### 1.1 Alle Services in einer Tabelle

| Kategorie        | Service      | URL | Zugriff | Nutzen |
|------------------|-------------|-----|---------|--------|
| Core             | Dashboard   | dashboard.automation-plus-ki.de | Authentik SSO (`akadmin` / `Homestack2026`) | Zentrales Übersichts-Dashboard |
| Core             | Authentik   | auth.automation-plus-ki.de | `akadmin` / `Homestack2026` (direkt) | Identity Provider / SSO |
| Core             | Coolify     | coolify.automation-plus-ki.de | **Nur Tailscale** (100.124.39.4) | Container-Management, Deployments |
| Automation       | n8n         | n8n.automation-plus-ki.de | Authentik → n8n: `admin@automation-plus-ki.de` / `Homestack2026` | Workflow-Automation |
| Automation       | NocoDB      | nocodb.automation-plus-ki.de | Authentik SSO | No-Code DB-UI |
| Automation       | Nextcloud   | nextcloud.automation-plus-ki.de | Authentik SSO | Datei-Cloud, Kalender, Kontakte |
| Monitoring       | Grafana     | grafana.automation-plus-ki.de | Authentik SSO | Dashboards (CPU, RAM, Container, Logs) |
| Monitoring       | Prometheus  | prometheus.automation-plus-ki.de | Authentik SSO | Metrics-Sammlung |
| Tools            | Vaultwarden | vault.automation-plus-ki.de | SSO via Authentik (OIDC) | Password Manager |
| Tools            | Hoppscotch  | hoppscotch.automation-plus-ki.de | Account + Mailpit-Bestätigung | API-Client (Postman-Ersatz) |
| Tools            | Mailpit     | mail.automation-plus-ki.de | Kein Auth | SMTP-Catcher |
| Tools            | Steel Browser | steel.automation-plus-ki.de | Authentik SSO | Browser-Automation / Playwright |
| Tools            | Qdrant      | qdrant.automation-plus-ki.de | Authentik SSO | Vector-DB (RAG, AI) |
| AI Voice         | Voice API   | voice.automation-plus-ki.de | JWT Bearer | STT → LLM → TTS (Twilio + fish.audio) |
| AI Voice         | Voice Health | voice.automation-plus-ki.de/health | Kein Auth | Health-Check |
| AI Voice         | Voice Docs  | voice.automation-plus-ki.de/docs | Kein Auth | OpenAPI / Swagger |

### 1.2 MCP-Server (einheitliche Tabelle)

| Server        | URL | Funktion |
|---------------|-----|----------|
| mcp-coolify   | mcp-coolify.automation-plus-ki.de   | Coolify API (Deploy, Status, Logs) |
| mcp-hetzner   | mcp-hetzner.automation-plus-ki.de   | Hetzner Cloud (Server, Firewall, Volumes) |
| mcp-cloudflare| mcp-cloudflare.automation-plus-ki.de| Cloudflare (DNS, Zones, Records) |
| mcp-github    | mcp-github.automation-plus-ki.de    | GitHub (Repos, Issues, PRs) |
| mcp-google    | mcp-google.automation-plus-ki.de    | Google Workspace (Drive, Sheets, Calendar) |
| mcp-filesystem| mcp-filesystem.automation-plus-ki.de| Server-Dateisystem (/opt/mcp-ops, /var/log) |
| mcp-postgres  | mcp-postgres.automation-plus-ki.de  | PostgreSQL (n8n DB) |
| mcp-grafana   | mcp-grafana.automation-plus-ki.de   | Grafana (Dashboards, Alerts) |
| mcp-prometheus| mcp-prometheus.automation-plus-ki.de| Prometheus (PromQL, Metrics) |
| mcp-authentik | mcp-authentik.automation-plus-ki.de | Authentik (User, Groups, Flows) |
| mcp-qdrant    | mcp-qdrant.automation-plus-ki.de    | Qdrant (Collections, Embeddings) |
| mcp-nocodb    | mcp-nocodb.automation-plus-ki.de    | NocoDB (Tabellen, Records) |
| mcp-nextcloud | mcp-nextcloud.automation-plus-ki.de | Nextcloud (Dateien, Kalender) |
| mcp-vaultwarden | mcp-vaultwarden.automation-plus-ki.de | Vaultwarden (Secrets) |
| mcp-n8n       | mcp-n8n.automation-plus-ki.de       | n8n (Workflows, Executions) |

*Hinweis: Alle MCP-Server Bearer-Token-geschützt; API-Keys nicht in dieser Tabelle (Sicherheit).*

### 1.3 Login-Übersicht

| Was              | Credentials |
|------------------|-------------|
| Authentik Admin  | `akadmin` / `Homestack2026` |
| n8n (nach SSO)   | `admin@automation-plus-ki.de` / `Homestack2026` |
| Vaultwarden      | SSO via Authentik (kein Passwort-Login) |
| Nextcloud        | SSO via Authentik |
| Coolify          | Nur über Tailscale-IP `100.124.39.4` |

### 1.4 Infra-Zugang

| Typ        | Befehl / URL |
|------------|--------------|
| SSH        | `ssh -i ~/.ssh/id_ed25519_hetzner_coolify root@<HETZNER_HOST>` |
| Coolify API| Bearer-Token in Header; Basis-URL: `https://coolify.automation-plus-ki.de/api/v1/` |

---

## 2. Framework-Vergleich (Dashboard / Data-Apps)

### 2.1 Kategorisiert

| Kategorie              | Tool           | Fokus | Lernkurve   | Flexibilität |
|------------------------|----------------|-------|-------------|--------------|
| Data Science / Dashboard | Streamlit    | Schnelle Prototypen | Sehr flach | Mittel |
| Data Science / Dashboard | Plotly Dash  | Komplexe Dashboards | Mittel–Hoch | Hoch |
| Data Science / Dashboard | Shiny for Python | Reaktive Daten-Apps | Mittel | Hoch |
| Data Science / Dashboard | NiceGUI      | Moderne UI (Quasar/Vue) | Flach | Hoch |
| Web-Framework          | FastAPI + JS  | Custom Web-Apps, API | Hoch | Maximal |
| Web-Framework          | Django        | All-in-One, Admin, DB | Hoch | Hoch |
| Low-Code BI            | Metabase / Superset | BI / SQL-Reporting | Sehr flach | Niedrig |

### 2.2 Empfehlungsmatrix („Was wählen?“)

| Ziel | Empfehlung |
|------|------------|
| Schnell Dashboard für Kollegen | Streamlit oder NiceGUI |
| Komplexe App mit vielen Abhängigkeiten | Shiny for Python |
| Produkt mit Login, professionelles Frontend | FastAPI + Frontend-Framework |
| Nur visualisieren, wenig Code | Metabase / Superset |

---

## 3. Gemini-Empfehlung: Streamlit für Agent Control Center

| Kriterium | Begründung |
|-----------|------------|
| Schnelligkeit | Sehr schnelle Entwicklung; passt zu Coolify/Authentik-Setup |
| Python-Integration | Agent-Logik und UI in einer Sprache; keine tiefe JS-Kenntnis nötig |
| Architektur-Fit | dashboard.automation-plus-ki.de bereits als zentrales Panel geplant |
| Fallback | Bei Grenzen: NiceGUI oder Plotly Dash |

---

## 4. Cursor-Prompt (für Composer)

Der von Gemini vorgeschlagene Prompt zielt auf:

| Schritt | Inhalt |
|--------|--------|
| 1. Analyse | Architektur-Dateien lesen; Dashboard-URL + Authentik OIDC verstehen |
| 2. Aufgabe | `dashboard.py` (Streamlit), Authentik/OIDC-Integration, Layout aus „Struktur. Authentic.txt“ |
| 3. Layout | Sidebar (N8N, NocoDB, Grafana), Agent-Status-Cards, Live-Task-Feed (Platzhalter) |
| 4. Anforderungen | Modular, `st.session_state` für User, modernes UI, Coolify-Port beachten |
| 5. Ergebnis | Vollständiger Code `dashboard.py`, `requirements.txt`, Hinweis für Client-ID/Secret in Authentik |

---

## 5. Resultat / Was daraus folgt

| Aspekt | Konsequenz |
|--------|------------|
| **Dokumentation** | Services und MCP-Server sind jetzt in wenigen Tabellen abbildbar; eine Master-Datei (z. B. diese) kann als Referenz für Cursor und für künftige Automatisierungen dienen. |
| **Technologie-Entscheidung** | Streamlit ist die sinnvolle Basis für das Agent Control Center; Wechsel nur nötig, wenn sehr komplexe Interaktivität oder eigenes Frontend-Design im Vordergrund stehen. |
| **Nächster Schritt** | Cursor-Prompt (Abschnitt 4) im Composer ausführen – mit Verweis auf die Architektur-Dateien (z. B. „Struktur. Authentic.txt“, „Letzter Stand.txt“) und diese Auswertung als Kontext. |
| **Sicherheit** | Zugangsdaten und API-Keys nicht in Repos oder Chat-Logs; nur Platzhalter/Hinweise im Code (z. B. „Client-ID/Secret aus Authentik hier eintragen“). |

**Kurz:** Die Gemini-Ausgabe ist in Tabellen überführt; die Empfehlung „Streamlit + Authentik + Cursor-Prompt“ ist schlüssig und umsetzbar – nächster konkreter Schritt: Prompt in Cursor einfügen und `dashboard.py` plus `requirements.txt` generieren lassen.
