# Fresh Deploy Guide – Automation + KI Platform

This guide covers a complete redeploy from a fresh Hetzner server to a fully running platform.

---

## Prerequisites

- [ ] Hetzner CPX42 server with Ubuntu 22.04 LTS (IP assigned)
- [ ] Domain `automation-plus-ki.de` DNS pointing to server IP in Cloudflare
- [ ] GitHub repo access: `TimoGoetz1988/aios` (private, PAT token ready)
- [ ] GHCR write access for `ghcr.io/timogoetz1988/`
- [ ] Cloudflare API token (`Zone:DNS:Edit`)
- [ ] All secrets from `infra/env-template.md` prepared
- [ ] SSH key added to server

---

## Step 1: Initial Server Setup

```bash
ssh root@<HETZNER_HOST>

# System updates
apt-get update && apt-get upgrade -y
apt-get install -y curl git htop

# Create directory structure
mkdir -p /srv/automation-plus-ki/stacks/homestack
```

---

## Step 2: Install Coolify

```bash
curl -fsSL https://cdn.coollabs.io/coolify/install.sh | bash
```

After installation, Coolify is available at `http://<server-ip>:8000`.

- Create admin account
- Set `FQDN` to `coolify.automation-plus-ki.de`
- Coolify will auto-configure Traefik as reverse proxy

---

## Step 3: Configure Cloudflare DNS

Add a wildcard A record in Cloudflare:

```
*.automation-plus-ki.de  →  A  →  <HETZNER_HOST>  (proxied: false / DNS only)
automation-plus-ki.de    →  A  →  <HETZNER_HOST>
```

Or use the Cloudflare MCP / API to batch-create records.

---

## Step 4: Configure Coolify Sources & Registry

In Coolify UI (`Settings → Sources`):

1. Add GitHub source: Personal Access Token with `repo` + `read:packages` scope
2. Add GHCR registry: `ghcr.io`, username `timogoetz1988`, PAT as password

---

## Step 5: Deploy Homestack (Docker Compose)

Copy the homestack compose file to the server and start it:

```bash
# On server
cd /srv/automation-plus-ki/stacks/homestack

# Create .env from template (fill all values first!)
cp /path/to/env-template .env
nano .env

# Start all homestack services
docker compose up -d

# Verify all containers are running
docker compose ps
```

Homestack includes: PostgreSQL, Redis, n8n, Grafana, Prometheus, Authentik, Qdrant, AIOS-Core API, Crew API, Ollama.

---

## Step 6: Deploy Coolify Apps

For each Coolify-managed app, either re-import via Coolify UI or use the Coolify API:

### Admin Dashboard

- Source: `ghcr.io/timogoetz1988/aios-admin-dashboard:latest`
- Port: 3000
- Domain: `admin.automation-plus-ki.de`
- Set all env vars from `infra/env-template.md` (Admin Dashboard section)

### NocoDB

- Coolify App ID: `sow4k0go0swkssgokk84wwwg`
- Domain: `nocodb.automation-plus-ki.de`
- Requires: PostgreSQL running, S3 bucket accessible

### AppFlowy

- Coolify Service ID: `o8cgss00s00swcckwccs8skc`
- Domain: `appflowy.automation-plus-ki.de`

---

## Step 7: Deploy MCP Servers (19x)

Each MCP server is a Coolify App. Deploy in order:

```
mcp-filesystem   → so8ggg0wwc4k4k0o0cs8sgoo
mcp-postgres     → xsw0co8wsgog8kwkg40s0oow
mcp-github       → n0wg88os8g04g84c08w4g8gw
mcp-cloudflare   → lk448ww08sccc4wg8ccog8oo
mcp-coolify      → d8gwgokgk08w8wg00g48gkgo
mcp-n8n          → qoo8sww8s4swwskkwkc0s0gw
mcp-nocodb       → igs4cckosw0go4scgwoso48w
mcp-grafana      → oc0kwwkws0844o04wc8448kw
mcp-prometheus   → hgsokgoccg0cw88okw44ggk0
mcp-qdrant       → yswo4w8ggs0kg8o8g4sogk88
mcp-hetzner      → nos84kwk80ckw04gw844s4w8
mcp-authentik    → s0gkg4404wso8c00o80wc8w0
mcp-google       → jokwo0ws4owcc4ssww0co4s0
```

Each needs its respective API token set as an environment variable (see `infra/env-template.md`).

---

## Step 8: Configure Traefik Custom Routes

```bash
# Copy any custom dynamic config files
ls /data/coolify/proxy/dynamic/

# After adding new files, Traefik picks them up automatically (file provider)
# Force reload if needed:
docker restart coolify-proxy
```

---

## Step 9: Initialize Databases

```bash
# Connect to PostgreSQL and create databases
docker exec -it homestack-postgres psql -U postgres

CREATE DATABASE aios_db;
CREATE DATABASE n8n;
CREATE DATABASE nocodb;
CREATE DATABASE grafana;
CREATE DATABASE authentik;

# Create per-service users (use passwords from .env)
CREATE USER aios_user WITH PASSWORD '...';
GRANT ALL PRIVILEGES ON DATABASE aios_db TO aios_user;
# ... repeat for each service
```

---

## Step 10: Configure Authentik SSO

1. Navigate to `https://auth.automation-plus-ki.de`
2. Complete Authentik setup wizard with bootstrap credentials
3. Create OAuth2 providers for: n8n, Grafana, Admin Dashboard, AppFlowy
4. Configure outpost for each application
5. Export `AUTHENTIK_API_TOKEN` and update env vars

---

## Step 11: Verify Everything

```bash
# Check all containers
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# Check Traefik routing
docker logs coolify-proxy 2>&1 | tail -50

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq '.data.activeTargets | length'
```

Run the verification checklist:

- [ ] https://admin.automation-plus-ki.de — Admin Dashboard loads
- [ ] https://n8n.automation-plus-ki.de — n8n UI accessible
- [ ] https://nocodb.automation-plus-ki.de — NocoDB loads
- [ ] https://grafana.automation-plus-ki.de — Grafana dashboards present
- [ ] https://prometheus.automation-plus-ki.de — Prometheus targets all UP
- [ ] https://auth.automation-plus-ki.de — Authentik login works
- [ ] https://appflowy.automation-plus-ki.de — AppFlowy accessible
- [ ] https://qdrant.automation-plus-ki.de — Qdrant API responds
- [ ] All MCP server URLs return 200/health OK
- [ ] Admin Dashboard MCP Health widget shows all green

---

## Rollback / Disaster Recovery

- Coolify backups: stored in Hetzner Object Storage
- PostgreSQL: use `pg_dump` / Coolify backup trigger
- Docker volumes: snapshot with Hetzner Volume snapshots
- Re-deploy from GHCR image: images are immutable and tagged

```bash
# Restore a specific image version
docker pull ghcr.io/timogoetz1988/aios-admin-dashboard:<tag>
# Then trigger redeploy in Coolify UI
```
