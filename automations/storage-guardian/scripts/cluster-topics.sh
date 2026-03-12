#!/bin/bash

set -euo pipefail

INPUT_ROOT="${INPUT_ROOT:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/AGOC_INPUT_GLOBAL}"
DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/THEMEN_CLUSTER.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# THEMEN_CLUSTER"
  echo
  echo "_Einfache, pfadbasiere Themen-Cluster (Ordner = Cluster-Kandidaten)_"
  echo

  # Alle Verzeichnisse unterhalb INPUT_ROOT als potenzielle Cluster
  find "$INPUT_ROOT" -type d | while read -r dir; do
    [ "$dir" = "$INPUT_ROOT" ] && continue
    rel_dir="${dir#$INPUT_ROOT/}"
    file_count=$(find "$dir" -maxdepth 1 -type f | wc -l | tr -d " ")
    subdir_count=$(find "$dir" -mindepth 1 -maxdepth 1 -type d | wc -l | tr -d " ")

    echo "## $rel_dir"
    echo
    echo "- **Dateien**: $file_count"
    echo "- **Unterordner**: $subdir_count"
    echo "- **Vermutete Domäne**: (später durch KI ergänzen)"
    echo
  done
} > "$OUT_FILE"

echo "THEMEN_CLUSTER.md aktualisiert: $OUT_FILE"

