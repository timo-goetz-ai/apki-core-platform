variable "server_name" {
  description = "Name des Servers"
  type        = string
}

variable "server_type" {
  description = "Hetzner Server-Typ (z.B. cpx42)"
  type        = string
}

variable "location" {
  description = "Rechenzentrum (z.B. nbg1, fsn1, hel1)"
  type        = string
}

variable "image" {
  description = "OS-Image (z.B. ubuntu-24.04)"
  type        = string
}

variable "ssh_key_name" {
  description = "Name des SSH-Keys in Hetzner"
  type        = string
}

variable "ssh_public_key" {
  description = "Oeffentlicher SSH-Schluessel"
  type        = string
  sensitive   = true
}

variable "backups" {
  description = "Automatische Backups aktivieren"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels fuer den Server"
  type        = map(string)
  default     = {}
}
