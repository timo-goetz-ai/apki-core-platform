#!/usr/bin/env bash
set -euo pipefail
name="${1:-my-project}"
python -m generator.cli generate "$name" --template chatbot --var project_name="$name" --var environment=dev
