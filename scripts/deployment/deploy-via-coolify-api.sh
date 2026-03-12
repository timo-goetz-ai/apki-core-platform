#!/bin/bash
# Coolify API Deployment Script für MCP-OPS & Agent Hub

set -e

COOLIFY_URL="${COOLIFY_URL:-https://coolify.automation-plus-ki.de}"
COOLIFY_TOKEN="${COOLIFY_TOKEN}"

if [ -z "$COOLIFY_TOKEN" ]; then
    echo "❌ COOLIFY_TOKEN nicht gesetzt!"
    echo "Exportiere: export COOLIFY_TOKEN=your-token"
    exit 1
fi

echo "==========================================="
echo "  Coolify API Deployment"
echo "==========================================="
echo "Coolify URL: $COOLIFY_URL"
echo ""

# API Helper
api_call() {
    local method=$1
    local endpoint=$2
    local data=$3
    
    if [ -z "$data" ]; then
        curl -s -X "$method" \
            -H "Authorization: Bearer $COOLIFY_TOKEN" \
            -H "Accept: application/json" \
            "$COOLIFY_URL/api/v1/$endpoint"
    else
        curl -s -X "$method" \
            -H "Authorization: Bearer $COOLIFY_TOKEN" \
            -H "Accept: application/json" \
            -H "Content-Type: application/json" \
            -d "$data" \
            "$COOLIFY_URL/api/v1/$endpoint"
    fi
}

# ── MCP-OPS Stack ─────────────────────────────
echo "📦 Deploye MCP-OPS Stack..."

MCP_OPS_PATH="/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/mcp-ops"

# Prüfe ob docker-compose.yml existiert
if [ ! -f "$MCP_OPS_PATH/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml nicht gefunden: $MCP_OPS_PATH"
    exit 1
fi

# Lese docker-compose.yml
COMPOSE_CONTENT=$(cat "$MCP_OPS_PATH/docker-compose.yml" | jq -Rs .)

# Lese .env und konvertiere zu JSON
if [ -f "$MCP_OPS_PATH/.env" ]; then
    ENV_VARS=$(cat "$MCP_OPS_PATH/.env" | grep -v '^#' | grep -v '^$' | \
        jq -R -s 'split("\n") | map(select(. != "")) | map(split("=") | {key: .[0], value: (.[1:] | join("="))}) | from_entries')
else
    ENV_VARS="{}"
fi

# Stack erstellen/aktualisieren
echo "  → Erstelle Stack 'mcp-ops'..."

STACK_DATA=$(cat <<EOF
{
  "name": "mcp-ops",
  "type": "docker-compose",
  "docker_compose_file": "$COMPOSE_CONTENT",
  "environment_variables": $ENV_VARS
}
EOF
)

# Prüfe ob Stack existiert
STACK_EXISTS=$(api_call "GET" "stacks" | jq -r ".[] | select(.name == \"mcp-ops\") | .id")

if [ -n "$STACK_EXISTS" ]; then
    echo "  → Stack existiert bereits (ID: $STACK_EXISTS), aktualisiere..."
    RESULT=$(api_call "PUT" "stacks/$STACK_EXISTS" "$STACK_DATA")
else
    echo "  → Erstelle neuen Stack..."
    RESULT=$(api_call "POST" "stacks" "$STACK_DATA")
fi

STACK_ID=$(echo "$RESULT" | jq -r '.id // .uuid // empty')

if [ -z "$STACK_ID" ]; then
    echo "  ⚠️  Konnte Stack-ID nicht ermitteln"
    echo "  Response: $RESULT"
    echo ""
    echo "  → Bitte manuell in Coolify UI deployen"
else
    echo "  ✅ Stack erstellt/aktualisiert (ID: $STACK_ID)"
    
    # Deploy triggern
    echo "  → Starte Deployment..."
    DEPLOY_RESULT=$(api_call "POST" "stacks/$STACK_ID/deploy" "{}")
    echo "  ✅ Deployment gestartet"
fi

echo ""

# ── Agent Hub Stack ───────────────────────────
echo "📦 Deploye Agent Hub Stack..."

AGENT_HUB_PATH="/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/agent-hub"

# Prüfe ob docker-compose.yml existiert
if [ ! -f "$AGENT_HUB_PATH/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml nicht gefunden: $AGENT_HUB_PATH"
    exit 1
fi

# Lese docker-compose.yml
COMPOSE_CONTENT=$(cat "$AGENT_HUB_PATH/docker-compose.yml" | jq -Rs .)

# Lese .env und konvertiere zu JSON
if [ -f "$AGENT_HUB_PATH/.env" ]; then
    ENV_VARS=$(cat "$AGENT_HUB_PATH/.env" | grep -v '^#' | grep -v '^$' | \
        jq -R -s 'split("\n") | map(select(. != "")) | map(split("=") | {key: .[0], value: (.[1:] | join("="))}) | from_entries')
else
    ENV_VARS="{}"
fi

# Stack erstellen/aktualisieren
echo "  → Erstelle Stack 'agent-hub'..."

STACK_DATA=$(cat <<EOF
{
  "name": "agent-hub",
  "type": "docker-compose",
  "docker_compose_file": "$COMPOSE_CONTENT",
  "environment_variables": $ENV_VARS
}
EOF
)

# Prüfe ob Stack existiert
STACK_EXISTS=$(api_call "GET" "stacks" | jq -r ".[] | select(.name == \"agent-hub\") | .id")

if [ -n "$STACK_EXISTS" ]; then
    echo "  → Stack existiert bereits (ID: $STACK_EXISTS), aktualisiere..."
    RESULT=$(api_call "PUT" "stacks/$STACK_EXISTS" "$STACK_DATA")
else
    echo "  → Erstelle neuen Stack..."
    RESULT=$(api_call "POST" "stacks" "$STACK_DATA")
fi

STACK_ID=$(echo "$RESULT" | jq -r '.id // .uuid // empty')

if [ -z "$STACK_ID" ]; then
    echo "  ⚠️  Konnte Stack-ID nicht ermitteln"
    echo "  Response: $RESULT"
    echo ""
    echo "  → Bitte manuell in Coolify UI deployen"
else
    echo "  ✅ Stack erstellt/aktualisiert (ID: $STACK_ID)"
    
    # Deploy triggern
    echo "  → Starte Deployment..."
    DEPLOY_RESULT=$(api_call "POST" "stacks/$STACK_ID/deploy" "{}")
    echo "  ✅ Deployment gestartet"
fi

echo ""

# ── Health Checks ──────────────────────────────
echo "🔍 Warte 30 Sekunden auf Deployment..."
sleep 30

echo ""
echo "Health Checks:"
echo ""

# MCP-Server
for server in coolify hetzner cloudflare google github; do
    url="https://mcp-${server}.automation-plus-ki.de/health"
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "  ✅ mcp-${server}: OK"
    else
        echo "  ⚠️  mcp-${server}: Nicht erreichbar (möglicherweise noch nicht bereit)"
    fi
done

# Agent Hub
agent_url="https://agent.automation-plus-ki.de/health"
if curl -s -f "$agent_url" > /dev/null 2>&1; then
    echo "  ✅ agent-hub: OK"
else
    echo "  ⚠️  agent-hub: Nicht erreichbar (möglicherweise noch nicht bereit)"
fi

echo ""
echo "==========================================="
echo "  Deployment abgeschlossen!"
echo "==========================================="
echo ""
echo "Nächste Schritte:"
echo "  1. Prüfe Logs in Coolify UI"
echo "  2. Tausche API-Tokens in Environment Variables"
echo "  3. Starte Services neu falls nötig"
echo ""
