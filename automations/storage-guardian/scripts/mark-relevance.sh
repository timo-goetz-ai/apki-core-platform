#!/bin/bash

set -euo pipefail

DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
INVENTAR_FILE="${INVENTAR_FILE:-$DOCS_ROOT/INVENTAR_INPUT.md}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/RELEVANZ_PRUEFUNG_BUSINESS.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# RELEVANZ_PRUEFUNG_BUSINESS"
  echo
  echo "_Heuristische Markierung von prüfungs- und businessrelevanten Inhalten_"
  echo
  echo "| Pfad | Relevanz | Gründe |"
  echo "| --- | --- | --- |"

  if [ ! -f "$INVENTAR_FILE" ]; then
    echo "> INVENTAR_INPUT.md nicht gefunden: $INVENTAR_FILE"
    exit 0
  fi

  # Überspringe Header-Zeilen, arbeite nur über Tabellenzeilen
  grep "^|" "$INVENTAR_FILE" | tail -n +3 | while IFS="|" read -r _ path _ purpose time_ctx _; do
    lc_path="$(echo "$path" | tr '[:upper:]' '[:lower:]')"
    lc_purpose="$(echo "$purpose" | tr '[:upper:]' '[:lower:]')"

    relevance="niedrig"
    reasons=()

    if echo "$lc_path" | grep -Eq "wbs|ki-management|prüfung|exam"; then
      relevance="hoch"
      reasons+=("Stichworte zu Ausbildung/Prüfung")
    fi

    if echo "$lc_path" | grep -Eq "crm|kunde|customer|angebot|offer|business|projekt"; then
      [ "$relevance" = "niedrig" ] && relevance="mittel"
      reasons+=("Stichworte zu Business/Projekten")
    fi

    if echo "$lc_path" | grep -Eq "ai|agent|mcp|orchestration|workflow|devops"; then
      [ "$relevance" = "niedrig" ] && relevance="mittel"
      reasons+=("Stichworte zu Orchestrierung/KI-Systemen")
    fi

    if echo "$time_ctx" | grep -q "aktuell"; then
      reasons+=("aktuelle Datei")
    fi

    joined_reasons=$(printf "%s, " "${reasons[@]:-}")
    joined_reasons="${joined_reasons%, }"
    [ -z "$joined_reasons" ] && joined_reasons="(keine besonderen Merkmale)"

    echo "| $path | $relevance | $joined_reasons |"
  done
} > "$OUT_FILE"

echo "RELEVANZ_PRUEFUNG_BUSINESS.md aktualisiert: $OUT_FILE"

