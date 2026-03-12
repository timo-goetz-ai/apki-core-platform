#!/bin/bash
# Coolify Deployment Script für MCP-OPS & Agent Hub

set -e

COOLIFY_URL="${COOLIFY_URL:-https://coolify.automation-plus-ki.de}"
COOLIFY_TOKEN="${COOLIFY_TOKEN}"

if [ -z "$COOLIFY_TOKEN" ]; then
    echo "❌ COOLIFY_TOKEN nicht gesetzt!"
    echo "Exportiere: export COOLIFY_TOKEN=your-token"
    exit 1
fi

echo "==========================================="
echo "  Coolify Deployment"
echo "==========================================="
echo "Coolify URL: $COOLIFY_URL"
echo ""

# ── MCP-OPS Stack ─────────────────────────────
echo "📦 Deploye MCP-OPS Stack..."

MCP_OPS_PATH="/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/mcp-ops"

# Prüfe ob docker-compose.yml existiert
if [ ! -f "$MCP_OPS_PATH/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml nicht gefunden: $MCP_OPS_PATH"
    exit 1
fi

# Prüfe ob .env existiert
if [ ! -f "$MCP_OPS_PATH/.env" ]; then
    echo "⚠️  .env nicht gefunden, erstelle aus .env.example..."
    cp "$MCP_OPS_PATH/.env.example" "$MCP_OPS_PATH/.env"
fi

# Stack-Info
echo "  Stack: mcp-ops"
echo "  Compose File: docker-compose.yml"
echo "  Path: $MCP_OPS_PATH"
echo ""
echo "  → Bitte in Coolify UI deployen:"
echo "     1. Stack erstellen: 'mcp-ops'"
echo "     2. Type: Docker Compose"
echo "     3. Source: Local Path → $MCP_OPS_PATH"
echo "     4. Environment Variables aus .env importieren"
echo "     5. Deploy klicken"
echo ""

# ── Agent Hub Stack ───────────────────────────
echo "📦 Deploye Agent Hub Stack..."

AGENT_HUB_PATH="/Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/agent-hub"

# Prüfe ob docker-compose.yml existiert
if [ ! -f "$AGENT_HUB_PATH/docker-compose.yml" ]; then
    echo "❌ docker-compose.yml nicht gefunden: $AGENT_HUB_PATH"
    exit 1
fi

# Prüfe ob .env existiert
if [ ! -f "$AGENT_HUB_PATH/.env" ]; then
    echo "⚠️  .env nicht gefunden, erstelle aus .env.example..."
    cp "$AGENT_HUB_PATH/.env.example" "$AGENT_HUB_PATH/.env"
fi

# Stack-Info
echo "  Stack: agent-hub"
echo "  Compose File: docker-compose.yml"
echo "  Path: $AGENT_HUB_PATH"
echo ""
echo "  → Bitte in Coolify UI deployen:"
echo "     1. Stack erstellen: 'agent-hub'"
echo "     2. Type: Docker Compose"
echo "     3. Source: Local Path → $AGENT_HUB_PATH"
echo "     4. Environment Variables aus .env importieren"
echo "     5. Deploy klicken"
echo ""

# ── Health Checks (nach Deployment) ────────────
echo "🔍 Health Checks (nach Deployment):"
echo ""
echo "MCP-Server:"
echo "  curl https://mcp-coolify.automation-plus-ki.de/health"
echo "  curl https://mcp-hetzner.automation-plus-ki.de/health"
echo "  curl https://mcp-cloudflare.automation-plus-ki.de/health"
echo "  curl https://mcp-google.automation-plus-ki.de/health"
echo "  curl https://mcp-github.automation-plus-ki.de/health"
echo ""
echo "Agent Hub:"
echo "  curl https://agent.automation-plus-ki.de/health"
echo ""

echo "==========================================="
echo "  Vorbereitung abgeschlossen!"
echo "==========================================="
echo ""
echo "Nächste Schritte:"
echo "  1. Öffne Coolify: $COOLIFY_URL"
echo "  2. Deploye beide Stacks über die UI"
echo "  3. Tausche API-Tokens in Environment Variables"
echo "  4. Führe Health Checks durch"
echo ""
