#!/usr/bin/env bash
# Baut N8N_BASE_URL aus 1Password (Secure Note / Notizfeld) und ruft op run auf.
# Quelle: Item „TAILSCALE_HETZNER_CPX-42“, Vault 05_INFRASTRUCTURE, Feld notesPlain.
# Erwartet in der Notiz: MagicDNS-Name *.ts.net und/oder eine Tailscale-IPv4 (100.x).
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTE=$(op read "op://05_INFRASTRUCTURE/TAILSCALE_HETZNER_CPX-42/notesPlain")
HOST=$(printf '%s\n' "$NOTE" | grep -Eo '[a-z0-9][a-z0-9.-]+\.ts\.net' | head -1)
if [[ -z "${HOST}" ]]; then
  HOST=$(printf '%s\n' "$NOTE" | grep -Eo '100\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1)
fi
if [[ -z "${HOST}" ]]; then
  echo "op-run-n8n-tailscale: weder *.ts.net noch 100.x in TAILSCALE_HETZNER_CPX-42 notesPlain gefunden." >&2
  exit 1
fi
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
grep -v '^N8N_BASE_URL=' "${ROOT}/scripts/infra-1password.op.template" > "$TMP"
echo "N8N_BASE_URL=http://${HOST}:5678" >> "$TMP"
exec op run --env-file "$TMP" -- "$@"
