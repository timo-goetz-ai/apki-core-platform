#!/usr/bin/env bash
# Idempotent: legt in NocoDB (Content-Base) an der Tabelle `agents` die Spalte
# Phase (SingleSelect: 10, 20, 30) an, falls sie fehlt.
#
# Env (z. B. aus services/admin-dashboard/.env.local):
#   NOCODB_URL
#   NOCODB_API_TOKEN
#   NOCODB_AGENTS_TABLE_ID  (optional, Default: m8c0rpjwx5d4bu2)
#
set -euo pipefail
CURL="${CURL:-/usr/bin/curl}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_LOCAL="${ENV_LOCAL:-$ROOT/services/admin-dashboard/.env.local}"
if [[ -f "$ENV_LOCAL" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_LOCAL"
  set +a
fi
: "${NOCODB_URL:?Set NOCODB_URL}"
: "${NOCODB_API_TOKEN:?Set NOCODB_API_TOKEN}"
TABLE="${NOCODB_AGENTS_TABLE_ID:-m8c0rpjwx5d4bu2}"

META="$("$CURL" -sS -H "xc-token: ${NOCODB_API_TOKEN}" \
  "${NOCODB_URL}/api/v1/db/meta/tables/${TABLE}")"
if echo "$META" | python3 -c "import json,sys; t=json.load(sys.stdin); cols=t.get('columns') or []; print('yes' if any(c.get('column_name')=='Phase' for c in cols) else 'no')" | grep -q yes; then
  echo "nocodb: Spalte Phase existiert bereits (table=${TABLE})."
  exit 0
fi

BODY='{"column_name":"Phase","title":"Phase","uidt":"SingleSelect","colOptions":{"options":[{"title":"10","color":"#6B7280"},{"title":"20","color":"#2563EB"},{"title":"30","color":"#16A34A"}]}}'
CODE="$("$CURL" -sS -o /tmp/noco_phase_resp.json -w "%{http_code}" -X POST \
  -H "xc-token: ${NOCODB_API_TOKEN}" -H "Content-Type: application/json" \
  -d "$BODY" \
  "${NOCODB_URL}/api/v1/db/meta/tables/${TABLE}/columns")"
if [[ "$CODE" != "200" ]]; then
  echo "nocodb: POST columns failed HTTP $CODE" >&2
  python3 -c "print(open('/tmp/noco_phase_resp.json').read()[:800])" >&2 || true
  exit 1
fi
echo "nocodb: Spalte Phase angelegt (table=${TABLE})."
