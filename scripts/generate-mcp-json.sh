#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
op inject -i "$ROOT/.mcp.json.op" -o "$ROOT/.mcp.json" --force
chmod 600 "$ROOT/.mcp.json"
echo "Generated $ROOT/.mcp.json from 1Password (mode 600)"
