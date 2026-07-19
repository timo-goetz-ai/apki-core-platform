# Infrastructure Costs

Stand: 2026-07-20 · Self-hosted auf Hetzner

## Monthly

| Item | Cost | Notes |
|------|------|-------|
| Hetzner CPX42 VPS | ~€20–35 | 8 vCPU, 16 GB RAM, Nürnberg |
| Postgres (self-hosted) | €0* | Im Docker-Stack auf VPS |
| Object Storage / Backups | ~€5 | Hetzner Volume optional |
| Domain (Cloudflare) | ~€1 | DNS-only |
| LLM APIs (OpenRouter/Gemini) | variabel | Pay-per-use, ~€10–50 je nach Last |
| **TOTAL (Infra)** | **~€25–40/mo** | ~€300–480/year |

\* Managed Postgres würde ~€15/mo extra kosten — aktuell self-hosted im Stack.

## Scaling Path

| Users / Load | Estimated Cost | Notes |
|--------------|----------------|-------|
| Solo / Dev | €40 ✅ | Aktueller Stand (1× CPX42) |
| 1K users | €60–80 | Größerer VPS oder DB-Tuning |
| 10K users | €150–250 | Multi-node Coolify, managed DB |
| 100K users | €500+ | K8s oder Multi-Region, CDN, HA Postgres |

## Cost vs. Cloud (Reference)

| Provider | Comparable setup | Monthly |
|----------|------------------|---------|
| Hetzner (current) | CPX42 + self-hosted | ~€35 |
| AWS (ECS + RDS) | 2× t3.medium + db.t3.small | ~€150–200+ |
| Vercel + Supabase | Pro tiers | ~€50–100+ (vendor lock-in) |
