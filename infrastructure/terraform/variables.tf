# -----------------------------------------------------
# Hetzner Cloud
# -----------------------------------------------------

variable "hetzner_token" {
  description = "Hetzner Cloud API Token"
  type        = string
  sensitive   = true
}

variable "ssh_public_key" {
  description = "SSH Public Key fuer Server-Zugang"
  type        = string
  sensitive   = true
}

# -----------------------------------------------------
# Cloudflare
# -----------------------------------------------------

variable "cloudflare_api_key" {
  description = "Cloudflare Global API Key"
  type        = string
  sensitive   = true
}

variable "cloudflare_email" {
  description = "Cloudflare Account E-Mail"
  type        = string
}

variable "cloudflare_zone_id" {
  description = "Cloudflare Zone ID fuer automation-plus-ki.de"
  type        = string
  default     = "e1db61ccea38251e9bf8c0ca6482de64"
}

# -----------------------------------------------------
# Allgemein
# -----------------------------------------------------

variable "domain" {
  description = "Hauptdomain"
  type        = string
  default     = "automation-plus-ki.de"
}
