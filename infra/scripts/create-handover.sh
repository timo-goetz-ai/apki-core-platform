#!/bin/bash
# AIOS Session Handover Generator
# Wird automatisch beim Session-Ende aufgerufen

DATE=$(date '+%Y-%m-%d_%H-%M')
DATE_HUMAN=$(date '+%Y-%m-%d %H:%M')
LOG_DIR="/Users/zuhause_mit_ideen/projects/ai-os/infra/logs"
TEMPLATE="/Users/zuhause_mit_ideen/projects/ai-os/infra/session-template.md"
OUTPUT="$LOG_DIR/handover-$DATE.md"

mkdir -p "$LOG_DIR"

# Kontext aus PostCompact und Session-Log zusammenführen
CONTEXT=""
[ -f /tmp/aios-context.md ] && CONTEXT=$(cat /tmp/aios-context.md)
SESSION_LOG=""
[ -f /tmp/aios-session.log ] && SESSION_LOG=$(cat /tmp/aios-session.log)

# Handover aus Template bauen
cp "$TEMPLATE" "$OUTPUT"
sed -i '' "s/{{DATE}}/$DATE_HUMAN/g" "$OUTPUT" 2>/dev/null || sed -i "s/{{DATE}}/$DATE_HUMAN/g" "$OUTPUT"

# Session-Log anhängen
if [ -n "$SESSION_LOG" ]; then
  echo "" >> "$OUTPUT"
  echo "---" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "## Command Log" >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
  echo "$SESSION_LOG" >> "$OUTPUT"
  echo '```' >> "$OUTPUT"
fi

# Kontext-Zusammenfassung anhängen (aus PostCompact)
if [ -n "$CONTEXT" ]; then
  echo "" >> "$OUTPUT"
  echo "---" >> "$OUTPUT"
  echo "" >> "$OUTPUT"
  echo "## Auto-Kontext (PostCompact)" >> "$OUTPUT"
  echo "$CONTEXT" >> "$OUTPUT"
fi

# Temp-Dateien aufräumen
rm -f /tmp/aios-session.log /tmp/aios-context.md

echo "✅ Handover gespeichert: $OUTPUT"
