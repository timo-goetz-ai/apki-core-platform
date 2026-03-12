#!/bin/bash

set -euo pipefail

INPUT_ROOT="${INPUT_ROOT:-$HOME/Library/Mobile Documents/com~apple~CloudDocs/AGOC_INPUT_GLOBAL}"
DOCS_ROOT="${DOCS_ROOT:-$HOME/devops-center/docs}"
OUT_FILE="${OUT_FILE:-$DOCS_ROOT/INVENTAR_INPUT.md}"

mkdir -p "$DOCS_ROOT"

{
  echo "# INVENTAR_INPUT"
  echo
  echo "_Automatisch generiert: Überblick über Dateien im INPUT-Ordner_"
  echo
  echo "| Pfad | Dateityp | Geschätzter Inhalt/Zweck | Zeitlicher Kontext |"
  echo "| --- | --- | --- | --- |"

  find "$INPUT_ROOT" -type f | while read -r file; do
    rel_path="${file#$INPUT_ROOT/}"
    ext="${file##*.}"
    mtime_epoch=$(stat -f "%m" "$file" 2>/dev/null || stat -c "%Y" "$file")
    now_epoch=$(date +%s)
    age_days=$(( (now_epoch - mtime_epoch) / 86400 ))

    if [ "$age_days" -lt 30 ]; then
      time_ctx="aktuell"
    elif [ "$age_days" -lt 365 ]; then
      time_ctx="mittel"
    else
      time_ctx="alt"
    fi

    # Sehr grobe Heuristik für Inhalt/Zweck (wird später von KI/Agent verfeinert)
    case "$ext" in
      md|txt|rtf) purpose="Text / Notizen" ;;
      pdf) purpose="Dokument / Referenz" ;;
      png|jpg|jpeg|gif|webp) purpose="Bild / Grafik" ;;
      mov|mp4|m4v) purpose="Video / Aufnahme" ;;
      csv|xlsx|xls) purpose="Tabellen / Daten" ;;
      *) purpose="Unklar / später klären" ;;
    esac

    echo "| \`$rel_path\` | \`$ext\` | $purpose | $time_ctx |"
  done
} > "$OUT_FILE"

echo "INVENTAR_INPUT.md aktualisiert: $OUT_FILE"

