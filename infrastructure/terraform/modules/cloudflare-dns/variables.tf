variable "zone_id" {
  description = "Cloudflare Zone ID"
  type        = string
}

variable "domain" {
  description = "Hauptdomain (z.B. automation-plus-ki.de)"
  type        = string
}

variable "server_ip" {
  description = "IPv4-Adresse des Zielservers"
  type        = string
}

variable "subdomains" {
  description = "Map von Subdomains -> Konfiguration"
  type = map(object({
    proxied = bool
    comment = optional(string, "")
  }))
}

variable "txt_records" {
  description = "Map von TXT-Records"
  type = map(object({
    content = string
    comment = optional(string, "")
  }))
  default = {}
}
