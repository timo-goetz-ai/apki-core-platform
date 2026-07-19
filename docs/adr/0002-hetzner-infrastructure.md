# ADR 0002: Hetzner Cloud Infrastructure

**Status:** Accepted  
**Date:** 2026-07-20

## Problem / Context

Need production hosting for AIOS with data sovereignty (DSGVO), predictable costs, and full control over Docker services, MCP servers, and n8n.

## Decision

**Hetzner Cloud CPX42** (Nürnberg) + **Coolify** (self-hosted PaaS) + **Terraform** for DNS/firewall.

Alternatives considered:
- **AWS/GCP** — mature but ~€150–200+/mo for comparable setup
- **Vercel + managed DB** — fast DX but vendor lock-in, conflicts with self-hosting brand
- **Fly.io** — good for containers, less control over full homestack

## Consequences

- ✅ ~€25–40/mo fixed infra vs AWS €200+
- ✅ All data on EU server, Authentik SSO, own domains
- ✅ Coolify UI for deploys; GitHub Actions → GHCR → Coolify API
- ❌ Manual scaling — no auto-scaling groups
- ❌ Single-node SPOF until multi-node Coolify
- ❌ Ops burden: backups, updates, monitoring on us
