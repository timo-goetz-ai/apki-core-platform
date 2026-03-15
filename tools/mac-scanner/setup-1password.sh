#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────────────
# 1Password Setup für das AIOS Dashboard
# Speichert alle Secrets sicher in 1Password und erzeugt ein .env.op Template.
#
# Voraussetzungen:
#   brew install 1password-cli   (op CLI v2+)
#   op signin
#
# Verwendung:
#   chmod +x tools/mac-scanner/setup-1password.sh
#   ./tools/mac-scanner/setup-1password.sh
# ──────────────────────────────────────────────────────────────────────────────
set -euo pipefail

VAULT="AIOS"
ITEM="Dashboard Secrets"

echo "🔐 AIOS Dashboard – 1Password Setup"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. op CLI prüfen
if ! command -v op &>/dev/null; then
  echo "❌ 1Password CLI nicht gefunden."
  echo "   Installiere: brew install 1password-cli"
  exit 1
fi

# 2. Eingeloggt?
if ! op account list &>/dev/null; then
  echo "📲 Bitte zuerst einloggen: op signin"
  exit 1
fi

echo "✓ op CLI bereit"

# 3. Vault anlegen falls nicht vorhanden
if ! op vault get "$VAULT" &>/dev/null; then
  echo "📁 Vault \"$VAULT\" wird angelegt…"
  op vault create "$VAULT"
fi

echo "✓ Vault: $VAULT"

# 4. Secrets abfragen
echo ""
echo "Gib deine Secrets ein (Enter = überspringen/leer lassen):"
echo ""

read -rp "  DASHBOARD_API_KEY   (langer Zufallsstring): " DASHBOARD_API_KEY
read -rp "  CLOUDFLARE_API_TOKEN (von dash.cloudflare.com): " CF_TOKEN
read -rp "  CLOUDFLARE_ACCOUNT_ID:                         " CF_ACCOUNT_ID
read -rp "  COOLIFY_URL          (https://coolify.domain):  " COOLIFY_URL
read -rp "  COOLIFY_API_KEY      (von Coolify → API):       " COOLIFY_KEY
read -rp "  GITHUB_TOKEN         (ghp_...):                 " GH_TOKEN
read -rp "  DOCKER_HOST          (tcp://mac-ip:2375):       " DOCKER_HOST

echo ""
echo "💾 Speichere in 1Password Vault \"$VAULT\"…"

# 5. Item erstellen oder updaten
FIELDS=""
[[ -n "$DASHBOARD_API_KEY" ]] && FIELDS+=" 'DASHBOARD_API_KEY[password]=$DASHBOARD_API_KEY'"
[[ -n "$CF_TOKEN"          ]] && FIELDS+=" 'CLOUDFLARE_API_TOKEN[password]=$CF_TOKEN'"
[[ -n "$CF_ACCOUNT_ID"     ]] && FIELDS+=" 'CLOUDFLARE_ACCOUNT_ID[text]=$CF_ACCOUNT_ID'"
[[ -n "$COOLIFY_URL"       ]] && FIELDS+=" 'COOLIFY_URL[text]=$COOLIFY_URL'"
[[ -n "$COOLIFY_KEY"       ]] && FIELDS+=" 'COOLIFY_API_KEY[password]=$COOLIFY_KEY'"
[[ -n "$GH_TOKEN"          ]] && FIELDS+=" 'GITHUB_TOKEN[password]=$GH_TOKEN'"
[[ -n "$DOCKER_HOST"       ]] && FIELDS+=" 'DOCKER_HOST[text]=$DOCKER_HOST'"

# Item löschen falls vorhanden, dann neu anlegen
op item get "$ITEM" --vault "$VAULT" &>/dev/null && op item delete "$ITEM" --vault "$VAULT"

eval op item create \
  --vault "\"$VAULT\"" \
  --title "\"$ITEM\"" \
  --category Login \
  $FIELDS

echo ""
echo "✅ Secrets in 1Password gespeichert!"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 .env.local für Admin-Dashboard (in Coolify als Env-Vars setzen):"
echo ""
[[ -n "$DASHBOARD_API_KEY" ]] && echo "DASHBOARD_API_KEY=op://AIOS/Dashboard Secrets/DASHBOARD_API_KEY"
[[ -n "$CF_TOKEN"          ]] && echo "CLOUDFLARE_API_TOKEN=op://AIOS/Dashboard Secrets/CLOUDFLARE_API_TOKEN"
[[ -n "$CF_ACCOUNT_ID"     ]] && echo "CLOUDFLARE_ACCOUNT_ID=op://AIOS/Dashboard Secrets/CLOUDFLARE_ACCOUNT_ID"
[[ -n "$COOLIFY_URL"       ]] && echo "COOLIFY_URL=op://AIOS/Dashboard Secrets/COOLIFY_URL"
[[ -n "$COOLIFY_KEY"       ]] && echo "COOLIFY_API_KEY=op://AIOS/Dashboard Secrets/COOLIFY_API_KEY"
[[ -n "$GH_TOKEN"          ]] && echo "GITHUB_TOKEN=op://AIOS/Dashboard Secrets/GITHUB_TOKEN"
[[ -n "$DOCKER_HOST"       ]] && echo "DOCKER_HOST=op://AIOS/Dashboard Secrets/DOCKER_HOST"
echo ""
echo "🔑 Mac-Scanner mit op run starten:"
echo "   op run --env-file=.env.op -- node tools/mac-scanner/scan.js --push"
echo ""

# .env.op Datei erzeugen
ENV_OP="tools/mac-scanner/.env.op"
cat > "$ENV_OP" <<EOF
# Automatisch generiert – NICHT in git einchecken!
# Verwendung: op run --env-file=.env.op -- node scan.js --push
DASHBOARD_URL=https://agents.automation-plus-ki.de
DASHBOARD_API_KEY=op://AIOS/Dashboard Secrets/DASHBOARD_API_KEY
EOF

echo "✓ $ENV_OP erzeugt"
echo ""
echo "🔄 Fertig! Starte Scanner mit:"
echo "   cd tools/mac-scanner && op run --env-file=.env.op -- node scan.js --push"
