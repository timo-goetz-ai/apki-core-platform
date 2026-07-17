# Architektur

## System-Uebersicht

```
┌──────────────────────────────────────────────────────────┐
│                    Lokale Entwicklung                     │
│                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │  Terraform   │  │ Claude Code  │  │   n8n (lokal) │  │
│  │  IaC Layer   │  │  + MCP       │  │   Workflows   │  │
│  └──────┬───────┘  └──────┬───────┘  └───────┬───────┘  │
└─────────┼─────────────────┼──────────────────┼───────────┘
          │                 │                  │
          ▼                 ▼                  ▼
┌──────────────────────────────────────────────────────────┐
│                      Cloudflare                          │
│                                                          │
│  DNS Zone: automation-plus-ki.de                         │
│  13 A-Records -> <HETZNER_HOST>                          │
│  TXT: SPF + DMARC                                       │
└──────────────────────┬───────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────┐
│              Hetzner Cloud - CPX42                        │
│              8 vCPU · 16 GB RAM · 320 GB SSD             │
│              Ubuntu 24.04 · Nuremberg (nbg1)             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐  │
│  │                   Coolify PaaS                     │  │
│  │                                                    │  │
│  │  ┌──────────────┐  ┌──────────────────────────┐   │  │
│  │  │   Traefik    │  │      PostgreSQL (x2)      │   │  │
│  │  │   Reverse    │  │  n8n-db (15-alpine)       │   │  │
│  │  │   Proxy      │  │  saas-postgres (pgvector) │   │  │
│  │  │   + Let's    │  └──────────────────────────┘   │  │
│  │  │   Encrypt    │                                  │  │
│  │  └──────┬───────┘  ┌──────────────────────────┐   │  │
│  │         │          │      Application Layer    │   │  │
│  │         │          │                           │   │  │
│  │         ├─────────>│  n8n           :5678      │   │  │
│  │         ├─────────>│  NocoDB        :8080      │   │  │
│  │         ├─────────>│  Qdrant        :6333      │   │  │
│  │         ├─────────>│  Uptime Kuma   :3001      │   │  │
│  │         │          └──────────────────────────┘   │  │
│  │         │                                          │  │
│  │         │          ┌──────────────────────────┐   │  │
│  │         │          │      MCP Server Layer     │   │  │
│  │         │          │                           │   │  │
│  │         ├─────────>│  mcp-coolify     :3000    │   │  │
│  │         ├─────────>│  mcp-hetzner     :3000    │   │  │
│  │         ├─────────>│  mcp-cloudflare  :3000    │   │  │
│  │         ├─────────>│  mcp-google      :3000    │   │  │
│  │         └─────────>│  mcp-github      :3000    │   │  │
│  │                    └──────────────────────────┘   │  │
│  │                                                    │  │
│  │  ┌──────────────────────────────────────────────┐ │  │
│  │  │  Docker Volumes (persistent)                  │ │  │
│  │  │  n8n_data · postgres_data · saas_postgres_data│ │  │
│  │  │  saas_redis_data · qdrant_storage             │ │  │
│  │  │  uptime_kuma_data                             │ │  │
│  │  └──────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────┘  │
│                                                          │
│  Firewall: SSH (22) · HTTP (80) · HTTPS (443)            │
└──────────────────────────────────────────────────────────┘
```

## Netzwerk-Topologie

Alle Services laufen im Docker-Netzwerk `coolify` (extern).
Traefik routet basierend auf dem `Host`-Header:

| Subdomain | Service | Port |
|-----------|---------|------|
| `n8n.automation-plus-ki.de` | n8n | 5678 |
| `nocodb.automation-plus-ki.de` | NocoDB | 8080 |
| `qdrant.automation-plus-ki.de` | Qdrant | 6333 |
| `status.automation-plus-ki.de` | Uptime Kuma | 3001 |
| `coolify.automation-plus-ki.de` | Coolify UI | 8000 |
| `mcp-coolify.automation-plus-ki.de` | MCP Coolify | 3000 |
| `mcp-hetzner.automation-plus-ki.de` | MCP Hetzner | 3000 |
| `mcp-cloudflare.automation-plus-ki.de` | MCP Cloudflare | 3000 |
| `mcp-google.automation-plus-ki.de` | MCP Google | 3000 |
| `mcp-github.automation-plus-ki.de` | MCP GitHub | 3000 |
| `agent.automation-plus-ki.de` | Agent Hub | - |

## Datenbanken

| Datenbank | Image | Zweck | Zugang |
|-----------|-------|-------|--------|
| `n8n-db` | postgres:15-alpine | n8n Workflow-Daten | Intern (Docker) |
| `saas-postgres` | pgvector/pgvector:pg16 | NocoDB + SaaS-Daten | Port 5433 (extern) |
| `saas-redis` | redis:7-alpine | NocoDB Cache | Intern (Docker) |

## Sicherheits-Schichten

1. **Cloudflare:** DNS-only (kein Proxy), DNSSEC
2. **Hetzner Firewall:** Nur SSH, HTTP, HTTPS
3. **Traefik:** TLS-Terminierung via Let's Encrypt, Security-Header
4. **Coolify:** Automatische HTTPS-Zertifikate
5. **MCP Server:** API-Key-basierte Authentifizierung
6. **Datenbanken:** Keine externen Ports (ausser saas-postgres:5433)

## Terraform-verwaltete Ressourcen

```
Terraform State
├── module.server
│   ├── hcloud_ssh_key.deploy
│   └── hcloud_server.main
├── module.firewall
│   ├── hcloud_firewall.main
│   └── hcloud_firewall_attachment.main
└── module.dns
    ├── cloudflare_record.a_records["@"]
    ├── cloudflare_record.a_records["www"]
    ├── cloudflare_record.a_records["n8n"]
    ├── cloudflare_record.a_records["nocodb"]
    ├── cloudflare_record.a_records["qdrant"]
    ├── cloudflare_record.a_records["coolify"]
    ├── cloudflare_record.a_records["status"]
    ├── cloudflare_record.a_records["agent"]
    ├── cloudflare_record.a_records["mcp-coolify"]
    ├── cloudflare_record.a_records["mcp-hetzner"]
    ├── cloudflare_record.a_records["mcp-cloudflare"]
    ├── cloudflare_record.a_records["mcp-google"]
    ├── cloudflare_record.a_records["mcp-github"]
    ├── cloudflare_record.txt_records["@"]        (SPF)
    └── cloudflare_record.txt_records["_dmarc"]   (DMARC)
```
