#!/usr/bin/env bash
# =============================================================================
# AIOS – 1Password: kanonische Items anlegen/aktualisieren (Vault „AIOS“)
#
# Übernimmt Werte aus bestehenden Legacy-Items (API-COOLIFY, API-NOCODB, …)
# in die Titel, die GitHub Actions / env.op.all erwarten (Coolify, NocoDB, …).
#
# Hinweis: Das Login-Item „Cloudflare“ wird nicht bearbeitet (SSO-Felder);
# stattdessen existiert „Cloudflare-API“ mit api_token/email/account_id.
#
# Voraussetzung: op signin, Vault „AIOS“
# =============================================================================
set -euo pipefail
VAULT="AIOS"

norm_url() {
  local u="${1:-}"
  u="${u//$'\r'/}"
  u="${u//$'\n'/}"
  [[ -n "$u" ]] || { echo ""; return; }
  [[ "$u" =~ ^https?:// ]] || u="https://${u}"
  echo "$u"
}

item_exists() { op item get "$1" --vault "$VAULT" &>/dev/null; }

read_op() { op read "$1" 2>/dev/null || true; }

echo "== Hetzner (ip, ssh_private_key, token) =="
if item_exists "Hetzner"; then
  NOTE=$(read_op "op://AIOS/Hetzner/notesPlain")
  IP=$(echo "$NOTE" | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | head -1 || true)
  [[ -n "${IP:-}" ]] || IP="SET_YOUR_HETZNER_IP"
  KEY=$(read_op "op://AIOS/id_ed25519_hetzner_coolify/Private-Key")
  HTOK=$(read_op "op://AIOS/Hetzner/add more/ACESS_KEY")
  [[ -n "${HTOK:-}" ]] || HTOK=$(read_op "op://AIOS/Hetzner/_password")
  [[ -n "${HTOK:-}" ]] || HTOK="SET_HETZNER_API_TOKEN"
  [[ -n "${KEY:-}" ]] || KEY="SET_SSH_PRIVATE_KEY_OPENSSH"
  op item edit "Hetzner" --vault "$VAULT" \
    "ip[text]=${IP}" \
    "ssh_private_key[password]=${KEY}" \
    "token[password]=${HTOK}" \
    >/dev/null
  echo "  Hetzner aktualisiert."
fi

echo "== Coolify =="
CH_RAW=$(read_op "op://AIOS/API-COOLIFY/Host-Name")
CTOK=$(read_op "op://AIOS/API-COOLIFY/Anmeldedaten")
[[ -n "${CTOK:-}" ]] || CTOK=$(read_op "op://AIOS/coolify_prod/add more/coolify-production-api-260312")
[[ -n "${CTOK:-}" ]] || CTOK=$(read_op "op://AIOS/coolify_prod/password")
CH_URL=$(norm_url "$CH_RAW")
[[ -n "$CH_URL" ]] || CH_URL="https://coolify.automation-plus-ki.de"
if ! item_exists "Coolify"; then
  op item create --vault "$VAULT" --category "API Credential" --title "Coolify" \
    "url[text]=${CH_URL}" \
    "token[password]=${CTOK}" \
    "aios_core_uuid[text]=SET_UUID_FROM_COOLIFY_APP_aios-core" \
    "dashboard_uuid[text]=SET_UUID_FROM_COOLIFY_APP_admin-dashboard" \
    "coder_agent_uuid[text]=SET_UUID_FROM_COOLIFY_APP_coder-agent" \
    >/dev/null
  echo "  Coolify angelegt – UUIDs in 1Password setzen."
else
  op item edit "Coolify" --vault "$VAULT" "url[text]=${CH_URL}" "token[password]=${CTOK}" >/dev/null
  echo "  Coolify url/token aktualisiert."
fi

echo "== NocoDB =="
NH=$(read_op "op://AIOS/API-NOCODB/Host-Name")
NK=$(read_op "op://AIOS/API-NOCODB/Anmeldedaten")
[[ -n "${NK:-}" ]] || NK=$(read_op "op://AIOS/nocodb_prod/add more/api-nocodb")
NPW=$(read_op "op://AIOS/nocodb_prod/password")
NH_URL=$(norm_url "$NH")
[[ -n "$NH_URL" ]] || NH_URL="https://nocodb.automation-plus-ki.de"
if ! item_exists "NocoDB"; then
  op item create --vault "$VAULT" --category "API Credential" --title "NocoDB" \
    "url[text]=${NH_URL}" \
    "api_key[password]=${NK}" \
    "db_password[password]=${NPW:-CHANGE_ME}" \
    "mcp_projekte_table_id[text]=md_CHANGE_ME" \
    "mcp_dienste_table_id[text]=md_CHANGE_ME" \
    "mcp_audit_table_id[text]=md_CHANGE_ME" \
    >/dev/null
  echo "  NocoDB angelegt – MCP-Tabellen-IDs setzen."
else
  op item edit "NocoDB" --vault "$VAULT" \
    "url[text]=${NH_URL}" \
    "api_key[password]=${NK}" \
    "db_password[password]=${NPW:-CHANGE_ME}" \
    >/dev/null
  echo "  NocoDB aktualisiert."
fi

echo "== N8N =="
N8URL="https://n8n.automation-plus-ki.de"
N8KEY=$(read_op "op://AIOS/id_ed25519_hetzner_coolify/add more/N8N_acess-token")
[[ -n "${N8KEY:-}" ]] || N8KEY="SET_N8N_API_KEY"
if ! item_exists "N8N"; then
  op item create --vault "$VAULT" --category "API Credential" --title "N8N" \
    "url[text]=${N8URL}" \
    "api_key[password]=${N8KEY}" \
    "encryption_key[password]=$(openssl rand -hex 32)" \
    "db_password[password]=CHANGE_ME_N8N_DB" \
    >/dev/null
  echo "  N8N angelegt."
else
  op item edit "N8N" --vault "$VAULT" "url[text]=${N8URL}" "api_key[password]=${N8KEY}" >/dev/null
  echo "  N8N aktualisiert."
fi

echo "== AI-APIs =="
if ! item_exists "AI-APIs"; then
  A=$(read_op "op://AIOS/Claude_Anthropic/password")
  O=$(read_op "op://AIOS/OpenAI/password")
  R=$(read_op "op://AIOS/OPEN_ROUTER/password")
  op item create --vault "$VAULT" --category "API Credential" --title "AI-APIs" \
    "anthropic_api_key[password]=${A:-SET_ANTHROPIC}" \
    "openai_api_key[password]=${O:-SET_OPENAI}" \
    "openrouter_api_key[password]=${R:-SET_OPENROUTER}" \
    >/dev/null
  echo "  AI-APIs angelegt."
else
  echo "  AI-APIs existiert."
fi

echo "== AgenticOS / Google-Workspace =="
if ! item_exists "AgenticOS"; then
  op item create --vault "$VAULT" --category "Secure Note" --title "AgenticOS" \
    "base_path[text]=/opt/aios" >/dev/null
  echo "  AgenticOS angelegt."
fi
if ! item_exists "Google-Workspace"; then
  op item create --vault "$VAULT" --category "Secure Note" --title "Google-Workspace" \
    "project_id[text]=SET_GOOGLE_CLOUD_PROJECT_ID" \
    "delegated_user[text]=ai_studio@timo-goetz-ai.de" >/dev/null
  echo "  Google-Workspace angelegt."
fi

echo "== Cloudflare-API (ohne SSO-Login-Item anzufassen) =="
if ! item_exists "Cloudflare-API"; then
  CE=$(read_op "op://AIOS/Cloudflare/username")
  CT=$(read_op "op://AIOS/Cloudflare/password")
  op item create --vault "$VAULT" --category "API Credential" --title "Cloudflare-API" \
    "email[text]=${CE:-SET_EMAIL}" \
    "api_token[password]=${CT:-SET_TOKEN}" \
    "api_key[password]=${CT:-SET_KEY}" \
    "account_id[text]=SET_CLOUDFLARE_ACCOUNT_ID" \
    >/dev/null
  echo "  Cloudflare-API angelegt – account_id prüfen."
else
  echo "  Cloudflare-API existiert."
fi

echo "Fertig."
