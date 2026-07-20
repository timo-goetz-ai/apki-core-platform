#!/usr/bin/env bash
# Start Hetzner Cloud server (if offline), wait for stack health, rotate exposed MCP tokens.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_NAME="${HCLOUD_SERVER_NAME:-hetzner-automation-1}"
VAULT_INFRA="${OP_VAULT_INFRA:-fwl7qdu7q3nvqqjbrljzcdhita}"
VAULT_PROD="${OP_VAULT_PROD:-cfesh4cht5qrdxs5hnyzobb7si}"

log() { echo "[wake-rotate] $*"; }
die() { echo "[wake-rotate] ERROR: $*" >&2; exit 1; }

command -v hcloud >/dev/null || die "hcloud CLI required (brew install hcloud)"
command -v op >/dev/null || die "1Password CLI required"

load_hcloud_token() {
  local candidates=(
    "op://${VAULT_PROD}/Hetzner/api_token"
    "op://${VAULT_PROD}/Hetzner/token"
    "op://${VAULT_INFRA}/Homestack - Infrastructure/HETZNER_TOKEN"
    "op://${VAULT_INFRA}/Hetzner/token"
  )
  local ref tok
  for ref in "${candidates[@]}"; do
    tok=$(op read "$ref" 2>/dev/null || true)
    if [[ -n "$tok" ]]; then
      export HCLOUD_TOKEN="$tok"
      if hcloud server list -o noheader >/dev/null 2>&1; then
        log "Using Hetzner token from $ref"
        return 0
      fi
    fi
  done
  die "No valid HCLOUD_TOKEN in 1Password. Create one: console.hetzner.cloud → Security → API tokens → Read & Write"
}

wait_for_url() {
  local url="$1" name="$2" max="${3:-180}"
  local i=0 code
  while (( i < max )); do
    code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" || echo "000")
    if [[ "$code" != "000" && "$code" != "523" && "$code" != "502" && "$code" != "522" ]]; then
      log "$name reachable (HTTP $code)"
      return 0
    fi
    sleep 5
    (( i += 5 )) || true
  done
  die "$name still unreachable after ${max}s (last HTTP $code)"
}

load_hcloud_token

if ! hcloud server list -o noheader | grep -q .; then
  die "Hetzner project has no servers. Infra likely deleted or wrong API token/project."
fi

STATUS=$(hcloud server describe "$SERVER_NAME" -o format='{{.Status}}' 2>/dev/null || echo "missing")
if [[ "$STATUS" == "missing" ]]; then
  log "Available servers:"
  hcloud server list -o columns=name,status,ipv4
  die "Server '$SERVER_NAME' not found — set HCLOUD_SERVER_NAME or recreate infra"
fi

if [[ "$STATUS" != "running" ]]; then
  log "Starting server '$SERVER_NAME' (status=$STATUS)..."
  hcloud server poweron "$SERVER_NAME"
  sleep 15
else
  log "Server '$SERVER_NAME' already running"
fi

wait_for_url "https://auth.automation-plus-ki.de/-/health/ready/" "Authentik" 240
wait_for_url "https://directus.automation-plus-ki.de/server/health" "Directus" 120

exec "$REPO_ROOT/scripts/rotate-exposed-tokens.sh" "$@"
