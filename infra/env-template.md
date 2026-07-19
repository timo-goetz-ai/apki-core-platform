# Environment Variables Template

Copy the relevant sections to your `.env` files. **NEVER commit actual values.**
All secrets should be generated fresh on each deployment.

---

## Homestack (`/srv/automation-plus-ki/stacks/homestack/.env`)

### General

```env
ENVIRONMENT=production
DOMAIN=automation-plus-ki.de
```

### Database – PostgreSQL

```env
POSTGRES_PASSWORD=         # Main PostgreSQL superuser password (strong, 32+ chars)
POSTGRES_USER=postgres     # Superuser name
POSTGRES_HOST=homestack-postgres
POSTGRES_PORT=5432
```

### Database – Per-service credentials

```env
AIOS_DB_USER=aios_user
AIOS_DB_PASSWORD=          # aios_db service account password
AIOS_DB_NAME=aios_db

N8N_DB_USER=n8n_user
N8N_DB_PASSWORD=           # n8n PostgreSQL password
N8N_DB_NAME=n8n

NOCODB_DB_USER=nocodb_user
NOCODB_DB_PASSWORD=        # NocoDB PostgreSQL password
NOCODB_DB_NAME=nocodb

GRAFANA_DB_USER=grafana_user
GRAFANA_DB_PASSWORD=       # Grafana PostgreSQL password
GRAFANA_DB_NAME=grafana

AUTHENTIK_DB_USER=authentik_user
AUTHENTIK_DB_PASSWORD=     # Authentik PostgreSQL password
AUTHENTIK_DB_NAME=authentik
```

### Redis

```env
REDIS_URL=redis://homestack-redis:6379/0
REDIS_PASSWORD=            # Redis AUTH password (optional but recommended)
```

### n8n

```env
N8N_ENCRYPTION_KEY=        # 64-char random hex — protects stored credentials
N8N_USER_MANAGEMENT_JWT_SECRET=  # 64-char random hex
N8N_BASIC_AUTH_USER=       # Basic auth username (if enabled)
N8N_BASIC_AUTH_PASSWORD=   # Basic auth password
N8N_HOST=n8n.automation-plus-ki.de
N8N_PROTOCOL=https
N8N_API_KEY=               # n8n API key for external access
```

### Authentik SSO

```env
AUTHENTIK_SECRET_KEY=      # 64-char random hex — Django secret key
AUTHENTIK_BOOTSTRAP_EMAIL= # Initial superuser email
AUTHENTIK_BOOTSTRAP_PASSWORD=  # Initial superuser password (change after first login)
AUTHENTIK_API_TOKEN=       # API access token (generate in Authentik UI after setup)
AUTHENTIK_HOST=auth.automation-plus-ki.de
```

### NocoDB

```env
NC_AUTH_JWT_SECRET=        # JWT signing secret (32+ chars)
NC_ADMIN_EMAIL=            # NocoDB admin email
NC_ADMIN_PASSWORD=         # NocoDB admin password
NC_DB=pg://homestack-postgres:5432?u=nocodb_user&p=...&d=nocodb
```

### NocoDB – S3 Storage (Hetzner Object Storage)

```env
NC_S3_BUCKET_NAME=noco-aios
NC_S3_REGION=fsn1
NC_S3_ENDPOINT=https://fsn1.your-objectstorage.com
NC_S3_ACCESS_KEY=          # Hetzner Object Storage access key ID
NC_S3_ACCESS_SECRET=       # Hetzner Object Storage secret key
```

### Grafana

```env
GF_SECURITY_ADMIN_USER=admin
GF_SECURITY_ADMIN_PASSWORD=     # Grafana admin password
GF_DATABASE_TYPE=postgres
GF_DATABASE_HOST=homestack-postgres:5432
GF_DATABASE_NAME=grafana
GF_DATABASE_USER=grafana_user
GF_DATABASE_PASSWORD=           # Same as GRAFANA_DB_PASSWORD
GF_SERVER_ROOT_URL=https://grafana.automation-plus-ki.de
```

### Qdrant

```env
QDRANT_API_KEY=            # Qdrant REST API key (optional, enable in config)
```

### Ollama

```env
OLLAMA_HOST=0.0.0.0
OLLAMA_ORIGINS=*
# No auth by default — keep internal, do not expose publicly
```

### Nexus Core API (FastAPI, früher „Nexus Core“)

Variablennamen entsprechen `pydantic-settings` (`database_url` → `DATABASE_URL`, usw.).

```env
DATABASE_URL=postgresql+asyncpg://aios_user:...@homestack-postgres:5432/aios_db
REDIS_URL=redis://homestack-redis:6379/0
AIOS_TOKEN=                # Pflicht in Prod: Header x-aios-token für geschützte Routen
CREW_API_URL=http://crew-api:8002   # interner Crew-API-Base-URL (Port je nach Deploy anpassen)
OPENROUTER_API_KEY=        # OpenRouter API key
ANTHROPIC_API_KEY=         # Anthropic direct API key
OPENAI_API_KEY=            # OpenAI API key (optional)
OLLAMA_BASE_URL=http://ollama:11434
```

---

## Admin Dashboard (set as Coolify environment variables)

```env
# LLM Providers (Multi-Orchestrator: OpenRouter · Ollama · SauerkrautLM)
OPENROUTER_API_KEY=        # OpenRouter (kostenlose Modelle, Tool-Calling)
ANTHROPIC_API_KEY=         # Anthropic Claude direct API
GOOGLE_AI_API_KEY=         # Google AI Studio (Gemini)
OPENAI_API_KEY=            # OpenAI (optional)
OLLAMA_BASE_URL=           # Ollama API (z.B. http://ollama:11434) — für SauerkrautLM: ollama pull sauerkrautlm

# Internal API
NEXT_PUBLIC_AIOS_CORE_API_URL=https://api.automation-plus-ki.de
NEXT_PUBLIC_WS_URL=wss://api.automation-plus-ki.de

# Infrastructure APIs
COOLIFY_API_KEY=           # Coolify API key (Settings → API Keys)
COOLIFY_BASE_URL=https://coolify.automation-plus-ki.de
CLOUDFLARE_API_TOKEN=      # Cloudflare DNS management token

# Service APIs
N8N_API_KEY=               # n8n workflow API key
N8N_BASE_URL=https://n8n.automation-plus-ki.de
NOCODB_API_TOKEN=          # NocoDB API token
NOCODB_BASE_URL=https://nocodb.automation-plus-ki.de
GRAFANA_API_KEY=           # Grafana service account token
GRAFANA_URL=https://grafana.automation-plus-ki.de
PROMETHEUS_URL=https://prometheus.automation-plus-ki.de
AUTHENTIK_API_TOKEN=       # Authentik API token

# AI / Vector
OLLAMA_BASE_URL=http://ollama:11434
QDRANT_URL=http://homestack-qdrant:6333
QDRANT_API_KEY=            # Optional Qdrant API key

# Node env
NODE_ENV=production
```

---

## MCP Servers (each set as Coolify environment variable per app)

```env
# mcp-github
GITHUB_TOKEN=              # GitHub PAT with repo scope

# mcp-cloudflare
CLOUDFLARE_API_TOKEN=      # Cloudflare API token

# mcp-coolify
COOLIFY_API_KEY=           # Coolify API key
COOLIFY_BASE_URL=https://coolify.automation-plus-ki.de

# mcp-filesystem
# (configured with allowed paths, no secret needed)

# mcp-grafana
GRAFANA_URL=https://grafana.automation-plus-ki.de
GRAFANA_API_KEY=           # Grafana service account token

# mcp-hetzner
HETZNER_API_TOKEN=         # Hetzner Cloud API token

# mcp-n8n
N8N_API_KEY=               # n8n API key
N8N_BASE_URL=https://n8n.automation-plus-ki.de

# mcp-nocodb
NOCODB_API_TOKEN=          # NocoDB API token
NOCODB_BASE_URL=https://nocodb.automation-plus-ki.de

# mcp-postgres
DATABASE_URL=postgresql://aios_user:...@homestack-postgres:5432/aios_db

# mcp-prometheus
PROMETHEUS_URL=http://homestack-prometheus:9090

# mcp-qdrant
QDRANT_URL=http://homestack-qdrant:6333
QDRANT_API_KEY=            # Optional

# mcp-authentik
AUTHENTIK_URL=https://auth.automation-plus-ki.de
AUTHENTIK_API_TOKEN=       # Authentik API token

# mcp-google
GOOGLE_CLIENT_ID=          # Google OAuth2 client ID
GOOGLE_CLIENT_SECRET=      # Google OAuth2 client secret
GOOGLE_REFRESH_TOKEN=      # OAuth2 refresh token
```

---

## Secret Generation Reference

```bash
# 64-char random hex (for encryption keys, JWT secrets)
openssl rand -hex 32

# 32-char random alphanumeric
openssl rand -base64 24 | tr -dc 'a-zA-Z0-9' | head -c 32

# UUID
uuidgen | tr '[:upper:]' '[:lower:]'
```
