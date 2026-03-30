#!/usr/bin/env bash
# Baut N8N_BASE_URL aus 1Password (Item TAILSCALE_HETZNER_CPX-42, notesPlain) und ruft op run auf.
# Standard: bevorzugt Tailscale-IPv4 (100.x), falls in der Notiz — robuster als MagicDNS ohne Tailscale-DNS.
# Override: N8N_TAILSCALE_HOST_MODE=magicdns|ip|auto (default auto)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
NOTE=$(op read "op://05_INFRASTRUCTURE/TAILSCALE_HETZNER_CPX-42/notesPlain")
MODE="${N8N_TAILSCALE_HOST_MODE:-auto}"
TS_IP=$(printf '%s\n' "$NOTE" | grep -Eo '100\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}' | head -1)
MAGIC=$(printf '%s\n' "$NOTE" | grep -Eo '[a-z0-9][a-z0-9.-]+\.ts\.net' | head -1)
HOST=""
case "$MODE" in
  magicdns) HOST="${MAGIC}" ;;
  ip) HOST="${TS_IP}" ;;
  auto)
    if [[ -n "${TS_IP}" ]]; then HOST="${TS_IP}"
    elif [[ -n "${MAGIC}" ]]; then HOST="${MAGIC}"
    fi ;;
esac
if [[ -z "${HOST}" ]]; then
  echo "op-run-n8n-tailscale: weder 100.x noch *.ts.net in TAILSCALE_HETZNER_CPX-42 notesPlain (mode=$MODE)." >&2
  exit 1
fi
TMP=$(mktemp)
trap 'rm -f "$TMP"' EXIT
grep -v '^N8N_BASE_URL=' "${ROOT}/scripts/infra-1password.op.template" > "$TMP"
echo "N8N_BASE_URL=http://${HOST}:5678" >> "$TMP"
exec op run --env-file "$TMP" -- "$@"
