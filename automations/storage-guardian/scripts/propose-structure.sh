#!/bin/bash

set -euo pipefail

DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/STRUKTUR_EMPFEHLUNG.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# STRUKTUR_EMPFEHLUNG"
  echo
  echo "_Vorschlag für Zielarchitektur & Ordnerstruktur (Baseline)_"
  echo
  echo "## Pipeline-Empfehlung"
  echo
  echo "- **INPUT**: iCloud-Ordner \`AGOC_INPUT_GLOBAL\`, 2TB-Volume, NAS"
  echo "- **PROCESSING**: Cloud Agents (z. B. \`storage-guardian\`), n8n-Workflows"
  echo "- **KNOWLEDGE**: GitHub-Repos (Markdown), NocoDB/Postgres, Qdrant"
  echo "- **OUTPUT**: generierte Reports, Dashboards (Grafana), Exports"
  echo "- **SYSTEM**: Hetzner-Infra, MCP-Server, Coolify, Monitoring"
  echo
  echo "Diese Datei wird später von KI/Agenten mit konkreten Strukturen und Pfad-Vorschlägen ergänzt."
} > "$OUT_FILE"

echo "STRUKTUR_EMPFEHLUNG.md aktualisiert: $OUT_FILE"

