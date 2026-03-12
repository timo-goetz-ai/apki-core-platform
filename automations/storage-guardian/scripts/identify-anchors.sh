#!/bin/bash

set -euo pipefail

DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
INVENTAR_FILE="${INVENTAR_FILE:-$DOCS_ROOT/INVENTAR_INPUT.md}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/WISSENSANKER_VORSCHLAG.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# WISSENSANKER_VORSCHLAG"
  echo
  echo "_Heuristisch identifizierte Kandidaten für Master-/Referenzdokumente_"
  echo
  echo "Hinweis: aktuell auf Basis von Dateinamen/Typ; KI-Verfeinerung folgt."
  echo

  if [ ! -f "$INVENTAR_FILE" ]; then
    echo "> INVENTAR_INPUT.md nicht gefunden: $INVENTAR_FILE"
    exit 0
  fi

  echo "## Kandidaten (Text/Notizen, PDFs, große Ordnerstrukturen)"
  echo

  # Sehr einfache Heuristik: alles mit .md/.pdf und bestimmten Keywords
  grep -E "\\.(md|pdf)\\\`" "$INVENTAR_FILE" | while IFS="|" read -r _ path _ purpose _; do
    lc_path="$(echo "$path" | tr '[:upper:]' '[:lower:]')"
    if echo "$lc_path" | grep -Eq "overview|übersicht|leitfaden|guide|handbuch|doku|dokumentation|playbook|runbook"; then
      echo "- $path  → **starker Kandidat** für Wissensanker"
    else
      echo "- $path  → normaler Kandidat"
    fi
  done
} > "$OUT_FILE"

echo "WISSENSANKER_VORSCHLAG.md aktualisiert: $OUT_FILE"

