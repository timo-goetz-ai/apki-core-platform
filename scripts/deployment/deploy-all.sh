#!/bin/bash
# Deployment-Script für MCP-OPS und Agent Hub

set -e

echo "==========================================="
echo "  MCP-OPS & Agent Hub Deployment"
echo "==========================================="
echo ""

# Prüfe Docker
if ! docker ps > /dev/null 2>&1; then
    echo "❌ Docker läuft nicht!"
    echo "Bitte starte Docker Desktop oder den Docker-Daemon."
    exit 1
fi

echo "✅ Docker läuft"
echo ""

# ── MCP-OPS Deployment ────────────────────────
echo "📦 Deploye MCP-OPS..."
cd /Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/mcp-ops

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "❌ .env-Datei fehlt in mcp-ops/"
    exit 1
fi

# Baue Images
echo "  → Baue Images..."
docker compose build

# Starte Services
echo "  → Starte Services..."
docker compose up -d

# Warte kurz
sleep 3

# Zeige Status
echo ""
echo "  MCP-OPS Status:"
docker compose ps

echo ""
echo "✅ MCP-OPS deployed"
echo ""

# ── Agent Hub Deployment ──────────────────────
echo "📦 Deploye Agent Hub..."
cd /Users/zuhause_mit_ideen/DEV_ROOT/server-infra/03_INFRASTRUCTURE/agent-hub

# Prüfe ob .env existiert
if [ ! -f .env ]; then
    echo "❌ .env-Datei fehlt in agent-hub/"
    exit 1
fi

# Baue Images
echo "  → Baue Images..."
docker compose build

# Starte Services
echo "  → Starte Services..."
docker compose up -d

# Warte kurz
sleep 3

# Zeige Status
echo ""
echo "  Agent Hub Status:"
docker compose ps

echo ""
echo "✅ Agent Hub deployed"
echo ""

# ── Health Checks ──────────────────────────────
echo "🔍 Health Checks..."
echo ""

# MCP-Server Health Checks
echo "MCP-Server:"
for server in coolify hetzner cloudflare google github; do
    url="https://mcp-${server}.automation-plus-ki.de/health"
    if curl -s -f "$url" > /dev/null 2>&1; then
        echo "  ✅ mcp-${server}: OK"
    else
        echo "  ⚠️  mcp-${server}: Nicht erreichbar (möglicherweise noch nicht bereit)"
    fi
done

echo ""
echo "Agent Hub:"
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
echo "  1. Prüfe Logs: docker compose logs -f"
echo "  2. Tausche API-Tokens in .env-Dateien"
echo "  3. Starte Services neu: docker compose restart"
echo ""
