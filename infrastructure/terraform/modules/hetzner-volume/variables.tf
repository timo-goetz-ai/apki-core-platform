variable "name" {
  description = "Name des Volumes"
  type        = string
}

variable "size" {
  description = "Groesse des Volumes in GB"
  type        = number
  default     = 100
}

variable "location" {
  description = "Hetzner-Standort (z.B. nbg1, fsn1, hel1)"
  type        = string
}

variable "server_id" {
  description = "Server-ID fuer Volume-Attachment"
  type        = number
}

variable "labels" {
  description = "Labels fuer das Volume"
  type        = map(string)
  default     = {}
}
