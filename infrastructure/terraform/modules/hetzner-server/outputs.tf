output "server_id" {
  description = "Hetzner Server ID"
  value       = hcloud_server.main.id
}

output "server_ipv4" {
  description = "Oeffentliche IPv4-Adresse"
  value       = hcloud_server.main.ipv4_address
}

output "server_ipv6" {
  description = "Oeffentliches IPv6-Netzwerk"
  value       = hcloud_server.main.ipv6_network
}

output "server_status" {
  description = "Server-Status"
  value       = hcloud_server.main.status
}

output "ssh_key_id" {
  description = "SSH-Key ID"
  value       = hcloud_ssh_key.deploy.id
}
