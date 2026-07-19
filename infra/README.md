# Infrastructure Guide – Automation + KI Platform

> Last updated: 2026-03-17
> Platform: automation-plus-ki.de
> Repo: github.com/TimoGoetz1988/aios (private)

---

## Server

| Property | Value |
|----------|-------|
| Provider | Hetzner Cloud |
| Type | CPX42 |
| CPU | 8 vCPU (AMD) |
| RAM | 16 GB |
| Disk | 240 GB SSD |
| IPv4 | <HETZNER_HOST> |
| OS | Ubuntu 22.04 LTS |
| Runtime | Docker + Coolify |

---

## Architecture Overview

```
Internet
   │
   ▼
Cloudflare (DNS + CDN)
   │  All subdomains → A → <HETZNER_HOST>
   ▼
Traefik (reverse proxy, managed by Coolify)
   │  /data/coolify/proxy/dynamic/  (custom routes)
   │  TLS via Let's Encrypt (ACME)
   ▼
┌─────────────────────────────────────────────┐
│  Coolify (management plane)                 │
│  ┌──────────────────────────────────────┐   │
│  │  homestack Docker Compose network    │   │
│  │  /srv/automation-plus-ki/stacks/     │   │
│  │  homestack/docker-compose.yml        │   │
│  └──────────────────────────────────────┘   │
└─────────────────────────────────────────────┘
```

---

## Services

### Core Platform

| Service | Deployment | URL | Image / Container |
|---------|-----------|-----|-------------------|
| Admin Dashboard | Coolify App (Docker Image) | https://admin.automation-plus-ki.de | ghcr.io/timogoetz1988/aios-admin-dashboard:latest |
| AIOS-Core API | homestack Docker Compose | https://api.automation-plus-ki.de | nexus-core |
| Crew API | homestack Docker Compose | internal | aios-crew-api |

### Automation & Data

| Service | Deployment | URL | Container |
|---------|-----------|-----|-----------|
| n8n | homestack Docker Compose | https://n8n.automation-plus-ki.de | homestack-n8n |
| NocoDB | Coolify App | https://nocodb.automation-plus-ki.de | sow4k0go0swkssgokk84wwwg |
| AppFlowy | Coolify Service | https://appflowy.automation-plus-ki.de | o8cgss00s00swcckwccs8skc |

### Observability

| Service | Deployment | URL | Container |
|---------|-----------|-----|-----------|
| Grafana | homestack Docker Compose | https://grafana.automation-plus-ki.de | homestack-grafana |
| Prometheus | homestack Docker Compose | https://prometheus.automation-plus-ki.de | homestack-prometheus |

### AI / ML

| Service | Deployment | URL | Container |
|---------|-----------|-----|-----------|
| Ollama | Docker (standalone) | internal: http://ollama:11434 | ollama |
| Qdrant | homestack Docker Compose | https://qdrant.automation-plus-ki.de | homestack-qdrant |

### Auth & Security

| Service | Deployment | URL | Container |
|---------|-----------|-----|-----------|
| Authentik SSO | homestack Docker Compose | https://auth.automation-plus-ki.de | homestack-authentik-server, homestack-authentik-worker |

### Infrastructure

| Service | Deployment | URL | Container |
|---------|-----------|-----|-----------|
| Coolify | Docker (self-managed) | https://coolify.automation-plus-ki.de | coolify |
| Traefik | Managed by Coolify | (internal) | coolify-proxy |

### MCP Servers (19x, all Coolify Apps)

| MCP Server | Coolify App ID | URL |
|-----------|---------------|-----|
| mcp-authentik | s0gkg4404wso8c00o80wc8w0 | https://mcp-authentik.automation-plus-ki.de |
| mcp-cloudflare | lk448ww08sccc4wg8ccog8oo | https://mcp-cloudflare.automation-plus-ki.de |
| mcp-coolify | d8gwgokgk08w8wg00g48gkgo | https://mcp-coolify.automation-plus-ki.de |
| mcp-filesystem | so8ggg0wwc4k4k0o0cs8sgoo | https://mcp-filesystem.automation-plus-ki.de |
| mcp-github | n0wg88os8g04g84c08w4g8gw | https://mcp-github.automation-plus-ki.de |
| mcp-google | jokwo0ws4owcc4ssww0co4s0 | https://mcp-google.automation-plus-ki.de |
| mcp-grafana | oc0kwwkws0844o04wc8448kw | https://mcp-grafana.automation-plus-ki.de |
| mcp-hetzner | nos84kwk80ckw04gw844s4w8 | https://mcp-hetzner.automation-plus-ki.de |
| mcp-n8n | qoo8sww8s4swwskkwkc0s0gw | https://mcp-n8n.automation-plus-ki.de |
| mcp-nocodb | igs4cckosw0go4scgwoso48w | https://mcp-nocodb.automation-plus-ki.de |
| mcp-postgres | xsw0co8wsgog8kwkg40s0oow | https://mcp-postgres.automation-plus-ki.de |
| mcp-prometheus | hgsokgoccg0cw88okw44ggk0 | https://mcp-prometheus.automation-plus-ki.de |
| mcp-qdrant | yswo4w8ggs0kg8o8g4sogk88 | https://mcp-qdrant.automation-plus-ki.de |

---

## Databases

All databases run inside the `homestack` Docker Compose network.

### PostgreSQL (`homestack-postgres:5432`)

| Database | Used by |
|----------|---------|
| aios_db | AIOS-Core API |
| n8n | n8n workflows |
| nocodb | NocoDB |
| grafana | Grafana |
| authentik | Authentik SSO |
| vaultwarden | Vaultwarden (if deployed) |

### Redis (`homestack-redis:6379`)

Used by: n8n, Authentik, Crew API session caching

### Qdrant (`homestack-qdrant:6333`)

Used by: AI agents, vector search, semantic memory

---

## DNS (Cloudflare)

All subdomains use a single A record pointing to the server IP.

```
*.automation-plus-ki.de  →  A  →  <HETZNER_HOST>
```

Managed via Cloudflare API. Token required with `Zone:DNS:Edit` permission.

---

## Reverse Proxy (Traefik)

Traefik is managed and restarted by Coolify. Custom routes live at:

```
/data/coolify/proxy/dynamic/
```

- TLS termination via Let's Encrypt (ACME, HTTP-01 challenge)
- All HTTP → HTTPS redirects handled by Traefik middleware
- Internal service-to-service calls use Docker network DNS (no TLS needed)

---

## CI/CD (GitHub Actions)

Workflows in `.github/workflows/`:

| Workflow | Trigger | Purpose |
|---------|---------|---------|
| `build-and-push.yml` | push to main | Build Docker image, push to GHCR |
| `deploy-prod.yml` | push to main | Trigger Coolify webhook deploy |
| `deploy-staging.yml` | push to develop | Deploy to staging environment |
| `ci.yml` | PR | Lint, type-check, tests |

Docker images are published to: `ghcr.io/timogoetz1988/`

---

## Object Storage (Hetzner)

- Provider: Hetzner Object Storage
- Region: fsn1
- Endpoint: `https://fsn1.your-objectstorage.com`
- Bucket (NocoDB): `noco-aios`
- Protocol: S3-compatible API

---

## File Layout on Server

```
/
├── data/coolify/           # Coolify data, Traefik config
│   └── proxy/dynamic/      # Custom Traefik route files
├── srv/automation-plus-ki/
│   └── stacks/
│       └── homestack/
│           ├── docker-compose.yml
│           └── .env
└── var/lib/docker/         # Docker volumes
```
