output "volume_id" {
  description = "Hetzner Volume ID"
  value       = hcloud_volume.main.id
}

output "linux_device" {
  description = "Linux-Geraetepfad des Volumes (z.B. /dev/disk/by-id/scsi-0HC_Volume_...)"
  value       = hcloud_volume.main.linux_device
}

output "volume_name" {
  description = "Name des Volumes"
  value       = hcloud_volume.main.name
}
