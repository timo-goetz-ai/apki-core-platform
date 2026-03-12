# =============================================
# Provider-Konfiguration
# =============================================

provider "hcloud" {
  token = var.hetzner_token
}

provider "cloudflare" {
  api_key = var.cloudflare_api_key
  email   = var.cloudflare_email
}

# =============================================
# Hetzner Server
# =============================================

module "server" {
  source = "./modules/hetzner-server"

  server_name    = "hetzner"
  server_type    = "cpx42"
  location       = "nbg1"
  image          = "ubuntu-24.04"
  backups        = true
  ssh_key_name   = "id_ed25519_hetzner_coolify"
  ssh_public_key = var.ssh_public_key

  labels = {
    environment = "production"
    managed_by  = "terraform"
    project     = "automation-stack"
  }
}

# =============================================
# Hetzner Firewall
# =============================================

module "firewall" {
  source = "./modules/hetzner-firewall"

  firewall_name = "production-firewall"
  server_id     = module.server.server_id
}

# =============================================
# Hetzner Volume (persistente Datenhaltung)
# =============================================

module "volume" {
  source = "./modules/hetzner-volume"

  name      = "production-data"
  size      = 100
  location  = "nbg1"
  server_id = module.server.server_id

  labels = {
    environment = "production"
    managed_by  = "terraform"
    project     = "automation-stack"
  }
}

# =============================================
# Cloudflare DNS
# =============================================

module "dns" {
  source = "./modules/cloudflare-dns"

  zone_id   = var.cloudflare_zone_id
  domain    = var.domain
  server_ip = module.server.server_ipv4

  subdomains = {
    # ── Hauptdienste ─────────────────────────────────────────────
    "@"         = { proxied = true,  comment = "Main website" }
    "www"       = { proxied = true,  comment = "www redirect" }
    "n8n"       = { proxied = true,  comment = "n8n Automation Platform" }
    "nocodb"    = { proxied = true,  comment = "NocoDB (legacy – wird zu crm migriert)" }
    "crm"       = { proxied = true,  comment = "NocoDB CRM" }
    "qdrant"    = { proxied = false, comment = "Qdrant Vector Database (direkt, kein CF-Proxy)" }
    "coolify"   = { proxied = false, comment = "Coolify Dashboard (direkt)" }
    "status"    = { proxied = true,  comment = "Uptime Kuma" }
    "grafana"   = { proxied = true,  comment = "Grafana Monitoring" }
    "prometheus" = { proxied = false, comment = "Prometheus (intern, kein CF-Proxy)" }
    "nextcloud" = { proxied = true,  comment = "Nextcloud" }
    # ── Geplante Dienste ─────────────────────────────────────────
    "auth"      = { proxied = true,  comment = "Authentik SSO (geplant)" }
    # ── MCP-Server Stack ─────────────────────────────────────────
    # proxied=false: StreamableHTTP-Sessions – CF-Proxy bricht bei >100s ab
    "agent"          = { proxied = false, comment = "Agent Hub Controller" }
    "mcp-coolify"    = { proxied = false, comment = "MCP Coolify Server" }
    "mcp-hetzner"    = { proxied = false, comment = "MCP Hetzner Server" }
    "mcp-cloudflare" = { proxied = false, comment = "MCP Cloudflare Server" }
    "mcp-google"     = { proxied = false, comment = "MCP Google Workspace Server" }
    "mcp-github"     = { proxied = false, comment = "MCP GitHub Server" }
  }

  txt_records = {
    "@"      = { content = "v=spf1 include:_spf.google.com -all", comment = "" }
    "_dmarc" = { content = "v=DMARC1; p=reject; rua=mailto:admin@automation-plus-ki.de", comment = "" }
  }
}
