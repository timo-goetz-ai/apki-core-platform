#!/bin/bash

set -euo pipefail

INPUT_ROOT="${INPUT_ROOT:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/AGOC_INPUT_GLOBAL}"
DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/SEMANTISCHE_ZUORDNUNG.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# SEMANTISCHE_ZUORDNUNG"
  echo
  echo "_Grobe, regelbasierte Zuordnung pro Datei (wird später durch KI verfeinert)_"
  echo
  echo "| Pfad | Rollen | Heuristik |"
  echo "| --- | --- | --- |"

  find "$INPUT_ROOT" -type f | while read -r file; do
    rel_path="${file#$INPUT_ROOT/}"
    lc_path="$(echo "$rel_path" | tr '[:upper:]' '[:lower:]')"

    roles=()
    reason=""

    if echo "$lc_path" | grep -q "wbs"; then
      roles+=("Ausbildung/Prüfung")
      reason+="enthält 'wbs'; "
    fi
    if echo "$lc_path" | grep -Eq "projekt|project|pm"; then
      roles+=("Projekt/Produkt")
      reason+="enthält 'projekt'/'project'/'pm'; "
    fi
    if echo "$lc_path" | grep -Eq "crm|kunde|customer"; then
      roles+=("Business/CRM")
      reason+="enthält 'crm'/'kunde'/'customer'; "
    fi
    if echo "$lc_path" | grep -Eq "privat|private|personal"; then
      roles+=("Privat/Persönlich")
      reason+="enthält 'privat'/'personal'; "
    fi
    if echo "$lc_path" | grep -Eq "api|code|src|github"; then
      roles+=("Automatisierung/KI-System")
      reason+="enthält 'api'/'code'/'src'/'github'; "
    fi

    if [ "${#roles[@]}" -eq 0 ]; then
      roles+=("Unklar/später klären")
      reason="keine Heuristik gegriffen"
    fi

    joined_roles=$(printf "%s, " "${roles[@]}")
    joined_roles="${joined_roles%, }"

    echo "| \`$rel_path\` | $joined_roles | $reason |"
  done
} > "$OUT_FILE"

echo "SEMANTISCHE_ZUORDNUNG.md aktualisiert: $OUT_FILE"

