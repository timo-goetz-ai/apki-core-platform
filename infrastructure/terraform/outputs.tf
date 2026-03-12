output "server_ipv4" {
  description = "Oeffentliche IPv4 des Hetzner Servers"
  value       = module.server.server_ipv4
}

output "server_ipv6" {
  description = "IPv6-Netzwerk des Hetzner Servers"
  value       = module.server.server_ipv6
}

output "server_status" {
  description = "Aktueller Server-Status"
  value       = module.server.server_status
}

output "dns_a_records" {
  description = "Cloudflare A-Record IDs"
  value       = module.dns.a_record_ids
}

output "dns_txt_records" {
  description = "Cloudflare TXT-Record IDs"
  value       = module.dns.txt_record_ids
}

output "firewall_id" {
  description = "Hetzner Firewall ID"
  value       = module.firewall.firewall_id
}

output "volume_id" {
  description = "Hetzner Volume ID"
  value       = module.volume.volume_id
}

output "volume_device" {
  description = "Linux-Geraetepfad des Volumes"
  value       = module.volume.linux_device
}
