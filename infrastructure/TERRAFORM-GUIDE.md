# Terraform Guide

## Uebersicht

Terraform verwaltet die Kern-Infrastruktur:

- **Hetzner Cloud:** Server (CPX42), SSH-Key, Firewall
- **Cloudflare:** DNS-Records fuer automation-plus-ki.de

## Ersteinrichtung

### 1. Terraform installieren

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform
terraform --version  # >= 1.5.0
```

### 2. Variablen konfigurieren

```bash
cp terraform/terraform.tfvars.example terraform/terraform.tfvars
```

Folgende Werte muessen eingetragen werden:

| Variable | Quelle |
|----------|--------|
| `hetzner_token` | [Hetzner Console](https://console.hetzner.cloud) -> API Tokens |
| `cloudflare_api_token` | [Cloudflare Dashboard](https://dash.cloudflare.com/profile/api-tokens) |
| `ssh_public_key` | `cat ~/.ssh/id_ed25519.pub` |
| `cloudflare_zone_id` | Bereits vorausgefuellt |

### 3. Initialisieren

```bash
cd terraform
terraform init
```

### 4. Bestehende Ressourcen importieren

Beim ersten Mal muessen die existierenden Ressourcen importiert werden:

```bash
bash import.sh
```

Das Script importiert:
- 1 Hetzner Server (ID: 118056094)
- 13 Cloudflare A-Records
- 2 Cloudflare TXT-Records

### 5. Validieren

```bash
terraform plan
```

Erwartetes Ergebnis: `No changes. Your infrastructure matches the configuration.`

## Taeglich verwendete Befehle

### Aenderungen planen

```bash
terraform plan
```

### Aenderungen anwenden

```bash
terraform apply
```

### Status anzeigen

```bash
terraform show
```

## Haeufige Aufgaben

### Neue Subdomain hinzufuegen

In `terraform/main.tf` unter `module "dns"` -> `subdomains`:

```hcl
subdomains = {
  # ... bestehende Eintraege ...
  "neue-subdomain" = { proxied = false, comment = "Beschreibung" }
}
```

Dann: `terraform plan && terraform apply`

### Firewall-Port oeffnen

In `terraform/main.tf` unter `module "firewall"`:

```hcl
module "firewall" {
  source      = "./modules/hetzner-firewall"
  server_id   = module.server.server_id
  server_name = "hetzner"
  extra_ports = ["8080"]  # <- Neuer Port
}
```

### Server-Typ aendern

In `terraform/main.tf` unter `module "server"`:

```hcl
server_type = "cpx52"  # Upgrade von cpx42
```

**Achtung:** Server-Typ-Aenderungen erfordern einen Neustart.

## Module

### hetzner-server

| Ressource | Beschreibung |
|-----------|-------------|
| `hcloud_ssh_key.deploy` | SSH-Key fuer Server-Zugang |
| `hcloud_server.main` | Der Hauptserver |

### hetzner-firewall

| Ressource | Beschreibung |
|-----------|-------------|
| `hcloud_firewall.main` | Firewall mit Regeln |
| `hcloud_firewall_attachment.main` | Zuordnung zum Server |

### cloudflare-dns

| Ressource | Beschreibung |
|-----------|-------------|
| `cloudflare_record.a_records` | A-Records (per `for_each`) |
| `cloudflare_record.txt_records` | TXT-Records (SPF, DMARC) |

## State-Verwaltung

Der Terraform-State wird lokal gespeichert (`terraform.tfstate`).
Diese Datei ist gitignored und sollte **niemals** committed werden.

Fuer Team-Nutzung: Umstellung auf Remote Backend (z.B. Terraform Cloud, S3) empfohlen.
