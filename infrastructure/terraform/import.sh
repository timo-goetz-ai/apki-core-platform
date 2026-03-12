#!/bin/bash
# =============================================
# Terraform Import: Bestehende Ressourcen importieren
# Ausfuehren NACH terraform init
# =============================================

set -e

echo "=== Hetzner Server importieren ==="
terraform import module.server.hcloud_server.main 118056094

echo "=== Cloudflare A-Records importieren ==="
ZONE="e1db61ccea38251e9bf8c0ca6482de64"

terraform import 'module.dns.cloudflare_record.a_records["@"]'              "${ZONE}/0ade940bd877a0fbe3d938037a380864"
terraform import 'module.dns.cloudflare_record.a_records["www"]'            "${ZONE}/7a431660a9758da55012b633bfeebd95"
terraform import 'module.dns.cloudflare_record.a_records["n8n"]'            "${ZONE}/98d86b7364fd6ed85148faa5c5f961b9"
terraform import 'module.dns.cloudflare_record.a_records["nocodb"]'         "${ZONE}/7cbc35a88d4e06f0ccf17b82b40dc8f8"
terraform import 'module.dns.cloudflare_record.a_records["qdrant"]'         "${ZONE}/c5c7e0325dcae2beba8af620aa061fbe"
terraform import 'module.dns.cloudflare_record.a_records["coolify"]'        "${ZONE}/6ab603ef4bdd0911b49c5971f38f4fde"
terraform import 'module.dns.cloudflare_record.a_records["status"]'         "${ZONE}/3ec23cc9a5c0dcaf0c33c8d00ff65355"
terraform import 'module.dns.cloudflare_record.a_records["agent"]'          "${ZONE}/5d454782188cb350c525c5bea1c6d14e"
terraform import 'module.dns.cloudflare_record.a_records["mcp-coolify"]'    "${ZONE}/cfd91a40ff9189ca515d8566041fec2c"
terraform import 'module.dns.cloudflare_record.a_records["mcp-hetzner"]'    "${ZONE}/11b5d99d1f3ad313c3df25fba49269da"
terraform import 'module.dns.cloudflare_record.a_records["mcp-cloudflare"]' "${ZONE}/7bcea6a306075e2f39e4b28e91f0d54b"
terraform import 'module.dns.cloudflare_record.a_records["mcp-google"]'     "${ZONE}/ade09d7e20385e164bb9f1e987cc3d3a"
terraform import 'module.dns.cloudflare_record.a_records["mcp-github"]'     "${ZONE}/17813691e04f6a69e0c97103bbb53440"

echo "=== Cloudflare TXT-Records importieren ==="
terraform import 'module.dns.cloudflare_record.txt_records["@"]'      "${ZONE}/e5e5d0cb50f833ac9b6d8aa5b93dc5ff"
terraform import 'module.dns.cloudflare_record.txt_records["_dmarc"]' "${ZONE}/5ad2b149af5d6634686a1a6202d7699f"

echo ""
echo "=== Import abgeschlossen ==="
echo "Jetzt 'terraform plan' ausfuehren - es sollten 0 Aenderungen angezeigt werden."
