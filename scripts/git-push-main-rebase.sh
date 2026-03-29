#!/usr/bin/env bash
# Push nach origin/main: erst Remote-Stand einziehen (rebase), dann pushen.
# Verhindert typischen Fehler: "! [rejected] ... (fetch first)".
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"
BRANCH="${1:-main}"
git fetch origin
git pull --rebase "origin" "$BRANCH"
git push "origin" "$BRANCH"
echo "OK: pushed origin/$BRANCH"
