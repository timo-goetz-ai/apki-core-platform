# A-Records fuer alle Subdomains
resource "cloudflare_record" "a_records" {
  for_each = var.subdomains

  zone_id = var.zone_id
  name    = each.key == "@" ? var.domain : each.key
  content = var.server_ip
  type    = "A"
  proxied = each.value.proxied
  ttl     = 1
  comment = each.value.comment
}

# TXT-Records (SPF, DMARC, etc.)
resource "cloudflare_record" "txt_records" {
  for_each = var.txt_records

  zone_id = var.zone_id
  name    = each.key == "@" ? var.domain : each.key
  content = each.value.content
  type    = "TXT"
  proxied = false
  ttl     = 1
  comment = each.value.comment
}
