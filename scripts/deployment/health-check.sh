#!/bin/bash
set -euo pipefail

SETUP_YAML="${SETUP_YAML:-$HOME/devops-center/config/system-map.yaml}"
OUTPUT_DIR="${OUTPUT_DIR:-$HOME/devops-center/docs/infra-agent-outputs}"
OUT_FILE="$OUTPUT_DIR/HEALTH_CHECK.md"

mkdir -p "$OUTPUT_DIR"

SERVICES=(
  "n8n|https://n8n.automation-plus-ki.de/healthz"
  "Grafana|https://grafana.automation-plus-ki.de/api/health"
  "NocoDB|https://nocodb.automation-plus-ki.de/api/v1/health"
  "Prometheus|https://prometheus.automation-plus-ki.de/-/healthy"
  "Agents|https://agents.automation-plus-ki.de/health"
  "Dashboard|https://dashboard.automation-plus-ki.de"
  "Browserless|https://browserless.automation-plus-ki.de/pressure"
)

PASS=0; FAIL=0

{
  echo "# HEALTH_CHECK"
  echo
  echo "_Geprüft: $(date '+%Y-%m-%d %H:%M:%S')_"
  echo
  echo "| Service | URL | Status |"
  echo "| --- | --- | --- |"

  for entry in "${SERVICES[@]}"; do
    name="${entry%%|*}"
    url="${entry##*|}"
    if curl -sf --max-time 8 "$url" > /dev/null 2>&1; then
      echo "| $name | \`$url\` | OK |"
      ((PASS++))
    else
      echo "| $name | \`$url\` | FAIL |"
      ((FAIL++))
    fi
  done

  echo
  echo "**Gesamt**: $PASS OK, $FAIL FAIL"
} > "$OUT_FILE"

echo "Health-Check: $PASS OK, $FAIL FAIL → $OUT_FILE"
[ "$FAIL" -gt 0 ] && exit 1 || exit 0
