#!/bin/bash
set -euo pipefail

OUTPUT_DIR="${OUTPUT_DIR:-$HOME/devops-center/docs/infra-agent-outputs}"
OUT_FILE="$OUTPUT_DIR/DRIFT_REPORT.md"
COOLIFY_URL="${COOLIFY_URL:-https://coolify.automation-plus-ki.de}"
COOLIFY_API_TOKEN="${COOLIFY_API_TOKEN:-}"

mkdir -p "$OUTPUT_DIR"

{
  echo "# DRIFT_REPORT"
  echo
  echo "_Generiert: $(date '+%Y-%m-%d %H:%M:%S')_"
  echo
  echo "## setup.yaml vs. Ist-Zustand"
  echo

  # Soll-Zustand aus system-map.yaml
  echo "### Soll-Zustand (system-map.yaml)"
  echo
  if command -v python3 &>/dev/null && [ -f "$HOME/devops-center/config/system-map.yaml" ]; then
    python3 -c "
import yaml, sys
with open('$HOME/devops-center/config/system-map.yaml') as f:
    data = yaml.safe_load(f)
systems = data.get('systems', {})
print('| System | URL | Rolle | Core |')
print('| --- | --- | --- | --- |')
for k, v in systems.items():
    print(f'| {k} | {v.get(\"url\",\"-\")} | {v.get(\"role\",\"-\")} | {v.get(\"core\",\"-\")} |')
"
  fi

  echo
  echo "### Ist-Zustand (Health-Checks)"
  echo
  bash "$(dirname "$0")/health-check.sh" 2>/dev/null || true
  cat "$OUTPUT_DIR/HEALTH_CHECK.md" | grep "^|" | tail -n +3 || true

  echo
  echo "---"
  echo "_Nächster Schritt: Ausgefallene Services in Coolify prüfen und neu starten._"
} > "$OUT_FILE"

echo "Drift-Report generiert: $OUT_FILE"
