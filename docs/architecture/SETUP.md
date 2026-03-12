# Setup: KI-Bewerbungs-Automation

## Voraussetzungen (erfüllt)

- N8n: `homestack-n8n` (Coolify)
- NocoDB: `homestack-nocodb` (Coolify)
- SSH: `ssh hetzner`

## MCP-Server (Cursor Settings → MCP aktivieren)

Alle Server: automation-plus-ki.de. Konfiguration: `Desktop/01_Command_Center/03_Agents/06_mcp-config/mcp.json`

| Server | Zweck |
|--------|-------|
| **mcp-nocodb** | Tabellen, Records, Seed-Daten |
| **mcp-infra** | N8n-Workflows, Trigger, Status |
| **mcp-docker** | Container (N8n, NocoDB, Coolify) |
| **mcp-database** | PostgreSQL (NocoDB-Backend) |
| **mcp-hetzner** | Server, Ressourcen |
| **mcp-grafana** | Dashboards, Monitoring |
| **mcp-nextcloud** | Dateien, Reports |
| **mcp-gitops** | Workflow-JSON versionieren |

**NocoDB:** Schema nur in UI – Records per `nocodb_create_record` etc.

## Setup-Reihenfolge

1. NocoDB: Base + Tabellen anlegen  
2. N8n: Credentials (NocoDB + SMTP) anlegen  
3. N8n: Workflow importieren, Credentials zuweisen  

---

## Schritte

### 1. NocoDB: Base und Tabellen anlegen

**Option A – Setup-Script (empfohlen):**

```bash
cd 03_AI_Engineering
pip install -r scripts/requirements.txt
export NOCODB_URL="https://nocodb.deine-domain.de"   # Coolify-URL zu NocoDB
export NOCODB_TOKEN="..."                            # NocoDB → Account → Tokens → Create
python scripts/setup_nocodb.py
```

Das Script erstellt Base, Tabellen und seedet platforms. Base-ID und Table-IDs werden ausgegeben.

**Option B – Manuell:**

1. NocoDB öffnen (über Coolify-URL)
2. Neue Base: **Bewerbungs-Automation**
3. Tabellen manuell anlegen gemäß `nocodb/schema/*.md`:
   - keywords
   - platforms
   - jobs
   - matches
   - applications
   - activity_log
   - insights
4. Links zwischen Tabellen setzen (job → platform, match → job, application → match)
5. Views: Kanban für `matches` (nach match_category), für `applications` (nach status)
6. API Token: Account (Avatar) → Tokens → Create Token

### 2. Seed-Daten importieren

- **platforms**: CSV aus `nocodb/seed/platforms_initial.csv` in NocoDB importieren
- **keywords**: Aus `research/MASTER_KEYWORDS.md` manuell oder per Bulk-Import

### 3. N8n: Credentials anlegen

**Pflicht (Reihenfolge):**

1. **NocoDB API Token**
   - NocoDB → Account → Tokens → Create Token
   - In N8n: Credential „NocoDB API“ → URL + Token (später austauschbar)

2. **SMTP (SMTP2Go)** – für E-Mail-Benachrichtigungen
   - Host: `mail-eu.smtp2go.com`
   - Port: `2525` (TLS) oder `465` (SSL)
   - User/Pass: SMTP2Go-Login
   - Details: [docs/CREDENTIALS.md](CREDENTIALS.md)

**Optional:** OpenAI/Claude, Apify

### 4. N8n: Workflows importieren

1. N8n öffnen (Coolify-URL)
2. Menü (⋮) → Import from File → `n8n/workflows/01_research_jobs.json`
3. **NocoDB-Node** „Job speichern“: Credential zuweisen, Base-ID + Table-ID eintragen
4. **SMTP** wird für Workflow 04 (Notifications) benötigt – Credential vorher anlegen

### 5. Docker-Compose (optional)

Falls du eine **separate** Instanz für dieses Projekt willst (statt Homestack):

```bash
cd docker
cp .env.example .env
# .env bearbeiten
docker compose up -d
```

## Nächste Schritte

- Apify-Integration für StepStone/Indeed (kostenpflichtig)
- Oder: Manuelle Job-URLs als Input
- Workflow 02: Keyword-Extraktion (LLM)
- Workflow 03: Matching & Scoring
- Workflow 04: Notifications
