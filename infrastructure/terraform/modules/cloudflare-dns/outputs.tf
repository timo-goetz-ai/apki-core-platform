output "a_record_ids" {
  description = "Map von Subdomain -> Record ID"
  value       = { for k, v in cloudflare_record.a_records : k => v.id }
}

output "txt_record_ids" {
  description = "Map von TXT-Record Name -> Record ID"
  value       = { for k, v in cloudflare_record.txt_records : k => v.id }
}
