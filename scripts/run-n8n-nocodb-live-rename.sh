#!/usr/bin/env bash
# Orchestrierung: n8n (API) + NocoDB Namen aus N8N_WORKFLOW_RENAME_MAP.md
# n8n: interne URL empfohlen, z. B. export N8N_BASE_URL=http://10.0.1.16:5678
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "== NocoDB workflows (Map) =="
python3 scripts/nocodb-workflows-rename-from-map.py

echo "== n8n rename (DRY_RUN=${DRY_RUN:-}) =="
python3 scripts/n8n-rename-via-api.py

echo "== Testmatrix =="
python3 scripts/n8n-workflow-test-matrix-refresh.py

echo "== Audit (Live; Fallback: --from-exports) =="
if python3 scripts/n8n-audit-webhooks-subflows.py 2>/dev/null; then
  true
else
  python3 scripts/n8n-audit-webhooks-subflows.py --from-exports
fi

echo "Fertig."
