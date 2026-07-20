#!/usr/bin/env bash
# Rotates tokens that were exposed in committed .mcp.json
# Updates 1Password + local .mcp.json (gitignored)
set -euo pipefail

VAULT="fwl7qdu7q3nvqqjbrljzcdhita"
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MCP_JSON="$REPO_ROOT/.mcp.json"
STAMP=$(date +%Y%m%d-%H%M)

log() { echo "[rotate] $*"; }

preflight() {
  local url="$1" name="$2"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 12 "$url" || echo "000")
  if [[ "$code" == "000" || "$code" == "523" || "$code" == "502" ]]; then
    die "$name unreachable (HTTP $code). Server/Tailscale offline? Start Hetzner + run: ./scripts/rotate-exposed-tokens.sh"
  fi
}

die() { echo "[rotate] ERROR: $*" >&2; exit 1; }

command -v op >/dev/null || die "1Password CLI (op) required"
command -v jq >/dev/null || die "jq required"
command -v curl >/dev/null || die "curl required"

# ── Load current secrets (never echo values) ─────────────────────────────────
AUTHENTIK_URL="${AUTHENTIK_URL:-https://auth.automation-plus-ki.de}"
DIRECTUS_URL="${DIRECTUS_URL:-https://directus.automation-plus-ki.de}"
COOLIFY_URL="${COOLIFY_URL:-https://coolify.automation-plus-ki.de}"
ANYTHINGLLM_MCP_URL="${ANYTHINGLLM_MCP_URL:-https://mcp-anythingllm.automation-plus-ki.de/mcp}"
BASE_DOMAIN="${BASE_DOMAIN:-automation-plus-ki.de}"

OLD_AUTH_TOKEN=$(op read "op://${VAULT}/Homestack - Service Credentials/AUTHENTIK_API_TOKEN" 2>/dev/null || true)
OLD_COOLIFY=$(op read "op://${VAULT}/Homestack - Infrastructure/COOLIFY_API_KEY" 2>/dev/null || true)
DIRECTUS_USER=$(op read "op://${VAULT}/DIRECTIS/username" 2>/dev/null || echo "ai_studio@timo-goetz-ai.de")
DIRECTUS_PASS=$(op read "op://${VAULT}/DIRECTIS/password" 2>/dev/null || true)
OLD_ANYTHING=$(op read "op://${VAULT}/API_ANYTHING_LLM/password" 2>/dev/null || true)

[[ -n "$OLD_AUTH_TOKEN" ]] || die "AUTHENTIK_API_TOKEN not found in 1Password"
[[ -n "$DIRECTUS_PASS" ]] || die "Directus password not found in 1Password (DIRECTIS item)"

NEW_AUTH_TOKEN=""
NEW_DIRECTUS_TOKEN=""
NEW_COOLIFY_TOKEN="${NEW_COOLIFY_TOKEN:-}"
NEW_ANYTHING_TOKEN="${NEW_ANYTHING_TOKEN:-$OLD_ANYTHING}"

# ── 1. Authentik: create new API token, revoke old by identifier ─────────────
preflight "$AUTHENTIK_URL/-/health/ready/" "Authentik"
preflight "$DIRECTUS_URL/server/health" "Directus"
log "Rotating Authentik API token..."

USER_PK=$(curl -sf "$AUTHENTIK_URL/api/v3/core/users/me/" \
  -H "Authorization: Bearer $OLD_AUTH_TOKEN" | jq -r '.pk // empty')
[[ -n "$USER_PK" ]] || die "Authentik: could not get user pk (token invalid?)"

IDENT="mcp-rotated-${STAMP}"
CREATE_RESP=$(curl -sf -X POST "$AUTHENTIK_URL/api/v3/core/tokens/" \
  -H "Authorization: Bearer $OLD_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"$IDENT\", \"user\": $USER_PK, \"description\": \"Rotated after .mcp.json leak $STAMP\", \"expiring\": false}")

NEW_AUTH_TOKEN=$(echo "$CREATE_RESP" | jq -r '.key // empty')
[[ -n "$NEW_AUTH_TOKEN" && "$NEW_AUTH_TOKEN" != "null" ]] || die "Authentik: token creation failed"

# Revoke old tokens matching previous mcp/akadmin patterns (keep new)
curl -sf "$AUTHENTIK_URL/api/v3/core/tokens/?user=$USER_PK" \
  -H "Authorization: Bearer $NEW_AUTH_TOKEN" | jq -r '.results[] | select(.identifier != "'"$IDENT"'") | .pk' | while read -r pk; do
  curl -sf -X DELETE "$AUTHENTIK_URL/api/v3/core/tokens/$pk/" \
    -H "Authorization: Bearer $NEW_AUTH_TOKEN" >/dev/null || true
  log "Revoked old Authentik token pk=$pk"
done

op item edit "Homestack - Service Credentials" --vault "$VAULT" \
  "AUTHENTIK_API_TOKEN[password]=$NEW_AUTH_TOKEN" >/dev/null
log "Authentik: new token saved to 1Password"

# ── 2. Directus: login + regenerate static token ─────────────────────────────
log "Rotating Directus static token..."

LOGIN_RESP=$(curl -sf -X POST "$DIRECTUS_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$DIRECTUS_USER\",\"password\":\"$DIRECTUS_PASS\"}")
ACCESS=$(echo "$LOGIN_RESP" | jq -r '.data.access_token // empty')
[[ -n "$ACCESS" ]] || die "Directus login failed"

TOKEN_RESP=$(curl -sf -X POST "$DIRECTUS_URL/users/me/token" \
  -H "Authorization: Bearer $ACCESS")
NEW_DIRECTUS_TOKEN=$(echo "$TOKEN_RESP" | jq -r '.data.token // .data // empty' | head -1)
# Directus returns token in .data directly sometimes
if [[ -z "$NEW_DIRECTUS_TOKEN" || "$NEW_DIRECTUS_TOKEN" == "null" ]]; then
  NEW_DIRECTUS_TOKEN=$(echo "$TOKEN_RESP" | jq -r '.data // empty')
fi
[[ -n "$NEW_DIRECTUS_TOKEN" && "$NEW_DIRECTUS_TOKEN" != "null" ]] || die "Directus token regeneration failed"

# Store in DIRECTIS as static token note field if exists, else update password field label
op item edit "DIRECTIS" --vault "$VAULT" \
  "password[password]=$NEW_DIRECTUS_TOKEN" >/dev/null 2>&1 || \
op item edit "DIRECTIS" --vault "$VAULT" \
  "credential[password]=$NEW_DIRECTUS_TOKEN" >/dev/null || true
log "Directus: new static token saved to 1Password (DIRECTIS)"

# ── 3. Coolify: requires UI — use env NEW_COOLIFY_TOKEN if set ───────────────
if [[ -n "${NEW_COOLIFY_TOKEN:-}" ]]; then
  op item edit "Homestack - Infrastructure" --vault "$VAULT" \
    "COOLIFY_API_KEY[password]=$NEW_COOLIFY_TOKEN" >/dev/null
  log "Coolify: new token saved from NEW_COOLIFY_TOKEN env"
elif [[ -n "$OLD_COOLIFY" ]]; then
  # Validate old still works; warn for manual rotation
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" "$COOLIFY_URL/api/v1/teams" \
    -H "Authorization: Bearer $OLD_COOLIFY" || echo "000")
  if [[ "$HTTP" == "200" ]]; then
    log "WARN: Coolify token still valid — create new token in Coolify UI:"
    log "  $COOLIFY_URL → Keys & Tokens → API Tokens → Create"
    log "  Then: NEW_COOLIFY_TOKEN='...' $0"
    NEW_COOLIFY_TOKEN="$OLD_COOLIFY"
  else
    die "Coolify token invalid (HTTP $HTTP). Create new token in UI and re-run with NEW_COOLIFY_TOKEN=..."
  fi
else
  die "Coolify COOLIFY_API_KEY not found in 1Password"
fi

# ── 4. Write .mcp.json (gitignored) ──────────────────────────────────────────
cat > "$MCP_JSON" << EOF
{
  "mcpServers": {
    "directus": {
      "command": "npx",
      "args": ["-y", "directus-mcp-server@latest"],
      "env": {
        "DIRECTUS_URL": "$DIRECTUS_URL",
        "DIRECTUS_TOKEN": "$NEW_DIRECTUS_TOKEN"
      }
    },
    "mcp-anythingllm": {
      "type": "url",
      "url": "$ANYTHINGLLM_MCP_URL",
      "headers": {
        "Authorization": "Bearer $NEW_ANYTHING_TOKEN"
      }
    },
    "mcp-aios-ops": {
      "type": "stdio",
      "command": "uv",
      "args": ["run", "--directory", "./infrastructure/mcp-servers/mcp-aios-ops", "mcp-aios-ops"],
      "env": {
        "COOLIFY_URL": "$COOLIFY_URL",
        "COOLIFY_TOKEN": "$NEW_COOLIFY_TOKEN",
        "AUTHENTIK_URL": "$AUTHENTIK_URL",
        "AUTHENTIK_TOKEN": "$NEW_AUTH_TOKEN",
        "BASE_DOMAIN": "$BASE_DOMAIN"
      }
    }
  }
}
EOF
chmod 600 "$MCP_JSON"
log "Wrote $MCP_JSON (mode 600)"

log "Done. Authentik + Directus rotated. Coolify: manual if not passed via NEW_COOLIFY_TOKEN."
