variable "firewall_name" {
  description = "Name der Firewall"
  type        = string
}

variable "server_id" {
  description = "Server-ID fuer Firewall-Attachment"
  type        = number
}

variable "extra_ports" {
  description = "Zusaetzliche TCP-Ports zum Oeffnen"
  type        = list(string)
  default     = []
}
