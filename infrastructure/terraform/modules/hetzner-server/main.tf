resource "hcloud_ssh_key" "deploy" {
  name       = var.ssh_key_name
  public_key = var.ssh_public_key
}

resource "hcloud_server" "main" {
  name        = var.server_name
  server_type = var.server_type
  location    = var.location
  image       = var.image
  ssh_keys    = [hcloud_ssh_key.deploy.id]
  backups     = var.backups
  labels      = var.labels

  public_net {
    ipv4_enabled = true
    ipv6_enabled = true
  }

  lifecycle {
    ignore_changes = [ssh_keys]
  }
}
