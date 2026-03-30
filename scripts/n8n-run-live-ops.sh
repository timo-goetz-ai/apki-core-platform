#!/usr/bin/env bash
# Live: Webhook/Subflow-Audit + Testmatrix (safe executes). Voraussetzung: Tailscale, n8n :5678 erreichbar.
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
RUNNER="${ROOT}/scripts/op-run-n8n-tailscale.sh"
echo "== n8n Live-Audit ==" >&2
"$RUNNER" python3 "${ROOT}/scripts/n8n-audit-webhooks-subflows.py"
echo "== Testmatrix + execute-safe-only ==" >&2
"$RUNNER" python3 "${ROOT}/scripts/n8n-workflow-test-matrix-refresh.py" --execute-safe-only
echo "Fertig: Audit-MD unter docs/operations/, Test-Log n8n-workflow-test-log-*.md" >&2
