#!/usr/bin/env bash
# =============================================================================
# AIOS – 1Password Vault Setup
#
# Legt alle Secrets strukturiert in 1Password an.
# Danach können CI/CD, Coolify und lokale Entwicklung per op:// darauf zugreifen.
#
# Voraussetzungen:
#   brew install 1password-cli   (op CLI v2+)
#   op signin
#
# Verwendung:
#   chmod +x tools/op-secrets/setup-vault.sh
#   ./tools/op-secrets/setup-vault.sh
# =============================================================================
set -euo pipefail

VAULT="AIOS"

# ── Helpers ──────────────────────────────────────────────────────────────────

check_prerequisites() {
  if ! command -v op &>/dev/null; then
    echo "❌  1Password CLI nicht gefunden."
    echo "    Installiere: brew install 1password-cli"
    exit 1
  fi
  if ! op account list &>/dev/null 2>&1; then
    echo "📲  Bitte zuerst einloggen: op signin"
    exit 1
  fi
  echo "✓ op CLI bereit"
}

ensure_vault() {
  if ! op vault get "$VAULT" &>/dev/null 2>&1; then
    echo "📁 Vault \"$VAULT\" wird angelegt…"
    op vault create "$VAULT"
  fi
  echo "✓ Vault: $VAULT"
}

upsert_item() {
  local title="$1"
  shift
  if op item get "$title" --vault "$VAULT" &>/dev/null 2>&1; then
    op item edit "$title" --vault "$VAULT" "$@"
  else
    op item create --vault "$VAULT" --title "$title" --category "API Credential" "$@"
  fi
  echo "  ✓ $title"
}

prompt() {
  local var="$1" label="$2" current="${!1:-}"
  read -rp "  $label: " input
  eval "$var='${input:-$current}'"
}

# ── Main ──────────────────────────────────────────────────────────────────────

check_prerequisites
ensure_vault

echo ""
echo "══════════════════════════════════════════════════════════════"
echo " AIOS – Secrets Setup"
echo " Vault: $VAULT"
echo "══════════════════════════════════════════════════════════════"
echo ""

# ── 1. Coolify ────────────────────────────────────────────────────────────────
echo "🔧 Coolify"
prompt COOLIFY_URL               "  URL (https://coolify.automation-plus-ki.de)"
prompt COOLIFY_TOKEN             "  API Token (Coolify → Settings → API Tokens)"
prompt COOLIFY_NEXUS_CORE_UUID   "  nexus-core Application UUID (Coolify UI → App → UUID)"
prompt COOLIFY_DASHBOARD_UUID    "  admin-dashboard Application UUID"
prompt COOLIFY_CODER_AGENT_UUID  "  coder-agent Application UUID"

upsert_item "AIOS/Coolify" \
  "url[text]=$COOLIFY_URL" \
  "token[password]=$COOLIFY_TOKEN" \
  "nexus_core_uuid[text]=$COOLIFY_NEXUS_CORE_UUID" \
  "dashboard_uuid[text]=$COOLIFY_DASHBOARD_UUID" \
  "coder_agent_uuid[text]=$COOLIFY_CODER_AGENT_UUID"

# ── 2. Hetzner ───────────────────────────────────────────────────────────────
echo ""
echo "🔧 Hetzner Cloud"
prompt HETZNER_TOKEN      "  API Token (console.hetzner.cloud → API Tokens)"
prompt HETZNER_IP         "  Server IP (z.B. 49.12.xxx.xxx)"
prompt HETZNER_SSH_KEY    "  SSH Private Key Pfad (z.B. ~/.ssh/id_rsa) – Inhalt wird gespeichert"

SSH_KEY_CONTENT=""
if [[ -f "$HETZNER_SSH_KEY" ]]; then
  SSH_KEY_CONTENT=$(cat "$HETZNER_SSH_KEY")
fi

upsert_item "AIOS/Hetzner" \
  "token[password]=$HETZNER_TOKEN" \
  "ip[text]=$HETZNER_IP" \
  "ssh_private_key[password]=$SSH_KEY_CONTENT"

# ── 3. NocoDB ─────────────────────────────────────────────────────────────────
echo ""
echo "🔧 NocoDB"
prompt NOCODB_URL                     "  URL (https://nocodb.automation-plus-ki.de)"
prompt NOCODB_API_KEY                 "  API Key (NocoDB → Team & Auth → API Token)"
prompt NOCODB_MCP_PROJEKTE_TABLE_ID   "  MCP-Projekte Table ID (md_xxx)"
prompt NOCODB_MCP_DIENSTE_TABLE_ID    "  MCP-Dienste Table ID  (md_xxx)"
prompt NOCODB_MCP_AUDIT_TABLE_ID      "  MCP-Audit Table ID    (md_xxx)"
prompt NOCODB_DB_PASSWORD             "  Postgres Passwort (NocoDB Stack)"

upsert_item "AIOS/NocoDB" \
  "url[text]=$NOCODB_URL" \
  "api_key[password]=$NOCODB_API_KEY" \
  "mcp_projekte_table_id[text]=$NOCODB_MCP_PROJEKTE_TABLE_ID" \
  "mcp_dienste_table_id[text]=$NOCODB_MCP_DIENSTE_TABLE_ID" \
  "mcp_audit_table_id[text]=$NOCODB_MCP_AUDIT_TABLE_ID" \
  "db_password[password]=$NOCODB_DB_PASSWORD"

# ── 4. Cloudflare ─────────────────────────────────────────────────────────────
echo ""
echo "🔧 Cloudflare"
prompt CLOUDFLARE_API_KEY    "  Global API Key (dash.cloudflare.com → Profile → API Tokens)"
prompt CLOUDFLARE_API_TOKEN  "  Zone API Token (für Tunnel + DNS)"
prompt CLOUDFLARE_EMAIL      "  Account Email"
prompt CLOUDFLARE_ACCOUNT_ID "  Account ID"

upsert_item "AIOS/Cloudflare" \
  "api_key[password]=$CLOUDFLARE_API_KEY" \
  "api_token[password]=$CLOUDFLARE_API_TOKEN" \
  "email[text]=$CLOUDFLARE_EMAIL" \
  "account_id[text]=$CLOUDFLARE_ACCOUNT_ID"

# ── 5. GitHub ─────────────────────────────────────────────────────────────────
echo ""
echo "🔧 GitHub"
prompt GITHUB_TOKEN "  Personal Access Token (ghp_...)"

upsert_item "AIOS/GitHub" \
  "token[password]=$GITHUB_TOKEN"

# ── 6. N8N ────────────────────────────────────────────────────────────────────
echo ""
echo "🔧 N8N"
prompt N8N_BASE_URL       "  URL (https://n8n.automation-plus-ki.de)"
prompt N8N_API_KEY        "  API Key"
prompt N8N_ENCRYPTION_KEY "  Encryption Key (32+ Zeichen)"
prompt N8N_DB_PASSWORD    "  Postgres Passwort"

upsert_item "AIOS/N8N" \
  "url[text]=$N8N_BASE_URL" \
  "api_key[password]=$N8N_API_KEY" \
  "encryption_key[password]=$N8N_ENCRYPTION_KEY" \
  "db_password[password]=$N8N_DB_PASSWORD"

# ── 7. AI APIs ────────────────────────────────────────────────────────────────
echo ""
echo "🔧 AI APIs"
prompt ANTHROPIC_API_KEY "  Anthropic API Key (sk-ant-...)"
prompt OPENAI_API_KEY    "  OpenAI API Key    (sk-...)"
prompt OPENROUTER_API_KEY "  OpenRouter API Key (sk-or-...)"

upsert_item "AIOS/AI-APIs" \
  "anthropic_api_key[password]=$ANTHROPIC_API_KEY" \
  "openai_api_key[password]=$OPENAI_API_KEY" \
  "openrouter_api_key[password]=$OPENROUTER_API_KEY"

# ── 8. Datenbank / Core Services ──────────────────────────────────────────────
echo ""
echo "🔧 Core Services (Postgres, Redis, JWT)"
prompt POSTGRES_PASSWORD "  Postgres Passwort (AIOS DB)"
prompt JWT_SECRET        "  JWT Secret (min. 32 Zeichen)"
prompt DASHBOARD_API_KEY "  Dashboard API Key (langer Zufallsstring)"

upsert_item "AIOS/Core" \
  "postgres_password[password]=$POSTGRES_PASSWORD" \
  "jwt_secret[password]=$JWT_SECRET" \
  "dashboard_api_key[password]=$DASHBOARD_API_KEY"

# ── 9. Google Workspace ───────────────────────────────────────────────────────
echo ""
echo "🔧 Google Workspace"
prompt GOOGLE_PROJECT_ID      "  Project ID"
prompt GOOGLE_DELEGATED_USER  "  Delegated User (timo@automation-plus-ki.de)"

upsert_item "AIOS/Google-Workspace" \
  "project_id[text]=$GOOGLE_PROJECT_ID" \
  "delegated_user[text]=$GOOGLE_DELEGATED_USER"

# ── 10. Agentic OS ────────────────────────────────────────────────────────────
echo ""
echo "🔧 Agentic OS"
prompt AGENTIC_OS_BASE_PATH "  Basispfad auf dem Server (/pfad/zu/03_ai-agent-platform)"

upsert_item "AIOS/AgenticOS" \
  "base_path[text]=$AGENTIC_OS_BASE_PATH"

# ── 11. Slack ────────────────────────────────────────────────────────────────
echo ""
echo "🔧 Slack"
prompt SLACK_WEBHOOK "  Webhook URL (https://hooks.slack.com/services/...)"

upsert_item "AIOS/Slack" \
  "webhook_url[password]=$SLACK_WEBHOOK"

# ── 12. CI Service Account Token ─────────────────────────────────────────────
echo ""
echo "🔧 1Password Service Account (für GitHub Actions)"
echo "   Erstelle einen Service Account unter:"
echo "   https://developer.1password.com/docs/service-accounts/"
echo "   Gib ihm Lese-Zugriff auf den Vault \"$VAULT\""
prompt OP_SERVICE_ACCOUNT_TOKEN "  Service Account Token (ops_...)"

echo ""
echo "══════════════════════════════════════════════════════════════"
echo " ✅  Alle Secrets in 1Password gespeichert!"
echo "══════════════════════════════════════════════════════════════"
echo ""
echo " Nächster Schritt: GitHub Secret setzen"
echo ""
echo "   gh secret set OP_SERVICE_ACCOUNT_TOKEN \\"
echo "     --body \"$OP_SERVICE_ACCOUNT_TOKEN\" \\"
echo "     --repo TimoGoetz1988/aios"
echo ""
echo " Dann können alle CI-Workflows automatisch Secrets laden."
echo ""
