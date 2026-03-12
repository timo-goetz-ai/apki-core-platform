# Einstieg: 01_Infrastructure

**Homestack + MCP-Stack Configs**

---

## Überblick

| | |
|---|---|
| **Ziel** | 24-Service Docker-Infrastruktur, 18 MCP-Server |
| **Status** | Production ✅ |
| **Owner** | Timo |

---

## Komponenten

- **Homestack:** n8n, NocoDB, Authentik, Vaultwarden, Qdrant, Redis, Prometheus, Grafana, Loki, PostgreSQL
- **MCP Stack:** github, cloudflare, hetzner, coolify, n8n, postgres, nocodb, qdrant, grafana...
- **Host:** Hetzner 46.224.145.109 (Coolify)

---

## Struktur

- **Tasks** → Infrastruktur-Tasks
- **Configs** → Docker Compose, Coolify-Configs
- **Ergebnis** → Runbooks, Setup-Guides

---

## Links

- ARCHITECTURE → docs/ARCHITECTURE
- SERVICES → docs/SERVICES
